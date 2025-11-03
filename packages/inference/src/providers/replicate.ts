/**
 * See the registered mapping of HF model ID => Replicate model ID here:
 *
 * https://huggingface.co/api/partners/replicate/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at Replicate and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to Replicate, please open an issue on the present repo
 * and we will tag Replicate team members.
 *
 * Thanks!
 */
import { InferenceClientProviderOutputError } from "../errors.js";
import { isUrl } from "../lib/isUrl.js";
import type { BodyParams, HeaderParams, RequestArgs, UrlParams } from "../types.js";
import { omit } from "../utils/omit.js";
import {
	TaskProviderHelper,
	type AutomaticSpeechRecognitionTaskHelper,
	type ImageToImageTaskHelper,
	type TextToImageTaskHelper,
	type TextToVideoTaskHelper,
} from "./providerHelper.js";
import type { ImageToImageArgs } from "../tasks/cv/imageToImage.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";
import type { AutomaticSpeechRecognitionOutput } from "@huggingface/tasks";
import { base64FromBytes } from "../utils/base64FromBytes.js";
export interface ReplicateOutput {
	output?: string | string[];
}

type ReplicatePredictionStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled" | "queued";

interface ReplicateAsyncResponse extends ReplicateOutput {
	id?: string;
	status?: ReplicatePredictionStatus;
	error?: unknown;
	urls?: {
		get?: string;
	};
}

const POLLING_INTERVAL_MS = 1_000;

function headersInitToRecord(headers?: HeadersInit): Record<string, string> {
	if (!headers) {
		return {};
	}
	if (headers instanceof Headers) {
		return Object.fromEntries(headers.entries());
	}
	if (Array.isArray(headers)) {
		return Object.fromEntries(headers);
	}
	return { ...headers };
}

function getErrorMessage(error: unknown): string | undefined {
	if (!error) {
		return undefined;
	}
	if (typeof error === "string") {
		return error;
	}
	if (typeof error === "object" && "message" in error && typeof error.message === "string") {
		return error.message;
	}
	return undefined;
}

async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

abstract class ReplicateTask extends TaskProviderHelper {
	constructor(url?: string) {
		super("replicate", url || "https://api.replicate.com");
	}

	makeRoute(params: UrlParams): string {
		if (params.model.includes(":")) {
			return "v1/predictions";
		}
		return `v1/models/${params.model}/predictions`;
	}
	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			input: {
				...omit(params.args, ["inputs", "parameters"]),
				...(params.args.parameters as Record<string, unknown>),
				prompt: params.args.inputs,
			},
			version: params.model.includes(":") ? params.model.split(":")[1] : undefined,
		};
	}
	override prepareHeaders(params: HeaderParams, binary: boolean): Record<string, string> {
		const headers: Record<string, string> = { Authorization: `Bearer ${params.accessToken}`, Prefer: "wait" };
		if (!binary) {
			headers["Content-Type"] = "application/json";
		}
		return headers;
	}

	override makeUrl(params: UrlParams): string {
		const baseUrl = this.makeBaseUrl(params);
		if (params.model.includes(":")) {
			return `${baseUrl}/v1/predictions`;
		}
		return `${baseUrl}/v1/models/${params.model}/predictions`;
	}

	protected async ensureFinalResponse(
		response: ReplicateOutput | Blob | ReplicateAsyncResponse,
		requestUrl?: string,
		headers?: HeadersInit
	): Promise<ReplicateOutput | Blob> {
		if (response instanceof Blob) {
			return response;
		}

		if (!response || typeof response !== "object") {
			return response as ReplicateOutput;
		}

		const status = "status" in response ? response.status : undefined;

		if (!status || status === "succeeded") {
			return response as ReplicateOutput;
		}

		if (status === "failed" || status === "canceled") {
			const message = getErrorMessage((response as ReplicateAsyncResponse).error);
			throw new InferenceClientProviderOutputError(`Replicate prediction ${status}${message ? `: ${message}` : ""}`);
		}

		const pollUrl = this.getPollUrl(response as ReplicateAsyncResponse, requestUrl);
		if (!pollUrl) {
			throw new InferenceClientProviderOutputError(
				"Received incomplete response from Replicate API: missing polling URL"
			);
		}

		const headerRecord = headersInitToRecord(headers);
		const pollHeaders: Record<string, string> = {};
		if (headerRecord.Authorization) {
			pollHeaders.Authorization = headerRecord.Authorization;
		}
		pollHeaders.Accept = "application/json";

		// Poll the prediction endpoint until completion
		while (true) {
			await sleep(POLLING_INTERVAL_MS);
			const pollResponse = await fetch(pollUrl, {
				method: "GET",
				headers: pollHeaders,
			});

			if (!pollResponse.ok) {
				throw new InferenceClientProviderOutputError(
					`Failed to poll Replicate prediction status: HTTP ${pollResponse.status}`
				);
			}

			const prediction = (await pollResponse.json()) as ReplicateAsyncResponse;
			const predictionStatus = prediction.status;

			if (!predictionStatus || predictionStatus === "succeeded") {
				return prediction as ReplicateOutput;
			}

			if (predictionStatus === "failed" || predictionStatus === "canceled") {
				const message = getErrorMessage(prediction.error);
				throw new InferenceClientProviderOutputError(
					`Replicate prediction ${predictionStatus}${message ? `: ${message}` : ""}`
				);
			}
		}
	}

	private getPollUrl(response: ReplicateAsyncResponse, requestUrl?: string): string | undefined {
		if (response.urls && typeof response.urls === "object" && typeof response.urls.get === "string") {
			return response.urls.get;
		}

		if (!response.id || !requestUrl) {
			return undefined;
		}

		try {
			const url = new URL(requestUrl);
			const pathname = url.pathname.replace(/\/$/, "");
			if (pathname.endsWith("/predictions")) {
				url.pathname = `${pathname}/${response.id}`;
				return url.toString();
			}
		} catch {
			return undefined;
		}

		return undefined;
	}
}

