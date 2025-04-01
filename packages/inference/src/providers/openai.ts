/**
 * Special case: provider configuration for a private models provider (OpenAI in this case).
 */
import type { BodyParams, HeaderParams, ProviderConfig, UrlParams } from "../types";

const OPENAI_API_BASE_URL = "https://api.openai.com";

const makeBaseUrl = (): string => {
	return OPENAI_API_BASE_URL;
};

const makeBody = (params: BodyParams): Record<string, unknown> => {
	if (!params.chatCompletion) {
		throw new Error("OpenAI only supports chat completions.");
	}
	return {
		...params.args,
		model: params.model,
	};
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl = (params: UrlParams): string => {
	if (!params.chatCompletion) {
		throw new Error("OpenAI only supports chat completions.");
	}
	return `${params.baseUrl}/v1/chat/completions`;
};

export const OPENAI_CONFIG: ProviderConfig = {
	makeBaseUrl,
	makeBody,
	makeHeaders,
	makeUrl,
	clientSideRoutingOnly: true,
};
