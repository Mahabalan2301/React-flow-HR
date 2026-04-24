import { Handle, Position, type NodeProps } from 'reactflow';
import type { WorkflowNodeData } from '../../types/workflow';

export default function TaskNode({ data }: NodeProps<WorkflowNodeData>) {
  return (
    <div className="flow-node flow-node-task">
      <p className="flow-node-type">Task Node</p>
      <p className="flow-node-label">{data.label}</p>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
