import { create } from 'zustand';
import {
  addEdge as rfAddEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from 'reactflow';
import type {
  NodeDataUpdater,
  SidebarNodeType,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
} from '../types/workflow';
import { canCreateConnection } from '../utils/validation';

const initialNodes: WorkflowNode[] = [
  {
    id: '1',
    position: { x: 120, y: 120 },
    data: { label: 'Start' },
    type: 'startNode',
  },
  {
    id: '2',
    position: { x: 380, y: 120 },
    data: { label: 'Task', title: 'Task', description: '', assignee: '', dueDate: '' },
    type: 'taskNode',
  },
  {
    id: '3',
    position: { x: 640, y: 120 },
    data: { label: 'End' },
    type: 'endNode',
  },
];

const initialEdges: WorkflowEdge[] = [{ id: 'e1-2', source: '1', target: '2', type: 'deletable' }];

let nodeIdCounter = initialNodes.length + 1;
const MAX_HISTORY = 100;

type WorkflowSnapshot = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
};

const cloneNodes = (nodes: WorkflowNode[]) =>
  nodes.map((node) => ({
    ...node,
    data: { ...node.data },
    position: { ...node.position },
  }));

const cloneEdges = (edges: WorkflowEdge[]) =>
  edges.map((edge) => ({
    ...edge,
    data: edge.data ? { ...edge.data } : edge.data,
  }));

const createSnapshot = (state: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode: WorkflowNode | null;
}): WorkflowSnapshot => ({
  nodes: cloneNodes(state.nodes),
  edges: cloneEdges(state.edges),
  selectedNodeId: state.selectedNode?.id ?? null,
});

const restoreSelectedNode = (nodes: WorkflowNode[], selectedNodeId: string | null) => {
  if (!selectedNodeId) {
    return null;
  }

  return nodes.find((node) => node.id === selectedNodeId) ?? null;
};

const trimHistory = (history: WorkflowSnapshot[]) =>
  history.length > MAX_HISTORY ? history.slice(history.length - MAX_HISTORY) : history;

const hasGraphChanged = (
  prevNodes: WorkflowNode[],
  prevEdges: WorkflowEdge[],
  nextNodes: WorkflowNode[],
  nextEdges: WorkflowEdge[],
) => {
  return (
    JSON.stringify({ nodes: prevNodes, edges: prevEdges }) !==
    JSON.stringify({ nodes: nextNodes, edges: nextEdges })
  );
};

type WorkflowState = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNode: WorkflowNode | null;
  history: WorkflowSnapshot[];
  future: WorkflowSnapshot[];
  addNode: (nodeType: SidebarNodeType) => void;
  updateNode: (nodeId: string, updater: NodeDataUpdater) => void;
  setSelectedNode: (node: WorkflowNode | null) => void;
  addEdge: (connection: Connection) => void;
  removeEdge: (edgeId: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  undo: () => void;
  redo: () => void;
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNode: null,
  history: [],
  future: [],

  addNode: (nodeType) => {
    const id = `node-${nodeIdCounter++}`;
    const position = {
      x: 220 + Math.random() * 500,
      y: 40 + Math.random() * 420,
    };

    const config = {
      start: {
        data: { label: 'Start' },
        type: 'startNode' as const,
      },
      task: {
        data: { label: 'Task', title: 'Task', description: '', assignee: '', dueDate: '' },
        type: 'taskNode' as const,
      },
      approval: {
        data: { label: 'Approval', approverRole: '', threshold: 1 },
        type: 'approvalNode' as const,
      },
      automated: {
        data: { label: 'Automated', actionId: '', actionParams: {} },
        type: 'automatedNode' as const,
      },
      end: {
        data: { label: 'End' },
        type: 'endNode' as const,
      },
    }[nodeType];

    const newNode: WorkflowNode = {
      id,
      position,
      data: config.data,
      type: config.type,
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      history: trimHistory([...state.history, createSnapshot(state)]),
      future: [],
    }));
  },

  updateNode: (nodeId, updater) => {
    set((state) => {
      const nextNodes = state.nodes.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }

        const patch =
          typeof updater === 'function'
            ? updater(node.data as WorkflowNodeData)
            : updater;

        return {
          ...node,
          data: {
            ...node.data,
            ...patch,
          },
        };
      });

      const nextSelectedNode = state.selectedNode
        ? nextNodes.find((node) => node.id === state.selectedNode?.id) ?? null
        : null;

      return {
        nodes: nextNodes,
        selectedNode: nextSelectedNode,
        history: trimHistory([...state.history, createSnapshot(state)]),
        future: [],
      };
    });
  },

  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },

  addEdge: (connection) => {
    set((state) => {
      if (!canCreateConnection(state.nodes, state.edges, connection)) {
        return state;
      }

      return {
        edges: rfAddEdge({ ...connection, type: 'deletable' }, state.edges as Edge[]),
        history: trimHistory([...state.history, createSnapshot(state)]),
        future: [],
      };
    });
  },

  removeEdge: (edgeId) => {
    set((state) => {
      const nextEdges = state.edges.filter((edge) => edge.id !== edgeId);
      if (!hasGraphChanged(state.nodes, state.edges, state.nodes, nextEdges)) {
        return state;
      }

      return {
        edges: nextEdges,
        history: trimHistory([...state.history, createSnapshot(state)]),
        future: [],
      };
    });
  },

  onNodesChange: (changes) =>
    set((state) => {
      const nextNodes = applyNodeChanges(changes, state.nodes);
      const nodeIds = new Set(nextNodes.map((node) => node.id));
      const nextEdges = state.edges.filter(
        (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
      );
      const nextSelectedNode = state.selectedNode
        ? nextNodes.find((node) => node.id === state.selectedNode?.id) ?? null
        : null;

      return {
        nodes: nextNodes,
        edges: nextEdges,
        selectedNode: nextSelectedNode,
      };
    }),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  undo: () => {
    set((state) => {
      if (state.history.length === 0) {
        return state;
      }

      const previousSnapshot = state.history[state.history.length - 1];
      const nextHistory = state.history.slice(0, -1);
      const currentSnapshot = createSnapshot(state);
      const restoredNodes = cloneNodes(previousSnapshot.nodes);
      const restoredEdges = cloneEdges(previousSnapshot.edges);

      return {
        nodes: restoredNodes,
        edges: restoredEdges,
        selectedNode: restoreSelectedNode(restoredNodes, previousSnapshot.selectedNodeId),
        history: nextHistory,
        future: trimHistory([...state.future, currentSnapshot]),
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) {
        return state;
      }

      const nextSnapshot = state.future[state.future.length - 1];
      const nextFuture = state.future.slice(0, -1);
      const currentSnapshot = createSnapshot(state);
      const restoredNodes = cloneNodes(nextSnapshot.nodes);
      const restoredEdges = cloneEdges(nextSnapshot.edges);

      return {
        nodes: restoredNodes,
        edges: restoredEdges,
        selectedNode: restoreSelectedNode(restoredNodes, nextSnapshot.selectedNodeId),
        history: trimHistory([...state.history, currentSnapshot]),
        future: nextFuture,
      };
    });
  },
}));