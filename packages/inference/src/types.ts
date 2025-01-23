import type { PipelineType } from "@huggingface/tasks";
import type { ChatCompletionInput } from "@huggingface/tasks";

/**
 * HF model id, like "meta-llama/Llama-3.3-70B-Instruct"
 */
export type ModelId = string;

export interface Options {
	/**
	 * (Default: true) Boolean. If a request 503s and wait_for_model is set to false, the request will be retried with the same parameters but with wait_for_model set to true.
	 */
	retry_on_error?: boolean;
	/**
	 * (Default: true). Boolean. There is a cache layer on Inference API (serverless) to speedup requests we have already seen. Most models can use those results as is as models are deterministic (meaning the results will be the same anyway). However if you use a non deterministic model, you can set this parameter to prevent the caching mechanism from being used resulting in a real new query.
	 */
	use_cache?: boolean;
	/**
	 * (Default: false). Boolean. Do not load the model if it's not already available.
	 */
	dont_load_model?: boolean;
	/**
	 * (Default: false). Boolean to use GPU instead of CPU for inference (requires Startup plan at least).
	 */
	use_gpu?: boolean;

	/**
	 * (Default: false) Boolean. If the model is not ready, wait for it instead of receiving 503. It limits the number of requests required to get your inference done. It is advised to only set this flag to true after receiving a 503 error as it will limit hanging in your application to known places.
	 */
	wait_for_model?: boolean;
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

export const INFERENCE_PROVIDERS = ["fal-ai", "replicate", "sambanova", "together", "hf-inference"] as const;
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
		| { audio_url: string }
		| ChatCompletionInput
	) & {
		parameters?: Record<string, unknown>;
		accessToken?: string;
	};
