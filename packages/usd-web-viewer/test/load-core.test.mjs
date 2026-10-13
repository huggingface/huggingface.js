// Drives the real WASM build through load-core with in-memory files.
import { afterEach, test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import http from "node:http";
import zlib from "node:zlib";
import { initSync, UsdLoader } from "../wasm/usd_wasm.js";
import {
	composeStage,
	fetchLimited,
	imageInfo,
	loadFailure,
	readGeometries,
	takePackagedTextures,
	textureJobs,
} from "../src/load-core.ts";
import { UsdLoadError } from "../src/errors.ts";
import { hubPackageLayers, pinHubRevision } from "../src/hub-prefetch.ts";

// Closed once each test ends, as node:test's t.after did.
const cleanups = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

// Missing from the oldest supported browsers (Safari 16.4).
delete Map.groupBy;
delete AbortSignal.any;
delete URL.canParse;
initSync({ module: readFileSync(new URL("../wasm/usd_wasm_bg.wasm", import.meta.url)) });

const QUAD = `def Mesh "M" {
  int[] faceVertexCounts = [4]
  int[] faceVertexIndices = [0, 1, 2, 3]
  point3f[] points = [(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 1, 0)]
}`;

/** Serves `files` (URL -> string | Uint8Array); counts fetches in flight. */
function server(files, { delayMs = 0 } = {}) {
	const s = { inFlight: 0, maxInFlight: 0, requested: [] };
	s.fetchBytes = async (url) => {
		s.requested.push(url);
		s.inFlight++;
		s.maxInFlight = Math.max(s.maxInFlight, s.inFlight);
		await new Promise((resolve) => setTimeout(resolve, delayMs));
		s.inFlight--;
		const body = files[url];
		if (body === undefined) return null;
		return typeof body === "string" ? new TextEncoder().encode(body) : body;
	};
	return s;
}

/** A zip of stored (or, with `deflate`, deflated) entries, each optionally declaring a size it does not have. */
function storedZip(entries) {
	const locals = [];
	const centrals = [];
	let offset = 0;
	for (const { name, data: raw, declaredSize = raw.length, deflate = false } of entries) {
		const nameBytes = Buffer.from(name);
		const crc = zlib.crc32(raw);
		const data = deflate ? zlib.deflateRawSync(raw) : raw;
		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0);
		local.writeUInt16LE(20, 4);
		local.writeUInt16LE(deflate ? 8 : 0, 8);
		local.writeUInt32LE(crc, 14);
		local.writeUInt32LE(data.length, 18);
		local.writeUInt32LE(declaredSize, 22);
		local.writeUInt16LE(nameBytes.length, 26);
		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50, 0);
		central.writeUInt16LE(20, 4);
		central.writeUInt16LE(20, 6);
		central.writeUInt16LE(deflate ? 8 : 0, 10);
		central.writeUInt32LE(crc, 16);
		central.writeUInt32LE(data.length, 20);
		central.writeUInt32LE(declaredSize, 24);
		central.writeUInt16LE(nameBytes.length, 28);
		central.writeUInt32LE(offset, 42);
		locals.push(local, nameBytes, data);
		centrals.push(central, nameBytes);
		offset += local.length + nameBytes.length + data.length;
	}
	const centralSize = centrals.reduce((n, b) => n + b.length, 0);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(entries.length, 8);
	end.writeUInt16LE(entries.length, 10);
	end.writeUInt32LE(centralSize, 12);
	end.writeUInt32LE(offset, 16);
	return new Uint8Array(Buffer.concat([...locals, ...centrals, end]));
}

test("a package entry that lies about its size is read without trusting the header", async () => {
	const s = server({
		"https://h/root.usda": '#usda 1.0\ndef "A" (references = @./p.usdz[m.usda]@) {}',
		"https://h/p.usdz": storedZip([
			{ name: "m.usda", data: Buffer.from(`#usda 1.0\n(defaultPrim = "M")\n${QUAD}`), declaredSize: 0xfffffff0 },
		]),
	});
	const { scene, meta } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/root.usda" });
	let triangles = 0;
	readGeometries(scene, meta, (i, g) => (triangles += g ? g.groups.reduce((n, [, count]) => n + count / 3, 0) : 0));
	scene.free();
	assert.equal(triangles, 2);
});

test("a usdz layer whose files would expand too far is refused before openusd reads it", async () => {
	// bomb.usdz, smaller: a deflated entry declaring 600 MiB, and one declaring less than it inflates to.
	const quad = Buffer.from(`#usda 1.0\n${QUAD}`);
	for (const entry of [
		{ name: "root.usda", data: quad, deflate: true, declaredSize: 600 * 2 ** 20 },
		{
			name: "root.usda",
			data: Buffer.concat([quad, Buffer.alloc(1 << 20, 32)]),
			deflate: true,
			declaredSize: quad.length,
		},
	]) {
		const s = server({ "https://h/bomb.usdz": storedZip([entry]) });
		const error = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/bomb.usdz" }).then(
			() => null,
			(e) => e,
		);
		assert.equal(error?.code, "compose");
	}
	// A stored package loads.
	const s = server({ "https://h/ok.usdz": storedZip([{ name: "root.usda", data: quad }]) });
	const { scene, meta } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/ok.usdz" });
	scene.free();
	assert.equal(meta.geometryCount, 1);
}, 5000);

