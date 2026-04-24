import { Handle, Position, type NodeProps } from 'reactflow';
import type { WorkflowNodeData } from '../../types/workflow';

export default function ApprovalNode({ data }: NodeProps<WorkflowNodeData>) {
  return (
    <div className="flow-node flow-node-approval">
      <p className="flow-node-type">Approval Node</p>
      <p className="flow-node-label">{data.label}</p>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
