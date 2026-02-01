
import LinkedChain from "../../src/linked-chain";

/**
 * ⏳ CHRONO-ROGUE: THE TIME LOOPER ⏳
 * 
 * This advanced example demonstrates a "self-correcting" game simulation that uses 
 * LinkedChain's time travel capabilities to cheat death.
 * 
 * CORE MECHANICS:
 * 1. The 'Player' executes actions in turns.
 * 2. Every significant action is a node in the chain.
 * 3. Combat is fatal. If HP <= 0, the 'Chronosphere' activates.
 * 4. The system searches history for the last safe checkpoint (before combat).
 * 5. It reverts time and takes a DIFFERENT action (e.g., Heal instead of Attack).
 * 
 * KEY FEATURES SHOWCASED:
 * - `revert_to_history(index)`: True state rollback.
 * - `ancestor_path()`: Analyzing past decisions to find where things went wrong.
 * - Complex State object (HP, Inventory, Status Effects).
 */

// --- 1. Game State Definitions ---

type Item = "Potion" | "Sword" | "Shield" | "Chronosphere";

interface GameState {
    turn: number;
    hp: number;
    maxHp: number;
    enemyName?: string;
    enemyHp?: number;
    inventory: Item[];
    status: "Exploring" | "Combat" | "Dead" | "Victory";
    log: string;
}

// Helper for deep cloning state updates (in a real app, LinkedChain's delta handles storage, but we pass full objects here)
const updateState = (prev: GameState, changes: Partial<GameState>): GameState => ({
    ...prev,
    ...changes,
    inventory: changes.inventory ? [...changes.inventory] : [...prev.inventory]
});

// --- 2. The Game Engine ---

class ChronoGame {
    chain: LinkedChain<GameState>;

    constructor() {
        this.chain = new LinkedChain<GameState>({
            data: {
                turn: 1,
                hp: 100,
                maxHp: 100,
                inventory: ["exclude" as any], // Initial setup
                status: "Exploring",
                log: "Hero enters the Dungeon of Eternity."
            },
            metadata: { title: "Turn 1: Entry" }
        });

        // Fix initial inventory artifact
        this.chain.update({
            data: updateState(this.chain.data()!, { inventory: ["Sword", "Potion", "Chronosphere", "Potion"] })
        });
    }

    // Action: Encounter Enemy
    encounter(enemy: string, hp: number) {
        const current = this.chain.data()!;
        console.log(`\n[Turn ${current.turn}] ⚠️ Encountered ${enemy} (${hp} HP)!`);

        this.chain.update({
            data: updateState(current, {
                turn: current.turn + 1,
                status: "Combat",
                enemyName: enemy,
                enemyHp: hp,
                log: `Encountered ${enemy}.`
            }),
            metadata: { title: `Turn ${current.turn + 1}: Contact (${enemy})` }
        });
    }

    // Action: Attack
    attack() {
        const current = this.chain.data()!;
        if (current.status !== "Combat") return;

        console.log(`   ⚔️ Hero attacks!`);

        // Simulating damage exchange
        const dmgToEnemy = 30;
        const dmgToHero = 40; // High damage!

        const newEnemyHp = (current.enemyHp || 0) - dmgToEnemy;
        const newHeroHp = current.hp - dmgToHero;

        if (newHeroHp <= 0) {
            this.handleDeath("Killed by " + current.enemyName);
        } else if (newEnemyHp <= 0) {
            this.victory();
        } else {
            this.chain.update({
                data: updateState(current, {
                    turn: current.turn + 1,
                    hp: newHeroHp,
                    enemyHp: newEnemyHp,
                    log: `Attacked. Took ${dmgToHero} dmg.`
                }),
                metadata: { title: `Turn ${current.turn + 1}: Combat Round` }
            });
            console.log(`   > Result: Hero HP: ${newHeroHp}, Enemy HP: ${newEnemyHp}`);
        }
    }

    // Action: Drink Potion
    drinkPotion() {
        const current = this.chain.data()!;
        if (!current.inventory.includes("Potion")) {
            console.log("   ❌ No potions left!");
            return false;
        }

        console.log(`   🧪 Hero drinks a Potion.`);
        const newInv = [...current.inventory];
        newInv.splice(newInv.indexOf("Potion"), 1);

        const newHp = Math.min(current.maxHp, current.hp + 50);

        this.chain.update({
            data: updateState(current, {
                turn: current.turn + 1,
                hp: newHp,
                inventory: newInv,
                log: "Used Potion."
            }),
            metadata: { title: `Turn ${current.turn + 1}: Healed` }
        });
        console.log(`   > Result: Hero HP restored to ${newHp}.`);
        return true;
    }

