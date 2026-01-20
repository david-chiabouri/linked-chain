# Multiverse Simulator Walkthrough

## Overview
The `multiverse-simulator.ts` script uses `LinkedChain` to model an entire sci-fi multiverse. It simulates diverging timelines based on critical civilization choices, tracking global variables like population, technology, and crises.

## Key LinkedChain Features
- **Complex State Modeling**: Storing rich objects (`CivilizationState`) in the chain.
- **Deep Lineage**: Using `ancestor_path()` to trace the complete history of a reality back to its genesis.
- **Graph Traversal**: Searching across multiple distinct chains (parallel universes) to find data (e.g., who discovered FTL travel?).

## Code Highlights

### Evolution
We define an `evolve` helper to transition state. The simulator manages a "Prime Timeline" until a divergence point in 2150.

### The Split
From 2150 (Index 1), we branch into multiple realities:
1.  **Timeline A (War)**: Continuation of the current chain.
2.  **Timeline B (Peace)**: `branch_from_history(1)`.
3.  **Timeline C (Isolation)**: `branch_from_history(0)` (diverged way back in 2100).

### Cross-Timeline Analysis
We iterate through the "tips" of these chains and trace their ancestors to generate a report.
```typescript
const history = t.node.ancestor_path();
console.log(`Length: ${history.length} eras`);
```

## Running the Example
```bash
bun run examples/multiverse-simulator/multiverse-simulator.ts
```
