import type { ChatCompletionOutput, TextGenerationInput, TextGenerationOutput, TextToImageInput } from "@huggingface/tasks";
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BaseArgs, BodyParams, HeaderParams, UrlParams } from "../types";
import { toArray } from "../utils/toArray";
import type { ChatCompletionInput } from "@huggingface/tasks/src/tasks";
/**
 * Base class for task-specific provider helpers
 */
export abstract class TaskProviderHelper {
	constructor(
		private provider: string,
		private baseUrl: string,
		private task?: string,
		readonly clientSideRoutingOnly: boolean = false
	) { }

	/**
	 * Return the response in the expected format.
	 * Needs to be implemented in the subclasses.
	 */
	abstract getResponse(
		response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: "url" | "blob"
	): Promise<unknown>;

	/**
	 * Prepare the base URL for the request
	 */
	makeBaseUrl(): string {
		return this.baseUrl;
	}

	/**
	 * Prepare the body for the request
	 */
	makeBody(params: BodyParams): unknown {
		if ("data" in params.args && !!params.args.data) {
			return params.args.data;
		}
		return JSON.stringify(this.preparePayload(params));
	}

	/**
	 * Prepare the URL for the request
	 */
	makeUrl(params: UrlParams): string {
		const route = this.makeRoute(params).replace(/^\/+/, "");
		return `${params.baseUrl}/${route}`;
	}

	/**
	 * Prepare the route for the request
	 * Needs to be implemented in the subclasses.
	 */
	abstract makeRoute(params: UrlParams): string;

	/**
	 * Prepare the headers for the request
	 */
	prepareHeaders(params: HeaderParams, binary: boolean): Record<string, string> {
		const headers: Record<string, string> = { Authorization: `Bearer ${params.accessToken}` };
		if (!binary) {
			headers["Content-Type"] = "application/json";
		}
		return headers;
	}

	/**
	 * Prepare the payload for the request
	 * Needs to be implemented in the subclasses.
	 */
	abstract preparePayload(params: BodyParams): unknown;
}

export interface TextToImageTaskHelper {
	getResponse(response: unknown,
		url?: string,
		headers?: HeadersInit,
		outputType?: "url" | "blob"
	): Promise<string | Blob>;

	preparePayload(params: BodyParams<TextToImageInput & BaseArgs>): Record<string, unknown>;
}

export interface TextGenerationTaskHelper {
	getResponse(response: unknown,
		url?: string,
		headers?: HeadersInit,
	): Promise<TextGenerationOutput>;

	preparePayload(params: BodyParams<TextGenerationInput & BaseArgs>): Record<string, unknown>;

}

export interface ConversationalTaskHelper {
	getResponse(response: unknown,
		url?: string,
		headers?: HeadersInit,
	): Promise<ChatCompletionOutput>;

	preparePayload(params: BodyParams<ChatCompletionInput & BaseArgs>): Record<string, unknown>;
}

export class BaseConversationalTask extends TaskProviderHelper implements ConversationalTaskHelper {
	constructor(provider: string, baseUrl: string, clientSideRoutingOnly: boolean = false) {
		super(provider, baseUrl, "conversational", clientSideRoutingOnly);
	}

	makeRoute(params: UrlParams): string {
		void params;
		return "v1/chat/completions";
	}

	preparePayload(params: BodyParams<ChatCompletionInput & BaseArgs>): Record<string, unknown> {
		return {
			...params.args,
			model: params.model,
		};
	}

	async getResponse(response: ChatCompletionOutput): Promise<ChatCompletionOutput> {
		if (
			typeof response === "object" &&
			Array.isArray(response?.choices) &&
			typeof response?.created === "number" &&
			typeof response?.id === "string" &&
			typeof response?.model === "string" &&
			/// Together.ai and Nebius do not output a system_fingerprint
			(response.system_fingerprint === undefined ||
				response.system_fingerprint === null ||
				typeof response.system_fingerprint === "string") &&
			typeof response?.usage === "object"
		) {
			return response;
		}

		throw new InferenceOutputError("Expected ChatCompletionOutput");
	}
}

export class BaseTextGenerationTask extends TaskProviderHelper implements TextGenerationTaskHelper {
	constructor(provider: string, baseUrl: string, clientSideRoutingOnly: boolean = false) {
		super(provider, baseUrl, "text-generation", clientSideRoutingOnly);
	}
	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...params.args,
			model: params.model,
		};
	}
	makeRoute(params: UrlParams): string {
		void params;
		return "v1/completions";
	}

	async getResponse(response: unknown): Promise<TextGenerationOutput> {
		const res = toArray(response);
		// @ts-expect-error - We need to check properties on unknown type
		if (Array.isArray(res) && res.every((x) => "generated_text" in x && typeof x?.generated_text === "string")) {
			return (res as TextGenerationOutput[])?.[0];
		}

		throw new InferenceOutputError("Expected Array<{generated_text: string}>");
	}
}
