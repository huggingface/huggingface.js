// Prefetch-then-compose loading, shared by the Web Worker and the Node test.
//
// Layers are identified by absolute URL without a query, exactly as requested
// or as the Rust side resolved them from authored paths, and fetched by that
// URL. Only the root keeps its query (a signed URL, say) for fetching:
// relative references do not inherit it.
import type { UsdLoader, UsdScene } from "../wasm/usd_wasm.js";
import { UsdLoadError } from "./errors.js";
import type { PackageLayers } from "./hub-prefetch.js";
import type {
	ComposeStats,
	Failure,
	GeometryArrays,
	GeometryMeta,
	OverBudget,
	SceneMeta,
	StageProgress,
} from "./meta.js";
import type { LoadWarning, TextureMode } from "./types.js";

/** The load options' defaults, and the largest image read at all (by side and by area). */
export const DEFAULTS = {
	textures: "preview",
	maxTextureSize: 1024,
	maxConcurrentFetches: 16,
	maxLayerBytes: 768 * 2 ** 20,
	maxLayers: 1024,
	maxInstances: 100000,
	maxTriangles: 20e6,
	maxTextureBytes: 512 * 2 ** 20,
	maxImageSize: 16384,
	maxImagePixels: 8192 * 8192,
} satisfies { textures: TextureMode; [limit: string]: unknown };

/** Charged with each chunk's size as it arrives; throws once over budget. */
export type Budget = (bytes: number) => void;

export interface ComposeOptions {
	UsdLoader: typeof UsdLoader;
	/**
	 * Null or a `fetch` UsdLoadError when missing. Calling `budget` with each chunk's size as it
	 * arrives throws once all layers together pass `maxLayerBytes`; a body never passed
	 * through it is charged whole when it returns.
	 */
	fetchBytes: (url: string, budget: Budget) => Promise<Uint8Array | null>;
	/** Absolute. */
	rootUrl: string;
	/** Layer requests in flight at once. Default 16. */
	maxConcurrentFetches?: number | undefined;
	/** Total size of the distinct layers held for composition. Default 768 MiB. */
	maxLayerBytes?: number | undefined;
	/** Distinct layer files requested (files read from inside a `.usdz` package are not requested, so not counted). Default 1024. */
	maxLayers?: number | undefined;
	/** Mesh instances drawn, PointInstancer placements included; the rest are left out with an `instance-limit` warning. Default 100000. */
	maxInstances?: number | undefined;
	/**
	 * Layers likely to be needed: fetched ahead at lower priority, right away if `eager` or else once the root names a
	 * dependency, charged to `maxLayerBytes` like any layer, and used only if composition asks for them.
	 */
	preload?: Promise<PackageLayers> | undefined;
	onProgress?: ((progress: Extract<StageProgress, { stage: "layers" | "compose" }>) => void) | undefined;
}

interface Preloaded {
	started: boolean;
	charged: number;
	dropped?: boolean;
	bytes?: Promise<Uint8Array | null>;
}