test("layer progress counts each layer once, however many compose rounds fetch it again", async () => {
	// Each layer is named only inside a variant the one before selects: every round asks for the next.
	const files = {
		"https://h/root.usda": '#usda 1.0\ndef "A" (variants = { string v = "x" }\n  prepend references = @./l1.usda@) {}',
	};
	for (let i = 1; i <= 4; i++) {
		const next = i < 4 ? `"x" (references = @./l${i + 1}.usda@) {}` : `"x" {}`;
		files[`https://h/l${i}.usda`] =
			`#usda 1.0\n(defaultPrim = "P")\ndef "P" (prepend variantSets = "v") {\n  variantSet "v" = {\n    ${next}\n  }\n}`;
	}
	const events = [];
	const { scene, stats } = await composeStage({
		UsdLoader,
		fetchBytes: server(files).fetchBytes,
		rootUrl: "https://h/root.usda",
		onProgress: (p) => p.stage === "layers" && events.push(p),
	});
	scene.free();
	assert.ok(stats.rounds > 2, `${stats.rounds} rounds`);
	assert.deepEqual(
		events.filter((p) => p.loaded > p.total),
		[],
	);
	assert.deepEqual(events.at(-1), { ...events.at(-1), loaded: 5, total: 5 });
});

test("packaged texture reads share one byte budget", async () => {
	// overlap.zip, smaller: three images in one package, read past the budget.
	const mesh = (n) => `def Mesh "M${n}" (prepend apiSchemas = ["MaterialBindingAPI"]) {
  int[] faceVertexCounts = [3]
  int[] faceVertexIndices = [0, 1, 2]
  point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
  rel material:binding = </Mat${n}>
}
def Material "Mat${n}" {
  token outputs:surface.connect = </Mat${n}/P.outputs:surface>
  def Shader "P" {
    uniform token info:id = "UsdPreviewSurface"
    color3f inputs:diffuseColor.connect = </Mat${n}/T.outputs:rgb>
    token outputs:surface
  }
  def Shader "T" {
    uniform token info:id = "UsdUVTexture"
    asset inputs:file = @${n}.png@
    float3 outputs:rgb
  }
}`;
	const names = ["a", "b", "c"];
	const usdz = storedZip([
		{ name: "root.usda", data: Buffer.from(`#usda 1.0\n${names.map(mesh).join("\n")}`) },
		...names.map((n) => ({ name: `${n}.png`, data: Buffer.alloc(1 << 20) })),
	]);
	const s = server({ "https://h/p.usdz": usdz });
	const { scene, meta } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/p.usdz" });
	const packaged = takePackagedTextures(scene, textureJobs(meta, { textures: "preview", maxSize: 1024 }), {
		maxBytes: 2.5 * 2 ** 20,
	});
	scene.free();
	assert.deepEqual(
		[...packaged.values()].map((v) => (v instanceof Error ? "refused" : v.byteLength)),
		[1 << 20, 1 << 20, "refused"],
	);
});

test("imageInfo reads the size of PNG, JPEG and WebP from the header, and whether it is color", () => {
	const bytes = (...parts) =>
		new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));
	const le16 = (n) => [n & 255, n >> 8];
	const le24 = (n) => [n & 255, (n >> 8) & 255, n >> 16];
	const be32 = (n) => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];
	// A 64 x 32 PNG signature and IHDR chunk; a 64 x 32 baseline JPEG SOF0 with `components` channels.
	const png = (bitDepth, colorType) =>
		bytes(
			[0x89],
			"PNG",
			[13, 10, 26, 10],
			be32(13),
			"IHDR",
			be32(64),
			be32(32),
			[bitDepth, colorType],
			Array.from({ length: 7 }, () => 0),
		);
	const jpeg = (components) =>
		bytes([0xff, 0xd8, 0xff, 0xc0, 0, 0x11, 8, 0, 32, 0, 64, components, 1, 0x11, 0, 2, 0x11, 1, 3, 0x11, 1]);
	const riff = (chunk, data) =>
		bytes(
			"RIFF",
			[0, 0, 0, 0],
			"WEBP",
			chunk,
			[0, 0, 0, 0],
			data,
			Array.from({ length: 16 }, () => 0),
		);
	const vp8l = (639 | (479 << 14)) >>> 0;
	const color = (width, height) => ({ width, height, color: true });
	const data = { width: 64, height: 32, color: false };
	// 8-bit RGB(A) and palette images are color (sRGB under `auto`); single-channel and 16-bit ones are data.
	// [what, header, info]
	for (const [what, header, expected] of [
		["quadrants.png", new Uint8Array(readFileSync(new URL("../fixtures/quadrants.png", import.meta.url))), color(2, 2)],
		["RGBA PNG", png(8, 6), color(64, 32)],
		["palette PNG", png(8, 3), color(64, 32)],
		["grey PNG", png(8, 0), data],
		["grey and alpha PNG", png(8, 4), data],
		["16-bit RGB PNG", png(16, 2), data],
		["YCbCr JPEG", jpeg(3), color(64, 32)],
		["grey JPEG", jpeg(1), data],
		["lossy WebP", riff("VP8 ", [0, 0, 0, 0x9d, 1, 0x2a, ...le16(640), ...le16(480)]), color(640, 480)],
		[
			"lossless WebP",
			riff("VP8L", [0x2f, vp8l & 255, (vp8l >> 8) & 255, (vp8l >> 16) & 255, vp8l >>> 24]),
			color(640, 480),
		],
		["extended WebP", riff("VP8X", [0, 0, 0, 0, ...le24(20000 - 1), ...le24(30 - 1)]), color(20000, 30)],
		[
			"GIF",
			bytes(
				"GIF89a",
				le16(20000),
				le16(20000),
				Array.from({ length: 20 }, () => 0),
			),
			null,
		],
		[
			"BMP",
			bytes(
				"BM",
				Array.from({ length: 40 }, () => 0),
			),
			null,
		],
		["truncated RIFF", bytes("RIFF"), null],
	]) {
		assert.deepEqual(imageInfo(header), expected, what);
	}
});
test("a mesh whose corners share one point welds in linear time", async () => {
	// weld.usda, smaller: every corner on point 0, each with its own normal.
	const faces = 20000;
	const normals = Array.from({ length: faces * 3 }, (_, i) => `(${i}, 1, 0)`).join(", ");
	const usda = `#usda 1.0
def Mesh "M" {
  int[] faceVertexCounts = [${Array.from({ length: faces }, () => 3).join(",")}]
  int[] faceVertexIndices = [${Array.from({ length: faces * 3 }, () => 0).join(",")}]
  point3f[] points = [(0, 0, 0)]
  normal3f[] normals = [${normals}] (interpolation = "faceVarying")
}`;
	const s = server({ "https://h/root.usda": usda });
	const t0 = performance.now();
	const { scene, meta } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/root.usda" });
	let vertices = 0;
	readGeometries(scene, meta, (i, g) => (vertices = g.vertices));
	scene.free();
	assert.equal(vertices, faces * 3);
	assert.ok(performance.now() - t0 < 3000, `${Math.round(performance.now() - t0)} ms`);
}, 10000);

