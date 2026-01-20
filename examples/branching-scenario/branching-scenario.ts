
import LinkedChain from "../../src/linked-chain";

/**
 * Branching Scenario Example
 * Demonstrates:
 * 1. Creating a linear history
 * 2. Forking/Branching from a past point (like Git)
 * 3. Maintaining separate timelines for the branch vs main
 */

console.log("--- Branching/Forking Example ---");

// Imagine a document draft system
interface Document {
    content: string;
    version: number;
}

const doc = new LinkedChain<Document>({
    data: { content: "Introduction", version: 1 },
    metadata: { title: "Draft V1" }
});

// Update the document a few times
doc.update({ data: { content: "Introduction\nChapter 1", version: 2 } });
doc.update({ data: { content: "Introduction\nChapter 1\nChapter 2", version: 3 } });

console.log("Current Main Document:");
console.log(doc.data());

// Now, realized Chapter 2 was a bad direction. Let's go back to Version 2 and try a different approach.
// We need to find the history index for Version 2.
// In a real app we might store IDs in metadata or search the timeline.
// Here we know: 0=V1, 1=V2, 2=V3
const v2Index = 1;

console.log(`\n[Forking] Creating a new branch from History Index ${v2Index} (Version 2)...`);

const alternateDraft = doc.branch_from_history(v2Index);
// Update metadata of the new branch for clarity
alternateDraft.update_metadata({ title: "Draft V2 - Alternative Ending" });

console.log("Branch Initial State:");
console.log(alternateDraft.data());

// Now write a DIFFERENT Chapter 2 on this branch
alternateDraft.update({
    data: { content: "Introduction\nChapter 1\nChapter 2 (The Better Version)", version: 3.1 }
});

console.log("\nAfter writing on branch:");
console.log("Main Doc:", doc.data());
console.log("Alternate Doc:", alternateDraft.data());

// Verify lineage
console.log("\nLineage Check:");
console.log("Main Doc Ancestors:", doc.ancestors().size); // Should be 0 direct parents (it's linear updates on same object)
// Actually, 'ancestors' in LinkedChain refers to GRAPH PARENTS (previous links), not history states.
// Since we didn't use `new_next_link`, the 'doc' variable IS the chain node.
// 'branch_from_history' creates a new INDEPENDENT chain node starting from that state.
// Ideally, maybe we want to link them?
// The current implementation of `branch_from_history` just returns a detached new node with shared origin if set.

console.log("Branches from Main Doc:", alternateDraft.origin() === doc);