/** Loads and composes the stage at `rootUrl`. */
export async function composeStage({
	UsdLoader,
	fetchBytes,
	rootUrl,
	maxConcurrentFetches = DEFAULTS.maxConcurrentFetches,
	maxLayerBytes = DEFAULTS.maxLayerBytes,
	maxLayers = DEFAULTS.maxLayers,
	maxInstances = DEFAULTS.maxInstances,
	preload,
	onProgress = () => {},
}: ComposeOptions): Promise<{
	scene: UsdScene;
	meta: SceneMeta;
	stats: ComposeStats;
	/** Every layer file read, with its size. */
	layers: { url: string; size: number }[];
}> {
	const root = rootUrl.split(/[?#]/)[0];
	const urlOf = (path: string) => (path === root ? rootUrl : path);
	const loader = new UsdLoader();
	const stats: ComposeStats = {
		layers: 0,
		layerBytes: 0,
		missing: 0,
		rounds: 0,
		fetchMs: 0,
		parseMs: 0,
		composeMs: 0,
		warnings: [],
	};
	const started = new Map<string, Promise<void>>();
	// Layers fetched again for a later compose round count once.
	const done = new Set<string>();
	const progress = (path: string) => {
		done.add(path);
		onProgress({ stage: "layers", loaded: done.size, total: started.size, bytes: stats.layerBytes });
	};
	const throttle = limiter(maxConcurrentFetches);
	// One budget for every layer body, charged as its bytes arrive, so fetches
	// in parallel cannot each count on the whole remainder.
	let heldBytes = 0;
	const charge = (bytes: number, path: string, speculative = false) => {
		heldBytes += bytes;
		// Preloads are a guess: unused ones give their bytes back before a needed layer fails the load.
		if (heldBytes > maxLayerBytes && !speculative) {
			for (const [key, entry] of preloaded) {
				preloaded.delete(key);
				entry.dropped = true;
				heldBytes -= entry.charged;
				entry.charged = 0;
			}
		}
		if (heldBytes > maxLayerBytes) {
			throw resourceLimit(`layers exceed maxLayerBytes (${maxLayerBytes} bytes) at ${path}`);
		}
	};
	// Re-fetched layers replace their earlier bytes, so count each path once.
	const layerSizes = new Map<string, number>();
	// Speculative fetches by URL, dropped once composition is done. One that
	// has not started when its layer is asked for, or that failed, gives way to
	// the regular fetch, so the result is the same as without them. Their
	// bytes are charged as they arrive, and stay charged once used.
	const preloaded = new Map<string, Preloaded>();
	let composed = false;
	// Every distinct layer URL composition asked for, for maxLayers. Preloads
	// are a guess, so they do not count; at most maxLayers of them start.
	const requested = new Set<string>();
	let preloads = 0;
	const startPreload = (layers: PackageLayers["layers"]) => {
		let bytes = 0;
		for (const { url, size } of layers) {
			const key = urlKey(url);
			bytes += size;
			if (composed || bytes > maxLayerBytes) {
				break;
			}
			if (requested.has(key) || preloaded.has(key)) {
				continue;
			}
			if (preloads >= maxLayers) {
				break;
			}
			preloads++;
			const entry: Preloaded = { started: false, charged: 0 };
			preloaded.set(key, entry);
			// Unused once composed: the next chunk cancels the body.
			const budget = (bytes: number) => {
				if (composed || entry.dropped) {
					throw new Error("composed or dropped without it");
				}
				entry.charged += bytes;
				charge(bytes, url, true);
			};
			entry.bytes = throttle(
				async () => {
					if (composed || preloaded.get(key) !== entry) {
						return null;
					}
					entry.started = true;
					const bytes = await fetchBytes(url, budget);
					if (bytes) {
						budget(bytes.byteLength - entry.charged);
					}
					return bytes;
				},
				{ later: true },
			).catch(() => {
				heldBytes -= entry.charged;
				entry.charged = 0;
				return null;
			});
		}
	};
	const takePreloaded = (path: string) => {
		const entry = preloaded.get(urlKey(path));
		preloaded.delete(urlKey(path));
		return entry?.started ? entry : null;
	};

	// Jobs in flight. A job queues its dependencies here rather than awaiting
	// them, so layers that reference each other cannot wait on each other.
	const pending: Promise<void>[] = [];
	const drain = async () => {
		while (pending.length) {
			await Promise.all(pending.splice(0));
		}
	};
	const fetchLayer = (path: string): void => {
		if (loader.has(path) || started.has(path)) {
			return;
		}
		requested.add(urlKey(path));
		if (requested.size > maxLayers) {
			throw resourceLimit(`more than maxLayers (${maxLayers}) layer files at ${path}`);
		}
		const job = (async () => {
			const t0 = performance.now();
			heldBytes -= layerSizes.get(path) ?? 0;
			layerSizes.delete(path);
			let charged = 0;
			const budget = (bytes: number) => {
				charged += bytes;
				charge(bytes, path);
			};
			// Any fetch failure, HTTP or network: the root fails the load, any
			// other layer is left out with a warning.
			let bytes: Uint8Array | null | undefined = null;
			let failure: (Error & { status?: number }) | null = null;
			try {
				const entry = takePreloaded(path);
				bytes = entry && (await entry.bytes);
				if (entry && bytes) {
					charged = entry.charged;
				}
				bytes ??= await throttle(() => fetchBytes(urlOf(path), budget));
			} catch (error) {
				heldBytes -= charged;
				// HTTP errors carry a status; network errors are TypeErrors (as from fetch).
				if ((error as { status?: number })?.status === undefined && !(error instanceof TypeError)) {
					throw error;
				}
				failure = error as Error;
			}
			stats.fetchMs = Math.max(stats.fetchMs, performance.now() - t0);
			if (!bytes) {
				if (path === root) {
					const status = failure?.status ?? (failure ? undefined : 404);
					throw new UsdLoadError("fetch", `could not fetch ${rootUrl}${status ? ` (HTTP ${status})` : ""}`, {
						url: rootUrl,
						status,
						cause: failure ?? undefined,
					});
				}
				stats.missing++;
				stats.warnings.push({
					code: "layer-missing",
					message: `layer not found: ${failure?.message ?? urlOf(path)}`,
					path: urlOf(path),
				});
				loader.markUnavailable(path);
				progress(path);
				return;
			}
			charge(bytes.byteLength - charged, path);
			layerSizes.set(path, bytes.byteLength);
			stats.layers++;
			stats.layerBytes += bytes.byteLength;
			const t1 = performance.now();
			let deps: string[];
			try {
				deps = loader.addLayer(path, bytes);
			} catch (error) {
				// After a trap the module is unusable: the load fails.
				if (isTrap(error)) {
					throw error;
				}
				// An unreadable layer is left out; composition carries on without it.
				stats.warnings.push({
					code: "layer-unreadable",
					message: String((error as Error).message || error),
					path: urlOf(path),
				});
				loader.markUnavailable(path);
				progress(path);
				return;
			} finally {
				stats.parseMs += performance.now() - t1;
			}
			progress(path);
			for (const dep of deps) {
				fetchLayer(dep);
			}
		})();
		started.set(path, job);
		pending.push(job);
	};

	fetchLayer(root);
	// A root without dependencies needs nothing else from its directory.
	const rootHasDependencies = () =>
		(started.get(root) ?? Promise.resolve()).then(
			() => started.size > 1,
			() => false,
		);
	preload?.then(async ({ layers, eager }) => (eager || (await rootHasDependencies())) && startPreload(layers));
	await drain();
	if (!loader.has(root)) {
		const reason = stats.warnings.find((w) => w.path === rootUrl)?.message;
		throw new UsdLoadError("compose", `could not read ${rootUrl}${reason ? `: ${reason}` : ""}`, { url: rootUrl });
	}

	for (;;) {
		stats.rounds++;
		onProgress({ stage: "compose", round: stats.rounds });
		const t0 = performance.now();
		const missing = loader.compose(root, maxInstances);
		stats.composeMs += performance.now() - t0;
		if (!missing.length) {
			break;
		}
		if (stats.rounds > 16) {
			throw new UsdLoadError("compose", `composition still missing layers: ${missing.join(", ")}`);
		}
		// The list also names layers the failed attempt consumed; fetch them again.
		for (const path of missing) {
			started.delete(path);
		}
		missing.forEach(fetchLayer);
		await drain();
	}
	composed = true;
	const scene = loader.takeScene();
	loader.free();
	const meta: SceneMeta = JSON.parse(scene.meta());
	const layers = [...layerSizes].map(([path, size]) => ({ url: urlOf(path), size }));
	return { scene, meta, stats, layers };
}

/**
 * What the page is told about a failed load. Fetch and resource-limit errors
 * keep their code, url and status; anything the WASM side throws is a
 * composition failure. Running out of WASM memory (4 GiB at most) reads as a
 * scene too large to load: an allocation that fails while reading a layer
 * reports "out of memory", one that aborts traps as a bare `unreachable`. A
 * Rust panic, which also traps as `unreachable`, gives its message instead,
 * read with `lastPanic` (the module's export). Overflowing the stack, the WASM one (an
 * out-of-bounds access) or the engine's, means a scene nested too deeply to read.
 */
export function loadFailure(error: unknown, wasmMemoryBytes: number, lastPanic?: () => string | undefined): Failure {
	const { code = "compose", url, status } = (error ?? {}) as Partial<Failure>;
	const message = String((error as Error)?.message || error);
	const failure = (detail: string): Failure => ({ code, message: detail, url, status });
	if (code !== "compose") {
		return failure(message);
	}
	const tooLarge = () =>
		failure(
			`scene too large to load: ran out of memory (${(wasmMemoryBytes / 2 ** 30).toFixed(1)} GiB of WebAssembly memory in use): ${message}`,
		);
	if (OUT_OF_MEMORY.test(message) || (error instanceof WebAssembly.RuntimeError && wasmMemoryBytes > 3 * 2 ** 30)) {
		return tooLarge();
	}
	if (!isTrap(error)) {
		return failure(message);
	}
	const panic = readPanic(lastPanic);
	if (panic) {
		return failure(`${message}: ${panic}`);
	}
	if (/out of bounds|call stack|recursion/i.test(message)) {
		return failure(`stack overflow: the scene nests too deeply to read (${message})`);
	}
	// Rust aborts on a failed allocation without a panic: a bare `unreachable`.
	if (/unreachable/i.test(message)) {
		return tooLarge();
	}
	return failure(message);
}

/** Messages of allocations that failed, in Rust or in the engine. */
export const OUT_OF_MEMORY =
	/out of memory|memory allocation|allocation failed|memory size exceeded|could not allocate/i;

/** Reading the panic calls into the trapped module, which can trap again (an exhausted stack does). */
function readPanic(lastPanic?: () => string | undefined) {
	try {
		return lastPanic?.();
	} catch {
		return undefined;
	}
}

/** A WebAssembly trap or an exhausted engine call stack: the module is no longer usable. */
function isTrap(error: unknown) {
	return (
		error instanceof WebAssembly.RuntimeError ||
		error instanceof RangeError ||
		(error as Error)?.name === "InternalError"
	);
}

function resourceLimit(detail: string) {
	return new UsdLoadError("fetch", `resource limit exceeded: ${detail}`);
}

/** Runs at most `max` of the given tasks at once; tasks marked `later` wait for the others. */
export function limiter(max: number): <T>(task: () => Promise<T>, options?: { later?: boolean }) => Promise<T> {
	interface Job {
		task: () => Promise<unknown>;
		resolve: (value: unknown) => void;
		reject: (reason: unknown) => void;
	}
	let active = 0;
	const queue: Job[] = [];
	const later: Job[] = [];
	const next = () => {
		if (active >= max) {
			return;
		}
		const job = queue.shift() ?? later.shift();
		if (!job) {
			return;
		}
		active++;
		const { task, resolve, reject } = job;
		task()
			.then(resolve, reject)
			.finally(() => {
				active--;
				next();
			});
	};
	return <T>(task: () => Promise<T>, { later: low = false } = {}): Promise<T> =>
		new Promise<T>((resolve, reject) => {
			(low ? later : queue).push({ task, resolve: resolve as (value: unknown) => void, reject });
			next();
		});
}

/** A layer URL as fetch would spell it, so an authored `a b.usd` matches a listed `a%20b.usd`. */
function urlKey(url: string) {
	try {
		return new URL(url).href;
	} catch {
		return url;
	}
}

/**
 * Fetches a body, passing each chunk's size to `budget` as it arrives and
 * giving up (cancelling the body) when `budget` throws. An HTTP error throws a
 * `fetch` UsdLoadError carrying the status. `fetchFn` is the global fetch or a
 * stand-in with the same contract. Rate limiting (429) and server errors
 * (5xx) are retried with backoff, as the Hub answers bursts with 429.
 */
export async function fetchLimited(
	url: string,
	budget: Budget,
	{
		fetchFn = fetch,
		retries = 3,
		retryDelayMs = 500,
	}: { fetchFn?: (url: string) => Promise<Response>; retries?: number; retryDelayMs?: number } = {},
): Promise<Uint8Array> {
	let response = await fetchFn(url);
	for (let attempt = 0; attempt < retries && (response.status === 429 || response.status >= 500); attempt++) {
		response.body?.cancel().catch(() => {});
		const retryAfterMs = Number(response.headers?.get("retry-after")) * 1000;
		const delay = retryAfterMs > 0 ? Math.min(retryAfterMs, 10_000) : retryDelayMs * 2 ** attempt * (1 + Math.random());
		await new Promise((resolve) => setTimeout(resolve, delay));
		response = await fetchFn(url);
	}
	if (!response.ok) {
		throw new UsdLoadError("fetch", `HTTP ${response.status} for ${url}`, { url, status: response.status });
	}
	if (!response.body) {
		return new Uint8Array();
	}
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		try {
			budget(value.byteLength);
		} catch (error) {
			await reader.cancel();
			throw error;
		}
		size += value.byteLength;
		chunks.push(value);
	}
	const out = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return out;
}

/**
 * Size of a PNG, JPEG or WebP from its header, without decoding, and whether
 * it is color: 8-bit RGB(A) or palette, rather than greyscale or 16-bit data
 * (the images `sourceColorSpace = "auto"` decodes as sRGB; WebP is always
 * color). Null for other formats, whose size cannot be checked before decoding.
 */
export function imageInfo(b: Uint8Array): { width: number; height: number; color: boolean } | null {
	const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
	const ascii = (at: number, text: string) => [...text].every((c, i) => b[at + i] === c.charCodeAt(0));
	if (b.length > 25 && b[0] === 0x89 && ascii(1, "PNG")) {
		const [bitDepth, colorType] = [b[24], b[25]];
		const color = colorType === 3 || (bitDepth === 8 && (colorType === 2 || colorType === 6));
		return { width: v.getUint32(16), height: v.getUint32(20), color };
	}
	if (b[0] === 0xff && b[1] === 0xd8) {
		let i = 2;
		while (i + 9 < b.length) {
			if (b[i] !== 0xff) {
				return null;
			}
			const marker = b[i + 1];
			const length = (b[i + 2] << 8) | b[i + 3];
			const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
			if (isFrame) {
				return {
					height: (b[i + 5] << 8) | b[i + 6],
					width: (b[i + 7] << 8) | b[i + 8],
					color: b[i + 4] === 8 && b[i + 9] >= 3,
				};
			}
			i += 2 + length;
		}
		return null;
	}
	if (b.length >= 30 && ascii(0, "RIFF") && ascii(8, "WEBP")) {
		// The first chunk: lossy (VP8), lossless (VP8L) or extended (VP8X).
		if (ascii(12, "VP8 ")) {
			return { width: v.getUint16(26, true) & 0x3fff, height: v.getUint16(28, true) & 0x3fff, color: true };
		}
		if (ascii(12, "VP8L")) {
			const bits = v.getUint32(21, true);
			return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, color: true };
		}
		if (ascii(12, "VP8X")) {
			const u24 = (at: number) => b[at] | (b[at + 1] << 8) | (b[at + 2] << 16);
			return { width: u24(24) + 1, height: u24(27) + 1, color: true };
		}
	}
	return null;
}

