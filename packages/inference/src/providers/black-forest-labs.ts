/**
 * See the registered mapping of HF model ID => Black Forest Labs model ID here:
 *
 * https://huggingface.co/api/partners/blackforestlabs/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Black Forest Labs and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Black Forest Labs, please open an issue on the present repo
 * and we will tag Black Forest Labs team members.
 *
 * Thanks!
 */
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams, HeaderParams, UrlParams } from "../types";
import { delay } from "../utils/delay";
import { omit } from "../utils/omit";
import { TaskProviderHelper } from "./providerHelper";

const BLACK_FOREST_LABS_AI_API_BASE_URL = "https://api.us1.bfl.ai";

export class BlackForestLabsTextToImageTask extends TaskProviderHelper {
	constructor() {
		super("black-forest-labs", BLACK_FOREST_LABS_AI_API_BASE_URL, "text-to-image");
	}

	override makeBody(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			prompt: params.args.inputs,
		};
	}

	override prepareHeaders(params: HeaderParams): Record<string, string> {
		if (params.authMethod !== "provider-key") {
			return { Authorization: `Bearer ${params.accessToken}` };
		} else {
			return { "X-Key": `${params.accessToken}` };
		}
	}

	override makeRoute(params?: UrlParams): string {
		if (!params) {
			throw new Error("Params are required");
		}
		return `/v1/${params.model}`;
	}

	async getResponse(
		res: Response,
		url?: string,
		headers?: Record<string, string>,
		outputType?: "url" | "blob"
	): Promise<string | Blob> {
		const urlObj = new URL(res.url);
		for (let step = 0; step < 5; step++) {
			await delay(1000);
			console.debug(`Polling Black Forest Labs API for the result... ${step + 1}/5`);
			urlObj.searchParams.set("attempt", step.toString(10));
			const resp = await fetch(urlObj, { headers: { "Content-Type": "application/json" } });
			if (!resp.ok) {
				throw new InferenceOutputError("Failed to fetch result from black forest labs API");
			}
			const payload = await resp.json();
			if (
				typeof payload === "object" &&
				payload &&
				"status" in payload &&
				typeof payload.status === "string" &&
				payload.status === "Ready" &&
				"result" in payload &&
				typeof payload.result === "object" &&
				payload.result &&
				"sample" in payload.result &&
				typeof payload.result.sample === "string"
			) {
				if (outputType === "url") {
					return payload.result.sample;
				}
				const image = await fetch(payload.result.sample);
				return await image.blob();
			}
		}
		throw new InferenceOutputError("Failed to fetch result from black forest labs API");
	}
}
