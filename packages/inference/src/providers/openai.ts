/**
 * Special case: provider configuration for a private models provider (OpenAI in this case).
 */
import type { InferenceProvider } from "../types";

const OPENAI_API_BASE_URL = "https://api.openai.com";

const makeBaseUrl: InferenceProvider.MakeBaseUrl = () => {
	return OPENAI_API_BASE_URL;
};

const makeBody: InferenceProvider.MakeBody = (params) => {
	if (!params.chatCompletion) {
		throw new Error("OpenAI only supports chat completions.");
	}
	return {
		...params.args,
		model: params.model,
	};
};

const makeHeaders: InferenceProvider.MakeHeaders = (params) => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl: InferenceProvider.MakeUrl = (params) => {
	if (!params.chatCompletion) {
		throw new Error("OpenAI only supports chat completions.");
	}
	return `${params.baseUrl}/v1/chat/completions`;
};

export const OPENAI_CONFIG: InferenceProvider.Config = {
	makeBaseUrl,
	makeBody,
	makeHeaders,
	makeUrl,
	clientSideRoutingOnly: true,
};
