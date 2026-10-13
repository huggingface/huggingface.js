/* tslint:disable */
/* eslint-disable */

export class UsdLoader {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Stores a layer and returns the layers it names outside unselected
     * variants (see [`Loader::add_layer`]).
     */
    addLayer(path: string, bytes: Uint8Array): string[];
    /**
     * Composes the stage at `root`. Returns the layers still missing; when
     * that is empty the scene is ready for [`take_scene`](Self::take_scene).
     * The scene draws at most `max_instances` mesh instances.
     */
    compose(root: string, max_instances: number): string[];
    has(path: string): boolean;
    markUnavailable(path: string): void;
    constructor();
    /**
     * Hands over the extracted scene and drops every stored layer.
     */
    takeScene(): UsdScene;
}

/**
 * A composed scene whose meshes are read one at a time: `read(i)` makes
 * geometry `i` current, and the array getters move its data out (each once).
 * Only the current mesh's arrays live in WASM memory at any time.
 */
export class UsdScene {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    colors(): Float32Array;
    /**
     * Releases the stage once every geometry has been read.
     */
    finish(): void;
    /**
     * Indices as 16-bit, for geometries with fewer than 65536 vertices.
     * On failure the indices stay in place for [`indices`](Self::indices).
     */
    indices16(): Uint16Array;
    indices(): Uint32Array;
    /**
     * Everything but the triangle data, as JSON.
     */
    meta(): string;
    normals(): Float32Array;
    /**
     * A texture that lives inside a USDZ package, if `path` names one there.
     * Fails rather than expand it past `limit` bytes.
     */
    packagedFile(path: string, limit: number): Uint8Array | undefined;
    positions(): Float32Array;
    /**
     * Reads geometry `index` and returns its metadata as JSON, or `None` when
     * the mesh has nothing drawable. A mesh with more than `max_triangles` is
     * left unread: `{"overBudget": triangles, "path": prim path}`.
     */
    read(index: number, max_triangles: number): string | undefined;
    /**
     * UV set `set` (in the order of the geometry's `uvSets`).
     */
    uvs(set: number): Float32Array;
}

/**
 * Takes the message of the last panic, if any.
 */
export function lastPanic(): string | undefined;

export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_usdloader_free: (a: number, b: number) => void;
    readonly __wbg_usdscene_free: (a: number, b: number) => void;
    readonly lastPanic: (a: number) => void;
    readonly start: () => void;
    readonly usdloader_addLayer: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly usdloader_compose: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly usdloader_has: (a: number, b: number, c: number) => number;
    readonly usdloader_markUnavailable: (a: number, b: number, c: number) => void;
    readonly usdloader_new: () => number;
    readonly usdloader_takeScene: (a: number, b: number) => void;
    readonly usdscene_colors: (a: number, b: number) => void;
    readonly usdscene_finish: (a: number) => void;
    readonly usdscene_indices: (a: number, b: number) => void;
    readonly usdscene_indices16: (a: number, b: number) => void;
    readonly usdscene_meta: (a: number, b: number) => void;
    readonly usdscene_normals: (a: number, b: number) => void;
    readonly usdscene_packagedFile: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly usdscene_positions: (a: number, b: number) => void;
    readonly usdscene_read: (a: number, b: number, c: number, d: number) => void;
    readonly usdscene_uvs: (a: number, b: number, c: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export2: (a: number, b: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
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
