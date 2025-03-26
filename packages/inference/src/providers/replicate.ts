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
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams, HeaderParams, InferenceTask, UrlParams } from "../types";
import { omit } from "../utils/omit";
import { TaskProviderHelper } from "./providerHelper";

export interface ReplicateOutput {
	output?: string | string[];
}
export class ReplicateTask extends TaskProviderHelper {
	constructor(task: InferenceTask, url?: string) {
		super("replicate", url || "https://api.replicate.com", task);
	}

	override makeRoute(params: UrlParams): string {
		if (params.model.includes(":")) {
			return "v1/predictions";
		}
		return `v1/models/${params.model}/predictions`;
	}
	override makeBody(params: BodyParams): Record<string, unknown> {
		return params.args;
	}
	override prepareHeaders(params: HeaderParams): Record<string, string> {
		return { Authorization: `Bearer ${params.accessToken}`, Prefer: "wait" };
	}

	override makeUrl(params: UrlParams): string {
		if (params.model.includes(":")) {
			return `${params.baseUrl}/v1/predictions`;
		}
		return `${params.baseUrl}/v1/models/${params.model}/predictions`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override getResponse(response: unknown, url?: string, headers?: Record<string, string>): unknown {
		throw new Error("Method not implemented.");
	}
}

export class ReplicateTextToImageTask extends ReplicateTask {
	constructor() {
		super("text-to-image");
	}
	override makeBody(params: BodyParams): Record<string, unknown> {
		return {
			...omit(params.args, ["inputs", "parameters"]),
			input: {
				prompt: params.args.inputs,
				...(params.args.parameters as Record<string, unknown>),
			},
			version:
				params.args.model && (params.args.model as string).includes(":")
					? (params.args.model as string).split(":")[1]
					: undefined,
		};
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override async getResponse(
		res: ReplicateOutput | Blob,
		url?: string,
		headers?: Record<string, string>,
		outputType?: "url" | "blob"
	): Promise<string | Blob> {
		if (
			typeof res === "object" &&
			"output" in res &&
			Array.isArray(res.output) &&
			res.output.length > 0 &&
			typeof res.output[0] === "string"
		) {
			if (outputType === "url") {
				return res.output[0];
			}
			const urlResponse = await fetch(res.output[0]);
			return await urlResponse.blob();
		}

		throw new InferenceOutputError("Expected Replicate text-to-image response format");
	}
}

export class ReplicateTextToSpeechTask extends ReplicateTask {
	constructor() {
		super("text-to-speech");
	}
	// TODO: Implement this
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override async getResponse(res: ReplicateOutput, url?: string, headers?: Record<string, string>): Promise<unknown> {
		throw new Error("Method not implemented yet.");
	}
}

export class ReplicateTextToVideoTask extends ReplicateTask {
	constructor() {
		super("text-to-video");
	}
	// TODO: Implement this
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override async getResponse(res: ReplicateOutput, url?: string, headers?: Record<string, string>): Promise<unknown> {
		throw new Error("Method not implemented yet.");
	}
}
