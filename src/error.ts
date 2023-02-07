import type { JsonObject } from "type-fest";

export async function createApiError(response: Response): Promise<never> {
	const error = new ApiError(response.statusCode, response.headers.get("X-Request-Id"));

	error.message = "Api error with status " + error.statusCode + ". Request ID: " + error.requestId;

	if (response.headers.get("Content-Type")?.startsWith("application/json")) {
		const json = await response.json();
		error.message = json.message;
		error.data = json;
	} else {
		error.data = { message: await response.text() };
	}

	throw error;
}

export class ApiError extends Error {
	statusCode: number;
	requestId?: string;
	data?:      JsonObject;

	constructor(statusCode: number, requestId?: string) {
		super();

		this.statusCode = statusCode;
		this.requestId = requestId;
	}
}
