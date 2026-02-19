import type { TextGenerationOutput } from "@huggingface/tasks";
import { InferenceClientProviderOutputError } from "../errors.js";
import type { BodyParams } from "../types.js";
import { omit } from "../utils/omit.js";
import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper.js";

/**
 * DeepInfra exposes OpenAI-compatible endpoints under the /v1/openai namespace.
 */
const DEEPINFRA_API_BASE_URL = "https://api.deepinfra.com";

interface DeepInfraCompletionChoice {
	text?: string;
}

interface DeepInfraCompletionResponse {
	choices: DeepInfraCompletionChoice[];
	model: string;
}

export class DeepInfraConversationalTask extends BaseConversationalTask {
	constructor() {
		super("deepinfra", DEEPINFRA_API_BASE_URL);
	}

	override makeRoute(): string {
		return "v1/openai/chat/completions";
	}
}

export class DeepInfraTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("deepinfra", DEEPINFRA_API_BASE_URL);
	}

	override makeRoute(): string {
		return "v1/openai/completions";
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		const parameters = params.args.parameters as Record<string, unknown> | undefined;
		const res = {
			model: params.model,
			prompt: params.args.inputs,
			...omit(params.args, ["inputs", "parameters"]),
			...(parameters
				? {
						max_tokens: parameters.max_new_tokens,
						...omit(parameters, ["max_new_tokens"]),
				  }
				: undefined),
		};
		return res;
	}

	override async getResponse(response: DeepInfraCompletionResponse): Promise<TextGenerationOutput> {
		if (
			typeof response === "object" &&
			response !== null &&
			Array.isArray(response.choices) &&
			response.choices.length > 0
		) {
			const completion = response.choices[0].text;
			if (typeof completion === "string") {
				return { generated_text: completion };
			}
		}

		throw new InferenceClientProviderOutputError(
			"Received malformed response from DeepInfra text-generation API: expected OpenAI completion payload"
		);
	}
}
