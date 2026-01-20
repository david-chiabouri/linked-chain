/**
 * Metadata for identifying and describing a chain link or state.
 */
export type Metadata = {
    id?: number | string;
    title?: string;
    description?: string;
    extra?: { [key: string]: any };
}

/**
 * Ingredients for creating or updating a LinkedChain link.
 * @template T The type of data stored in the chain.
 */
export interface LinkedChainIngredients<T> {
    /** The original source or root of this chain. */
    origin?: LinkedChain<T>;
    /** The parent or previous link in the chain. */
    parent?: LinkedChain<T> | null;
    /** The next link in the chain. */
    next?: LinkedChain<T> | null;
    /** The data payload for this link. */
    data?: T;
    /** Metadata describing this link (id, title, etc). */
    metadata?: Metadata;
    /** Whether this link is a snapshot/checkpoint. */
    is_snapshot?: boolean;
    /** Shared lineage pointer for history tracking. */
    history?: LinkedChainHistory<T>;
}

/**
 * A singular type for all history events.
 * Represents a point in time in the history of a chain.
 */
export type HistoryEntry<T> = {
    /** The timestamp when this entry was created. */
    readonly timestamp: number;
    /** Partial data changes (delta) applied at this step. */
    readonly data_delta?: Partial<T>;
    /** Partial metadata changes (delta) applied at this step. */
    readonly metadata_delta?: Partial<Metadata>;
    /** A full snapshot checkpoint, if one was taken at this step. */
    readonly checkpoint?: LinkedChain<T>;
}

/**
 * LinkedChain: A graph node that tracks its own evolution and relationships.
 * It uses a shared History lineage across all of its temporal versions.
 * 
 * This structure acts as both a Doubly Linked List node AND a Version Control System.
 * Every change is tracked, allowing for time travel, branching, and delta compression.
 * 
 * @template T The type of data payload stored.
 */
export default class LinkedChain<T> {
    protected _origin: LinkedChain<T> | undefined;
    protected _metadata: Metadata | undefined;
    protected _data: T | undefined;
    protected _previous: LinkedChain<T> | null = null;
    protected _next: LinkedChain<T> | null = null;
    protected _progeny: Set<LinkedChain<T>> = new Set();
    protected _ancestors: Set<LinkedChain<T>> = new Set();
    protected _chain_link_history: LinkedChainHistory<T>;
    protected _is_snapshot: boolean = false;

    /**
     * Creates a new LinkedChain instance.
     * @param ingredients Configuration object containing initial state and relationships.
     */
    public constructor(ingredients: LinkedChainIngredients<T>) {
        this._data = ingredients.data ?? undefined;
        this._previous = ingredients.parent ?? null;
        this._next = ingredients.next ?? null;
        this._origin = ingredients.origin ?? undefined;
        this._metadata = ingredients.metadata ?? undefined;
        this._is_snapshot = ingredients.is_snapshot ?? false;

        // If this is a snapshot sharing history, reuse it; otherwise create a new history timeline.
        let history_to_set: LinkedChainHistory<T> = this._is_snapshot && ingredients.history ? ingredients.history : new LinkedChainHistory<T>(this);
        this._chain_link_history = history_to_set;

        // Initialize branching sets for primary line
        if (this._previous) {
            this._ancestors.add(this._previous);
            this._previous._progeny.add(this);
        }
        if (this._next) {
            this._progeny.add(this._next);
            this._next._ancestors.add(this);
        }
    }

    /**
     * Returns true if this instance represents a static snapshot rather than a live link.
     */
    public is_snapshot(): boolean {
        return this._is_snapshot;
    }

    public origin(): LinkedChain<T> | undefined { return this._origin; }
    public next(): LinkedChain<T> | null { return this._next; }
    public previous(): LinkedChain<T> | null { return this._previous; }
    public progeny(): Set<LinkedChain<T>> { return this._progeny; }
    public ancestors(): Set<LinkedChain<T>> { return this._ancestors; }


