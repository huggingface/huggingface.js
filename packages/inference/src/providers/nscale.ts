import type { ProviderConfig, UrlParams, HeaderParams, BodyParams } from "../types";

const NSCALE_API_BASE_URL = "https://inference.api.nscale.com";

const makeBody = (params: BodyParams): Record<string, unknown> => {
	return {
		...params.args,
		model: params.model,
	};
};

const makeHeaders = (params: HeaderParams): Record<string, string> => {
	return { Authorization: `Bearer ${params.accessToken}` };
};

const makeUrl = (params: UrlParams): string => {
	if (params.task === "text-to-image") {
		return `${params.baseUrl}/v1/images/generations`;
	}
	if (params.task === "text-generation") {
		return `${params.baseUrl}/v1/chat/completions`;
	}
	return `${params.baseUrl}/v1/chat/completions`;
};

export const NSCALE_CONFIG: ProviderConfig = {
	baseUrl: NSCALE_API_BASE_URL,
	makeBody,
	makeHeaders,
	makeUrl,
};