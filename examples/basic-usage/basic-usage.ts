
import LinkedChain from "../../src/linked-chain";

/**
 * Basic Usage Example
 * Demonstrates:
 * 1. Creating a chain node
 * 2. Updating data (automatically tracking history)
 * 3. Viewing the history timeline
 */

console.log("--- Basic Usage Example ---");

// 1. Create a "Project" node
interface ProjectState {
    name?: string;
    status: "planning" | "in-progress" | "completed";
    completion: number;
}

const project = new LinkedChain<ProjectState>({
    data: { name: "My Super App", status: "planning", completion: 0 },
    metadata: { title: "Project Root", id: "proj-001" }
});

console.log("\n[1] Created Project:");
console.log(project.data());

// 2. Start working on it
console.log("\n[2] Updating status to 'in-progress'...");
project.update({
    data: { ...project.data()!, status: "in-progress", completion: 10 }
});

// 3. Make some progress
console.log("\n[3] Making progress (completion: 50%)...");
project.update({
    data: { ...project.data()!, status: "in-progress", completion: 50 },
    metadata: { description: "Halfway there!" }
});

// 4. Finish the project
console.log("\n[4] Completing project...");
project.update({
    data: { ...project.data()!, status: "completed", completion: 100 }
});

console.log("\nFinal State:", project.data());

// 5. Inspect History
console.log("\n[5] History Timeline:");
const history = project.history().timeline();
history.forEach((entry, index) => {
    console.log(`Index ${index}:`,
        entry.data_delta ? `Data Change: ${JSON.stringify(entry.data_delta)}` : "",
        entry.metadata_delta ? `Meta Change: ${JSON.stringify(entry.metadata_delta)}` : "",
        entry.checkpoint ? "[Checkpoint]" : ""
    );
});
