# LinkedChain

**A Self-Aware, Time-Traveling Graph Data Structure for TypeScript.**

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

`LinkedChain` is a single-file, zero-dependency TypeScript class.

1. Copy `src/linked-chain.ts` into your project.
2. Import it:
   ```typescript
   import LinkedChain from "./src/linked-chain";
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

---

## 🧠 Core Concepts

### 1. The "Self-Aware" Node
A `LinkedChain` node is aware of its place in the graph relative to its neighbors.
- **Ancestors**: All nodes that came before it (in a graph sense, e.g., a "parent" commit or a previous linked list node).
- **Progeny**: All nodes that descend from it.
- **Origin**: The root source of the chain.

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

---

## 👥 Contributing

This project is open for extension. Key areas for improvement:
- **Deep Diffing**: Currently, `LinkedChain` uses shallow comparisons for deltas. Implementing deep diffing for nested objects would improve efficiency.
- **Serialization**: Full history serialization/deserialization support.

---

*Generated by Antigravity*
