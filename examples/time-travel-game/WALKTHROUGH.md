# Chrono-Rogue: Time Travel Game Walkthrough

## Overview
The `time-travel-game.ts` script is a high-fidelity "Roguelike Time-Looper" simulation. It demonstrates an AI agent that can "cheat death" by rewinding time when it encounters a fatal situation.

## Key LinkedChain Features
- **Revert to History**: `node.revert_to_history(index)` allows the system to roll back the entire game state (HP, Inventory, Enemies) to a precise moment in the past.
- **Deep Lineage Rebuilding**: The system must inspect past states to find a "safe" moment to return to (finding a state where HP > threshold).

## Gameplay Loop
1.  **Exploration**: The hero enters the dungeon.
2.  **Combat**: The hero fights a Dragon. Each attack is a chain update.
3.  **Death**: The Dragon deals a fatal blow.
4.  **Chrono-Trigger**: 
    - The death handler pauses execution.
    - It scans the `LinkedChainHistory` backwards.
    - It identifies a turn *before* the fatal sequence where the hero had potions.
    - It calls `revert_to_history(safeIndex)`.
5.  **Divergence**: The hero, now back in the past, takes a *different action* (Drinks Potion) instead of Attacking, altering the timeline and securing victory.

## Code Highlights

### The Rewind Logic
```typescript
// Scan history backwards for a safe state
for (let i = history.length - 2; i >= 0; i--) {
    const tempState = this.chain.rebuild_at(i);
    // Find state where we are alive and well
    if (tempState.data().hp > 40) {
        this.chain.revert_to_history(i);
        break;
    }
}
```

## Running the Example
```bash
bun run examples/time-travel-game/time-travel-game.ts
```
