import { useMemo, useState } from 'react';
import { simulateWorkflow, type SimulationResponse, type WorkflowJson } from '../api/mockApi';
import type { WorkflowEdge, WorkflowNode } from '../types/workflow';
import { validateWorkflow } from '../utils/validation';

type SimulationPanelProps = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onValidationStateChange: (invalidNodeIds: string[]) => void;
};

export default function SimulationPanel({ nodes, edges, onValidationStateChange }: SimulationPanelProps) {
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastSubmittedWorkflow, setLastSubmittedWorkflow] = useState<WorkflowJson | null>(null);

  const serializedWorkflow = useMemo<WorkflowJson>(() => ({
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      data: { label: node.data?.label ?? 'Untitled node' },
    })),
    edges: edges.map((edge) => ({ source: edge.source, target: edge.target })),
  }), [nodes, edges]);

  const handleSimulate = async () => {
    const validationResult = validateWorkflow(nodes, edges);
    if (!validationResult.isValid) {
      setErrorMessages(validationResult.errors);
      setResult(null);
      onValidationStateChange(Object.keys(validationResult.nodeErrors));
      return;
    }

    setIsSimulating(true);
    setErrorMessages([]);
    setLastSubmittedWorkflow(serializedWorkflow);
    onValidationStateChange([]);

    try {
      const response = await simulateWorkflow(serializedWorkflow);

      setResult(response);
    } catch {
      setErrorMessages(['Simulation failed. Please try again.']);
      setResult(null);
      onValidationStateChange([]);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <section className="simulation-panel">
      <h2>Simulation</h2>
      <button type="button" className="simulate-button" onClick={handleSimulate} disabled={isSimulating}>
        {isSimulating ? 'Simulating...' : 'Simulate Workflow'}
      </button>

      {errorMessages.length > 0 && (
        <ul className="simulation-errors">
          {errorMessages.map((message) => (
            <li key={message} className="simulation-error">
              {message}
            </li>
          ))}
        </ul>
      )}

      <div className="simulation-json-block">
        <h3>Serialized Request</h3>
        <p className="simulation-hint">Payload shape sent to the simulation API endpoint.</p>
        <pre className="simulation-json">{JSON.stringify(lastSubmittedWorkflow ?? serializedWorkflow, null, 2)}</pre>
      </div>

      {result && (
        <div className="simulation-results">
          <h3>Execution Timeline</h3>
          <ol className="simulation-timeline">
            {result.steps.map((step) => (
              <li key={step.nodeId + step.step} className="simulation-timeline-item">
                <p className="simulation-timeline-title">
                  Step {step.step}: {step.nodeLabel}
                </p>
                <p className="simulation-timeline-meta">
                  Type: {step.nodeType} | Status: {step.status}
                </p>
                <p className="simulation-timeline-message">{step.message}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
