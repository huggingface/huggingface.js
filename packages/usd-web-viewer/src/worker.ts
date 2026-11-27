// Loads, composes and extracts a USD stage off the main thread, then streams
// textures as downscaled ImageBitmaps. One worker per load: the page
// terminates it when done, disposed or aborted, which releases all WASM memory.
import init, { lastPanic, UsdLoader } from "../wasm/usd_wasm.js";
import { hubPackageLayers, pinHubRevision } from "./hub-prefetch.js";
import {
	DEFAULTS,
	composeStage,
	fetchLimited,
	imageInfo,
	limiter,
	loadFailure,
	readGeometries,
	requestFor,
	takePackagedTextures,
	textureJobs,
} from "./load-core.js";
import type { Budget } from "./load-core.js";
import type { LoadRequest, StageProgress, WorkerMessage } from "./meta.js";

// The worker's global scope, typed here: the package is checked against the
// `dom` lib, whose `self` is a window.
declare const self: {
	postMessage(message: WorkerMessage, transfer?: Transferable[]): void;
	onmessage: ((event: MessageEvent<LoadRequest>) => void) | null;
};

// Textures in flight at once (fetch and decode): decoding a large image
// briefly holds it at full size, so wide parallelism spikes memory.
const TEXTURE_CONCURRENCY = 4;
// Longest side and largest area of an image read at all: larger ones are
// refused from their header, before decoding (WebGL's own limit is commonly
// 16384 px a side too). Decoding holds the full image: 4 bytes a pixel.
const MAX_IMAGE_SIZE = DEFAULTS.maxImageSize;
const MAX_IMAGE_PIXELS = DEFAULTS.maxImagePixels;
// Images past this many pixels decode one at a time rather than in parallel.
const LARGE_IMAGE_PIXELS = 4096 * 4096;
const decodeLarge = limiter(1);

self.onmessage = async ({ data }) => {
	const {
		url,
		wasmModule,
		maxTextureSize = DEFAULTS.maxTextureSize,
		textures = DEFAULTS.textures,
		maxConcurrentFetches = DEFAULTS.maxConcurrentFetches,
		maxLayerBytes,
		maxTextureBytes = DEFAULTS.maxTextureBytes,
		maxLayers,
		maxInstances,
		maxTriangles,
		files,
	} = data;
	const request = requestFor(url, files);
	const fetchBytes = (target: string, budget: Budget) => fetchLimited(target, budget, { fetchFn: request });
	// One budget for every texture, packaged ones first, then each fetched
	// body as its bytes arrive. Bytes of a body cut short stay charged: they
	// were downloaded.
	let textureBytes = 0;
	const chargeTexture = (bytes: number) => {
		textureBytes += bytes;
		if (textureBytes > maxTextureBytes) {
			throw new Error(`textures exceed maxTextureBytes (${maxTextureBytes} bytes)`);
		}
	};
	const progress = (p: StageProgress) => self.postMessage({ type: "progress", progress: p });

	let wasmMemory: WebAssembly.Memory | undefined;
	try {
		const t0 = performance.now();
		// Looked up while the WASM module initializes.
		const rootUrl = pinHubRevision(url, request);
		const preload = rootUrl.then((root) => hubPackageLayers(root, request));
		const wasm = await init({ module_or_path: wasmModule });
		wasmMemory = wasm.memory;
		const tInit = performance.now();

		const { scene, meta, stats, layers } = await composeStage({
			UsdLoader,
			fetchBytes,
			rootUrl: await rootUrl,
			maxConcurrentFetches,
			maxLayerBytes,
			maxLayers,
			maxInstances,
			preload,
			onProgress: progress,
		});
		stats.initMs = tInit - t0;
		self.postMessage({ type: "meta", meta });
		// One mesh at a time: each is transferred (not copied) as soon as it is read.
		const onGeometry: Parameters<typeof readGeometries>[2] = (index, g, arrays) => {
			const transfer = arrays
				? [arrays.positions, arrays.normals, arrays.colors, arrays.indices, ...arrays.uvs]
						.filter((a) => !!a)
						.map((a) => a.buffer)
				: [];
			self.postMessage({ type: "geometry", index, meta: g, arrays }, transfer);
			progress({ stage: "geometry", loaded: index + 1, total: meta.geometryCount });
		};
		const warnings = readGeometries(scene, meta, onGeometry, { maxTriangles });
		const jobs = textureJobs(meta, { textures, maxSize: maxTextureSize });
		const packaged = takePackagedTextures(scene, jobs, { maxBytes: maxTextureBytes });
		for (const entry of packaged.values()) {
			if (!(entry instanceof Error)) {
				textureBytes += entry.byteLength;
			}
		}
		scene.free();
		stats.warnings.push(...warnings);
		stats.totalMs = performance.now() - t0;
		stats.wasmMemoryBytes = wasm.memory.buffer.byteLength;
		self.postMessage({ type: "scene", stats: stats as Required<typeof stats>, layers });

		let loaded = 0;
		let bytes = 0;
		progress({ stage: "textures", loaded, total: jobs.length, bytes });
		// The limiter runs jobs in order, so base colors come first.
		const throttle = limiter(Math.min(maxConcurrentFetches, TEXTURE_CONCURRENCY));
		await Promise.all(
			jobs.map(({ path, size }) =>
				throttle(async () => {
					try {
						const entry = packaged.get(path);
						if (entry instanceof Error) {
							throw entry;
						}
						// A packaged path is never a URL to fetch.
						if (!entry && path.includes("[")) {
							throw new Error(`not found in its package: ${path}`);
						}
						const image = entry ?? (await fetchBytes(path, chargeTexture));
						bytes += image.byteLength;
						const { bitmap, color } = await decodeTexture(image, size);
						self.postMessage({ type: "texture", path, bitmap, color, size: image.byteLength }, [bitmap]);
					} catch (error) {
						self.postMessage({ type: "texture", path, error: String((error as Error)?.message || error) });
					}
					progress({ stage: "textures", loaded: ++loaded, total: jobs.length, bytes });
				}),
			),
		);
		self.postMessage({ type: "done" });
	} catch (error) {
		self.postMessage({ type: "error", ...loadFailure(error, wasmMemory?.buffer.byteLength ?? 0, lastPanic) });
	}
};

