
import LinkedChain from "../../src/linked-chain";

/**
 * Basic Usage Example
 * Demonstrates:
 * i. Creating a chain node
 * ii. Updating data (automatically tracking history)
 * iii. Viewing the history timeline
 * iv. Changing project origin
 * v. Linking to another chain
 * vi. Unlinking from a chain
 * vii. Circular linking
 */

console.log("--- Basic Usage Example ---");

// i. Create a "Project" node
interface ProjectState {
    name?: string;
    status: "planning" | "in-progress" | "completed";
    completion: number;
}

const project = new LinkedChain<ProjectState>({
    data: { name: "My Super App Template", status: "planning", completion: 0 },
    metadata: { title: "Project Root of Some Day", id: "proj-001" }
});

console.log("\n[1] Created Project:");
console.log(project.data());

// ii. Start working on it
console.log("\n[2] Updating status to 'in-progress'...");
project.update({
    data: { ...project.data()!, status: "in-progress", completion: 10 }
});

console.log("\n[3] Making progress (completion: 50%)...");
project.update({
    data: { ...project.data()!, status: "in-progress", completion: 50 },
    metadata: { description: "Halfway there!" }
});

console.log("\n[4] Completing project...");
project.update({
    data: { ...project.data()!, status: "completed", completion: 100 }
});


// iii. Inspect History
console.log("\n[4a] Marking as crucial milestone (snapshot)...");
project.set_if_snapshot(true);
console.log("Is Snapshot?", project.is_snapshot());

console.log("\nFinal State:", project.data());

console.log("\n[5] History Timeline:");
const history = project.history().timeline();
history.forEach((entry, index) => {
    console.log(`Index ${index}:`,
        entry.data_delta ? `Data Change: ${JSON.stringify(entry.data_delta)}` : "",
        entry.metadata_delta ? `Meta Change: ${JSON.stringify(entry.metadata_delta)}` : "",
        entry.checkpoint ? "[Checkpoint]" : ""
    );
});

// iv. Change project origin
console.log("\n[6] Changing project origin...");
console.log("\n[6a] Current Project Origin:", project.origin()?.data());
const next_day = new LinkedChain<ProjectState>({
    data: { name: "Template Random Chain", status: "planning", completion: 0 },
    metadata: { title: "Template of Day [...]", id: "proj-000" }
});
console.log("\n[6b] Next Day Chain:", next_day.data());
project.update({
    origin: next_day,
    data: { status: "in-progress", completion: 10 },
    metadata: { title: "New project of Day [...]", id: "proj-002" }
});
console.log("\n[6c] New Project Origin:", project.origin()?.data());

// v. Linking to another chain
console.log("\n[7] Linking to another chain...");
next_day.link_previous(project);
console.log("\n[7a] Linked Project:", next_day.previous()?.data());
