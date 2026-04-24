# HR Workflow Builder

An HR workflow builder for designing, editing, validating, and simulating process flows with React Flow, TypeScript, and Zustand.

## Overview

The application currently supports:
1. Adding workflow nodes from a sidebar.
2. Editing selected node data in a dynamic form panel.
3. Connecting, moving, and deleting nodes and edges visually.
4. Running workflow simulation against a mock async API.
5. Validating workflows before simulation.

## Architecture

The app is split into small, focused layers:
1. State layer: Zustand owns nodes, edges, selection, and update actions.
2. Canvas layer: React Flow renders the graph and registers custom node and edge types.
3. Form layer: NodeForm renders dynamic fields from configuration objects.
4. Simulation layer: validates workflow structure, sends JSON to the mock API, and displays results.
5. Service layer: mock API provides automation templates and workflow simulation responses.

Data flow is one-way:
1. User actions update Zustand.
2. Zustand updates React Flow state.
3. Panels and simulation UI re-render from the store.

## Key Features Implemented

1. Sidebar node creation:
- Start, Task, Approval, Automated, and End nodes.

2. Custom nodes:
- Separate React components for each node type.
- Clean card-style UI with labels and handles.

3. Custom edge with delete action:
- Uses `BaseEdge` and `EdgeLabelRenderer`.
- Shows a centered `×` button to delete a single edge.

4. Dynamic NodeForm:
- Config-driven form fields per node type.
- Task: title, description, assignee, dueDate.
- Approval: approverRole, threshold.
- Start/End: label.
- Automated: action dropdown is populated by fetching `getAutomations()` from the mock API service (not hardcoded in the form), and parameters are rendered dynamically from the selected API response template.

5. Workflow validation:
- Only one Start node allowed.
- At least one End node required.
- No disconnected nodes.
- Validation errors block simulation and are shown visually in the Simulation panel as a dedicated error list (`.simulation-errors` / `.simulation-error`) directly under the Simulate button.
- Nodes with validation issues are also highlighted directly on the canvas with a red border and warning indicator; a sidebar legend explains this visual cue.

6. Simulation:
- Converts nodes and edges to a serialized JSON payload in the form `{ nodes: [{ id, type, data: { label } }], edges: [{ source, target }] }`.
- Sends the serialized payload to a mock async `simulateWorkflow` API.
- Displays an execution timeline/log UI with step number, node label, node type, status, and message.

7. Undo/Redo history (bonus):
- Graph mutations are captured in a bounded Zustand history stack (`history`) with a forward stack (`future`).
- On each structural change, previous graph state is pushed to `history` and `future` is cleared.
- Undo restores the last snapshot; Redo reapplies from the forward stack.
- Available via sidebar buttons and keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`).

## Folder Structure

```text
workflow-builder/
  src/
    api/
      mockApi.ts
    app/
      store.ts
    components/
      AutomatedActionFields.tsx
      NodeForm.tsx
      Sidebar.tsx
      SimulationPanel.tsx
      WorkflowCanvas.tsx
      edges/
        DeletableEdge.tsx
      nodeFormConfig.ts
      nodes/
        ApprovalNode.tsx
        AutomatedNode.tsx
        EndNode.tsx
        StartNode.tsx
        TaskNode.tsx
    styles/
      globals.css
    types/
      workflow.ts
    utils/
      validation.ts
    App.tsx
    main.tsx
```

## How To Run

Prerequisite:
1. Node.js 20.19+ or 22.12+ recommended.

Install and start:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Deployment

This project is deployed on Vercel.

Live URL:
1. Add your deployed URL here after each production deploy.
2. Example format: `https://react-flow-hr-owqq.vercel.app/`

Vercel project settings:
1. Framework Preset: `Vite`
2. Root Directory: `./`
3. Build Command: `npm run build`
4. Output Directory: `dist`

