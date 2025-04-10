import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper";
import type { ChatCompletionOutput, TextGenerationOutputFinishReason } from "@huggingface/tasks";
import { InferenceOutputError } from "../lib/InferenceOutputError";

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

  override preparePayload(params: BodyParams): Record<string, unknown> {
    return {
      model: params.model,
      ...params.args,
      ...params.args.parameters,
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
    throw new InferenceOutputError("Expected Together text generation response format");
  }
}
