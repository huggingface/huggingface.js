// The public types; `index` re-exports them.
import type * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

/** `preview` (default): base color up to `maxTextureSize`, roughness / metallic / occlusion / opacity / emissive maps up to 512 px, no normal maps. `full`: every map, normals included, up to `maxTextureSize`. `none`: no textures. */
export type TextureMode = "none" | "preview" | "full";

export type LoadProgress = (
	| {
			readonly stage: "layers";
			readonly loaded: number;
			/** Grows while layer dependencies are discovered. */ readonly total: number;
			readonly bytes: number;
	  }
	| { readonly stage: "compose"; readonly round: number }
	/** Meshes streaming out of the worker; the load resolves once `loaded === total`. */
	| { readonly stage: "geometry"; readonly loaded: number; readonly total: number }
	| { readonly stage: "textures"; readonly loaded: number; readonly total: number; readonly bytes: number }
) & {
	/**
	 * The whole load, 0 to 1, for a progress bar; it never decreases. Each stage spans a share: `layers` 0–0.4 (`loaded / (total + 1)`,
	 * as more layers may yet be found), `compose` 0.45, `geometry` 0.5–0.8 and `textures` 0.8–1 (`loaded / total`). It reaches 1 when the
	 * last texture settles, or with the `textures` stage when there are none.
	 */
	readonly fraction: number;
};

/**
 * Every request a load makes is sent as `<model-viewer>` sends its own: cookies only to the page's own origin (the browser's default
 * `credentials: 'same-origin'`), no custom headers, no referrer, and only to http(s) URLs (the root URL excepted, as the caller chose it).
 */
export interface LoadOptions {
	/** Default `preview`. */
	textures?: TextureMode | undefined;
	/** Long-side cap for decoded textures, in pixels. Default 1024. */
	maxTextureSize?: number | undefined;
	/** Aborts fetches and the worker; the load rejects with a UsdLoadError of code `aborted`. */
	signal?: AbortSignal | undefined;
	onProgress?: ((progress: LoadProgress) => void) | undefined;
	/** Where the `.wasm` binary is served from. Defaults to the copy next to the package. */
	wasmUrl?: string | URL | undefined;
	/** Where the worker script is served from. Defaults to the copy next to the package. */
	workerUrl?: string | URL | undefined;
	/** Requests in flight at once, a positive integer (anything else throws a RangeError). Default 16 (textures: at most 4 fetched and decoded at once). */
	maxConcurrentFetches?: number | undefined;
	/** Total bytes of USD layers to fetch before failing with a `fetch` error. Default 768 MiB. */
	maxLayerBytes?: number | undefined;
	/** Layer files to request before failing with a `fetch` error. Default 1024. Layers read from inside a `.usdz` package are not requested, so not counted: the package counts once, its contents are bounded by `maxLayerBytes` and the package expansion limits (512 MiB per file, 1 GiB in all). */
	maxLayers?: number | undefined;
	/** Triangles drawn across all meshes, counted once per instance; meshes past it are left out unread with a `triangle-limit` warning. Default 20 million. */
	maxTriangles?: number | undefined;
	/** Mesh instances drawn, PointInstancer placements (nested ones expanded) included; the rest are left out with an `instance-limit` warning. Default 100,000. Many instances of one mesh with the same materials draw as one `THREE.InstancedMesh`. */
	maxInstances?: number | undefined;
	/** Total bytes of texture files, read from packages or fetched (counted as they download); textures past it fail with a `texture-failed` warning. Default 512 MiB. Only PNG, JPEG and WebP up to 16384 px a side and 8192 x 8192 px in area are decoded; others are refused from their header. */
	maxTextureBytes?: number | undefined;
	/**
	 * Loads from these files instead of the network, e.g. ones dropped on the page or picked with `<input type="file" webkitdirectory>`.
	 * Keys are package-relative paths (`pkg/root.usda`, `pkg/Textures/a.png`; a `File`'s `webkitRelativePath` works as is), and the
	 * `url` argument is the key of the root layer. Relative asset paths resolve against their layer's key and match a key exactly
	 * (case-sensitive; `\\` and a leading `./` or `/` are normalised). Paths not in `files` are never fetched: they are missing.
	 * Absolute http(s) paths in the files are fetched like any other. Files are read in the worker only when
	 * needed, counted against `maxLayerBytes` and `maxTextureBytes`.
	 */
	files?: ReadonlyMap<string, Blob> | undefined;
}

