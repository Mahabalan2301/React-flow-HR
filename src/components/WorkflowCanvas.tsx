import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Connection,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
} from 'reactflow';
import Sidebar from './Sidebar';
import NodeForm from './NodeForm';
import SimulationPanel from './SimulationPanel';
import type { NodeDataUpdater } from '../types/workflow';
import StartNode from './nodes/StartNode';
import TaskNode from './nodes/TaskNode';
import ApprovalNode from './nodes/ApprovalNode';
import AutomatedNode from './nodes/AutomatedNode';
import EndNode from './nodes/EndNode';
import DeletableEdge from './edges/DeletableEdge';
import { useWorkflowStore } from '../app/store';
import { canCreateConnection } from '../utils/validation';

const NODE_TYPES: NodeTypes = Object.freeze({
  startNode: StartNode,
  taskNode: TaskNode,
  approvalNode: ApprovalNode,
  automatedNode: AutomatedNode,
  endNode: EndNode,
});

const EDGE_TYPES: EdgeTypes = Object.freeze({
  deletable: DeletableEdge,
});

export default function WorkflowCanvas() {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const selectedNode = useWorkflowStore((state) => state.selectedNode);
  const addNode = useWorkflowStore((state) => state.addNode);
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);
  const addEdge = useWorkflowStore((state) => state.addEdge);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const canUndo = useWorkflowStore((state) => state.history.length > 0);
  const canRedo = useWorkflowStore((state) => state.future.length > 0);
  const [invalidNodeIds, setInvalidNodeIds] = useState<string[]>([]);

  const onNodeClick = useCallback<NodeMouseHandler>((_event, node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const updateSelectedNodeData = useCallback((updater: NodeDataUpdater) => {
    if (!selectedNode) {
      return;
    }

    updateNode(selectedNode.id, updater);
  }, [selectedNode, updateNode]);

  const isValidConnection = useCallback((connection: Connection) => {
    return canCreateConnection(nodes, edges, connection);
  }, [nodes, edges]);

  const renderedNodes = useMemo(() => {
    const invalidNodeIdSet = new Set(invalidNodeIds);

    return nodes.map((node) => {
      const hasError = invalidNodeIdSet.has(node.id);
      const existingClassName = node.className ? `${node.className} ` : '';

      return {
        ...node,
        className: `${existingClassName}${hasError ? 'flow-node-invalid' : ''}`.trim(),
      };
    });
  }, [nodes, invalidNodeIds]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isModifierPressed = event.ctrlKey || event.metaKey;
      if (!isModifierPressed) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [undo, redo]);

  return (
    <div className="workflow-layout">
      <Sidebar onAddNode={addNode} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} />
      <div className="canvas-area">
        <ReactFlow
          nodes={renderedNodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          deleteKeyCode={['Delete', 'Backspace']}
          onNodeClick={onNodeClick}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={addEdge}
          isValidConnection={isValidConnection}
          nodesDraggable
          fitView
        >
          <MiniMap pannable zoomable />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <div className="inspector-column">
        <NodeForm selectedNode={selectedNode} onChangeData={updateSelectedNodeData} />
        <SimulationPanel nodes={nodes} edges={edges} onValidationStateChange={setInvalidNodeIds} />
      </div>
    </div>
  );
}