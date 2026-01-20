# LinkedChain

[![npm version](https://img.shields.io/npm/v/linked-chain.svg?style=flat-square)](https://www.npmjs.com/package/linked-chain)

**A Temporal, Node-Based Graph Data Structure for TypeScript.**

---

## 📖 Introduction

`LinkedChain` is a sophisticated data structure designed for scenarios where **history**, **lineage**, and **version control** are distinct first-class citizens of your runtime state.

Unlike a traditional Doubly Linked List, every `LinkedChain` node behaves like a "Git Repo" for its own data. It tracks every change, allows for instant time-travel (undo/redo) to any past state, and supports branching timelines where a single object can fork into multiple independent futures.

### Use Cases
- **Simulation Engines**: Track the history of every entity in a simulation.
- **Game State Management**: Implement "Save Scumming", Undo/Redo, or branching narrative paths effortlessly.
- **Collaborative Editing**: Manage document versions and diverging drafts.
- **Audit Logging**: Automatically keep a delta-compressed history of all critical data changes for compliance.

---

## ⚡ Quick Start

### Installation

Install via your preferred package manager:

**Bun**
```bash
bun add linked-chain
```

**NPM**
```bash
npm install linked-chain
```

### Impatient? Copy-Paste-Ready:
```typescript
import LinkedChain from "linked-chain";
```

### Basic Usage

```typescript
// 1. Create a chain node
const node = new LinkedChain({
    data: { value: 100 },
    metadata: { title: "Initial State" }
});

// 2. Update it (Automatic History Tracking)
node.update({
    data: { value: 200 } // Changes are recorded as deltas
});

// 3. Time Travel
console.log(node.data()); // { value: 200 }
node.revert_to_history(0);
console.log(node.data()); // { value: 100 }
```

### Type Safety (Generics)
`LinkedChain` is fully typed. You can define your own interfaces to ensure type safety across history and branching.

```typescript
// Define your state shape
interface UserProfile {
    id: number;
    username: string;
    role: "admin" | "user";
}

// Pass the interface to the Generic
const userNode = new LinkedChain<UserProfile>({
    data: { id: 1, username: "neo", role: "user" }
});

// TypeScript enforces the shape!
userNode.update({
    // @ts-expect-error: 'god' is not assignable to type "admin" | "user"
    data: { role: "god" } 
});
```

---

## 🧠 Core Concepts

### 1. Proof of "Self-Awareness"
We label this data structure "self-aware" because it satisfies three criteria of computational reflexivity that standard nodes lack:

1.  **Temporal Proprioception**: It knows not just *what* it is, but *when* it is. Unlike a dumb object that gets overwritten, a `LinkedChain` node retains a memory of every state it has ever held.
2.  **Lineage Cognition**: It understands its relationship to the "Prime Timeline" (Origin) and can distinguish between its direct ancestors and distinct parallel branches (Progeny).
3.  **Autonomic Regulation**: It manages its own history. You don't update a separate "HistoryManager" utility; you update the *Node*, and the Node itself calculates the delta and crystallizes the event in its memory.

### 2. Built-in Version Control (`LinkedChainHistory`)
Every node has access to a `LinkedChainHistory` engine.
- **Timeline**: A linear array of `HistoryEntry` objects.
- **Delta Compression**: To save memory, `LinkedChain` calculates the *difference* between the current state and the previous state. It stores only this delta.
- **Checkpoints**: Full state snapshots are taken periodically to speed up time travel operations.

### 3. Branching Logic
Just like Git, you can create a "Fork" of your data at any point in its history.
```typescript
// Create a NEW, independent chain starting from History Index 2
const branch = node.branch_from_history(2);
```
The new branch is a separate object but retains the *lineage* of the original.

---

## 📚 Examples & Walkthroughs

We have provided a suite of heavily commented examples to demonstrate the power of `LinkedChain`.

| Example | Complexity | Description |
| :--- | :--- | :--- |
| **[Basic Usage](./examples/basic-usage/WALKTHROUGH.md)** | ⭐ | Learn the basics: Creating nodes, updating data, and inspecting the auto-generated history timeline. |
| **[Branching Scenarios](./examples/branching-scenario/WALKTHROUGH.md)** | ⭐⭐ | A "Git-like" document drafting system where you fork a draft from a previous version to explore an alternate ending. |
| **[The Multiverse Simulator](./examples/multiverse-simulator/WALKTHROUGH.md)** | ⭐⭐⭐ | A complex sci-fi simulation tracking multiple parallel civilizations. Demonstrates deep lineage analysis and searching across divergent graph branches. |
| **[Chrono-Rogue (Game)](./examples/time-travel-game/WALKTHROUGH.md)** | ⭐⭐⭐⭐ | A "Roguelike" game engine that detects player death, automatically scans history for the last safe save state, rewinds time, and alters player strategy to survive. |

---

## 🛠 API Reference

### `LinkedChain<T>`

#### Constructor
```typescript
new LinkedChain<T>(ingredients: LinkedChainIngredients<T>)
```
- `data`: Initial data payload.
- `metadata`: Initial metadata (title, id, description).
- `parent` / `next` / `origin`: Optional graph connections.

#### State Methods
- **`update(ingredients)`**: Updates data/metadata and records a history entry.
- **`data()`**: Returns the current data payload.
- **`metadata()`**: Returns the current metadata.
- **`toJSON()`**: Serializes the current state (excludes history).

#### History Methods
- **`revert_to_history(index)`**: Reverts the current *state* to a past point in time. This creates a new history entry representing the revert.
- **`branch_from_history(index)`**: Returns a **new** `LinkedChain` instance starting from the state at `index`.
- **`history().timeline()`**: Returns the array of all history entries.

#### Graph Traversal
- **`ancestor_path()`**: Returns an array of all previous nodes (walking backwards).
- **`progeny_path()`**: Returns an array of all next nodes (walking forwards).
- **`iterate('next' | 'previous')`**: A Generator for lazy iteration.
- **`find(predicate)`**: Searches the entire connected linear chain (up and down) for a node matching the predicate.
- **`has_circular_link()`**: Returns `true` if the chain loops on itself.

## ⚠️ Computed Limitations

While powerful, `LinkedChain` is currently in **Alpha** and has several known architectural limitations:

1.  **Shallow Delta Compression**: The history engine uses shallow equality checks. If you update a deeply nested object, the delta will store the *entire* top-level property path rather than a recursive diff.
2.  **Memory Growth**: The `LinkedChainHistory` timeline grows indefinitely. There is currently no "Garbage Collection" or "Squashing" mechanism to purge old history entries, so very long-running chains may consume significant memory.
3.  **Serialization**: The `.toJSON()` method exports only the *current node's state*. It does not export the entire history timeline or the graph structure (relationships). You cannot yet `JSON.stringify` a chain and `JSON.parse` it back into a fully functional, time-traveling object.
4.  **Reference Integrity**: JavaScript object references are preserved in memory. If you branch a chain, the new branch points to the same underlying data objects until they are modified. Mutating data *outside* of the `.update()` method (e.g., `node.data().value = 5`) breaks the history tracking.

---

## 🤝 Caring for the Code?

**I am actively looking for contributors!**

This project (and others in our portfolio) needs engineers who love graph theory, data structures, and TypeScript.
If you're interested in:
- Implementing **Deep Diffing** for smarter deltas.
- Building a **Serialization/Deserialization** engine to save entire multiverses to disk.
- Optimizing memory usage with **History Pruning**.

Please open an issue or submit a PR. I am building a suite of advanced tools and would love your help.

---

*Documentation Generated with AI*