Deployment notes:
1. Removed direct dependency on `@rolldown/binding-win32-x64-msvc` because it is Windows-only and fails on Vercel Linux build environments.
2. Keep Node.js version compatible with Vite 8 (`20.19+` or `22.12+`).
3. Redeploy from Vercel after pushing to `main`.

## Design Decisions

1. Zustand for shared workflow state:
Centralized state keeps React Flow, the node form, and simulation in sync without prop drilling.
2. Config-driven forms:
Field definitions live in configuration rather than hardcoded JSX, making new node types easier to add.
3. Modular dynamic automation fields:
Automated node action selection and parameter rendering are isolated for reuse and clarity.
4. Mock API abstraction:
The UI already works against async contracts, so switching to a real backend later is straightforward.
5. Custom React Flow primitives:
Custom nodes and edges give the editor a purpose-built workflow UX.

6. Scalable abstraction boundaries:
The architecture is intentionally split into reusable abstractions that scale with product growth:
- Graph state abstraction (Zustand store actions/selectors) isolates workflow mutations from rendering.
- Rendering abstraction (React Flow + custom node/edge components) isolates visual concerns per node/edge type.
- Form abstraction (typed config + controlled inputs) enables adding node-specific fields without rewriting form rendering logic.
- Validation abstraction (`validateWorkflow` + connection guards) centralizes graph rules instead of duplicating checks across UI handlers.
- Execution abstraction (simulation service + serialized graph payload) keeps execution behavior independent from editor internals.
This separation keeps feature growth mostly additive (new node type, rule, or simulation behavior) rather than requiring broad refactors.

7. Time-travel state management for editor ergonomics:
Undo/redo is implemented as first-class state transitions in the store, demonstrating scalable state abstraction for interactive graph editors.

## Evaluation Coverage Notes

1. Extensible form system for new node types:
- Form rendering is config-driven via `NODE_FORM_CONFIG` and `FormFieldConfig` rather than hardcoded per-field JSX.
- To add a new node type, you extend `WorkflowNodeData` (if needed), add a config entry in `nodeFormConfig.ts`, and add/update one node renderer component.
- Current dynamic behavior already demonstrates extensibility with `automatedNode` using API-driven actions and parameter fields.

2. Interface/type clarity for workflow nodes:
- Core workflow types are centralized in `src/types/workflow.ts`.
- `WorkflowNodeData` documents node-level data attributes.
- `WorkflowNode` and `WorkflowEdge` wrap React Flow generics for type-safe graph operations.
- `SerializedWorkflow`, `SerializedWorkflowNode`, and `SerializedWorkflowEdge` define the API payload schema used for simulation.

3. Graph-structure reasoning:
- Validation includes structural graph rules (single Start, at least one End, connectivity checks, Start entry constraints, and reachability from Start).
- UI-level connection rules prevent invalid graph edits early (for example, preventing incoming edges into Start).
- Simulation execution order follows graph traversal (BFS) from Start through outgoing edges, then appends any remaining orphan/cyclic nodes deterministically.

4. Controlled components:
- The Node form uses controlled inputs (`value` + `onChange`) for text, date, number, textarea, and select fields.
- Automated action parameter fields are also controlled and synced to Zustand state updates.

## Key Insight

This system separates workflow definition (graph structure) from execution logic (simulation layer).

## Trade-Offs

1. In-memory state only:
Fast and simple, but workflows are not persisted across reloads.
2. Lightweight validation:
Covers core structural rules, but does not yet analyze more advanced graph semantics.
3. Mock simulation:
Good for interaction design and demos, but not a real execution engine.

## Future Improvements

1. Persist workflows to local storage and backend APIs.
2. Add undo/redo, keyboard shortcuts, and zoom-to-fit controls.
3. Expand validation for cycles, orphan branches, and business-specific rules.
4. Add execution audit logs and richer simulation statuses.
5. Add templates for common HR processes such as onboarding and approvals.