export class ReplicateTextToImageTask extends ReplicateTask implements TextToImageTaskHelper {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			input: {
				...omit(params.args, ["inputs", "parameters"]),
				...(params.args.parameters as Record<string, unknown>),
				prompt: params.args.inputs,
				lora_weights:
					params.mapping?.adapter === "lora" && params.mapping.adapterWeightsPath
						? `https://huggingface.co/${params.mapping.hfModelId}`
						: undefined,
			},
			version: params.model.includes(":") ? params.model.split(":")[1] : undefined,
		};
	}

	override async getResponse(
		res: ReplicateOutput | Blob,
		url?: string,
		headers?: Record<string, string>,
		outputType?: "url" | "blob" | "json"
	): Promise<string | Blob | Record<string, unknown>> {
		void url;
		const finalResponse = (await this.ensureFinalResponse(res, url, headers)) as ReplicateOutput;

		if (
			typeof finalResponse === "object" &&
			"output" in finalResponse &&
			Array.isArray(finalResponse.output) &&
			finalResponse.output.length > 0 &&
			typeof finalResponse.output[0] === "string"
		) {
			if (outputType === "json") {
				return { ...finalResponse };
			}
			if (outputType === "url") {
				return finalResponse.output[0];
			}
			const urlResponse = await fetch(finalResponse.output[0]);
			return await urlResponse.blob();
		}

		throw new InferenceClientProviderOutputError("Received malformed response from Replicate text-to-image API");
	}
}

export class ReplicateTextToSpeechTask extends ReplicateTask {
	override preparePayload(params: BodyParams): Record<string, unknown> {
		const payload = super.preparePayload(params);

		const input = payload["input"];
		if (typeof input === "object" && input !== null && "prompt" in input) {
			const inputObj = input as Record<string, unknown>;
			inputObj["text"] = inputObj["prompt"];
			delete inputObj["prompt"];
		}

		return payload;
	}

	override async getResponse(response: ReplicateOutput | Blob, url?: string, headers?: HeadersInit): Promise<Blob> {
		const finalResponse = (await this.ensureFinalResponse(response, url, headers)) as ReplicateOutput | Blob;

		if (finalResponse instanceof Blob) {
			return finalResponse;
		}
		if (finalResponse && typeof finalResponse === "object") {
			if ("output" in finalResponse) {
				if (typeof finalResponse.output === "string") {
					const urlResponse = await fetch(finalResponse.output);
					return await urlResponse.blob();
				} else if (Array.isArray(finalResponse.output)) {
					const urlResponse = await fetch(finalResponse.output[0]);
					return await urlResponse.blob();
				}
			}
		}
		throw new InferenceClientProviderOutputError("Received malformed response from Replicate text-to-speech API");
	}
}

export class ReplicateTextToVideoTask extends ReplicateTask implements TextToVideoTaskHelper {
	override async getResponse(response: ReplicateOutput | Blob, url?: string, headers?: HeadersInit): Promise<Blob> {
		const finalResponse = (await this.ensureFinalResponse(response, url, headers)) as ReplicateOutput;
		if (
			typeof finalResponse === "object" &&
			!!finalResponse &&
			"output" in finalResponse &&
			typeof finalResponse.output === "string" &&
			isUrl(finalResponse.output)
		) {
			const urlResponse = await fetch(finalResponse.output);
			return await urlResponse.blob();
		}

		throw new InferenceClientProviderOutputError("Received malformed response from Replicate text-to-video API");
	}
}

