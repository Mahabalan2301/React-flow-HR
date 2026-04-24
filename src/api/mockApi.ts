import type { SerializedWorkflow } from '../types/workflow';

export type AutomationTemplate = {
  id: string;
  label: string;
  params: string[];
};

export type WorkflowJson = SerializedWorkflow;

export type SimulationStep = {
  step: number;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: 'success' | 'completed' | 'approved';
  message: string;
};

export type SimulationResponse = {
  runId: string;
  status: 'completed';
  totalSteps: number;
  steps: SimulationStep[];
};

const automations: AutomationTemplate[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
];

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function buildExecutionOrder(workflow: WorkflowJson) {
  const nodes = workflow.nodes ?? [];
  const edges = workflow.edges ?? [];

  if (nodes.length === 0) {
    return [] as typeof nodes;
  }

  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    if (!outgoing.has(edge.source) || !outgoing.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)?.push(edge.target);
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const startNode = nodes.find((node) => node.type === 'startNode' || node.type === 'start');
  const queue = startNode ? [startNode.id] : [];
  const visited = new Set<string>(queue);
  const ordered: typeof nodes = [];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) {
      continue;
    }

    const node = nodeById.get(id);
    if (!node) {
      continue;
    }

    ordered.push(node);

    for (const nextId of outgoing.get(id) ?? []) {
      if (visited.has(nextId)) {
        continue;
      }

      visited.add(nextId);
      queue.push(nextId);
    }
  }

  // If there is no Start node or any orphaned/cyclic nodes remain, append them deterministically.
  if (ordered.length < nodes.length) {
    const seen = new Set(ordered.map((node) => node.id));
    for (const node of nodes) {
      if (!seen.has(node.id)) {
        ordered.push(node);
      }
    }
  }

  return ordered;
}

// GET /automations
export async function getAutomations(): Promise<AutomationTemplate[]> {
  await delay(200);
  return automations;
}

// POST /simulate
export async function simulateWorkflow(workflowJson: WorkflowJson): Promise<SimulationResponse> {
  await delay(350);

  const orderedNodes = buildExecutionOrder(workflowJson);

  const getStepStatus = (nodeType?: string): SimulationStep['status'] => {
    if (nodeType === 'taskNode') {
      return 'completed';
    }
    if (nodeType === 'approvalNode') {
      return 'approved';
    }
    return 'success';
  };

  const steps: SimulationStep[] = orderedNodes.map((node, index) => ({
    step: index + 1,
    nodeId: node.id,
    nodeType: node.type ?? 'default',
    nodeLabel: node.data?.label ?? node.id,
    status: getStepStatus(node.type),
    message: `${node.data?.label ?? node.id} -> ${getStepStatus(node.type)}`,
  }));

  return {
    runId: `run_${Date.now()}`,
    status: 'completed',
    totalSteps: steps.length,
    steps,
  };
}
