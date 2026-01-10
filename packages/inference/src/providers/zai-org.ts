/**
 * See the registered mapping of HF model ID => ZAI model ID here:
 *
 * https://huggingface.co/api/partners/zai-org/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at zai and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to zai, please open an issue on the present repo
 * and we will tag zai team members.
 *
 * Thanks!
 */
import { InferenceClientProviderApiError, InferenceClientProviderOutputError } from "../errors.js";
import { getLogger } from "../lib/logger.js";
import type { BodyParams, HeaderParams, UrlParams } from "../types.js";
import { delay } from "../utils/delay.js";
import { omit } from "../utils/omit.js";
import { BaseConversationalTask, TaskProviderHelper, type TextToImageTaskHelper } from "./providerHelper.js";

const ZAI_API_BASE_URL = "https://api.z.ai";

export class ZaiConversationalTask extends BaseConversationalTask {
	constructor() {
		super("zai-org", ZAI_API_BASE_URL);
	}

	override prepareHeaders(params: HeaderParams, binary: boolean): Record<string, string> {
		const headers = super.prepareHeaders(params, binary);
		headers["x-source-channel"] = "hugging_face";
		headers["accept-language"] = "en-US,en";
		return headers;
	}

	override makeRoute(): string {
		return "/api/paas/v4/chat/completions";
	}
}

interface ZaiTextToImageResponse {
	model: string;
	id: string;
	request_id: string;
	task_status: "PROCESSING" | "SUCCESS" | "FAIL";
}

interface ZaiAsyncResultResponse {
	image_result?: Array<{ url: string }>;
	model: string;
	id: string;
	request_id: string;
	task_status: "PROCESSING" | "SUCCESS" | "FAIL";
}

const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 2000;

export class ZaiTextToImageTask extends TaskProviderHelper implements TextToImageTaskHelper {
	constructor() {
		super("zai-org", ZAI_API_BASE_URL);
	}

	override prepareHeaders(params: HeaderParams, binary: boolean): Record<string, string> {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${params.accessToken}`,
			"x-source-channel": "hugging_face",
			"accept-language": "en-US,en",
		};
		if (!binary) {
			headers["Content-Type"] = "application/json";
		}
		return headers;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	makeRoute(_params: UrlParams): string {
		return "/api/paas/v4/async/images/generations";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			...(params.args.parameters as Record<string, unknown>),
			model: params.model,
			prompt: params.args.inputs,
		};
	}

	async getResponse(
		response: ZaiTextToImageResponse,
		url?: string,
		headers?: HeadersInit,
		outputType?: "url" | "blob" | "json"
	): Promise<string | Blob | Record<string, unknown>> {
		const logger = getLogger();

		if (response.task_status === "FAIL") {
			throw new InferenceClientProviderOutputError("ZAI API returned task status: FAIL");
		}

		const taskId = response.id;
		const pollUrl = `${ZAI_API_BASE_URL}/api/paas/v4/async-result/${taskId}`;

		const pollHeaders: Record<string, string> = {
			"Accept-Language": "en-US,en",
		};
		if (headers && typeof headers === "object") {
			const h = headers as Record<string, string>;
			if (h["Authorization"]) {
				pollHeaders["Authorization"] = h["Authorization"];
			}
		}

		for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
			await delay(POLL_INTERVAL_MS);
			logger.debug(`Polling ZAI API for the result... ${attempt + 1}/${MAX_POLL_ATTEMPTS}`);

			const resp = await fetch(pollUrl, {
				method: "GET",
				headers: pollHeaders,
			});

			if (!resp.ok) {
				throw new InferenceClientProviderApiError(
					`Failed to fetch result from ZAI API: ${resp.status}`,
					{ url: pollUrl, method: "GET", headers: pollHeaders },
					{ requestId: resp.headers.get("X-LOG-ID") ?? "", status: resp.status, body: await resp.text() }
				);
			}

			const result: ZaiAsyncResultResponse = await resp.json();

			if (result.task_status === "FAIL") {
				throw new InferenceClientProviderOutputError("ZAI API task failed");
			}

			if (result.task_status === "SUCCESS") {
				if (!result.image_result || result.image_result.length === 0) {
					throw new InferenceClientProviderOutputError("ZAI API returned no image results");
				}

				const imageUrl = result.image_result[0].url;

				if (outputType === "json") {
					return { ...result };
				}
				if (outputType === "url") {
					return imageUrl;
				}

				const imageResponse = await fetch(imageUrl);
				return await imageResponse.blob();
			}
		}

		throw new InferenceClientProviderOutputError(
			`Timed out while waiting for the result from ZAI API - aborting after ${MAX_POLL_ATTEMPTS} attempts`
		);
	}
}