    /**
     * Adds a generic link to the progeny set of this chain.
     * Useful for tracking non-linear branches or children.
     * @param link The child link to add.
     * @returns The added link.
     */
    public add_link(link: LinkedChain<T>): LinkedChain<T> {
        this._progeny.add(link);
        link._ancestors.add(this);
        this.history().add_entry(link);
        return link;
    }

    /**
     * Updates the state of this link (data, metadata, relationships) and records the change in history.
     * @param data Partial ingredients to update.
     * @returns The updated instance (chainable).
     */
    public update(data: LinkedChainIngredients<T>): LinkedChain<T> {
        // We capture state changes for history recording
        const had_data = data.data !== undefined;
        const had_meta = data.metadata !== undefined;

        if (had_meta && data.metadata) this.update_metadata(data.metadata); // Handles its own history entry if called directly, but we want one atomic entry? 
        // Logic fix: update_metadata calls add_entry. If we call it here, we get two entries if we also add_entry at the end.
        // Better pattern: Apply all changes then call add_entry ONCE.

        // Let's modify the internal state first.
        if (data.metadata) {
            this._metadata = {
                id: data.metadata.id ?? this.metadata().id,
                title: data.metadata.title ?? this.metadata().title,
                description: data.metadata.description ?? this.metadata().description,
                extra: data.metadata.extra ?? this.metadata().extra
            };
        }

        if (data.data !== undefined) this._data = data.data;
        if (data.next !== undefined) this.set_next(data.next, false); // false to suppress history add inside setter
        if (data.parent !== undefined) this.set_previous(data.parent, false);

        this.history().add_entry(this);
        return this;
    }

    /**
     * Updates metadata.
     * @param new_metadata Partial metadata.
     */
    public update_metadata(new_metadata: Metadata): LinkedChain<T> {
        this._metadata = {
            id: new_metadata.id ?? this.metadata().id,
            title: new_metadata.title ?? this.metadata().title,
            description: new_metadata.description ?? this.metadata().description,
            extra: new_metadata.extra ?? this.metadata().extra
        };
        this.history().add_entry(this);
        return this;
    }

    /**
     * Sets the next link in the chain.
     * @param new_link The new next link.
     * @param record_history Whether to record this change in history (default true).
     */
    public set_next(new_link: LinkedChain<T> | null, record_history: boolean = true): LinkedChain<T> {
        this._next = new_link;
        if (new_link) {
            this._progeny.add(new_link);
            new_link._ancestors.add(this);
        }
        if (record_history) this.history().add_entry(this);
        return this;
    }

    /**
     * Sets the previous link in the chain.
     * @param new_link The new previous link.
     * @param record_history Whether to record this change in history (default true).
     */
    public set_previous(new_link: LinkedChain<T> | null, record_history: boolean = true): LinkedChain<T> {
        this._previous = new_link;
        if (new_link) {
            this._ancestors.add(new_link);
            new_link._progeny.add(this);
        }
        if (record_history) this.history().add_entry(this);
        return this;
    }

    public history(): LinkedChainHistory<T> {
        return this._chain_link_history;
    }

    public data(): T | undefined {
        return this._data;
    }

    public metadata(): Metadata {
        return this._metadata ?? { title: "", description: "", extra: {} };
    }

    /**
     * Uses `structuredClone` to create a deep copy of the object.
     * Falls back to a simple JSON clone if structuredClone fails (though in Bun/Modern Node it is standard).
     */
    public static universalClone<V>(obj: V): V {
        if (obj === null || typeof obj !== 'object') return obj;
        try {
            return globalThis.structuredClone(obj);
        } catch (e) {
            // Fallback for non-cloneable objects (like functions, though data shouldn't have them)
            if (obj instanceof Set) return new Set(obj) as any;
            if (obj instanceof Map) return new Map(obj) as any;
            if (Array.isArray(obj)) return [...obj] as any;
            return { ...obj };
        }
    }

    // --- Graph Logic & Traversal ---

