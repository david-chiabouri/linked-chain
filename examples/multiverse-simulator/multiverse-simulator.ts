
import LinkedChain from "../../src/linked-chain";

/**
 * 🌌 THE MULTIVERSE SIMULATOR 🌌
 * 
 * This example demonstrates using LinkedChain to model diverging timelines in a science fiction setting.
 * It showcases:
 * - Complex State Tracking: Civilizations, Tech Levels, and Global Parameters.
 * - Strategic Branching: Creating "What If" scenarios (alternate timelines).
 * - Lineage Analysis: Tracing back the cause of an event using ancestors.
 * - Graph Traversal: Visualizing the entire multiverse structure.
 */

// --- 1. Define the Reality State ---

interface CivilizationState {
    year: number;
    population_billions: number;
    global_temperature_celsius: number;
    dominant_factions: string[];
    technologies: Set<string>;
    active_crises: string[];
}

// Helper to make state updates cleaner
const evolve = (
    base: CivilizationState,
    changes: Partial<CivilizationState>
): CivilizationState => {
    // Note: In a real app, we might rely on the chain's delta system, 
    // but here we compute the full new state for the 'data' payload.
    // Deep clone sets/arrays to avoid mutation reference issues in this simulation script.
    return {
        ...base,
        ...changes,
        technologies: changes.technologies ? changes.technologies : new Set(base.technologies),
        dominant_factions: changes.dominant_factions ? [...changes.dominant_factions] : [...base.dominant_factions],
        active_crises: changes.active_crises ? [...changes.active_crises] : [...base.active_crises]
    };
};

console.log("🚀 INITIALIZING REALITY ENGINE...\n");

// --- 2. The Prime Timeline (The "Root") ---

const genesisState: CivilizationState = {
    year: 2100,
    population_billions: 9.5,
    global_temperature_celsius: 16.5,
    dominant_factions: ["United Earth Federation", "Mars Colony One"],
    technologies: new Set(["Fusion Power", "Quantum Computing"]),
    active_crises: ["Resource Scarcity"]
};

// The root of our history
const timelinePrime = new LinkedChain<CivilizationState>({
    data: genesisState,
    metadata: {
        title: "The Golden Age",
        id: "TIMELINE_ALPHA"
    }
});

console.log(`[YEAR ${timelinePrime.data()?.year}] Timeline started. Status: Stable.`);

// --- 3. The Divergent Point (Year 2150) ---

// Advance Prime Timeline to 2150
let currentEra = timelinePrime;

const state2150 = evolve(currentEra.data()!, {
    year: 2150,
    active_crises: ["Resource Scarcity", "Alien Signal Detected"],
    technologies: new Set([...currentEra.data()!.technologies, "Interplanetary Travel"])
});

currentEra.update({
    data: state2150,
    metadata: { title: " The Signal" }
});

console.log(`\n[YEAR 2150] An alien signal is detected. The timeline becomes unstable...`);

// At this point, reality fractures into three possibilities.

// --- 4. Timeline A: The War Path (Direct continuation) ---

console.log("\n⚔️  Simulating Timeline A: Aggressive First Contact...");

// We interpret the signal as a threat.
const warState = evolve(state2150, {
    year: 2200,
    population_billions: 4.2, // Billions die
    active_crises: ["Interstellar War", "Nuclear Winter"],
    dominant_factions: ["Earth Defense Force"]
});

// We continue the main chain instance as "Timeline A"
currentEra.update({
    data: warState,
    metadata: { title: "The Great Silence (Extinction Event)" }
});

console.log(`   > Result: Population reduced to ${currentEra.data()?.population_billions}B. Status: CATASTROPHIC.`);


// --- 5. Timeline B: The Diplomatic Path (Branch from 2150) ---

console.log("\n🕊️  Simulating Timeline B: Peaceful Integration...");

// We need to branch from BEFORE the war started.
// History index 0 = 2100 (Start)
// History index 1 = 2150 (The Signal) <- We branch here
// History index 2 = 2200 (The War)

