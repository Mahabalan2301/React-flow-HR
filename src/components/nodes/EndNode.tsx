import { Handle, Position, type NodeProps } from 'reactflow';
import type { WorkflowNodeData } from '../../types/workflow';

export default function EndNode({ data }: NodeProps<WorkflowNodeData>) {
  return (
    <div className="flow-node flow-node-end">
      <p className="flow-node-type">End Node</p>
      <p className="flow-node-label">{data.label}</p>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
