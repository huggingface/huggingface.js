import type { ChatCompletionOutput, TextGenerationOutput } from "@huggingface/tasks";
import { HF_ROUTER_URL } from "../config";
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams, HeaderParams, UrlParams } from "../types";
import { toArray } from "../utils/toArray";

/**
 * Base class for task-specific provider helpers
 */
export abstract class TaskProviderHelper {
	constructor(
		private provider: string,
		private baseUrl: string,
		private task?: string,
		readonly clientSideRoutingOnly: boolean = false
	) {}

	/**
	 * Return the response in the expected format.
	 * Needs to be implemented in the subclasses.
	 */
	abstract getResponse(
		response: unknown,
		url?: string,
		headers?: Record<string, string>,
		outputType?: "url" | "blob"
	): unknown;

	/**
	 * Prepare the base URL for the request
	 */
	makeBaseUrl(params: UrlParams): string {
		return params.authMethod !== "provider-key" ? `${HF_ROUTER_URL}/${this.provider}` : this.baseUrl;
	}

	/**
	 * Prepare the body for the request
	 */
	makeBody(params: BodyParams): BodyInit {
		if ("data" in params.args && !!params.args.data) {
			return params.args.data as BodyInit;
		}
		return JSON.stringify(this.preparePayload(params));
	}

	/**
	 * Prepare the URL for the request
	 */
	makeUrl(params: UrlParams): string {
		const baseUrl = this.makeBaseUrl(params);
		const route = this.makeRoute(params).replace(/^\/+/, "");
		return `${baseUrl}/${route}`;
	}

	/**
	 * Prepare the route for the request
	 * Needs to be implemented in the subclasses.
	 */
	abstract makeRoute(params: UrlParams): string;

	/**
	 * Prepare the headers for the request
	 */
	prepareHeaders(params: HeaderParams, isBinary: boolean): Record<string, string> {
		const headers: Record<string, string> = { Authorization: `Bearer ${params.accessToken}` };
		if (!isBinary) {
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

export class BaseConversationalTask extends TaskProviderHelper {
	constructor(provider: string, baseUrl: string, clientSideRoutingOnly: boolean = false) {
		super(provider, baseUrl, "conversational", clientSideRoutingOnly);
	}

	makeRoute(params: UrlParams): string {
		void params;
		return "v1/chat/completions";
	}

	preparePayload(params: BodyParams): Record<string, unknown> {
		return {
			...params.args,
			model: params.model,
		};
	}

	getResponse(response: ChatCompletionOutput): ChatCompletionOutput {
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

export class BaseTextGenerationTask extends TaskProviderHelper {
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

	getResponse(response: unknown): TextGenerationOutput {
		const res = toArray(response);
		// @ts-expect-error - We need to check properties on unknown type
		if (Array.isArray(res) && res.every((x) => "generated_text" in x && typeof x?.generated_text === "string")) {
			return (res as TextGenerationOutput[])?.[0];
		}

		throw new InferenceOutputError("Expected Array<{generated_text: string}>");
	}
}
