import { Handle, Position, type NodeProps } from 'reactflow';
import type { WorkflowNodeData } from '../../types/workflow';

export default function StartNode({ data }: NodeProps<WorkflowNodeData>) {
  return (
    <div className="flow-node flow-node-start">
      <p className="flow-node-type">Start Node</p>
      <p className="flow-node-label">{data.label}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
