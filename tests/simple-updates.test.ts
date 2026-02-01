import { describe, expect, test, beforeEach } from "bun:test";
import LinkedChain from "../src/linked-chain";

// Simple test suite with VISUAL LOGS for the user to see what's happening
describe("Simplified Updates Test", () => {
    let chain: LinkedChain<{ label: string, value: number }>;

    beforeEach(() => {
        console.log("\n--- New Test Setup ---");
        chain = new LinkedChain({
            data: { label: "Root", value: 10 },
            metadata: { title: "Origin" }
        });
        console.log("Created Root:", chain.data());
    });

    test("Demonstrate find()", () => {
        console.log("\n[Test] Finding nodes...");

        const child1 = chain.new_next_link({ label: "Child 1", value: 20 });
        const child2 = child1.new_next_link({ label: "Target", value: 30 });
        const child3 = child2.new_next_link({ label: "Child 3", value: 40 });

        console.log("Chain created: Root -> Child 1 -> Target -> Child 3");

        // Search for "Target"
        console.log("Searching for node with label 'Target'...");
        const result = chain.find(d => d.label === "Target");

        console.log("Found:", result?.data());
        expect(result).toBe(child2);
        expect(result?.data()?.value).toBe(30);
    });

    test("Demonstrate update() with Snapshot", () => {
        console.log("\n[Test] Updating and Snapshots...");

        console.log("Current State:", chain.data());
        console.log("Is Snapshot?", chain.is_snapshot());

        // Update and mark as snapshot in one go
        console.log("Updating to value: 99 and marking as snapshot...");
        chain.update({
            data: { label: "Root Updated", value: 99 },
            is_snapshot: true
        });

        console.log("New State:", chain.data());
        console.log("Is Snapshot?", chain.is_snapshot());

        expect(chain.data()?.value).toBe(99);
        expect(chain.is_snapshot()).toBeTrue();
    });

    test("Demonstrate set_if_snapshot()", () => {
        console.log("\n[Test] Explicit set_if_snapshot()...");

        expect(chain.is_snapshot()).toBeFalse();

        console.log("Calling set_if_snapshot(true)...");
        chain.set_if_snapshot(true);

        console.log("Is Snapshot?", chain.is_snapshot());
        expect(chain.is_snapshot()).toBeTrue();

        console.log("Calling set_if_snapshot(false)...");
        chain.set_if_snapshot(false);

        console.log("Is Snapshot?", chain.is_snapshot());
        expect(chain.is_snapshot()).toBeFalse();
    });
});
