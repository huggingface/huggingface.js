import type { TextGenerationOutput } from "@huggingface/tasks";
import type { BodyParams } from "../types.js";
import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper.js";
import { InferenceClientProviderOutputError } from "../errors.js";

const INCEPTRON_API_BASE_URL = "https://openrouter.inceptron.io";

export class InceptronConversationalTask extends BaseConversationalTask {
	constructor() {
		super("inceptron", INCEPTRON_API_BASE_URL);
	}
}

export class InceptronTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("inceptron", INCEPTRON_API_BASE_URL);
	}

	override preparePayload(params: BodyParams): Record<string, unknown> {
		const payload = super.preparePayload(params);
		if (params.args.inputs) {
			payload.prompt = params.args.inputs;
			delete payload.inputs;
		}
		return payload;
	}

	override async getResponse(response: unknown): Promise<TextGenerationOutput> {
		if (
			typeof response === "object" &&
			response &&
			"choices" in response &&
			Array.isArray(response.choices) &&
			response.choices.length > 0 &&
			"text" in response.choices[0]
		) {
			return {
				generated_text: response.choices[0].text,
			};
		}

		throw new InferenceClientProviderOutputError("Received malformed response from Inceptron text generation API");
	}
}