test("indices are 16-bit up to index 65535, 32-bit past it", async () => {
	// One triangle reaching the last of `points` points.
	const mesh = (name, points) => `def Mesh "${name}" {
  int[] faceVertexCounts = [3]
  int[] faceVertexIndices = [0, 1, ${points - 1}]
  point3f[] points = [${Array.from({ length: points }, () => "(0, 0, 0)").join(", ")}]
}`;
	const s = server({ "https://h/root.usda": `#usda 1.0\n${mesh("A", 65536)}\n${mesh("B", 65537)}` });
	const { scene, meta } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/root.usda" });
	const out = [];
	readGeometries(scene, meta, (i, g, a) => out.push([g.maxIndex, a.indices.constructor.name]));
	scene.free();
	assert.deepEqual(out, [
		[65535, "Uint16Array"],
		[65536, "Uint32Array"],
	]);
});
test("fetchLimited stops reading a streamed body past maxBytes", async () => {
	const chunk = Buffer.alloc(64 * 1024);
	let sent = 0;
	const srv = http.createServer((req, res) => {
		if (req.url === "/small") return res.end("hello");
		// Chunked, no content-length: only counting the stream can catch it.
		const timer = setInterval(() => {
			sent += chunk.length;
			res.write(chunk);
		}, 1);
		res.on("close", () => clearInterval(timer));
	});
	await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
	cleanups.push(() => srv.close());
	const base = `http://127.0.0.1:${srv.address().port}`;
	assert.equal(new TextDecoder().decode(await fetchLimited(`${base}/small`, cap(5))), "hello");
	await assert.rejects(fetchLimited(`${base}/endless`, cap(256 * 1024)), /over the cap/);
	assert.ok(sent < 4 * 1024 * 1024, `stopped early (${sent} bytes sent)`);
});

test("fetchLimited retries 429 and 5xx responses, not other errors", async () => {
	const hits = {};
	const srv = http.createServer((req, res) => {
		hits[req.url] = (hits[req.url] ?? 0) + 1;
		if (req.url === "/busy" && hits[req.url] === 1) return res.writeHead(429).end();
		if (req.url === "/flaky" && hits[req.url] < 3) return res.writeHead(503).end();
		if (req.url === "/missing") return res.writeHead(404).end();
		res.end("ok");
	});
	await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
	cleanups.push(() => srv.close());
	const base = `http://127.0.0.1:${srv.address().port}`;
	const fast = { retryDelayMs: 1 };
	assert.equal(new TextDecoder().decode(await fetchLimited(`${base}/busy`, cap(5), fast)), "ok");
	assert.equal(new TextDecoder().decode(await fetchLimited(`${base}/flaky`, cap(5), fast)), "ok");
	await assert.rejects(fetchLimited(`${base}/missing`, cap(5), fast), (error) => error.status === 404);
	assert.deepEqual(hits, { "/busy": 2, "/flaky": 3, "/missing": 1 });
});

/** A byte budget for fetchLimited: charges each chunk and throws past `max`. */
function cap(max) {
	let used = 0;
	return (bytes) => {
		used += bytes;
		if (used > max) throw new Error("over the cap");
	};
}

test("parallel layers share one byte budget as their bodies stream in", async () => {
	const CHUNK = 64 * 1024;
	const BUDGET = 1024 * 1024;
	let streamed = 0;
	const endless = () =>
		new Response(
			new ReadableStream({
				async pull(controller) {
					await new Promise((resolve) => setTimeout(resolve));
					streamed += CHUNK;
					controller.enqueue(new Uint8Array(CHUNK).fill(32));
				},
			}),
		);
	const root = sublayers("./a.usda", "./b.usda", "./c.usda", "./d.usda");
	const fetchBytes = (url, budget) =>
		fetchLimited(url, budget, { fetchFn: async (u) => (u.endsWith("root.usda") ? new Response(root) : endless()) });
	await assert.rejects(
		composeStage({
			UsdLoader,
			fetchBytes,
			rootUrl: "https://h/root.usda",
			maxLayerBytes: BUDGET,
			maxConcurrentFetches: 4,
		}),
		/resource limit exceeded/,
	);
	// Each stream may have one chunk read ahead when the shared budget runs out.
	assert.ok(streamed <= BUDGET + 5 * CHUNK, `${streamed} bytes streamed for a ${BUDGET}-byte budget`);
});

/** The URLs `fetch` would request for what composeStage asked for. */
const fetched = (s) => s.requested.map((u) => new URL(u).href);
const sublayers = (...paths) => `#usda 1.0\n(subLayers = [${paths.map((p) => `@${p}@`).join(", ")}])`;

