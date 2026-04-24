import { useEffect, useState, type ChangeEvent } from 'react';
import { getAutomations, type AutomationTemplate } from '../api/mockApi';
import type { NodeDataUpdater, WorkflowNode, WorkflowNodeData } from '../types/workflow';
import {
  NODE_FORM_CONFIG,
  NODE_TYPE_TITLES,
  type FormFieldConfig,
  type StaticNodeType,
} from './nodeFormConfig';
import AutomatedActionFields from './AutomatedActionFields';

type NodeFormProps = {
  selectedNode: WorkflowNode | null;
  onChangeData: (updater: NodeDataUpdater) => void;
};

const isStaticNodeType = (type: string | undefined): type is StaticNodeType =>
  type === 'taskNode' || type === 'approvalNode' || type === 'startNode' || type === 'endNode';

export default function NodeForm({ selectedNode, onChangeData }: NodeFormProps) {
  const [automations, setAutomations] = useState<AutomationTemplate[]>([]);
  const [isLoadingAutomations, setIsLoadingAutomations] = useState(false);
  const [automationsError, setAutomationsError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadAutomations = async () => {
      setIsLoadingAutomations(true);
      setAutomationsError('');

      try {
        const result = await getAutomations();
        if (isMounted) {
          setAutomations(result);
        }
      } catch {
        if (isMounted) {
          setAutomationsError('Failed to load automation actions.');
          setAutomations([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAutomations(false);
        }
      }
    };

    loadAutomations();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!selectedNode) {
    return (
      <aside className="node-form-panel">
        <h2>Node Details</h2>
        <p className="node-form-empty">Click a node to edit its properties.</p>
      </aside>
    );
  }

  const { type, data } = selectedNode;

  const handleChange =
    (field: keyof WorkflowNodeData, inputType: FormFieldConfig['input']) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    const patch: Partial<WorkflowNodeData> = {
      [field]: inputType === 'number' ? Number(value || 0) : value,
    };

    if (field === 'title') {
      patch.label = value || 'Task';
    }
    if (field === 'approverRole') {
      patch.label = value || 'Approval';
    }
    if (field === 'label') {
      patch.label = value || 'Node';
    }

    onChangeData(patch);
  };

  const handleActionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const actionId = event.target.value;
    const automation = automations.find((item) => item.id === actionId);

    if (!automation) {
      onChangeData({ actionId: '', actionParams: {}, label: 'Automated' });
      return;
    }

    const actionParams = Object.fromEntries(automation.params.map((param) => [param, '']));
    onChangeData({ actionId: automation.id, actionParams, label: automation.label });
  };

  const handleParamChange = (paramName: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onChangeData((current) => ({
      actionParams: {
        ...(current.actionParams ?? {}),
        [paramName]: value,
      },
    }));
  };

  const getFieldValue = (field: FormFieldConfig) => {
    const value = data[field.key];
    if (value === undefined || value === null) {
      return String(field.defaultValue);
    }
    return String(value);
  };

  const renderField = (field: FormFieldConfig) => {
    const commonProps = {
      value: getFieldValue(field),
      onChange: handleChange(field.key, field.input),
    };

    return (
      <label key={field.key}>
        {field.label}
        {field.input === 'textarea' ? (
          <textarea rows={3} {...commonProps} />
        ) : (
          <input type={field.input} {...commonProps} />
        )}
      </label>
    );
  };

  const staticNodeType = isStaticNodeType(type) ? type : null;
  const title =
    type && (type in NODE_TYPE_TITLES)
      ? NODE_TYPE_TITLES[type as keyof typeof NODE_TYPE_TITLES]
      : 'Node';

  return (
    <aside className="node-form-panel">
      <h2>{title}</h2>
      <div className="node-form-grid">
        {staticNodeType && NODE_FORM_CONFIG[staticNodeType].map(renderField)}

        {type === 'automatedNode' && (
          <AutomatedActionFields
            data={data}
            automations={automations}
            isLoadingAutomations={isLoadingAutomations}
            automationsError={automationsError}
            onActionChange={handleActionChange}
            onParamChange={handleParamChange}
          />
        )}
      </div>
    </aside>
  );
}
