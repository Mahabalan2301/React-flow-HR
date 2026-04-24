import type { Edge, Node } from 'reactflow';

export type WorkflowNodeType = 'startNode' | 'taskNode' | 'approvalNode' | 'automatedNode' | 'endNode';

export type WorkflowNodeData = {
  label: string;
  title?: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  approverRole?: string;
  threshold?: number;
  actionId?: string;
  actionParams?: Record<string, string>;
};

export type NodeDataUpdater =
  | Partial<WorkflowNodeData>
  | ((current: WorkflowNodeData) => Partial<WorkflowNodeData>);

export type SidebarNodeType = 'start' | 'task' | 'approval' | 'automated' | 'end';

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export type SerializedWorkflowNode = {
  id: string;
  type?: WorkflowNodeType | string;
  data?: {
    label?: string;
  };
};

export type SerializedWorkflowEdge = {
  source: string;
  target: string;
};

export type SerializedWorkflow = {
  nodes?: SerializedWorkflowNode[];
  edges?: SerializedWorkflowEdge[];
};