export class ReplicateAutomaticSpeechRecognitionTask
	extends ReplicateTask
	implements AutomaticSpeechRecognitionTaskHelper
{
	override preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			input: {
				...omit(params.args, ["inputs", "parameters"]),
				...(params.args.parameters as Record<string, unknown>),
				audio: params.args.inputs, // This will be processed in preparePayloadAsync
			},
			version: params.model.includes(":") ? params.model.split(":")[1] : undefined,
		};
	}

	async preparePayloadAsync(args: AutomaticSpeechRecognitionArgs): Promise<RequestArgs> {
		const blob = "data" in args && args.data instanceof Blob ? args.data : "inputs" in args ? args.inputs : undefined;

		if (!blob || !(blob instanceof Blob)) {
			throw new Error("Audio input must be a Blob");
		}

		// Convert Blob to base64 data URL
		const bytes = new Uint8Array(await blob.arrayBuffer());
		const base64 = base64FromBytes(bytes);
		const audioInput = `data:${blob.type || "audio/wav"};base64,${base64}`;

		return {
			...("data" in args ? omit(args, "data") : omit(args, "inputs")),
			inputs: audioInput,
		};
	}

	override async getResponse(
		response: ReplicateOutput | Blob,
		url?: string,
		headers?: HeadersInit
	): Promise<AutomaticSpeechRecognitionOutput> {
		const finalResponse = (await this.ensureFinalResponse(response, url, headers)) as ReplicateOutput;
		if (typeof finalResponse?.output === "string") return { text: finalResponse.output };
		if (Array.isArray(finalResponse?.output) && typeof finalResponse.output[0] === "string")
			return { text: finalResponse.output[0] };

		const out = finalResponse?.output as
			| undefined
			| {
					transcription?: string;
					translation?: string;
					txt_file?: string;
			  };
		if (out && typeof out === "object") {
			if (typeof out.transcription === "string") return { text: out.transcription };
			if (typeof out.translation === "string") return { text: out.translation };
			if (typeof out.txt_file === "string") {
				const r = await fetch(out.txt_file);
				return { text: await r.text() };
			}
		}
		throw new InferenceClientProviderOutputError(
			"Received malformed response from Replicate automatic-speech-recognition API"
		);
	}
}

export class ReplicateImageToImageTask extends ReplicateTask implements ImageToImageTaskHelper {
	override preparePayload(params: BodyParams<ImageToImageArgs>): Record<string, unknown> {
		return {
			input: {
				...omit(params.args, ["inputs", "parameters"]),
				...params.args.parameters,
				input_image: params.args.inputs, // This will be processed in preparePayloadAsync
				lora_weights:
					params.mapping?.adapter === "lora" && params.mapping.adapterWeightsPath
						? `https://huggingface.co/${params.mapping.hfModelId}`
						: undefined,
			},
			version: params.model.includes(":") ? params.model.split(":")[1] : undefined,
		};
	}

	async preparePayloadAsync(args: ImageToImageArgs): Promise<RequestArgs> {
		const { inputs, ...restArgs } = args;

		// Convert Blob to base64 data URL
		const bytes = new Uint8Array(await inputs.arrayBuffer());
		const base64 = base64FromBytes(bytes);
		const imageInput = `data:${inputs.type || "image/jpeg"};base64,${base64}`;

		return {
			...restArgs,
			inputs: imageInput,
		};
	}

	override async getResponse(response: ReplicateOutput | Blob, url?: string, headers?: HeadersInit): Promise<Blob> {
		const finalResponse = (await this.ensureFinalResponse(response, url, headers)) as ReplicateOutput;
		if (
			typeof finalResponse === "object" &&
			!!finalResponse &&
			"output" in finalResponse &&
			Array.isArray(finalResponse.output) &&
			finalResponse.output.length > 0 &&
			typeof finalResponse.output[0] === "string"
		) {
			const urlResponse = await fetch(finalResponse.output[0]);
			return await urlResponse.blob();
		}

		if (
			typeof finalResponse === "object" &&
			!!finalResponse &&
			"output" in finalResponse &&
			typeof finalResponse.output === "string" &&
			isUrl(finalResponse.output)
		) {
			const urlResponse = await fetch(finalResponse.output);
			return await urlResponse.blob();
		}

		throw new InferenceClientProviderOutputError("Received malformed response from Replicate image-to-image API");
	}
}