test("layer URLs: what a load requests for what its layers author", async () => {
	const variants = `#usda 1.0
def "A" (
  variants = { string v = "on" }
  prepend variantSets = "v"
) {
  variantSet "v" = {
    "on" (references = @./on.usda@) {}
    "off" (references = @./off.usda@) {}
  }
}`;
	const empty = '#usda 1.0\n(defaultPrim = "X")\ndef "X" {}';
	// [what, root URL, layers by URL, URLs requested]
	const cases = [
		[
			"a signed root keeps its query; relative layers resolve without it",
			"https://h/a/root.usda?sig=abc",
			{ "https://h/a/root.usda?sig=abc": sublayers("./sub.usda"), "https://h/a/sub.usda": empty },
			["https://h/a/root.usda?sig=abc", "https://h/a/sub.usda"],
		],
		[
			"authored escapes and spaces are encoded once",
			"https://h/a/root.usda",
			{
				"https://h/a/root.usda": sublayers("./a%20b.usda", "./c d.usda"),
				"https://h/a/a%20b.usda": empty,
				"https://h/a/c d.usda": empty,
			},
			["https://h/a/root.usda", "https://h/a/a%20b.usda", "https://h/a/c%20d.usda"],
		],
		[
			"absolute layers keep their scheme and host, and anchor their own relative paths",
			"https://h/root.usda",
			{
				"https://h/root.usda": sublayers("http://other.example/x/x.usda"),
				"http://other.example/x/x.usda": sublayers("./y.usda"),
				"http://other.example/x/y.usda": empty,
			},
			["https://h/root.usda", "http://other.example/x/x.usda", "http://other.example/x/y.usda"],
		],
		[
			"an encoded slash stays part of its path segment",
			"https://h/d/resolve/refs%2Fpr%2F1/root.usda",
			{
				"https://h/d/resolve/refs%2Fpr%2F1/root.usda": sublayers("./sub.usda"),
				"https://h/d/resolve/refs%2Fpr%2F1/sub.usda": empty,
			},
			["https://h/d/resolve/refs%2Fpr%2F1/root.usda", "https://h/d/resolve/refs%2Fpr%2F1/sub.usda"],
		],
		[
			"a layer named only in a variant nothing selects is never requested",
			"https://h/root.usda",
			{ "https://h/root.usda": variants, "https://h/on.usda": empty },
			["https://h/root.usda", "https://h/on.usda"],
		],
	];
	for (const [what, rootUrl, files, expected] of cases) {
		const s = server(files);
		const { scene } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl });
		scene.free();
		assert.deepEqual(fetched(s).sort(), expected.sort(), what);
	}
});

test("relative layers resolve against the requested URL, not where it redirected", async () => {
	const requested = [];
	const srv = http.createServer((req, res) => {
		requested.push(req.url);
		if (req.url === "/a/root.usda") return res.writeHead(302, { location: "/cdn/blob1" }).end();
		if (req.url === "/cdn/blob1") return res.end(sublayers("./sub.usda"));
		if (req.url === "/a/sub.usda") return res.end("#usda 1.0");
		res.writeHead(404).end();
	});
	await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
	cleanups.push(() => srv.close());
	const base = `http://127.0.0.1:${srv.address().port}`;
	const { scene } = await composeStage({ UsdLoader, fetchBytes: fetchLimited, rootUrl: `${base}/a/root.usda` });
	scene.free();
	assert.deepEqual(requested, ["/a/root.usda", "/cdn/blob1", "/a/sub.usda"]);
});
test("a packaged image shared by many materials is extracted once, and only when its texture mode loads it", async () => {
	// Two materials each sample one 1 MiB image twice.
	const materials = Array.from(
		{ length: 2 },
		(_, i) => `def Mesh "M${i}" (prepend apiSchemas = ["MaterialBindingAPI"]) {
  int[] faceVertexCounts = [3]
  int[] faceVertexIndices = [0, 1, 2]
  point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
  rel material:binding = </Mat${i}>
}
def Material "Mat${i}" {
  token outputs:surface.connect = </Mat${i}/P.outputs:surface>
  def Shader "P" {
    uniform token info:id = "UsdPreviewSurface"
    color3f inputs:diffuseColor.connect = </Mat${i}/T.outputs:rgb>
    float inputs:roughness.connect = </Mat${i}/T.outputs:r>
    token outputs:surface
  }
  def Shader "T" {
    uniform token info:id = "UsdUVTexture"
    asset inputs:file = @tex.png@
    float3 outputs:rgb
    float outputs:r
  }
}`,
	);
	const usdz = storedZip([
		{ name: "root.usda", data: Buffer.from(`#usda 1.0\n${materials.join("\n")}`) },
		{ name: "tex.png", data: Buffer.alloc(1 << 20) },
	]);
	for (const [textures, reads] of [
		["none", 0],
		["preview", 1],
	]) {
		const s = server({ "https://h/shared.usdz": usdz });
		const { scene, meta } = await composeStage({
			UsdLoader,
			fetchBytes: s.fetchBytes,
			rootUrl: "https://h/shared.usdz",
		});
		const read = [];
		const packagedFile = scene.packagedFile.bind(scene);
		scene.packagedFile = (path, limit) => (read.push(path), packagedFile(path, limit));
		const packaged = takePackagedTextures(scene, textureJobs(meta, { textures, maxSize: 1024 }));
		scene.free();
		assert.equal(read.length, reads, textures);
		if (reads) assert.equal(packaged.get("https://h/shared.usdz[tex.png]").byteLength, 1 << 20);
	}
});

test("layers that reference each other compose instead of waiting on each other forever", async () => {
	const s = server({
		"https://h/root.usda": '#usda 1.0\ndef "A" (references = @./a.usda@) {}',
		"https://h/a.usda": `#usda 1.0\n(defaultPrim = "M")\n${QUAD}\ndef "Back" (references = @./b.usda@) {}`,
		"https://h/b.usda": '#usda 1.0\n(defaultPrim = "X")\ndef "X" (references = @./a.usda@) {}',
	});
	const { scene, stats } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/root.usda" });
	scene.free();
	assert.equal(stats.layers, 3);
	assert.deepEqual(s.requested.sort(), ["https://h/a.usda", "https://h/b.usda", "https://h/root.usda"]);
}, 5000);

