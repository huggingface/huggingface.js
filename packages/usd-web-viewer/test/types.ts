// Type-level checks of the public typings.
// usage: npm run check
import { UsdLoadError, loadUsd } from "../src/index.js";

const error = new UsdLoadError("fetch", "missing", { url: "https://example.test/root.usda", status: 404 });
const code: "aborted" | "fetch" | "compose" | "worker" | "webgl" = error.code;

const result = await loadUsd("https://example.test/root.usda", {
	maxConcurrentFetches: 4,
	maxLayers: 64,
	maxTriangles: 1e6,
	maxInstances: 1000,
	maxTextureBytes: 64 * 2 ** 20,
});
const upAxis: string = result.info.upAxis;

await loadUsd("https://example.test/root.usda", {
	onProgress: (p) => void (p.fraction + (p.stage === "compose" ? p.round : p.loaded)),
});

// @ts-expect-error a custom fetch is no longer an option
await loadUsd("https://example.test/root.usda", { fetch: globalThis.fetch });
// @ts-expect-error requests carry no custom headers
await loadUsd("https://example.test/root.usda", { headers: { Authorization: "Bearer token" } });

void code;
void upAxis;