/**
 * - `prim-unsupported`: visible geometry other than meshes and the implicit `Cube` / `Sphere` / `Cylinder` / `Cone` / `Capsule` / `Plane` (e.g. `BasisCurves`, `Points`, `Volume`, Gaussian splats) left out.
 * - `nothing-drawable`: no visible mesh had anything to draw.
 * - `layer-missing`: a layer could not be fetched, or was not an http(s) URL.
 * - `layer-unreadable`: a layer was fetched but could not be parsed; composition goes on without it.
 * - `material-fallback`: materials with neither UsdPreviewSurface nor a supported MDL material (OmniPBR, glTF), e.g. MaterialX only or custom MDL modules, shown grey.
 * - `composition`: what composition reported, e.g. an unresolved reference (the first 5, then a count).
 * - `texture-failed`: an image could not be fetched or read, or was refused (not an http(s) URL, past `maxTextureBytes`, larger than 16384 px a side or 8192 x 8192 px in area, or not PNG, JPEG or WebP); its inputs show their own (authored or default) values.
 * - `triangle-limit`: meshes left out past `maxTriangles`.
 * - `instance-limit`: instances left out past `maxInstances`.
 */
export type WarningCode =
	| "layer-missing"
	| "layer-unreadable"
	| "prim-unsupported"
	| "nothing-drawable"
	| "material-fallback"
	| "composition"
	| "texture-failed"
	| "triangle-limit"
	| "instance-limit";

export interface LoadWarning {
	readonly code: WarningCode;
	readonly message: string;
	/** The layer URL, texture path or an example prim / material path. */
	readonly path?: string | undefined;
}

export type MaterialKind = "preview" | "omnipbr" | "gltf-pbr" | "displayColor" | "fallback";

export interface LoadStats {
	readonly layers: number;
	readonly layerBytes: number;
	readonly missing: number;
	readonly rounds: number;
	readonly fetchMs: number;
	readonly parseMs: number;
	readonly composeMs: number;
	readonly initMs: number;
	readonly totalMs: number;
	readonly wasmMemoryBytes: number;
}

export interface LoadInfo {
	/** As authored, like Pixar's `UsdGeomGetStageUpAxis`: `Y` (default) or `Z`; anything else is drawn as `Y`. */
	readonly upAxis: string;
	readonly metersPerUnit: number;
	readonly meshes: number;
	readonly geometries: number;
	readonly triangles: number;
	readonly materials: number;
	readonly materialKinds: Readonly<Partial<Record<MaterialKind, number>>>;
	readonly stats: LoadStats;
	/** What could not be shown faithfully. Grows (texture failures) until `complete` settles. */
	readonly warnings: readonly LoadWarning[];
}

export interface LoadResult {
	/** Y-up, in meters. */
	readonly root: THREE.Group;
	readonly info: LoadInfo;
	/** Settles when textures have streamed in; rejects with a UsdLoadError if the load is aborted, disposed or the worker dies. */
	readonly complete: Promise<{ textures: number; failed: number }>;
	/** Frees geometries, materials and textures and stops any textures still streaming. */
	dispose(): void;
}

/** A `compose` error whose message starts with `scene too large to load` ran out of WebAssembly memory (4 GiB at most). */
export type UsdLoadErrorCode = "aborted" | "fetch" | "compose" | "worker" | "webgl";

export interface ViewerOptions {
	/** Canvas background. Default: transparent. */
	background?: THREE.ColorRepresentation | undefined;
	/** The WebGL context was lost: the stage is gone (its geometry lived only on the GPU) and any load in flight aborted. */
	onContextLost?: (() => void) | undefined;
	/** The context is back: `reload` loads the last model shown again, with the same options (null if none was shown). */
	onContextRestored?: ((reload: Promise<LoadResult> | null) => void) | undefined;
}

export interface ToBlobOptions {
	type?: "image/png" | "image/webp" | undefined;
	quality?: number | undefined;
	width?: number | undefined;
	height?: number | undefined;
}

export interface Viewer {
	readonly renderer: THREE.WebGLRenderer;
	readonly scene: THREE.Scene;
	readonly camera: THREE.PerspectiveCamera;
	readonly controls: OrbitControls;
	/** Loads a stage, replacing the current one once its geometry shows. A newer load aborts this one. */
	load(url: string, options?: LoadOptions): Promise<LoadResult>;
	/**
	 * Renders a fresh frame and encodes it, e.g. for a thumbnail: `type` `image/png` (default) or `image/webp` (PNG where the browser
	 * cannot encode WebP, as Safari), `quality` 0–1 for WebP, and an optional size in pixels (giving one keeps the aspect ratio;
	 * default: the canvas's). Rejects when the viewer is disposed or its WebGL context is lost.
	 */
	toBlob(options?: ToBlobOptions): Promise<Blob>;
	/** Removes and frees the current stage, and aborts any load in flight. */
	clear(): void;
	/** Points the camera at `object`, by default the current stage. */
	frame(object?: THREE.Object3D): void;
	requestRender(): void;
	/** Frees the renderer, the GPU context, the current stage and any load in flight, and removes the canvas. Safe to call twice. */
	dispose(): void;
}
