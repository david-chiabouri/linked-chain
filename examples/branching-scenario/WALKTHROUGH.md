# Branching Scenario Walkthrough

## Overview
The `branching-scenario.ts` script mimics a document version control system (like Git). It shows how to take a linear chain of edits and "fork" it from a past point to explore an alternative direction.

## Key LinkedChain Features
- **Branching**: `node.branch_from_history(index)`
- **Independence**: The new branch acts as a new root for its own future, while retaining the historical context of its origin.

## Code Highlights

### The Setup
We write a document through Versions 1, 2, and 3.
```typescript
doc.update({ data: { content: "Intro\nCh1\nCh2", version: 3 } });
```

### The Fork
We realize Chapter 2 was a mistake. we find the index corresponding to Version 2 and branch.
```typescript
const v2Index = 1; // Index in history
const alternateDraft = doc.branch_from_history(v2Index);
```

### The Divergence
We write a *new* Chapter 2 on the branch. The original `doc` instance remains unchanged (still has the old Chapter 2).
```typescript
alternateDraft.update({
    data: { content: "Intro\nCh1\nAnswer to Universe", version: 3.1 }
});
```

## Running the Example
```bash
bun run examples/branching-scenario/branching-scenario.ts
```
