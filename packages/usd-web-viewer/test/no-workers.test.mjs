// Where there are no Web Workers (on a server), loads fail cleanly.
import { test } from "vitest";
import assert from "node:assert/strict";

test("loadUsd without Web Workers rejects with a worker UsdLoadError", async () => {
	const { loadUsd } = await import("../src/index.ts");
	await assert.rejects(loadUsd("https://example.test/a.usda"), { name: "UsdLoadError", code: "worker" });
});
