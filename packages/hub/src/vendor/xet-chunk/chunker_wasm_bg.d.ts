/* tslint:disable */
/* eslint-disable */
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */

export type ReadableStreamType = "bytes";

export class Chunker {
    free(): void;
    [Symbol.dispose](): void;
    add_data(data: Uint8Array): any;
    finish(): any;
    constructor(target_chunk_size: number);
}

export class IntoUnderlyingByteSource {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cancel(): void;
    pull(controller: ReadableByteStreamController): Promise<any>;
    start(controller: ReadableByteStreamController): void;
    readonly autoAllocateChunkSize: number;
    readonly type: ReadableStreamType;
}

export class IntoUnderlyingSink {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    abort(reason: any): Promise<any>;
    close(): Promise<any>;
    write(chunk: any): Promise<any>;
}

export class IntoUnderlyingSource {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cancel(): void;
    pull(controller: ReadableStreamDefaultController): Promise<any>;
}

/**
 * Wasm wrapper around [`MerkleHashSubtree`] for O(log n) composable hash aggregation.
 *
 * Chunks are passed as `Array<{hash: string, length: number}>`.
 * Hashes are returned as hex strings.
 */
export class MerkleHashSubtree {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Reconstruct a subtree from a previously serialized JS object.
     */
    static deserialize(data: any): MerkleHashSubtree;
    /**
     * Returns the final aggregated hash as a hex string, or `undefined`
     * if both boundaries (`at_start` and `at_end`) are not yet known.
     */
    final_hash(): string | undefined;
    is_empty(): boolean;
    /**
     * Merge another subtree (the right neighbor) into this one.
     */
    merge_into(other: MerkleHashSubtree): void;
    /**
     * Create from an array of chunks `[{hash, length}, ...]`.
     *
     * - `at_start`: true if these are the first chunks of the file.
     * - `at_end`: true if these are the last chunks of the file.
     */
    constructor(at_start: boolean, chunks_array: any, at_end: boolean);
    num_levels(): number;
    num_nodes(): number;
    /**
     * Serialize the subtree to a JS object for storage or transfer.
     */
    serialize(): any;
}

/**
 * takes an Array of Objects of the form { "hash": string, "length": number }
 * and returns a string of a hash
 */
export function compute_file_hash(chunks_array: any): string;

/**
 * takes a hash and HMAC key (both as hex strings) and returns the HMAC result as a hex string
 */
export function compute_hmac(hash_hex: string, hmac_key_hex: string): string;

/**
 * takes an Array of hashes as strings and returns the verification hash for that range of chunk hashes
 */
export function compute_verification_hash(chunk_hashes: string[]): string;

/**
 * takes an Array of Objects of the form { "hash": string, "length": number }
 * and returns a string of a hash
 */
export function compute_xorb_hash(chunks_array: any): string;

/**
 * Entry point invoked by JavaScript in a worker.
 */
export function task_worker_entry_point(ptr: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_chunker_free: (a: number, b: number) => void;
    readonly __wbg_merklehashsubtree_free: (a: number, b: number) => void;
    readonly chunker_add_data: (a: number, b: number, c: number) => [number, number, number];
    readonly chunker_finish: (a: number) => [number, number, number];
    readonly chunker_new: (a: number) => number;
    readonly compute_file_hash: (a: any) => [number, number, number, number];
    readonly compute_hmac: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly compute_verification_hash: (a: number, b: number) => [number, number, number, number];
    readonly compute_xorb_hash: (a: any) => [number, number, number, number];
    readonly merklehashsubtree_deserialize: (a: any) => [number, number, number];
    readonly merklehashsubtree_final_hash: (a: number) => [number, number];
    readonly merklehashsubtree_is_empty: (a: number) => number;
    readonly merklehashsubtree_merge_into: (a: number, b: number) => [number, number];
    readonly merklehashsubtree_new: (a: number, b: any, c: number) => [number, number, number];
    readonly merklehashsubtree_num_levels: (a: number) => number;
    readonly merklehashsubtree_num_nodes: (a: number) => number;
    readonly merklehashsubtree_serialize: (a: number) => [number, number, number];
    readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
    readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
    readonly intounderlyingbytesource_cancel: (a: number) => void;
    readonly intounderlyingbytesource_pull: (a: number, b: any) => any;
    readonly intounderlyingbytesource_start: (a: number, b: any) => void;
    readonly intounderlyingbytesource_type: (a: number) => number;
    readonly intounderlyingsink_abort: (a: number, b: any) => any;
    readonly intounderlyingsink_close: (a: number) => any;
    readonly intounderlyingsink_write: (a: number, b: any) => any;
    readonly intounderlyingsource_cancel: (a: number) => void;
    readonly intounderlyingsource_pull: (a: number, b: any) => any;
    readonly task_worker_entry_point: (a: number) => [number, number];
    readonly wasm_bindgen_dae3e6268329b73d___convert__closures_____invoke___wasm_bindgen_dae3e6268329b73d___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_dae3e6268329b73d___JsError___true_: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen_dae3e6268329b73d___convert__closures_____invoke___js_sys_50231ef181b3f389___Function_fn_wasm_bindgen_dae3e6268329b73d___JsValue_____wasm_bindgen_dae3e6268329b73d___sys__Undefined___js_sys_50231ef181b3f389___Function_fn_wasm_bindgen_dae3e6268329b73d___JsValue_____wasm_bindgen_dae3e6268329b73d___sys__Undefined_______true_: (a: number, b: number, c: any, d: any) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
