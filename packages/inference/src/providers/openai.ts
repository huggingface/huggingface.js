/**
 * Special case: provider configuration for a private models provider (OpenAI in this case).
 */
import type { InferenceProviderTypes } from "./types";

const OPENAI_API_BASE_URL = "https://api.openai.com";

const makeBaseUrl: InferenceProviderTypes.MakeBaseUrl = () => {
	return OPENAI_API_BASE_URL;
};

const makeBody: InferenceProviderTypes.MakeBody = (params) => {
	if (!params.chatCompletion) {
		throw new Error("OpenAI only supports chat completions.");
	}
	return {
		...params.args,
		model: params.model,
	};
};

const makeHeaders: InferenceProviderTypes.MakeHeaders = (params) => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl: InferenceProviderTypes.MakeUrl = (params) => {
	if (!params.chatCompletion) {
		throw new Error("OpenAI only supports chat completions.");
	}
	return `${params.baseUrl}/v1/chat/completions`;
};

export const OPENAI_CONFIG: InferenceProviderTypes.Config = {
	makeBaseUrl,
	makeBody,
	makeHeaders,
	makeUrl,
	clientSideRoutingOnly: true,
};