test("a stage with nothing to draw says so, after naming what it could not draw", async () => {
	const read = async (usda) => {
		const s = server({ "https://h/root.usda": `#usda 1.0\n${usda}` });
		const { scene, meta } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/root.usda" });
		const warnings = readGeometries(scene, meta, () => {});
		scene.free();
		return [...meta.warnings, ...warnings].map((w) => w.code);
	};
	assert.deepEqual(await read('def ParticleField3DGaussianSplat "Splat" {}'), ["prim-unsupported", "nothing-drawable"]);
	assert.deepEqual(await read('def Mesh "Empty" {}'), ["nothing-drawable"]);
	assert.deepEqual(await read(QUAD), []);
});

test("reading geometry out of order or out of range throws instead of trapping", async () => {
	const s = server({ "https://h/root.usda": `#usda 1.0\n${QUAD}` });
	const { scene } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/root.usda" });
	assert.throws(() => scene.positions(), { message: /call read\(\) first/ });
	assert.throws(() => scene.read(7, 100), { message: /no geometry 7: the scene has 1/ });
	assert.ok(scene.read(0, 100));
	assert.throws(() => scene.uvs(3), { message: /no UV set 3/ });
	// Still usable: none of these trapped.
	assert.equal(scene.positions().length, 12);
	scene.free();
});

test("running out of WASM memory fails as a scene too large to load; a panic gives its message", () => {
	const GiB = 2 ** 30;
	const oom = new Error('failed to decode field "default" at /W/body.normals: failed to read vec: out of memory');
	assert.match(loadFailure(oom, 1 * GiB).message, /^scene too large to load: ran out of memory.*body\.normals/);
	assert.equal(loadFailure(oom, 1 * GiB).code, "compose");
	// An allocation that aborts traps; near the 4 GiB ceiling that is memory, not a bug.
	assert.match(loadFailure(new WebAssembly.RuntimeError("unreachable"), 3.9 * GiB).message, /^scene too large to load/);
	// Without a panic message, a bare `unreachable` is Rust aborting on a failed allocation.
	assert.match(
		loadFailure(new WebAssembly.RuntimeError("unreachable"), 0.1 * GiB).message,
		/^scene too large to load: ran out of memory/,
	);
	assert.match(
		loadFailure(new RangeError("Array buffer allocation failed"), 0.1 * GiB).message,
		/^scene too large to load/,
	);
	const panic = "panicked at crate/src/extract.rs:1:1:\nindex out of bounds";
	assert.equal(
		loadFailure(new WebAssembly.RuntimeError("unreachable"), 0.1 * GiB, () => panic).message,
		`unreachable: ${panic}`,
	);
	const fetchError = loadFailure(
		new UsdLoadError("fetch", "HTTP 404 for https://h/a.usd", { url: "https://h/a.usd", status: 404 }),
		4 * GiB,
	);
	assert.deepEqual(fetchError, {
		code: "fetch",
		message: "HTTP 404 for https://h/a.usd",
		url: "https://h/a.usd",
		status: 404,
	});
});

test("a UDIM texture loads its first tile, 1001", async () => {
	const s = server({
		"https://h/root.usda": `#usda 1.0
def Mesh "M" (prepend apiSchemas = ["MaterialBindingAPI"]) {
  int[] faceVertexCounts = [3]
  int[] faceVertexIndices = [0, 1, 2]
  point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
  rel material:binding = </Mat>
}
def Material "Mat" {
  token outputs:surface.connect = </Mat/Surface.outputs:surface>
  def Shader "Surface" {
    uniform token info:id = "UsdPreviewSurface"
    color3f inputs:diffuseColor.connect = </Mat/Tex.outputs:rgb>
    token outputs:surface
  }
  def Shader "Tex" {
    uniform token info:id = "UsdUVTexture"
    asset inputs:file = @Textures/body_alb.<UDIM>.png@
    float3 outputs:rgb
  }
}`,
	});
	const { scene, meta } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/root.usda" });
	scene.free();
	assert.deepEqual(
		textureJobs(meta, { textures: "full" }).map((j) => j.path),
		["https://h/Textures/body_alb.1001.png"],
	);
});

test("textures inside a package nested in packages are found where the nesting says", async () => {
	const material = `def Mesh "M" (prepend apiSchemas = ["MaterialBindingAPI"]) {
  int[] faceVertexCounts = [3]
  int[] faceVertexIndices = [0, 1, 2]
  point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
  rel material:binding = </M/Mat>
  def Material "Mat" {
    token outputs:surface.connect = </M/Mat/Surface.outputs:surface>
    def Shader "Surface" {
      uniform token info:id = "UsdPreviewSurface"
      color3f inputs:diffuseColor.connect = </M/Mat/Tex.outputs:rgb>
      token outputs:surface
    }
    def Shader "Tex" {
      uniform token info:id = "UsdUVTexture"
      asset inputs:file = @0/t.png@
      float3 outputs:rgb
    }
  }
}`;
	const deep = storedZip([
		{ name: "deep.usda", data: Buffer.from(`#usda 1.0\n(defaultPrim = "M")\n${material}`) },
		{ name: "0/t.png", data: Buffer.from("deep texture") },
	]);
	const mid = storedZip([
		{
			name: "mid.usda",
			data: Buffer.from('#usda 1.0\n(defaultPrim = "Mid")\ndef "Mid" (references = @0/deep.usdz@) {}'),
		},
		{ name: "0/deep.usdz", data: deep },
	]);
	const outer = storedZip([
		{ name: "outer.usda", data: Buffer.from('#usda 1.0\ndef "Outer" (references = @0/mid.usdz@) {}') },
		{ name: "0/mid.usdz", data: mid },
	]);
	const s = server({ "https://h/outer.usdz": outer });
	const { scene, meta } = await composeStage({ UsdLoader, fetchBytes: s.fetchBytes, rootUrl: "https://h/outer.usdz" });
	const textures = takePackagedTextures(scene, textureJobs(meta, { textures: "full", maxSize: 1024 }));
	scene.free();
	const path = "https://h/outer.usdz[0/mid.usdz[0/deep.usdz[0/t.png]]]";
	assert.deepEqual(
		textureJobs(meta, { textures: "full" }).map((j) => j.path),
		[path],
	);
	assert.equal(new TextDecoder().decode(textures.get(path)), "deep texture");
});

