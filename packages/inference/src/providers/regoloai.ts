import type {
  ChatCompletionOutput,
  TextGenerationOutput,
  TextGenerationOutputFinishReason,
  AutomaticSpeechRecognitionOutput,
  FeatureExtractionOutput,
  ChatCompletionInput,
} from "@huggingface/tasks";
import type { BodyParams, OutputType, RequestArgs } from "../types.js";
import { omit } from "../utils/omit.js";
import {
  BaseConversationalTask,
  BaseTextGenerationTask,
  TaskProviderHelper,
  type TextToImageTaskHelper,
  type AutomaticSpeechRecognitionTaskHelper,
  type FeatureExtractionTaskHelper,
} from "./providerHelper.js";
import { InferenceClientProviderOutputError } from "../errors.js";

const REGOLO_API_BASE_URL = "https://api.regolo.ai";

interface RegoloTextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
  choices: Array<{
    text: string;
    finish_reason: TextGenerationOutputFinishReason;
    index: number;
    logprobs?: unknown;
  }>;
}

interface RegoloImageGeneration {
  data: Array<{
    b64_json?: string;
    url?: string;
  }>;
}

export class RegoloaiConversationalTask extends BaseConversationalTask {
  constructor() {
    super("regoloai", REGOLO_API_BASE_URL);
  }

  override preparePayload(params: BodyParams<ChatCompletionInput>): Record<string, unknown> {
    const payload = super.preparePayload(params);

    if (params.model === "deepseek-ocr") {
      payload.skip_special_tokens = false;
    }

    const response_format = payload.response_format as
      | { type: "json_schema"; json_schema: { schema: unknown } }
      | undefined;

    if (response_format?.type === "json_schema" && response_format?.json_schema?.schema) {
      payload.response_format = {
        type: "json_schema",
        schema: response_format.json_schema.schema,
      };
    }

    return payload;
  }
}

export class RegoloaiTextGenerationTask extends BaseTextGenerationTask {
  constructor() {
    super("regoloai", REGOLO_API_BASE_URL);
  }

  override makeRoute(): string {
    return "v1/completions";
  }

  override preparePayload(params: BodyParams): Record<string, unknown> {
    return {
      model: params.model,
      ...params.args,
      prompt: params.args.inputs,
    };
  }

  override async getResponse(response: RegoloTextCompletionOutput): Promise<TextGenerationOutput> {
    if (typeof response?.choices?.[0]?.text === "string") {
      return { generated_text: response.choices[0].text };
    }
    throw new InferenceClientProviderOutputError("Malformed response from RegoloAI completions API");
  }
}

export class RegoloaiTextToImageTask extends TaskProviderHelper implements TextToImageTaskHelper {
  constructor() {
    super("regoloai", REGOLO_API_BASE_URL);
  }

  makeRoute(): string {
    return "v1/images/generations";
  }

  preparePayload(params: BodyParams): Record<string, unknown> {
    const parameters = (params.args.parameters as Record<string, unknown>) ?? {};

    return {
      model: params.model,
      prompt: params.args.inputs,
      n: parameters.n ?? 1,
      size: parameters.size ?? "1024x1024",
      response_format: params.outputType === "url" ? "url" : "b64_json",
      ...omit(params.args, ["inputs", "parameters"]),
    };
  }

  async getResponse(
    response: RegoloImageGeneration,
    _url?: string,
    _headers?: HeadersInit,
    outputType?: OutputType,
  ): Promise<string | Blob | Record<string, unknown>> {

    if (!response?.data?.[0]) {
      throw new InferenceClientProviderOutputError("No images received from RegoloAI");
    }

    if (outputType === "json") return { ...response };

    const item = response.data[0];

    if (item.url) return item.url;

    if (item.b64_json) {
      const base64Data = item.b64_json;
      if (outputType === "dataUrl") return `data:image/png;base64,${base64Data}`;

      return fetch(`data:image/png;base64,${base64Data}`).then((res) => res.blob());
    }

    throw new InferenceClientProviderOutputError("Image format not recognized in response");
  }
}

export class RegoloaiFeatureExtractionTask extends TaskProviderHelper implements FeatureExtractionTaskHelper {
	constructor() {
		super("regoloai", REGOLO_API_BASE_URL);
	}

	makeRoute(): string {
		return "v1/embeddings";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			model: params.model,
			input: params.args.inputs,
		};
	}

	async getResponse(response: any): Promise<FeatureExtractionOutput> {
		if (Array.isArray(response?.data) && response.data[0]?.embedding) {
			return response.data[0].embedding;
		}
		throw new InferenceClientProviderOutputError("Invalid embeddings response from RegoloAI");
	}
}
