import type { ChatCompletionOutput, TextGenerationOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../lib/InferenceOutputError";
import type { BodyParams, HeaderParams, UrlParams } from "../types";
import { toArray } from "../utils/toArray";
/**
 * Base class for task-specific provider helpers
 */
export abstract class TaskProviderHelper {
	private provider: string;
	private task: string;
	private baseUrl: string;
	private _clientSideRoutingOnly: boolean;

	constructor(provider: string, baseUrl: string, task: string, clientSideRoutingOnly: boolean = false) {
		this.provider = provider;
		this.task = task;
		this.baseUrl = baseUrl;
		this._clientSideRoutingOnly = clientSideRoutingOnly;
	}

	/**
	 * Whether the provider can only be used with client-side routing
	 */
	get clientSideRoutingOnly(): boolean {
		return this._clientSideRoutingOnly;
	}

	/**
	 * Prepare the base URL for the request
	 */
	makeBaseUrl(): string {
		return this.baseUrl;
	}

	/**
	 * Prepare the headers for the request
	 */
	prepareHeaders(params: HeaderParams): Record<string, string> {
		return { Authorization: `Bearer ${params.accessToken}` };
	}

	/**
	 * Prepare the body for the request
	 */
	abstract makeBody(params: BodyParams): Record<string, unknown>;

	/**
	 * Prepare the route for the request
	 */
	abstract makeRoute(params?: UrlParams): string;

	/**
	 * Prepare the URL for the request
	 */
	makeUrl(params: UrlParams): string {
		const route = this.makeRoute(params).replace(/^\/+/, "");
		return `${params.baseUrl}/${route}`;
	}

	/**
	 * Prepare the request to be sent to the provider :
	 * TODO: this is currently not used, the aim is to prepare/make the request in the task file instead of doing it in `makeRequestOptions`.
	 */
	prepareRequest(args: unknown): unknown {
		return args;
	}
	/**
	 * Return the response in the expected format
	 */
	abstract getResponse(response: unknown, url?: string, headers?: Record<string, string>): unknown;
}

export class BaseConversationalTask extends TaskProviderHelper {
	constructor(provider: string, baseUrl: string, clientSideRoutingOnly: boolean = false) {
		super(provider, baseUrl, "conversational", clientSideRoutingOnly);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override makeRoute(params?: UrlParams): string {
		return "v1/chat/completions";
	}

	override makeBody(params: BodyParams): Record<string, unknown> {
		return {
			...params.args,
			model: params.model,
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getResponse(response: ChatCompletionOutput, url?: string, headers?: Record<string, string>): ChatCompletionOutput {
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
	override makeBody(params: BodyParams): Record<string, unknown> {
		return {
			...params.args,
			model: params.model,
		};
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	override makeRoute(params: UrlParams): string {
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
