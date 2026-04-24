import { Handle, Position, type NodeProps } from 'reactflow';
import type { WorkflowNodeData } from '../../types/workflow';

export default function AutomatedNode({ data }: NodeProps<WorkflowNodeData>) {
  return (
    <div className="flow-node flow-node-automated">
      <p className="flow-node-type">Automated Node</p>
      <p className="flow-node-label">{data.label}</p>
      {data.actionId && <p className="flow-node-meta">Action: {data.actionId}</p>}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
