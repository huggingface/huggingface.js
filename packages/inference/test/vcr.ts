import { isBackend, isFrontend } from "../src/utils/env-predicates";

const TAPES_FILE = "./tapes.json";

let VCR_MODE;

/**
 * Allows to record tapes with a token to avoid rate limit.
 *
 * If VCR_MODE is not set and a token is present then disable it.
 */
if (process.env.VCR_MODE) {
	if ((process.env.VCR_MODE === "record" || process.env.VCR_MODE === "cache") && isFrontend) {
		throw new Error("VCR_MODE=record is not supported in the browser");
	}

	VCR_MODE = process.env.VCR_MODE;
} else {
	VCR_MODE = process.env.HF_ACCESS_TOKEN ? "disabled" : "playback";
}

if (isFrontend) {
	const originalFetch = window.fetch;

	window.fetch = (...args) => {
		return vcr(originalFetch, args[0], args[1]);
	};
} else {
	const originalFetch = global.fetch;

	global.fetch = (...args) => {
		return vcr(originalFetch, args[0], args[1]);
	};
}

/**
 * Represents a recorded HTTP request
 */
interface Tape {
	url: string;
	init?: RequestInit;

	response: {
		/**
		 * Base64 string of the response body
		 */
		body: string;

		status: number;
		statusText: string;
		headers?: HeadersInit;
	};
}

function tapeToResponse(tape: Tape) {
	return new Response(
		Uint8Array.from(atob(tape.response.body), (c) => c.charCodeAt(0)),
		{
			status: tape.response.status,
			statusText: tape.response.statusText,
			headers: tape.response.headers,
		}
	);
}

/**
 * Headers are volontarily skipped for now. They are not useful to distinguish requests
 * but bring more complexity because some of them are not deterministics like "date"
 * and it's complex to handle all the formats they can be given in.
 */
async function hashRequest(url: string, init: RequestInit): Promise<string> {
	const hashObject = {
		url,
		method: init.method,
		body: init.body,
	};

	const inputBuffer = new TextEncoder().encode(JSON.stringify(hashObject));

	let hashed: ArrayBuffer;
	if (isBackend) {
		const crypto = await import("node:crypto");
		hashed = await crypto.subtle.digest("SHA-256", inputBuffer);
	} else {
		hashed = await crypto.subtle.digest("SHA-256", inputBuffer);
	}

	return Array.from(new Uint8Array(hashed))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * This function behavior change according to the value of the VCR_MODE environment variable:
 *   - record: requests will be made to the external API and responses will be saved in files
 *   - playback: answers will be read from the filesystem, if they don't have been recorded before then an error will be thrown
 *   - cache: same as playback but if the response is not found in the filesystem then it will be recorded
 */
async function vcr(
	originalFetch: typeof global.fetch,
	input: RequestInfo | URL,
	init: RequestInit = {}
): Promise<Response> {
	let url;
	if (typeof input === "string") {
		url = input;
	} else if (input instanceof URL) {
		url = input.href;
	} else {
		url = input.url;
	}

	const hash = await hashRequest(url, init);

	const { default: tapes } = await import(TAPES_FILE);

	if (VCR_MODE === "playback") {
		if (!tapes[hash]) {
			throw new Error(`Tape not found: ${hash} (${url})`);
		}

		const response = tapeToResponse(tapes[hash]);

		return response;
	}

	if (VCR_MODE === "cache" && tapes[hash]) {
		const response = tapeToResponse(tapes[hash]);

		return response;
	}

	const response = await originalFetch(input, init);

	if (VCR_MODE === "record" || VCR_MODE === "cache") {
		const arrayBuffer = await response.arrayBuffer();
		const headers: Record<string, string> = {};
		response.headers.forEach((value, key) => (headers[key] = value));

		const tape: Tape = {
			url,
			init: {
				headers: init.headers,
				method: init.method,
			},
			response: {
				// Truncating the body to 30KB to avoid having huge files
				body: Buffer.from(arrayBuffer.slice(0, 30 * 1024)).toString("base64"),
				status: response.status,
				statusText: response.statusText,
			},
		};
		tapes[hash] = tape;

		const { writeFileSync } = await import("node:fs");
		writeFileSync(`./test/${TAPES_FILE}`, JSON.stringify(tapes, null, 2));

		// Return a new response with an unconsummed body
		return tapeToResponse(tape);
	}

	return response;
}