/** The scheme of files given with the `files` option: `local:///<key>`, the key percent-encoded. */
export const LOCAL = "local:";

/** A `files` key as the load spells it: `/` separators, no leading `./` or `/`. */
export function localKey(key: string): string {
	return key.replace(/\\/g, "/").replace(/^(?:\.?\/)+/, "");
}

/** The URL a `files` key loads as; relative asset paths in the file resolve against it. */
export function localUrl(key: string): string {
	return `${LOCAL}///${localKey(key).split("/").map(encodeURIComponent).join("/")}`;
}

/** The `files` key a `local:` URL names; one that is not valid percent-encoding names none. */
export function keyOfLocalUrl(url: string): string | undefined {
	try {
		return decodeURIComponent(new URL(url).pathname.slice(1));
	} catch (error) {
		if (error instanceof URIError) {
			return undefined;
		}
		throw error;
	}
}

/** A `local:` request, answered from `files`: a key it does not hold reads as a 404. */
export function localResponse(files: ReadonlyMap<string, Blob> | undefined, url: string): Response {
	const key = keyOfLocalUrl(url);
	const file = key === undefined ? undefined : files?.get(key);
	return file ? new Response(file) : new Response(null, { status: 404 });
}

/**
 * The fetch every request of a load rooted at `rootUrl` goes through (layers, textures, Hub listings), sent
 * as `<model-viewer>` sends its own: the browser's default `credentials: "same-origin"` (cookies only for
 * the page's own origin), no custom headers, and no referrer. The root URL is fetched whatever its scheme,
 * as the caller chose it; any other URL only over http(s). A load from `files` (a `local:` root) reads other
 * `local:` URLs from them, never from the network; no other load may. A refused URL throws a TypeError, as a
 * network failure does, so it reads as a missing layer or a failed texture.
 */