test("preloaded layers are used when composition asks for them, and change nothing else", async () => {
	const files = {
		"https://h/p/root.usda": `#usda 1.0\n(subLayers = [@./a b.usda@])\n${QUAD}`,
		"https://h/p/a b.usda": sublayers("./b.usda"),
		"https://h/p/b.usda": `#usda 1.0\ndef Mesh "B" {\n  int[] faceVertexCounts = [3]\n  int[] faceVertexIndices = [0, 1, 2]\n  point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]\n}`,
		"https://h/p/unused.usda": `#usda 1.0\n${QUAD.replace('"M"', '"U"')}`,
	};
	const plain = server(files, { delayMs: 5 });
	const expected = await composeStage({ UsdLoader, fetchBytes: plain.fetchBytes, rootUrl: "https://h/p/root.usda" });
	// As listed: spelled the way fetch spells it, root included.
	const listed = ["root.usda", "a%20b.usda", "b.usda", "unused.usda"].map((name) => ({
		url: `https://h/p/${name}`,
		size: 100,
	}));
	const s = server({ ...files, "https://h/p/a%20b.usda": files["https://h/p/a b.usda"] }, { delayMs: 5 });
	const actual = await composeStage({
		UsdLoader,
		fetchBytes: s.fetchBytes,
		rootUrl: "https://h/p/root.usda",
		preload: Promise.resolve({ layers: listed, eager: true }),
	});
	assert.deepEqual(actual.meta, expected.meta);
	assert.equal(actual.stats.layers, 3);
	expected.scene.free();
	actual.scene.free();
	assert.deepEqual(fetched(s).sort(), [
		"https://h/p/a%20b.usda",
		"https://h/p/b.usda",
		"https://h/p/root.usda",
		"https://h/p/unused.usda",
	]);
});

test("a preload that fails gives way to the regular fetch, with its result", async () => {
	const files = {
		"https://h/root.usda": sublayers("./a.usda", "./gone.usda"),
		"https://h/a.usda": sublayers("./b.usda"),
		"https://h/b.usda": "#usda 1.0",
	};
	const s = server(files, { delayMs: 5 });
	const requested = [];
	const fetchBytes = (url, budget) => {
		requested.push(url);
		if (url === "https://h/b.usda" && requested.filter((u) => u === url).length === 1)
			return Promise.reject(new TypeError("network"));
		return s.fetchBytes(url, budget);
	};
	const preload = Promise.resolve({
		layers: ["b.usda", "gone.usda"].map((name) => ({ url: `https://h/${name}`, size: 1 })),
		eager: false,
	});
	const { scene, stats } = await composeStage({ UsdLoader, fetchBytes, rootUrl: "https://h/root.usda", preload });
	scene.free();
	assert.equal(stats.layers, 3);
	assert.deepEqual(
		stats.warnings.map((w) => w.code),
		["layer-missing"],
	);
	assert.deepEqual(requested.filter((u) => u === "https://h/b.usda").length, 2);
});

test("a root with no dependencies fetches nothing ahead unless its package is declared", async () => {
	for (const eager of [false, true]) {
		const s = server(
			{ "https://h/root.usda": `#usda 1.0\n${QUAD}`, "https://h/other.usda": "#usda 1.0" },
			{ delayMs: 5 },
		);
		const preload = Promise.resolve({ layers: [{ url: "https://h/other.usda", size: 10 }], eager });
		const { scene } = await composeStage({
			UsdLoader,
			fetchBytes: s.fetchBytes,
			rootUrl: "https://h/root.usda",
			preload,
		});
		scene.free();
		assert.deepEqual(s.requested, eager ? ["https://h/root.usda", "https://h/other.usda"] : ["https://h/root.usda"]);
	}
});

test("unused preloads give their bytes back before a needed layer would fail maxLayerBytes", async () => {
	// The needed layers (1,000 bytes, one outside the listed folder) fit in 2,000; with the unused ones listed (1,900) they do not.
	const H = "https://huggingface.co/datasets/o/r/resolve/main/";
	const padded = (usda, bytes) => `${usda}\n#${" ".repeat(bytes - usda.length - 2)}`;
	const files = {
		[`${H}pkg/usd/root.usda`]: padded(sublayers("./part.usda", "../../shared/mat.usda"), 200),
		[`${H}pkg/usd/part.usda`]: padded(`#usda 1.0\n${QUAD}`, 300),
		[`${H}pkg/usd/unused1.usda`]: padded("#usda 1.0", 700),
		[`${H}pkg/usd/unused2.usda`]: padded("#usda 1.0", 700),
		[`${H}shared/mat.usda`]: padded(`#usda 1.0\n${QUAD.replace('"M"', '"Mat"')}`, 500),
	};
	const listed = ["root", "part", "unused1", "unused2"].map((name) => `${H}pkg/usd/${name}.usda`);
	// Streams each body in 100-byte chunks; the layer outside the folder arrives once the preloads are charged.
	const fetchBytes = async (url, budget) => {
		if (url.endsWith("mat.usda")) await new Promise((resolve) => setTimeout(resolve, 50));
		const body = new TextEncoder().encode(files[url]);
		for (let i = 0; i < body.length; i += 100) {
			budget(Math.min(100, body.length - i));
			await new Promise((resolve) => setTimeout(resolve));
		}
		return body;
	};
	const { scene, stats } = await composeStage({
		UsdLoader,
		fetchBytes,
		rootUrl: listed[0],
		maxLayerBytes: 2000,
		preload: Promise.resolve({ layers: listed.map((url) => ({ url, size: files[url].length })), eager: true }),
	});
	scene.free();
	assert.deepEqual([stats.layers, stats.layerBytes, stats.warnings], [3, 1000, []]);
});

