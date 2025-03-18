/**
 * See the registered mapping of HF model ID => Fal model ID here:
 *
 * https://huggingface.co/api/partners/fal-ai/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Fal and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Fal, please open an issue on the present repo
 * and we will tag Fal team members.
 *
 * Thanks!
 */
import { InferenceOutputError } from "../lib/InferenceOutputError";
import { isUrl } from "../lib/isUrl";
import type { BodyParams, HeaderParams, InferenceTask, ProviderConfig, UrlParams } from "../types";
import { delay } from "../utils/delay";

const FAL_AI_API_BASE_URL = "https://fal.run";
const FAL_AI_API_BASE_URL_QUEUE = "https://queue.fal.run";

const makeBaseUrl = (task?: InferenceTask): string => {
	return task === "text-to-video" ? FAL_AI_API_BASE_URL_QUEUE : FAL_AI_API_BASE_URL;
};

const makeBody = (params: BodyParams): Record<string, unknown> => {
	return params.args;
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	return {
		Authorization: params.authMethod === "provider-key" ? `Key ${params.accessToken}` : `Bearer ${params.accessToken}`,
	};
};

const makeUrl = (params: UrlParams): string => {
	const baseUrl = `${params.baseUrl}/${params.model}`;
	if (params.authMethod !== "provider-key" && params.task === "text-to-video") {
		return `${baseUrl}?_subdomain=queue`;
	}
	return baseUrl;
};

export const FAL_AI_CONFIG: ProviderConfig = {
	makeBaseUrl,
	makeBody,
	makeHeaders,
	makeUrl,
};

export interface FalAiOutput {
	request_id: string;
	status: string;
}

export async function pollFalResponse(res: FalAiOutput, url: string, headers: Record<string, string>): Promise<Blob> {
	const requestId = res.request_id;
	if (!requestId) {
		throw new InferenceOutputError("No request ID found in the response");
	}
	let status = res.status;

	const parsedUrl = new URL(url);
	const baseRequestUrl = `${parsedUrl.origin}${parsedUrl.pathname}/requests/${requestId}`;

	const statusUrl = `${baseRequestUrl}/status${parsedUrl.search}`;
	const resultUrl = `${baseRequestUrl}${parsedUrl.search}`;

	while (status !== "COMPLETED") {
		await delay(1000);
		const statusResponse = await fetch(statusUrl, { headers: headers });

		if (!statusResponse.ok) {
			throw new InferenceOutputError(`HTTP error! status: ${statusResponse.status}`);
		}
		try {
			status = (await statusResponse.json()).status;
		} catch (error) {
			throw error;
		}
	}

	const resultResponse = await fetch(resultUrl, { headers: headers });
	let result;
	try {
		result = await resultResponse.json();
	} catch (error) {
		throw error;
	}
	const isValidOutput =
		typeof result === "object" &&
		!!result &&
		"video" in result &&
		typeof result.video === "object" &&
		!!result.video &&
		"url" in result.video &&
		typeof result.video.url === "string" &&
		isUrl(result.video.url);
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected { video: { url: string } }");
	}
	const urlResponse = await fetch(result.video.url);
	return await urlResponse.blob();
}