export function requestFor(rootUrl: string, files?: ReadonlyMap<string, Blob>): (url: string) => Promise<Response> {
	return async (url) => {
		const { protocol } = new URL(url);
		if (protocol === LOCAL && rootUrl.startsWith(LOCAL)) {
			return localResponse(files, url);
		}
		if (url !== rootUrl && protocol !== "http:" && protocol !== "https:") {
			throw new TypeError(`only http(s) URLs are fetched: ${url}`);
		}
		return fetch(url, { credentials: "same-origin", referrerPolicy: "no-referrer" });
	};
}

/**
 * Reads each geometry out of WASM in turn, so only one mesh's arrays are in
 * WASM memory at a time, and calls `onGeometry(index, meta, arrays)` with
 * JS-owned typed arrays (`meta` and `arrays` are null for a mesh with nothing
 * drawable, or left out). Triangles count as drawn, once per instance:
 * meshes that would take them past `maxTriangles` are left out unread.
 * Releases the stage afterwards. Returns warnings: `triangle-limit` for
 * meshes left out, `nothing-drawable` when no mesh had anything to draw.
 */
export function readGeometries(
	scene: UsdScene,
	meta: SceneMeta,
	onGeometry: (index: number, meta: GeometryMeta | null, arrays: GeometryArrays | null) => void,
	{ maxTriangles = DEFAULTS.maxTriangles }: { maxTriangles?: number | undefined } = {},
): LoadWarning[] {
	const instances = Array.from({ length: meta.geometryCount }, () => 0);
	for (const { geometry } of meta.instances) {
		instances[geometry]++;
	}
	let drawn = 0;
	let left = maxTriangles;
	const skipped: string[] = [];
	for (let i = 0; i < meta.geometryCount; i++) {
		// Not drawn anywhere (e.g. all its instances past maxInstances).
		if (!instances[i]) {
			onGeometry(i, null, null);
			continue;
		}
		const json = scene.read(i, Math.min(Math.floor(left / instances[i]), 2 ** 32 - 1));
		const g: GeometryMeta | OverBudget | undefined = json && JSON.parse(json);
		if (!g || "overBudget" in g) {
			if (g) {
				skipped.push(g.path);
			}
			onGeometry(i, null, null);
			continue;
		}
		drawn++;
		left = Math.max(0, left - instances[i] * g.groups.reduce((n, [, count]) => n + count / 3, 0));
		onGeometry(i, g, {
			positions: scene.positions(),
			normals: scene.normals(),
			uvs: g.uvSets.map((_, k) => scene.uvs(k)),
			colors: g.hasColors ? scene.colors() : null,
			indices: g.maxIndex < 65536 ? scene.indices16() : scene.indices(),
		});
	}
	scene.finish();
	const warnings: LoadWarning[] = [];
	if (skipped.length) {
		warnings.push({
			code: "triangle-limit",
			message: `${skipped.length} meshes left out: past maxTriangles (${maxTriangles}) drawn`,
			path: skipped[0],
		});
	}
	if (!drawn) {
		warnings.push({
			code: "nothing-drawable",
			message: "nothing to draw: the stage has no visible meshes with geometry",
		});
	}
	return warnings;
}

