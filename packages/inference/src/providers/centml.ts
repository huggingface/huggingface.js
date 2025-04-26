/**
 * CentML provider implementation for serverless inference.
 * This provider supports chat completions and text generation through CentML's serverless endpoints.
 */
import type { ChatCompletionOutput, TextGenerationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams } from "../types";
import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper";

const CENTML_API_BASE_URL = "https://api.centml.com";

export class CentMLConversationalTask extends BaseConversationalTask {
	constructor() {
		super("centml", CENTML_API_BASE_URL);
	}

	override makeRoute(): string {
		return "openai/v1/chat/completions";
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		const { args, model } = params;
		return {
			...args,
			model,
			api_key: args.accessToken,
		};
	}

	override async getResponse(response: ChatCompletionOutput): Promise<ChatCompletionOutput> {
		if (
			typeof response === "object" &&
			Array.isArray(response?.choices) &&
			typeof response?.created === "number" &&
			typeof response?.id === "string" &&
			typeof response?.model === "string" &&
			typeof response?.usage === "object"
		) {
			return response;
		}

		throw new InferenceOutputError("Expected ChatCompletionOutput");
	}
}

export class CentMLTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("centml", CENTML_API_BASE_URL);
	}

	override makeRoute(): string {
		return "openai/v1/completions";
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		const { args, model } = params;
		return {
			...args,
			model,
			api_key: args.accessToken,
		};
	}

	override async getResponse(response: TextGenerationOutput): Promise<TextGenerationOutput> {
		if (typeof response === "object" && typeof response?.generated_text === "string") {
			return response;
		}

		throw new InferenceOutputError("Expected TextGenerationOutput");
	}
}