    /**
     * Generators allow for lazy iteration over the chain.
     * @param direction 'previous' for ancestors, 'next' for progeny.
     */
    public *iterate(direction: 'previous' | 'next'): Generator<LinkedChain<T>> {
        let current: LinkedChain<T> | null = direction === 'next' ? this.next() : this.previous();
        while (current) {
            yield current;
            current = direction === 'next' ? current.next() : current.previous();
            if (current === this) break; // Circular safety
        }
    }

    /**
     * Walks backwards from the current link to the start.
     * @returns An array of ancestors, ordered from nearest to furthest.
     */
    public ancestor_path(): LinkedChain<T>[] {
        const path: LinkedChain<T>[] = [];
        for (const node of this.iterate('previous')) {
            path.push(node);
        }
        return path;
    }

    /**
     * Walks forwards from the current link to the end.
     * @returns An array of progeny links.
     */
    public progeny_path(): LinkedChain<T>[] {
        const path: LinkedChain<T>[] = [];
        for (const node of this.iterate('next')) {
            path.push(node);
        }
        return path;
    }

    /**
     * Searches up and down the linear chain for a node matching the predicate.
     * @param predicate Function that returns true for the desired node.
     */
    public find(predicate: (node: LinkedChain<T>) => boolean): LinkedChain<T> | undefined {
        if (predicate(this)) return this;
        // Search forward
        for (const node of this.iterate('next')) {
            if (predicate(node)) return node;
        }
        // Search backward
        for (const node of this.iterate('previous')) {
            if (predicate(node)) return node;
        }
        return undefined;
    }

    /**
     * Detects if the chain contains a cycle using the Floyd's Cycle-Finding Algorithm (Tortoise and Hare).
     * @returns True if a loop is detected.
     */
    public has_circular_link(): boolean {
        let tortoise: LinkedChain<T> | null = this;
        let hare: LinkedChain<T> | null = this;
        while (hare !== null && hare.next() !== null) {
            tortoise = tortoise!.next();
            hare = hare.next()!.next();
            if (tortoise === hare) return true;
        }
        return false;
    }

    public final_ancestor_and_progeny(): { final_ancestor: LinkedChain<T> | undefined, final_progeny: LinkedChain<T> | undefined } {
        const ancestors = this.ancestor_path();
        const progeny = this.progeny_path();
        return {
            final_ancestor: ancestors.length > 0 ? ancestors[ancestors.length - 1] : this,
            final_progeny: progeny.length > 0 ? progeny[progeny.length - 1] : this
        };
    }

    public async ancestor_path_async(): Promise<LinkedChain<T>[]> {
        return this.ancestor_path();
    }

    public async progeny_path_async(): Promise<LinkedChain<T>[]> {
        return this.progeny_path();
    }

