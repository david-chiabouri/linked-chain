# Basic Usage Walkthrough

## Overview
The `basic-usage.ts` script demonstrates the fundamental operations of `LinkedChain`: creating a node, updating its state, and inspecting its automatic history tracking. It simulates the lifecycle of a software project from "planning" to "completed".

## Key LinkedChain Features
- **Initialization**: `new LinkedChain({ data: ... })`
- **Data Updates**: `node.update({ data: ... })` which automatically pushes a new history entry.
- **Deltas**: The history only stores *what changed* (deltas), not full copies.

## Code Highlights

### Creating a Node
We define a `ProjectState` interface and initialize the chain.
```typescript
const project = new LinkedChain<ProjectState>({
    data: { name: "My Super App", status: "planning", completion: 0 },
    metadata: { title: "Project Root" }
});
```

### Automatic History
When we call `update`, `LinkedChain` computes the difference between current and new state.
```typescript
// Only 'status' and 'completion' change. 'name' is preserved.
project.update({
    data: { status: "in-progress", completion: 10 }
});
```

## Running the Example
Execute the script with:
```bash
bun run examples/basic-usage/basic-usage.ts
```

Output will show the step-by-step state changes and the final compressed history timeline.