    victory() {
        const current = this.chain.data()!;
        console.log(`   🎉 Victory against ${current.enemyName}!`);
        this.chain.update({
            data: updateState(current, {
                turn: current.turn + 1,
                status: "Exploring",
                enemyName: undefined,
                enemyHp: undefined,
                log: `Defeated ${current.enemyName}.`
            }),
            metadata: { title: `Turn ${current.turn + 1}: Victory` }
        });
    }

    // THE TIME TRAVEL MECHANIC
    handleDeath(cause: string) {
        console.log(`\n💀 STATUS: DEAD (${cause}).`);
        console.log(`   ... INIT CHRONOSPHERE ...`);

        // 1. Mark death in history
        const current = this.chain.data()!;
        this.chain.update({
            data: updateState(current, {
                status: "Dead",
                hp: 0,
                log: `Died: ${cause}`
            }),
            metadata: { title: `Turn ${current.turn + 1}: DEATH` }
        });

        // Mark this fatal state as a snapshot point (a "bad ending")
        this.chain.set_if_snapshot(true);

        // 2. Scan History for a safe spot
        // Strategy: Go back to the start of the combat (or 2 turns ago)
        const history = this.chain.history().timeline();
        console.log(`   Suggesting rewind... Analyzing ${history.length} timeline entries.`);

        // Find the last known state where HP was > 50 (safe zone)
        // We iterate backwards from the end
        let safeIndex = -1;
        for (let i = history.length - 2; i >= 0; i--) {
            // We need to rebuild to inspect state properly as timeline stores deltas
            // Optimization: In a real app we might cache snapshots or metadata. 
            // Here we just rebuild for simulation fidelity.
            const tempState = this.chain.rebuild_at(i);
            if (tempState && tempState.data()!.hp > 40 && tempState.data()!.status === "Combat") {
                safeIndex = i;
                break;
            }
        }

        if (safeIndex === -1) {
            // Fallback: Just go back 2 steps
            safeIndex = Math.max(0, history.length - 3);
        }

        console.log(`   ⏪ REWINDING TO HISTORY INDEX ${safeIndex}...`);

        this.chain.revert_to_history(safeIndex);

        console.log(`   Time warp successful. Resuming from Turn ${this.chain.data()!.turn}.`);
        console.log(`   Current State: HP ${this.chain.data()!.hp}, Enemy HP ${this.chain.data()!.enemyHp}`);

        // 3. FORCE ALTERNATE STRATEGY
        // The game logic sees we are back.
        console.log(`\n[Turn ${this.chain.data()!.turn}] 💡 Foresight Active: 'I must heal instead of attacking!'`);
        this.drinkPotion();
    }
}

// --- 3. Run the Simulation ---

const game = new ChronoGame();

// Step 1: Walk in
console.log(`State: ${game.chain.data()!.log}`);

// Step 2: Fight a Dragon
game.encounter("Red Dragon", 100);

// Round 1: Attack (Takes 40 dmg, Hero 100 -> 60)
game.attack();

// Round 2: Attack (Takes 40 dmg, Hero 60 -> 20)
// Warning: Next hit will kill us (40 dmg > 20 HP)
game.attack();

// Round 3: Attack -> DEATH -> AUTO REWIND
// The 'attack' method triggers death logic, which rewinds time to before this fatal blow or earlier,
// and then forces a potion drink.
game.attack();
// Inside this call:
// 1. Hero HP becomes -20.
// 2. handleDeath() is called.
// 3. Rewinds to state where HP was 60 (Round 1 end).
// 4. Force drinks potion (HP 60 -> 100).

// Round 4 (Post-Time-Travel): We are now at Turn X with 100 HP.
// We can continue fighting.
console.log("\n--- Timeline Corrected ---");
game.attack(); // Hero 100 -> 60, Enemy (assuming state restored correctly)
// Note: When we reverted, we reverted the ENEMY HP too! 
// If we reverted to Round 1 end: Enemy was 70HP.
// We healed. Now we attack again. Enemy -> 40HP. Hero -> 60HP.

game.attack(); // Enemy -> 10HP. Hero -> 20HP.
game.attack(); // Enemy -> -20HP. Victory!

console.log("\n🏆 FINAL TIMELINE STATUS:");
console.log(game.chain.data());
