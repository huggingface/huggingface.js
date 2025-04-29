import type {
	ChatCompletionOutput,
	TextGenerationInput,
	TextGenerationOutput,
	TextGenerationOutputFinishReason,
} from "@huggingface/tasks";
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams } from "../types";
import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper";

interface FeatherlessAITextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
	choices: Array<{
		text: string;
		finish_reason: TextGenerationOutputFinishReason;
		seed: number;
		logprobs: unknown;
		index: number;
	}>;
}

const FEATHERLESS_API_BASE_URL = "https://api.featherless.ai";

export class FeatherlessAIConversationalTask extends BaseConversationalTask {
	constructor() {
		super("featherless-ai", FEATHERLESS_API_BASE_URL);
	}
}

export class FeatherlessAITextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("featherless-ai", FEATHERLESS_API_BASE_URL);
	}

	override preparePayload(params: BodyParams<TextGenerationInput>): Record<string, unknown> {
		return {
			...params.args,
			...params.args.parameters,
			model: params.model,
			prompt: params.args.inputs,
		};
	}

	override async getResponse(response: FeatherlessAITextCompletionOutput): Promise<TextGenerationOutput> {
		if (
			typeof response === "object" &&
			"choices" in response &&
			Array.isArray(response?.choices) &&
			typeof response?.model === "string"
		) {
			const completion = response.choices[0];
			return {
				generated_text: completion.text,
			};
		}
		throw new InferenceOutputError("Expected Featherless AI text generation response format");
	}
}
