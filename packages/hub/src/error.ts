import type { JsonObject } from "./vendor/type-fest/basic";

export async function createApiError(
	response: Response,
	opts?: { requestId?: string; message?: string },
): Promise<never> {
	const requestId = response.headers.get("X-Request-Id") ?? opts?.requestId;
	const error =
		response.status === 402 && response.headers.get("X-Error-Code") === "EgressLimitReached"
			? new EgressLimitReachedError(response.url, response.status, requestId)
			: new HubApiError(response.url, response.status, requestId);

	error.message = `Api error with status ${error.statusCode}${opts?.message ? `. ${opts.message}` : ""}`;

	const trailer = [`URL: ${error.url}`, error.requestId ? `Request ID: ${error.requestId}` : undefined]
		.filter(Boolean)
		.join(". ");

	if (response.headers.get("Content-Type")?.startsWith("application/json")) {
		const json = await response.json();
		error.message = json.error || json.message || error.message;
		if (json.error_description) {
			error.message = error.message ? error.message + `: ${json.error_description}` : json.error_description;
		}
		error.data = json;
	} else {
		error.data = { message: await response.text() };
	}

	error.message += `. ${trailer}`;

	throw error;
}

/**
 * Error thrown when an API call to the Hugging Face Hub fails.
 */
export class HubApiError extends Error {
	statusCode: number;
	url: string;
	requestId?: string;
	data?: JsonObject;

	constructor(url: string, statusCode: number, requestId?: string, message?: string) {
		super(message);

		this.statusCode = statusCode;
		this.requestId = requestId;
		this.url = url;
	}
}

/**
 * Error thrown when the Hugging Face Hub refuses a download (HTTP 402) because the account
 * reached its egress allowance.
 *
 * The error message, sent by the Hub, explains the situation and how to get a higher allowance.
 */
export class EgressLimitReachedError extends HubApiError {}

export class InvalidApiResponseFormatError extends Error {}
