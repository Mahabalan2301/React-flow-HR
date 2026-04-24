import type { SidebarNodeType } from '../types/workflow';

type SidebarProps = {
  onAddNode: (type: SidebarNodeType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

const nodeButtons: { label: string; type: SidebarNodeType }[] = [
  { label: 'Start Node', type: 'start' },
  { label: 'Task Node', type: 'task' },
  { label: 'Approval Node', type: 'approval' },
  { label: 'Automated Node', type: 'automated' },
  { label: 'End Node', type: 'end' },
];

export default function Sidebar({ onAddNode, onUndo, onRedo, canUndo, canRedo }: SidebarProps) {
  return (
    <aside className="sidebar">
      <h2>Nodes</h2>
      <p className="sidebar-legend">⚠ Red highlighted nodes have validation errors.</p>
      <div className="sidebar-history-actions">
        <button type="button" onClick={onUndo} disabled={!canUndo}>
          Undo (Ctrl+Z)
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>
          Redo (Ctrl+Y)
        </button>
      </div>
      <div className="sidebar-buttons">
        {nodeButtons.map((button) => (
          <button key={button.type} type="button" onClick={() => onAddNode(button.type)}>
            {button.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
