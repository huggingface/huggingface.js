import type { ChatCompletionInput, PipelineType } from "@huggingface/tasks";

/**
 * HF model id, like "meta-llama/Llama-3.3-70B-Instruct"
 */
export type ModelId = string;

export interface Options {
	/**
	 * (Default: true) Boolean. If a request 503s, the request will be retried with the same parameters.
	 */
	retry_on_error?: boolean;

	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
	/**
	 * Abort Controller signal to use for request interruption.
	 */
	signal?: AbortSignal;

	/**
	 * (Default: "same-origin"). String | Boolean. Credentials to use for the request. If this is a string, it will be passed straight on. If it's a boolean, true will be "include" and false will not send credentials at all.
	 */
	includeCredentials?: string | boolean;
}

export type InferenceTask = Exclude<PipelineType, "other">;

export const INFERENCE_PROVIDERS = [
	"black-forest-labs",
	"cerebras",
	"cohere",
	"fal-ai",
	"fireworks-ai",
	"hf-inference",
	"hyperbolic",
	"nebius",
	"novita",
	"openai",
	"replicate",
	"sambanova",
	"together",
] as const;

export type InferenceProvider = (typeof INFERENCE_PROVIDERS)[number];

export interface BaseArgs {
	/**
	 * The access token to use. Without it, you'll get rate-limited quickly.
	 *
	 * Can be created for free in hf.co/settings/token
	 *
	 * You can also pass an external Inference provider's key if you intend to call a compatible provider like Sambanova, Together, Replicate...
	 */
	accessToken?: string;

	/**
	 * The HF model to use.
	 *
	 * If not specified, will call huggingface.co/api/tasks to get the default model for the task.
	 *
	 * /!\ Legacy behavior allows this to be an URL, but this is deprecated and will be removed in the future.
	 * Use the `endpointUrl` parameter instead.
	 */
	model?: ModelId;

	/**
	 * The URL of the endpoint to use. If not specified, will call huggingface.co/api/tasks to get the default endpoint for the task.
	 *
	 * If specified, will use this URL instead of the default one.
	 */
	endpointUrl?: string;

	/**
	 * Set an Inference provider to run this model on.
	 *
	 * Defaults to the first provider in your user settings that is compatible with this model.
	 */
	provider?: InferenceProvider;
}

export type RequestArgs = BaseArgs &
	(
		| { data: Blob | ArrayBuffer }
		| { inputs: unknown }
		| { prompt: string }
		| { text: string }
		| { audio_url: string }
		| ChatCompletionInput
	) & {
		parameters?: Record<string, unknown>;
	};

export interface ProviderConfig {
	makeBaseUrl: ((task?: InferenceTask) => string) | (() => string);
	makeBody: (params: BodyParams) => Record<string, unknown>;
	makeHeaders: (params: HeaderParams) => Record<string, string>;
	makeUrl: (params: UrlParams) => string;
	clientSideRoutingOnly?: boolean;
}

export type AuthMethod = "none" | "hf-token" | "credentials-include" | "provider-key";

export interface HeaderParams {
	accessToken?: string;
	authMethod: AuthMethod;
}

export interface UrlParams {
	authMethod: AuthMethod;
	baseUrl: string;
	model: string;
	task?: InferenceTask;
	chatCompletion?: boolean;
}

export interface BodyParams {
	args: Record<string, unknown>;
	chatCompletion?: boolean;
	model: string;
	task?: InferenceTask;
}