/**
 * Images stored inside a USDZ package (they cannot be fetched by URL) among
 * the texture `jobs` (see {@link textureJobs}), each read once, by path, all
 * together at most `maxBytes`. One that cannot be read maps to its error, so
 * it fails as that texture rather than the whole load.
 */
export function takePackagedTextures(
	scene: UsdScene,
	jobs: TextureJob[],
	{ maxBytes = Infinity } = {},
): Map<string, Uint8Array | Error> {
	const out = new Map<string, Uint8Array | Error>();
	let left = maxBytes;
	for (const { path } of jobs) {
		if (!path.includes("[")) {
			continue;
		}
		try {
			const bytes = scene.packagedFile(path, left);
			if (bytes) {
				out.set(path, bytes);
			}
			left -= bytes?.byteLength ?? 0;
		} catch (error) {
			out.set(path, error as Error);
		}
	}
	return out;
}

/** Long-side cap for data maps (roughness, metallic, occlusion, ...) in `preview` mode. */
const PREVIEW_DATA_SIZE = 512;

export interface TextureJob {
	path: string;
	size: number;
}

/**
 * The texture files to load and the size to decode each to, base colors first.
 * `preview`: base color up to `maxSize`, other maps up to 512 px, no normal
 * maps. `full`: every map, including normals, up to `maxSize`. `none`: nothing.
 */
export function textureJobs(
	meta: SceneMeta,
	{ textures, maxSize }: { textures: TextureMode; maxSize: number },
): TextureJob[] {
	if (textures === "none") {
		return [];
	}
	const full = textures === "full";
	const dataSize = full ? maxSize : Math.min(maxSize, PREVIEW_DATA_SIZE);
	const tiers: [string[], number][] = [
		[["diffuseColor"], maxSize],
		[["opacity", "emissiveColor", "roughness", "metallic", "occlusion"], dataSize],
		[full ? ["normal"] : [], maxSize],
	];
	const jobs = new Map<string, number>();
	for (const [inputs, size] of tiers) {
		for (const m of meta.materials) {
			for (const input of inputs) {
				const path = m.maps[input]?.path;
				// A file shared by several inputs is decoded once, at the largest size asked.
				if (path) {
					jobs.set(path, Math.max(jobs.get(path) ?? 0, size));
				}
			}
		}
	}
	return [...jobs].map(([path, size]) => ({ path, size }));
}
