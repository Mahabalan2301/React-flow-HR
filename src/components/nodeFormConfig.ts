export type InputKind = 'text' | 'date' | 'number' | 'textarea';

export type StaticNodeType = 'taskNode' | 'approvalNode' | 'startNode' | 'endNode';

type StaticFieldKey =
  | 'label'
  | 'title'
  | 'description'
  | 'assignee'
  | 'dueDate'
  | 'approverRole'
  | 'threshold';

export type FormFieldConfig<K extends StaticFieldKey = StaticFieldKey> = {
  key: K;
  label: string;
} & (
  | {
      input: 'number';
      defaultValue: number;
    }
  | {
      input: Exclude<InputKind, 'number'>;
      defaultValue: string;
    }
);

type NodeTypeFieldConfigMap = {
  taskNode: Array<FormFieldConfig<'title' | 'description' | 'assignee' | 'dueDate'>>;
  approvalNode: Array<FormFieldConfig<'approverRole' | 'threshold'>>;
  startNode: Array<FormFieldConfig<'label'>>;
  endNode: Array<FormFieldConfig<'label'>>;
};

export const NODE_FORM_CONFIG: NodeTypeFieldConfigMap = {
  taskNode: [
    { key: 'title', label: 'Title', input: 'text', defaultValue: '' },
    { key: 'description', label: 'Description', input: 'textarea', defaultValue: '' },
    { key: 'assignee', label: 'Assignee', input: 'text', defaultValue: '' },
    { key: 'dueDate', label: 'Due Date', input: 'date', defaultValue: '' },
  ],
  approvalNode: [
    { key: 'approverRole', label: 'Approver Role', input: 'text', defaultValue: '' },
    { key: 'threshold', label: 'Threshold', input: 'number', defaultValue: 1 },
  ],
  startNode: [{ key: 'label', label: 'Label', input: 'text', defaultValue: 'Start' }],
  endNode: [{ key: 'label', label: 'Label', input: 'text', defaultValue: 'End' }],
};

export const NODE_TYPE_TITLES: Record<StaticNodeType | 'automatedNode', string> = {
  startNode: 'Start Node',
  taskNode: 'Task Node',
  approvalNode: 'Approval Node',
  automatedNode: 'Automated Node',
  endNode: 'End Node',
};
