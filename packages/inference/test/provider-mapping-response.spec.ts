import { afterEach, describe, expect, it } from "vitest";
import { InferenceClientHubApiError } from "../src/errors.js";
import {
	fetchInferenceProviderMappingForModel,
	inferenceProviderMappingCache,
} from "../src/lib/getInferenceProviderMapping.js";

const respondWith =
	(status: number, body: string, contentType = "application/json") =>
	() =>
		Promise.resolve(new Response(body, { status, headers: { "Content-Type": contentType } }));

describe("fetchInferenceProviderMappingForModel response handling", () => {
	afterEach(() => {
		inferenceProviderMappingCache.clear();
	});

	it.each([
		["200 without a mapping", 200, '{"id":"m"}', "application/json", /not been able to find/, { id: "m" }],
		["200 with null", 200, "null", "application/json", /not been able to find/, "null"],
		["200 with invalid JSON", 200, "<html>", "text/html", /invalid JSON/, "<html>"],
		[
			"404 JSON without an error string",
			404,
			'{"message":"nope"}',
			"application/json",
			/model m$/,
			{ message: "nope" },
		],
		[
			"404 JSON with an error string",
			404,
			'{"error":"Repository not found"}',
			"application/json",
			/: Repository not found$/,
			{ error: "Repository not found" },
		],
		["404 JSON with invalid JSON", 404, "{", "application/json", /model m$/, "{"],
		["500 plain text", 500, "Internal Error", "text/plain", /model m$/, "Internal Error"],
		[
			"500 JSON with a mapping",
			500,
			'{"inferenceProviderMapping":[]}',
			"application/json",
			/model m$/,
			{ inferenceProviderMapping: [] },
		],
	])("throws InferenceClientHubApiError for %s", async (_, status, body, contentType, message, responseBody) => {
		const error = await fetchInferenceProviderMappingForModel("m", undefined, {
			fetch: respondWith(status, body, contentType),
		}).catch((e) => e);

		expect(error).toBeInstanceOf(InferenceClientHubApiError);
		expect(error.message).toMatch(message);
		expect(error.httpResponse).toMatchObject({ status, body: responseBody });
	});

	it("returns the mapping for a valid response", async () => {
		const body = JSON.stringify({
			inferenceProviderMapping: { "hf-inference": { providerId: "m", status: "live", task: "text-classification" } },
		});

		const mapping = await fetchInferenceProviderMappingForModel("m", undefined, { fetch: respondWith(200, body) });

		expect(mapping).toEqual([
			{ provider: "hf-inference", hfModelId: "m", providerId: "m", status: "live", task: "text-classification" },
		]);
	});
});