test("pinHubRevision pins a Hub root to the commit its branch points at", async () => {
	const SHA = "a".repeat(40);
	const requested = [];
	const request = async (url) => {
		requested.push(url);
		return url.includes("/revision/main") ? Response.json({ sha: SHA }) : new Response(null, { status: 404 });
	};
	const root = "https://huggingface.co/datasets/nvidia/simready-assets/resolve/main/chair/simready_usd/sm_chair.usd";
	assert.equal(await pinHubRevision(root, request), root.replace("/main/", `/${SHA}/`));
	assert.deepEqual(requested, [
		"https://huggingface.co/api/datasets/nvidia/simready-assets/revision/main?expand%5B%5D=sha",
	]);
	// Already a commit, or not on the Hub: no request, URL unchanged.
	const pinned = root.replace("/main/", `/${SHA}/`);
	assert.equal(await pinHubRevision(pinned, request), pinned);
	assert.equal(await pinHubRevision("https://example.com/a.usd", request), "https://example.com/a.usd");
	assert.equal(requested.length, 1);
	// A failed lookup leaves the URL as it was.
	const branch = root.replace("/main/", "/dev/");
	assert.equal(await pinHubRevision(branch, request), branch);
});

test("hubPackageLayers lists the SimReady package of a Hub root, and nothing for other URLs", async () => {
	const requests = [];
	const tree = [
		{ type: "file", path: "pkg/com.nvidia.simready.packaging.json", size: 10 },
		{ type: "directory", path: "pkg/usd", size: 0 },
		{ type: "file", path: "pkg/usd/root.usd", size: 10 },
		{ type: "file", path: "pkg/usd/parts/a b.usdc", size: 10 },
		{ type: "file", path: "pkg/materials/m.usda", size: 10 },
		{ type: "file", path: "pkg/textures/t.png", size: 10 },
		{ type: "file", path: "pkg/huge.usd", size: 2 ** 30 },
	];
	const request = async (url) => (requests.push(url), Response.json(tree));
	const { layers, eager } = await hubPackageLayers(
		"https://huggingface.co/datasets/o/r/resolve/main/pkg/usd/root.usd?download=true",
		request,
	);
	assert.deepEqual(requests, ["https://huggingface.co/api/datasets/o/r/tree/main/pkg?recursive=true"]);
	assert.equal(eager, true);
	assert.deepEqual(
		layers.map((l) => l.url),
		[
			"https://huggingface.co/datasets/o/r/resolve/main/pkg/usd/root.usd",
			"https://huggingface.co/datasets/o/r/resolve/main/pkg/usd/parts/a%20b.usdc",
			"https://huggingface.co/datasets/o/r/resolve/main/pkg/materials/m.usda",
		],
	);
	// Without a manifest, only the root's own directory.
	const bare = await hubPackageLayers(
		"https://huggingface.co/o/r/resolve/main/pkg/usd/root.usd",
		async (url) => (requests.push(url), Response.json(tree.slice(1))),
	);
	assert.equal(requests.at(-1), "https://huggingface.co/api/models/o/r/tree/main/pkg?recursive=true");
	assert.equal(bare.eager, false);
	assert.deepEqual(
		bare.layers.map((l) => l.url),
		[
			"https://huggingface.co/o/r/resolve/main/pkg/usd/root.usd",
			"https://huggingface.co/o/r/resolve/main/pkg/usd/parts/a%20b.usdc",
		],
	);
	const none = { layers: [], eager: false };
	assert.deepEqual(
		await hubPackageLayers("https://example.com/datasets/o/r/resolve/main/pkg/usd/root.usd", request),
		none,
	);
	assert.deepEqual(await hubPackageLayers("https://huggingface.co/datasets/o/r/resolve/main/x.usd", request), none);
	assert.equal(requests.length, 2);
	assert.deepEqual(
		await hubPackageLayers(
			"https://huggingface.co/datasets/o/r/resolve/main/pkg/x.usd",
			async () => new Response(null, { status: 401 }),
		),
		none,
	);
});