const signalEventIndex = 1;
const timelinePeace = currentEra.branch_from_history(signalEventIndex);

timelinePeace.update_metadata({
    title: "Timeline Beta (Diplomacy)",
    id: "TIMELINE_BETA"
});

const utopiaState = evolve(timelinePeace.data()!, {
    year: 2200,
    population_billions: 12.0,
    technologies: new Set([...timelinePeace.data()!.technologies, "Zero Point Energy", "FTL Drive"]),
    active_crises: [], // Crisis resolved
    dominant_factions: ["Galactic Council"]
});

timelinePeace.update({
    data: utopiaState,
    metadata: { description: "Humanity joins the galactic community." }
});

console.log(`   > Result: Technology booms. FTL Drive acquired. Status: UTOPIAN.`);


// --- 6. Timeline C: The Isolationist Path (Fork from 2100) ---
// "What if we never left the solar system?" branching from way back.

console.log("\n🛡️  Simulating Timeline C: The Fortress Solar System...");

const timelineIsolation = timelinePrime.branch_from_history(0); // Branch from genesis

timelineIsolation.update_metadata({
    title: "Timeline Gamma (Isolation)",
    id: "TIMELINE_GAMMA"
});

// Fast forward this timeline to 2200 differently
timelineIsolation.update({
    data: evolve(timelineIsolation.data()!, {
        year: 2200,
        population_billions: 15.0, // Overpopulation
        technologies: new Set(["Dyson Swarm Incomplete", "Virtual Reality"]),
        dominant_factions: ["Sol Autocracy"],
        active_crises: ["Ecological Collapse"]
    })
});

console.log(`   > Result: Dyson swarm construction. High population. Status: STAGNANT.`);


// --- 7. Analyzing the Multiverse ---

console.log("\n\n🌌 MULTIVERSE ANALYSIS 🌌");

// We can find all "Endings" (leaf nodes) by traversing the graph.
// Since we have references to the tips: currentEra (War), timelinePeace (Peace), timelineIsolation (Isolation).

const timelines = [
    { name: "Timeline A (War)", node: currentEra },
    { name: "Timeline B (Peace)", node: timelinePeace },
    { name: "Timeline C (Isolation)", node: timelineIsolation }
];

for (const t of timelines) {
    console.log(`\nAnalyzing ${t.name}:`);

    // 1. Trace the history of this timeline
    // ancestor_path() walks backwards up the graph
    const history = t.node.ancestor_path();
    console.log(`   Length: ${history.length + 1} eras`); // +1 for self

    // 2. Find the divergence point (Origin)
    // If origin() is undefined, it means this node IS the origin.
    // We want the INITIAL state of the origin (Genesis), not its current evolved state.
    const originNode = t.node.origin() ?? t.node;
    // The first entry in history is the creation/checkpoint
    const genesisEntry = originNode.history().timeline()[0];
    const genesisTitle = genesisEntry?.checkpoint?.metadata().title ?? genesisEntry?.metadata_delta?.title ?? "Unknown Origin";

    console.log(`   Origin Era: ${genesisTitle}`);

    // 3. Unique Traits
    const tech = Array.from(t.node.data()?.technologies || []);
    console.log(`   Final Technologies: ${tech.slice(-2).join(", ")}`);
}

// --- 8. Search Across Time and Space ---

console.log("\n🔍 SEARCH QUERY: 'FTL Drive'");

// We want to find which timeline achieved FTL Drive.
// A simple depth-first search (DFS) or just iterating our known tips.
const achievedFTL = timelines.find(t =>
    t.node.data()?.technologies.has("FTL Drive")
);

if (achievedFTL) {
    console.log(`   MATCH FOUND in ${achievedFTL.name}.`);
    console.log(`   "The stars are ours."`);
} else {
    console.log("   Not found in any computed simulation.");
}

console.log("\n✅ Simulation Complete.");