/**
 * Decodes a PNG, JPEG or WebP straight to at most `maxSize` px on its long
 * side, and tells whether it holds color (what `sourceColorSpace = "auto"`
 * decodes as sRGB). Images whose size the header does not give, or that are
 * too large, are refused before decoding.
 */
async function decodeTexture(bytes: Uint8Array, maxSize: number) {
	const info = imageInfo(bytes);
	if (!info) {
		throw new Error("unsupported image format: only PNG, JPEG and WebP are read");
	}
	if (Math.max(info.width, info.height) > MAX_IMAGE_SIZE) {
		throw new Error(`image too large: ${info.width}x${info.height} (at most ${MAX_IMAGE_SIZE} px a side)`);
	}
	const pixels = info.width * info.height;
	if (pixels > MAX_IMAGE_PIXELS) {
		throw new Error(
			`image too large: ${info.width}x${info.height} (at most ${Math.sqrt(MAX_IMAGE_PIXELS)}x${Math.sqrt(MAX_IMAGE_PIXELS)} px in area)`,
		);
	}
	// USD texture coordinates put (0,0) at the bottom-left, three.js's default.
	const options: ImageBitmapOptions = {
		imageOrientation: "flipY",
		premultiplyAlpha: "none",
		colorSpaceConversion: "none",
	};
	const scale = Math.min(1, maxSize / Math.max(info.width, info.height));
	if (scale < 1) {
		options.resizeWidth = Math.max(1, Math.round(info.width * scale));
		options.resizeHeight = Math.max(1, Math.round(info.height * scale));
		options.resizeQuality = "high";
	}
	const decode = () => createImageBitmap(new Blob([bytes as Uint8Array<ArrayBuffer>]), options);
	return { bitmap: await (pixels > LARGE_IMAGE_PIXELS ? decodeLarge(decode) : decode()), color: info.color };
}
