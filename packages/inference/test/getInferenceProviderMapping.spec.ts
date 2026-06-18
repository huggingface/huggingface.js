import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getInferenceProviderMapping, inferenceProviderMappingCache } from "../src/lib/getInferenceProviderMapping.js";
import type { InferenceProviderMappingEntry } from "../src/types.js";

/**
 * Offline tests for getInferenceProviderMapping. We seed inferenceProviderMappingCache directly
 * so no network call to the Hub is made.
 */

const MODEL = "black-forest-labs/FLUX.2-klein-4B";

function seed(entries: InferenceProviderMappingEntry[]): void {
	inferenceProviderMappingCache.set(MODEL, entries);
}

describe("getInferenceProviderMapping - model mapped to one provider for multiple tasks", () => {
	beforeEach(() => {
		inferenceProviderMappingCache.clear();
	});
	afterEach(() => {
		inferenceProviderMappingCache.clear();
	});

	it("resolves each task to its own mapping", async () => {
		seed([
			{ provider: "together", hfModelId: MODEL, providerId: "flux2-t2i", status: "live", task: "text-to-image" },
			{ provider: "together", hfModelId: MODEL, providerId: "flux2-i2i", status: "live", task: "image-to-image" },
		]);

		const t2i = await getInferenceProviderMapping({ modelId: MODEL, provider: "together", task: "text-to-image" }, {});
		expect(t2i?.providerId).toBe("flux2-t2i");

		// Regression: previously this threw because `.find` returned the first (text-to-image)
		// mapping for the provider and then rejected it for not matching the requested task.
		const i2i = await getInferenceProviderMapping({ modelId: MODEL, provider: "together", task: "image-to-image" }, {});
		expect(i2i?.providerId).toBe("flux2-i2i");
	});

	it("resolves regardless of the order the mappings are returned in", async () => {
		seed([
			{ provider: "together", hfModelId: MODEL, providerId: "flux2-i2i", status: "live", task: "image-to-image" },
			{ provider: "together", hfModelId: MODEL, providerId: "flux2-t2i", status: "live", task: "text-to-image" },
		]);

		const t2i = await getInferenceProviderMapping({ modelId: MODEL, provider: "together", task: "text-to-image" }, {});
		expect(t2i?.providerId).toBe("flux2-t2i");
	});

	it("throws a helpful error listing all supported tasks when the requested task is unsupported", async () => {
		seed([
			{ provider: "together", hfModelId: MODEL, providerId: "flux2-t2i", status: "live", task: "text-to-image" },
			{ provider: "together", hfModelId: MODEL, providerId: "flux2-i2i", status: "live", task: "image-to-image" },
		]);

		await expect(
			getInferenceProviderMapping({ modelId: MODEL, provider: "together", task: "text-to-speech" }, {}),
		).rejects.toThrow(/not supported for task text-to-speech.*Supported tasks: text-to-image, image-to-image/);
	});

	it("still returns the single mapping for the common one-task case", async () => {
		seed([{ provider: "together", hfModelId: MODEL, providerId: "flux2-t2i", status: "live", task: "text-to-image" }]);

		const res = await getInferenceProviderMapping({ modelId: MODEL, provider: "together", task: "text-to-image" }, {});
		expect(res?.providerId).toBe("flux2-t2i");
	});
});
