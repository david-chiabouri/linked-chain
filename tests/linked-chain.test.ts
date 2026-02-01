import { describe, expect, test, beforeEach } from "bun:test";
import LinkedChain from "../src/linked-chain";

type TestData = {
    value: number;
    name?: string;
};

describe("LinkedChain", () => {
    let chain: LinkedChain<TestData>;

    beforeEach(() => {
        chain = new LinkedChain<TestData>({
            data: { value: 0 },
            metadata: { title: "Root", id: 0 }
        });
    });

    test("should initialize correctly", () => {
        expect(chain.data()).toEqual({ value: 0 });
        expect(chain.metadata().title).toBe("Root");
        expect(chain.previous()).toBeNull();
        expect(chain.next()).toBeNull();
        expect(chain.history().timeline().length).toBeGreaterThan(0); // Initial checkpoint
    });

    test("should update data and record history", () => {
        chain.update({ data: { value: 1 } });
        expect(chain.data()).toEqual({ value: 1 });

        chain.update({ data: { value: 2 } });
        expect(chain.data()).toEqual({ value: 2 });

        const history = chain.history().timeline();
        expect(history.length).toBeGreaterThanOrEqual(3); // init + update + update
    });

    test("should handle linking (next/previous)", () => {
        const nextNode = new LinkedChain<TestData>({ data: { value: 10 } });
        chain.link_next(nextNode);

        expect(chain.next()).toBe(nextNode);
        expect(nextNode.previous()).toBe(chain);
        expect(chain.progeny().has(nextNode)).toBeTrue();
        expect(nextNode.ancestors().has(chain)).toBeTrue();
    });

    test("should traverse ancestors and progeny", () => {
        const node1 = chain;
        const node2 = node1.new_next_link({ value: 1 });
        const node3 = node2.new_next_link({ value: 2 });

        expect(node1.progeny_path().map(n => n.data()?.value)).toEqual([1, 2]);
        expect(node3.ancestor_path().map(n => n.data()?.value)).toEqual([1, 0]);

        // Iterator test
        const ancestorsIndices: number[] = [];
        for (const ancestor of node3.iterate('previous')) {
            ancestorsIndices.push(ancestor.data()?.value!);
        }
        expect(ancestorsIndices).toEqual([1, 0]);
    });

    test("should detect circular links", () => {
        const node1 = chain;
        const node2 = node1.new_next_link({ value: 1 });
        const node3 = node2.new_next_link({ value: 2 });

        // Force loop
        node3.set_next(node1);

        expect(node1.has_circular_link()).toBeTrue();
    });

    test("should support time travel (revert)", () => {
        chain.update({ data: { value: 10 } });
        chain.update({ data: { value: 20 } });

        const historyLength = chain.history().timeline().length;
        // Index 0 should be initial state {value: 0}

        chain.revert_to_history(0);
        expect(chain.data()).toEqual({ value: 0 });

        // Reverting records a NEW history entry, so we moved forward in time to a state that looks like the past
        expect(chain.history().timeline().length).toBeGreaterThan(historyLength);
    });

    test("should support branching", () => {
        chain.update({ data: { value: 10 } }); // index 1 approx
        chain.update({ data: { value: 20 } }); // index 2 approx

        // Branch from index 1 (value 10)
        // Note: index depends on exact implementation details of constructor checkpointing.
        // 0: init checkpoint ({value: 0})
        // 1: update {value: 10}
        // 2: update {value: 20}

        const timeline = chain.history().timeline();
        const value10Index = timeline.findIndex(e => e.data_delta?.value === 10);

        const branch = chain.branch_from_history(value10Index);

        expect(branch).not.toBe(chain);
        expect(branch.data()).toEqual({ value: 10 });
        expect(branch.metadata().title).toContain("Branch");
        expect(branch.origin()).toBe(chain.origin() ?? chain);
    });

    test("find method should locate nodes", () => {
        const node1 = chain.update({ data: { value: 1, name: "start" } });
        const node2 = node1.new_next_link({ value: 2, name: "middle" });
        const node3 = node2.new_next_link({ value: 3, name: "end" });

        const found = node1.find(data => data.name === "end");
        expect(found).toBe(node3);

        const notFound = node1.find(data => data.name === "missing");
        expect(notFound).toBeUndefined();

        const backwardFind = node3.find(data => data.name === "start");
        expect(backwardFind).toBe(node1);
    });

    test("toJSON should serialize state", () => {
        chain.update({ data: { value: 99 } });
        const json = chain.toJSON();
        expect(json.data).toEqual({ value: 99 });
        expect(json.is_snapshot).toBeFalse();
    });

    test("structuredClone should handle Map/Set", () => {
        // Testing via update which uses clone internally? 
        // Actually the universalClone is used in create_snapshot_link

        const complexData = {
            value: 1,
            map: new Map([['a', 1]]),
            set: new Set([1, 2, 3])
        };

        // @ts-ignore
        const complexChain = new LinkedChain<any>({ data: complexData });

        // Trigger a snapshot/history save
        complexChain.history().save_checkpoint();

        // Revert/Rebuild uses snapshot
        const rebuilt = complexChain.rebuild_at(0);
        const data = rebuilt?.data();

        expect(data.map).toBeInstanceOf(Map);
        expect(data.set).toBeInstanceOf(Set);
        expect(data.map.get('a')).toBe(1);
    });
});