test("limits: requests in flight, layer files and bytes, drawn triangles and instances", async () => {
	const layers = Object.fromEntries(
		Array.from({ length: 40 }, (_, i) => [`l${i}.usda`, `#usda 1.0\ndef Xform "X${i}" {}`]),
	);
	const many = `(subLayers = [${Object.keys(layers).map((name) => `@./${name}@`)}])`;
	// subset-amp.usda, smaller: a 66-gon (64 triangles) its subset names 100 times.
	const n = 66;
	const points = Array.from(
		{ length: n },
		(_, i) => `(${Math.cos((i / n) * 6.283).toFixed(3)}, ${Math.sin((i / n) * 6.283).toFixed(3)}, 0)`,
	);
	const amp = `def Mesh "Amp" {
  int[] faceVertexCounts = [${n}]
  int[] faceVertexIndices = [${points.map((_, i) => i)}]
  point3f[] points = [${points}]
  def GeomSubset "S" {
    uniform token elementType = "face"
    uniform token familyName = "materialBind"
    int[] indices = [${Array.from({ length: 100 }, () => 0)}]
  }
}`;
	const instancer = (count) => `def PointInstancer "PI" {
  rel prototypes = [</PI/P/M>]
  int[] protoIndices = [${Array.from({ length: count }, () => 0)}]
  point3f[] positions = [${Array.from({ length: count }, (_, i) => `(${i}, 0, 0)`)}]
  def Scope "P" {
    ${QUAD}
  }
}`;
	// [what, root layer, other layers, preloaded layers, options, expected]: an `error` the load fails with (after at most
	// `requests` requests), or exactly `requests` requests, at most `inFlight` at once, `triangles` drawn, the `warnings`, and
	// at most `unusedRead` bytes of unused.usda read.
	const cases = [
		[
			"layer requests in flight stay within maxConcurrentFetches",
			many,
			layers,
			[],
			{ maxConcurrentFetches: 4 },
			{ requests: 41, inFlight: 4 },
		],
		[
			"layers past maxLayerBytes fail the load",
			many,
			layers,
			[],
			{ maxLayerBytes: 600 },
			{ error: /resource limit exceeded/ },
		],
		[
			"layers past maxLayers fail the load before they are requested",
			many,
			layers,
			[],
			{ maxLayers: 20 },
			{ error: /more than maxLayers \(20\)/, requests: 20 },
		],
		["as many layers as maxLayers load", many, layers, [], { maxLayers: 41 }, { requests: 41 }],
		[
			"meshes past maxTriangles are left out unread",
			`${["A", "B", "C"].map((name) => QUAD.replace('"M"', `"${name}"`)).join("\n")}`,
			{},
			[],
			{ maxTriangles: 5 },
			{ triangles: 4, warnings: [["triangle-limit", "/C"]] },
		],
		[
			"a face a subset names again is drawn once; the budget stops at zero",
			`${amp}\n${QUAD}`,
			{},
			[],
			{ maxTriangles: 65 },
			{ triangles: 64, warnings: [["triangle-limit", "/M"]] },
		],
		[
			"implicit shapes count",
			'def Cube "C" {}\ndef Sphere "S" {}',
			{},
			[],
			{ maxTriangles: 20 },
			{ triangles: 12, warnings: [["triangle-limit", "/S"]] },
		],
		[
			"placements past maxInstances",
			instancer(50),
			{},
			[],
			{ maxInstances: 10 },
			{ triangles: 20, warnings: [["instance-limit", "/PI"]] },
		],
		[
			"triangles count once per instance",
			instancer(10),
			{},
			[],
			{ maxTriangles: 19 },
			{
				triangles: 0,
				warnings: [
					["triangle-limit", "/PI/P/M"],
					["nothing-drawable", undefined],
				],
			},
		],
		[
			"an unused preload is charged as it streams",
			"(subLayers = [@./a.usda@])",
			{ "a.usda": `#usda 1.0\n${QUAD}`, "unused.usda": `#usda 1.0\n${" ".repeat(5000)}` },
			["a.usda", "unused.usda"],
			{ maxLayerBytes: 2000 },
			{ triangles: 2, warnings: [], unusedRead: 2000 },
		],
	];
	for (const [what, root, others, preloads, options, expected] of cases) {
		const files = { "https://h/root.usda": `#usda 1.0\n${root}` };
		for (const [name, body] of Object.entries(others)) files[`https://h/${name}`] = body;
		let [requests, inFlight, maxInFlight, unusedRead] = [0, 0, 0, 0];
		// Streams each body in 100-byte chunks; the root arrives last, so preloads stream first.
		const fetchBytes = async (url, budget) => {
			requests++;
			maxInFlight = Math.max(maxInFlight, ++inFlight);
			try {
				if (url.endsWith("root.usda") && preloads.length) await new Promise((resolve) => setTimeout(resolve, 100));
				const body = new TextEncoder().encode(files[url]);
				for (let i = 0; i < body.length; i += 100) {
					budget(Math.min(100, body.length - i));
					if (url.endsWith("unused.usda")) unusedRead += Math.min(100, body.length - i);
					await new Promise((resolve) => setTimeout(resolve));
				}
				return body;
			} finally {
				inFlight--;
			}
		};
		const preload = Promise.resolve({
			layers: preloads.map((name) => ({ url: `https://h/${name}`, size: 10 })),
			eager: true,
		});
		const loading = composeStage({ UsdLoader, fetchBytes, rootUrl: "https://h/root.usda", preload, ...options });
		if (expected.error) {
			await assert.rejects(loading, expected.error, what);
			assert.ok(requests <= (expected.requests ?? Infinity), `${what}: ${requests} requests`);
			continue;
		}
		const { scene, meta } = await loading;
		const counts = new Map();
		for (const { geometry } of meta.instances) counts.set(geometry, (counts.get(geometry) ?? 0) + 1);
		let drawn = 0;
		const limits = readGeometries(
			scene,
			meta,
			(i, g, a) => (drawn += a ? (counts.get(i) * a.indices.length) / 3 : 0),
			options,
		);
		scene.free();
		if ("requests" in expected) assert.equal(requests, expected.requests, what);
		if ("inFlight" in expected) assert.equal(maxInFlight, expected.inFlight, what);
		if ("triangles" in expected) assert.equal(drawn, expected.triangles, what);
		if ("warnings" in expected)
			assert.deepEqual(
				[...meta.warnings, ...limits].map((w) => [w.code, w.path]),
				expected.warnings,
				what,
			);
		assert.ok(unusedRead <= (expected.unusedRead ?? Infinity), `${what}: ${unusedRead} bytes read`);
	}
});
