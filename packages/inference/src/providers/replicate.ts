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
        type TextGenerationTaskHelper,
        type TextToImageTaskHelper,
        type TextToVideoTaskHelper,
} from "./providerHelper.js";
import type { ImageToImageArgs } from "../tasks/cv/imageToImage.js";
import type { AutomaticSpeechRecognitionArgs } from "../tasks/audio/automaticSpeechRecognition.js";
import type { AutomaticSpeechRecognitionOutput, TextGenerationOutput } from "@huggingface/tasks";
import { base64FromBytes } from "../utils/base64FromBytes.js";
export interface ReplicateOutput {
        output?: unknown;
}

function extractTextFromReplicateResponse(value: unknown): string | undefined {
        if (value == null) {
                return undefined;
        }
        if (typeof value === "string") {
                return value;
        }
        if (Array.isArray(value)) {
                for (const item of value) {
                        const text = extractTextFromReplicateResponse(item);
                        if (typeof text === "string" && text.length > 0) {
                                return text;
                        }
                }
                return undefined;
        }
        if (typeof value === "object") {
                const record = value as Record<string, unknown>;
                const directTextKeys = ["output_text", "generated_text", "text", "content"] as const;
                for (const key of directTextKeys) {
                        const maybeText = record[key];
                        if (typeof maybeText === "string" && maybeText.length > 0) {
                                return maybeText;
                        }
                }
                const nestedKeys = ["output", "choices", "message", "delta", "content", "data"] as const;
                for (const key of nestedKeys) {
                        if (key in record) {
                                const text = extractTextFromReplicateResponse(record[key]);
                                if (typeof text === "string" && text.length > 0) {
                                        return text;
                                }
                        }
                }
        }
        return undefined;
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
		void headers;
		if (
			typeof res === "object" &&
			"output" in res &&
			Array.isArray(res.output) &&
			res.output.length > 0 &&
			typeof res.output[0] === "string"
		) {
			if (outputType === "json") {
				return { ...res };
			}
			if (outputType === "url") {
				return res.output[0];
			}
			const urlResponse = await fetch(res.output[0]);
			return await urlResponse.blob();
		}

		throw new InferenceClientProviderOutputError("Received malformed response from Replicate text-to-image API");
	}
}

export class ReplicateTextGenerationTask extends ReplicateTask implements TextGenerationTaskHelper {
        override async getResponse(response: ReplicateOutput): Promise<TextGenerationOutput> {
                if (response instanceof Blob) {
                        throw new InferenceClientProviderOutputError(
                                "Received malformed response from Replicate text-generation API"
                        );
                }

                const text = extractTextFromReplicateResponse(response);
                if (typeof text === "string") {
                        return { generated_text: text };
                }

                throw new InferenceClientProviderOutputError(
                        "Received malformed response from Replicate text-generation API"
                );
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

	override async getResponse(response: ReplicateOutput): Promise<Blob> {
		if (response instanceof Blob) {
			return response;
		}
		if (response && typeof response === "object") {
			if ("output" in response) {
				if (typeof response.output === "string") {
					const urlResponse = await fetch(response.output);
					return await urlResponse.blob();
				} else if (Array.isArray(response.output)) {
					const urlResponse = await fetch(response.output[0]);
					return await urlResponse.blob();
				}
			}
		}
		throw new InferenceClientProviderOutputError("Received malformed response from Replicate text-to-speech API");
	}
}

export class ReplicateTextToVideoTask extends ReplicateTask implements TextToVideoTaskHelper {
	override async getResponse(response: ReplicateOutput): Promise<Blob> {
		if (
			typeof response === "object" &&
			!!response &&
			"output" in response &&
			typeof response.output === "string" &&
			isUrl(response.output)
		) {
			const urlResponse = await fetch(response.output);
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

	override async getResponse(response: ReplicateOutput): Promise<AutomaticSpeechRecognitionOutput> {
		if (typeof response?.output === "string") return { text: response.output };
		if (Array.isArray(response?.output) && typeof response.output[0] === "string") return { text: response.output[0] };

		const out = response?.output as
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

	override async getResponse(response: ReplicateOutput): Promise<Blob> {
		if (
			typeof response === "object" &&
			!!response &&
			"output" in response &&
			Array.isArray(response.output) &&
			response.output.length > 0 &&
			typeof response.output[0] === "string"
		) {
			const urlResponse = await fetch(response.output[0]);
			return await urlResponse.blob();
		}

		if (
			typeof response === "object" &&
			!!response &&
			"output" in response &&
			typeof response.output === "string" &&
			isUrl(response.output)
		) {
			const urlResponse = await fetch(response.output);
			return await urlResponse.blob();
		}

		throw new InferenceClientProviderOutputError("Received malformed response from Replicate image-to-image API");
	}
}