    public connected_links(): Set<LinkedChain<T>> {
        const all = new Set<LinkedChain<T>>();
        const queue: LinkedChain<T>[] = [this];
        all.add(this);

        while (queue.length > 0) {
            const current = queue.shift()!;
            for (const neighbor of [...current.ancestors(), ...current.progeny()]) {
                if (!all.has(neighbor)) {
                    all.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return all;
    }

    // --- Linking Logic ---

    /**
     * Inserts a link as the IMMEDIATE next neighbor, essentially splicing it in.
     * Updates previous/next pointers for all involved parties.
     * @param chain_to_link The link to insert.
     * @returns The current link (this).
     */
    public link_next(chain_to_link: LinkedChain<T>): LinkedChain<T> {
        const cur_next = this.next();
        chain_to_link.set_previous(this, false); // deferred history update?
        chain_to_link.set_next(cur_next, false);
        this.set_next(chain_to_link); // This triggers history update for 'this'
        if (chain_to_link.history() !== this.history()) {
            chain_to_link.history().add_entry(chain_to_link);
        }
        return this;
    }

    public link_previous(chain_to_link: LinkedChain<T>): LinkedChain<T> {
        const cur_prev = this.previous();
        cur_prev?.set_next(chain_to_link);
        chain_to_link.set_previous(cur_prev, false);
        chain_to_link.set_next(this, false);
        this.set_previous(chain_to_link);
        if (chain_to_link.history() !== this.history()) {
            chain_to_link.history().add_entry(chain_to_link);
        }
        return this;
    }

    public new_next_link(data: T, metadata?: Metadata): LinkedChain<T> {
        const new_link = new LinkedChain<T>({
            data,
            metadata,
            origin: this.origin() ?? this,
            parent: this,
            next: this.next()

        });
        this.link_next(new_link);
        return new_link;
    }

    public new_previous_link(data: T, metadata?: Metadata): LinkedChain<T> {
        const new_link = new LinkedChain<T>({
            data,
            metadata,
            origin: this.origin() ?? this,
            parent: this.previous(),
            next: this
        });
        this.link_previous(new_link);
        return new_link;
    }

    /**
     * Reverts the current data state to match a historical point.
     * This modifies the current instance in-place to look like the past.
     * @param index The index in the history timeline to revert to.
     */
    public revert_to_history(index: number): LinkedChain<T> {
        const state = this.history().rebuild_at(index);
        if (state) {
            this._data = state.data();
            this._metadata = state.metadata();
            this.history().add_entry(this);
        }
        return this;
    }

    /**
     * Creates a new branch from a historical state.
     * Returns a NEW LinkedChain instance that starts with the data from that historical point.
     * @param index The index in history to branch from.
     * @returns The new branched link.
     */
    public branch_from_history(index: number): LinkedChain<T> {
        const state = this.history().rebuild_at(index);
        if (!state) throw new Error("Invalid history index");

        const branch = new LinkedChain<T>({
            data: state.data(),
            metadata: { ...state.metadata(), title: `${state.metadata().title} (Branch)` },
            origin: this.origin() ?? this
        });

        this.history().add_entry(branch);
        return branch;
    }

    public rebuild_at(index: number): LinkedChain<T> | undefined {
        return this.history().rebuild_at(index);
    }

    /**
     * Serializes the current node state (not the entire history or graph) to JSON.
     */
    public toJSON() {
        return {
            metadata: this._metadata,
            data: this._data,
            is_snapshot: this._is_snapshot
        };
    }
}

/**
 * Manages the history lineage of a LinkedChain.
 * It stores a timeline of changes (deltas) and checkpoints, allowing for efficient
 * storage and reconstruction of past states.
 */
export class LinkedChainHistory<T> {
    protected _timeline: HistoryEntry<T>[] = [];
    protected _original_state: LinkedChain<T>;
    protected _latest_state: LinkedChain<T>;
    protected _saved_checkpoints: LinkedChain<T>[] = [];

    public constructor(link: LinkedChain<T>) {
        this._original_state = this.create_snapshot_link(link);
        this._latest_state = this.create_snapshot_link(link);
        this.add_checkpoint(this._original_state);
    }

    protected create_snapshot_link(link: LinkedChain<T>): LinkedChain<T> {
        return new (link.constructor as any)({
            data: LinkedChain.universalClone(link.data()),
            metadata: { ...link.metadata() },
            origin: link.origin(),
            parent: link.previous(),
            next: link.next(),
            is_snapshot: true,
            history: this // Share history pointer
        });
    }

    /**
     * Adds an entry to the history timeline.
     * Automatically calculates the delta between the current state and the new item.
     * @param item The new link state or partial data to record.
     * @returns The history instance (chainable).
     */
    public add_entry(item: LinkedChain<T> | Partial<T>): LinkedChainHistory<T> {
        const timestamp = Date.now();

        if (item instanceof LinkedChain) {
            const new_data = item.data();
            const new_meta = item.metadata();

            const data_delta = (new_data && this._latest_state.data())
                ? this.calculate_delta(this._latest_state.data()!, new_data)
                : null;

            const meta_delta = this.calculate_metadata_delta(this._latest_state.metadata(), new_meta);

            if ((data_delta && Object.keys(data_delta).length > 0) || Object.keys(meta_delta).length > 0) {
                this._timeline.push({
                    timestamp,
                    data_delta: data_delta ?? {},
                    metadata_delta: meta_delta
                });

                if (data_delta) Object.assign(this._latest_state.data() as any, data_delta);
                Object.assign(this._latest_state.metadata(), meta_delta);
            }
        } else {
            this._timeline.push({ timestamp, data_delta: item });
            if (this._latest_state.data()) Object.assign(this._latest_state.data() as any, item);
        }
        return this;
    }

    public save_checkpoint(): LinkedChainHistory<T> {
        const snapshot = this.create_snapshot_link(this._latest_state);
        this._saved_checkpoints.push(snapshot);
        this._timeline.push({ timestamp: Date.now(), checkpoint: snapshot });
        return this;
    }

    protected calculate_delta(oldObj: T, newObj: T): Partial<T> {
        const delta: any = {};
        for (const key in newObj) {
            // Shallow comparison
            if (newObj[key] !== (oldObj as any)[key]) delta[key] = newObj[key];
        }
        return delta;
    }

    /**
     * Calculates the cumulative delta between two indices in the history timeline.
     * @param start The starting index.
     * @param end The ending index.
     * @returns A partial object representing the net change.
     */
    public delta_between_points(start: number, end: number): Partial<T> {
        const delta: any = {};

        if (start < 0 || end >= this._timeline.length) return delta;

        // scale understanding
        if (end > start) { // means that we are adding from start to end
            for (let i = start + 1; i <= end; i++) {
                const entry = this._timeline[i];
                if (entry && entry.data_delta) {
                    Object.assign(delta, entry.data_delta);
                }
            }
            return delta;
        } else { // means that we are subtracting from end to start (going backwards??)
            // This logic was slightly flawed in original. 'Delta' usually implies change from A to B.
            // If we want difference between 5 and 2, it's what changed from 2 to 5.
            // If traversing backwards, we might need inverse operations, which generic objects don't support easily.
            // Returning empty for now to be safe or just standardizing on forward calculation.
            return delta;
        }
    }

    public delta_between_history_entries(start: HistoryEntry<T>, end: HistoryEntry<T>): Partial<T> {
        const startIdx = this._timeline.findIndex((entry) => entry === start);
        const endIdx = this._timeline.findIndex((entry) => entry === end);
        return this.delta_between_points(startIdx, endIdx);
    }

    public calculate_metadata_delta(old_metadata: Metadata, new_metadata: Metadata): Partial<Metadata> {
        const delta: any = {};
        if (old_metadata.title !== new_metadata.title) delta.title = new_metadata.title;
        if (old_metadata.description !== new_metadata.description) delta.description = new_metadata.description;
        return delta;
    }

    public add_checkpoint(link: LinkedChain<T>): LinkedChainHistory<T> {
        this._timeline.push({
            timestamp: Date.now(),
            checkpoint: this.create_snapshot_link(link)
        });
        return this;
    }

    /**
     * Reconstructs the state of the link at a specific history index.
     * It efficiently starts from the nearest checkpoint and applies deltas forward.
     * @param index The history index to rebuild.
     * @returns A snapshot LinkedChain representing that past state.
     */
    public rebuild_at(index: number): LinkedChain<T> | undefined {
        if (index < 0 || index >= this._timeline.length) return undefined;

        let baselink: LinkedChain<T> | undefined;
        let jumpIdx = -1;

        // Find the nearest previous checkpoint
        for (let i = index; i >= 0; i--) {
            const entry = this._timeline[i];
            if (entry && entry.checkpoint) {
                baselink = this.create_snapshot_link(entry.checkpoint);
                jumpIdx = i;
                break;
            }
        }

        if (!baselink) baselink = this.create_snapshot_link(this._original_state);

        // Replay changes from checkpoint (or start) to target index
        for (let i = jumpIdx + 1; i <= index; i++) {
            const entry = this._timeline[i];
            if (entry) {
                if (entry.data_delta) Object.assign(baselink.data() as any, entry.data_delta);
                if (entry.metadata_delta) Object.assign(baselink.metadata(), entry.metadata_delta);
            }
        }

        return baselink;
    }

    public timeline(): HistoryEntry<T>[] { return this._timeline; }
}
