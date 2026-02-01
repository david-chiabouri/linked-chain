import { describe, expect, test, beforeEach } from "bun:test";
import LinkedChain from "../src/linked-chain";

type TestData = {
    id: number;
    value: string;
};

describe("LinkedChain Updates - find, update, set_if_snapshot", () => {
    let root: LinkedChain<TestData>;
    let mid: LinkedChain<TestData>;
    let leaf: LinkedChain<TestData>;

    beforeEach(() => {
        // Setup a simple chain: Root <-> Mid <-> Leaf
        root = new LinkedChain<TestData>({
            data: { id: 1, value: "root" },
            metadata: { title: "Root Node" }
        });

        mid = root.new_next_link({ id: 2, value: "mid" }, { title: "Mid Node" });
        leaf = mid.new_next_link({ id: 3, value: "leaf" }, { title: "Leaf Node" });
    });

    describe("find()", () => {
        test("should find the current node if predicate matches", () => {
            const found = mid.find(data => data.id === 2);
            expect(found).toBe(mid);
        });

        test("should find a node in the forward direction (progeny)", () => {
            const found = root.find(data => data.value === "leaf");
            expect(found).toBe(leaf);
        });

        test("should find a node in the backward direction (ancestors)", () => {
            const found = leaf.find(data => data.value === "root");
            expect(found).toBe(root);
        });

        test("should return generic undefined if not found", () => {
            const found = root.find(data => data.id === 999);
            expect(found).toBeUndefined();
        });

        test("should find the first matching node when searching", () => {
            // Add another node with id=3 to chain: Root <-> Mid <-> Leaf(3) <-> Leaf2(3)
            const leaf2 = leaf.new_next_link({ id: 3, value: "leaf2" });

            // Search from root (forward)
            const firstFound = root.find(data => data.id === 3);
            expect(firstFound).toBe(leaf); // Should find 'leaf' before 'leaf2'

            // Search from leaf2 (backward) - searching for 2 (mid)
            const midFound = leaf2.find(data => data.id === 2);
            expect(midFound).toBe(mid);
        });

        test("should find node even if data is partial or complex predicate", () => {
            const found = root.find(data => data.value.includes("ea")); // "leaf" has "ea"
            expect(found).toBe(leaf);
        });
    });

    describe("update()", () => {
        test("should correctly update data and metadata", () => {
            root.update({
                data: { id: 1, value: "updated_root" },
                metadata: { title: "Updated Title" }
            });

            expect(root.data()).toEqual({ id: 1, value: "updated_root" });
            expect(root.metadata().title).toBe("Updated Title");
        });

        test("should update relationships (next/parent)", () => {
            const orphan = new LinkedChain<TestData>({ data: { id: 99, value: "orphan" } });

            // Update mid to point to orphan as next
            // Note: This breaks the chain structurally if not careful, but testing the API.
            mid.update({ next: orphan });

            expect(mid.next()).toBe(orphan);
            // Verify bidirectional link logic handled in set_next called by update
            expect(orphan.ancestors().has(mid)).toBeTrue();
        });

        test("should update is_snapshot status via update()", () => {
            expect(root.is_snapshot()).toBeFalse();
            root.update({ is_snapshot: true });
            expect(root.is_snapshot()).toBeTrue();
        });

        test("should record history on update", () => {
            const initialHistoryLength = root.history().timeline().length;

            root.update({ data: { id: 1, value: "new" } });

            expect(root.history().timeline().length).toBeGreaterThan(initialHistoryLength);

            const lastEntry = root.history().timeline().at(-1);
            expect(lastEntry?.data_delta).toEqual({ value: "new" });
        });
    });

    describe("set_if_snapshot()", () => {
        test("should explicitly set the snapshot flag", () => {
            expect(mid.is_snapshot()).toBeFalse();

            mid.set_if_snapshot(true);
            expect(mid.is_snapshot()).toBeTrue();

            mid.set_if_snapshot(false);
            expect(mid.is_snapshot()).toBeFalse();
        });

        test("should be chainable", () => {
            const result = leaf.set_if_snapshot(true);
            expect(result).toBe(leaf);
        });
    });
});
