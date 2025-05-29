import type { JsonObject } from "./vendor/type-fest/basic.js";

/**
 * Base class for all inference-related errors.
 */
export abstract class HfInferenceError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "HfInferenceError";
	}
}

export class HfInferenceInputError extends HfInferenceError {
	constructor(message: string) {
		super(message);
		this.name = "InputError";
	}
}

interface HttpRequest {
	url: string;
	method: string;
	headers?: Record<string, string>;
	body?: JsonObject;
}

interface HttpResponse {
	requestId: string;
	status: number;
	body: JsonObject | string;
}

abstract class HfInferenceHttpRequestError extends HfInferenceError {
	httpRequest: HttpRequest;
	httpResponse: HttpResponse;
	constructor(message: string, httpRequest: HttpRequest, httpResponse: HttpResponse) {
		super(message);
		this.httpRequest = {
			...httpRequest,
			...(httpRequest.headers
				? {
						headers: {
							...httpRequest.headers,
							...("Authorization" in httpRequest.headers ? { Authorization: `Bearer [redacted]` } : undefined),
							/// redact authentication in the request headers
						},
				  }
				: undefined),
		};
		this.httpResponse = httpResponse;
	}
}

/**
 * Thrown when the HTTP request to the provider fails, e.g. due to API issues or server errors.
 */
export class HfInferenceProviderApiError extends HfInferenceHttpRequestError {
	constructor(message: string, httpRequest: HttpRequest, httpResponse: HttpResponse) {
		super(message, httpRequest, httpResponse);
		this.name = "ProviderApiError";
	}
}

/**
 * Thrown when the HTTP request to the hub fails, e.g. due to API issues or server errors.
 */
export class HfInferenceHubApiError extends HfInferenceHttpRequestError {
	constructor(message: string, httpRequest: HttpRequest, httpResponse: HttpResponse) {
		super(message, httpRequest, httpResponse);
		this.name = "HubApiError";
	}
}

/**
 * Thrown when the inference output returned by the provider is invalid / does not match the expectations
 */
export class HfInferenceProviderOutputError extends HfInferenceError {
	constructor(message: string) {
		super(message);
		this.name = "ProviderOutputError";
	}
}
