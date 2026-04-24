import type { Connection } from 'reactflow';
import type { WorkflowEdge, WorkflowNode } from '../types/workflow';

export type WorkflowValidationResult = {
  isValid: boolean;
  errors: string[];
  nodeErrors: Record<string, string[]>;
};

const addNodeError = (nodeErrors: Record<string, string[]>, nodeId: string, message: string) => {
  if (!nodeErrors[nodeId]) {
    nodeErrors[nodeId] = [];
  }

  if (!nodeErrors[nodeId].includes(message)) {
    nodeErrors[nodeId].push(message);
  }
};

const getNodeLabel = (node: WorkflowNode) => node.data?.label?.trim() || 'Untitled node';

const getNodeCategory = (node: WorkflowNode) => {
  const rawType = (node.type ?? '').toLowerCase();

  if (rawType.endsWith('node')) {
    return rawType.slice(0, -4);
  }

  return rawType;
};

const isStartNode = (node: WorkflowNode) => getNodeCategory(node) === 'start';

const buildOutgoingMap = (edges: WorkflowEdge[]) => {
  const outgoing = new Map<string, string[]>();

  for (const edge of edges) {
    const targets = outgoing.get(edge.source) ?? [];
    targets.push(edge.target);
    outgoing.set(edge.source, targets);
  }

  return outgoing;
};

const getReachableFromStart = (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
  const startNodeIds = nodes.filter(isStartNode).map((node) => node.id);
  const outgoing = buildOutgoingMap(edges);
  const reachable = new Set<string>();
  const queue = [...startNodeIds];

  for (const startNodeId of startNodeIds) {
    reachable.add(startNodeId);
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const next of outgoing.get(current) ?? []) {
      if (reachable.has(next)) {
        continue;
      }

      reachable.add(next);
      queue.push(next);
    }
  }

  return reachable;
};

export function canCreateConnection(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  connection: Connection,
): boolean {
  const { source, target } = connection;

  if (!source || !target || source === target) {
    return false;
  }

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  if (isStartNode(targetNode)) {
    return false;
  }

  if (isStartNode(sourceNode)) {
    return true;
  }

  const reachableFromStart = getReachableFromStart(nodes, edges);
  return reachableFromStart.has(sourceNode.id);
}

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowValidationResult {
  const errors: string[] = [];
  const nodeErrors: Record<string, string[]> = {};

  if (nodes.length === 0) {
    errors.push('Workflow must contain at least one node');
    return { isValid: false, errors, nodeErrors };
  }

  const startNodes = nodes.filter((node) => getNodeCategory(node) === 'start');
  if (startNodes.length === 0) {
    errors.push('Workflow must contain a Start node');
  }
  if (startNodes.length > 1) {
    const message = 'Only one Start node is allowed';
    errors.push(message);
    for (const startNode of startNodes) {
      addNodeError(nodeErrors, startNode.id, message);
    }
  }

  const hasEndNode = nodes.some((node) => getNodeCategory(node) === 'end');
  if (!hasEndNode) {
    errors.push('Workflow must contain at least one End node');
  }

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const node of nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, 0);
  }

  for (const edge of edges) {
    const targetNode = nodes.find((node) => node.id === edge.target);
    if (targetNode && isStartNode(targetNode)) {
      const message = 'Start node cannot have incoming edges';
      errors.push(message);
      addNodeError(nodeErrors, targetNode.id, message);
    }

    if (incoming.has(edge.target)) {
      incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    }
    if (outgoing.has(edge.source)) {
      outgoing.set(edge.source, (outgoing.get(edge.source) ?? 0) + 1);
    }
  }

  for (const node of nodes) {
    const type = getNodeCategory(node);
    const label = getNodeLabel(node);
    const incomingCount = incoming.get(node.id) ?? 0;
    const outgoingCount = outgoing.get(node.id) ?? 0;

    if (type !== 'start' && incomingCount === 0) {
      const message = `Node '${label}' is not connected`;
      errors.push(message);
      addNodeError(nodeErrors, node.id, message);
    }

    if (type !== 'end' && outgoingCount === 0) {
      const message = `Node '${label}' is not connected`;
      errors.push(message);
      addNodeError(nodeErrors, node.id, message);
    }
  }

  if (startNodes.length === 1) {
    const reachableFromStart = getReachableFromStart(nodes, edges);

    for (const node of nodes) {
      if (!reachableFromStart.has(node.id)) {
        const message = `Node '${getNodeLabel(node)}' is not reachable from Start`;
        errors.push(message);
        addNodeError(nodeErrors, node.id, message);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    nodeErrors,
  };
}
