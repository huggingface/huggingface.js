/**
 * See the registered mapping of HF model ID => TextCLF model ID here:
 *
 * https://huggingface.co/api/partners/textclf/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at TextCLF and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to TextCLF, please open an issue on the present repo
 * and we will tag TextCLF team members.
 *
 * Thanks!
 */
import type { ChatCompletionOutput, TextGenerationOutput } from "@huggingface/tasks";
import type { BodyParams } from "../types.js";
import { omit } from "../utils/omit.js";
import {
	BaseConversationalTask,
	BaseTextGenerationTask,
} from "./providerHelper.js";
import { InferenceClientProviderOutputError } from "../errors.js";

const TEXTCLF_API_BASE_URL = "https://api.textclf.com";

export interface TextCLFTextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
    choices: Array<{
        message: { content: string };
    }>;
}

export class TextCLFConversationalTask extends BaseConversationalTask {
    constructor() {
        super("textclf", TEXTCLF_API_BASE_URL);
    }
}

export class TextCLFTextGenerationTask extends BaseTextGenerationTask {
    constructor() {
        super("textclf", TEXTCLF_API_BASE_URL);
    }

    override makeRoute(): string {
        return "v1/chat/completions";
    }

    override preparePayload(params: BodyParams): Record<string, unknown> {
        return {
            messages: [{ content: params.args.inputs, role: "user" }],
            ...(params.args.parameters
                ? {
                        max_tokens: (params.args.parameters as Record<string, unknown>).max_new_tokens,
                        ...omit(params.args.parameters as Record<string, unknown>, "max_new_tokens"),
                    }
                : undefined),
            ...omit(params.args, ["inputs", "parameters"]),
            model: params.model,
        };
    }

    override async getResponse(response: TextCLFTextCompletionOutput): Promise<TextGenerationOutput> {
        if (
            typeof response === "object" &&
            "choices" in response &&
            Array.isArray(response?.choices) &&
            typeof response?.model === "string"
        ) {
            const completion = response.choices[0];
            return {
                generated_text: completion.message.content,
            };
        }

        throw new InferenceClientProviderOutputError("Received malformed response from TextCLF text generation API");
    }
}

