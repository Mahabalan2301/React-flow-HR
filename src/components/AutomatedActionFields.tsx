import type { ChangeEvent } from 'react';
import type { AutomationTemplate } from '../api/mockApi';
import type { WorkflowNodeData } from '../types/workflow';

type AutomatedActionFieldsProps = {
  data: WorkflowNodeData;
  automations: AutomationTemplate[];
  isLoadingAutomations: boolean;
  automationsError: string;
  onActionChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onParamChange: (paramName: string) => (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function AutomatedActionFields({
  data,
  automations,
  isLoadingAutomations,
  automationsError,
  onActionChange,
  onParamChange,
}: AutomatedActionFieldsProps) {
  const selectedAutomation = automations.find((item) => item.id === data.actionId);

  return (
    <>
      <label>
        Action
        <select value={data.actionId ?? ''} onChange={onActionChange} disabled={isLoadingAutomations}>
          <option value="">Select an action</option>
          {automations.map((action) => (
            <option key={action.id} value={action.id}>
              {action.label}
            </option>
          ))}
        </select>
      </label>

      {!automationsError && (
        <p className="node-form-inline-hint">Actions are loaded from the mock API endpoint.</p>
      )}

      {automationsError && <p className="node-form-inline-error">{automationsError}</p>}

      {selectedAutomation?.params.map((paramName) => (
        <label key={paramName}>
          {paramName}
          <input
            type="text"
            value={data.actionParams?.[paramName] ?? ''}
            onChange={onParamChange(paramName)}
          />
        </label>
      ))}
    </>
  );
}
