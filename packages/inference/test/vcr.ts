import { omit } from "../src/utils/omit";
import { isBackend, isFrontend } from "../../shared";
import { HF_HUB_URL } from "../src/lib/getDefaultTask";

const TAPES_FILE = "./tapes.json";
const BASE64_PREFIX = "data:application/octet-stream;base64,";

enum MODE {
	RECORD = "record",
	PLAYBACK = "playback",
	CACHE = "cache",
	DISABLED = "disabled",
}

let VCR_MODE: MODE;

/**
 * Allows to record tapes with a token to avoid rate limit.
 *
 * If VCR_MODE is not set and a token is present then disable it.
 */
const env = import.meta.env;
if (env.VCR_MODE) {
	if ((env.VCR_MODE === MODE.RECORD || env.VCR_MODE === MODE.CACHE) && isFrontend) {
		throw new Error("VCR_MODE=record is not supported in the browser");
	}

	VCR_MODE = env.VCR_MODE as MODE;
} else {
	VCR_MODE = env.HF_TOKEN ? MODE.DISABLED : MODE.PLAYBACK;
}

const originalFetch = globalThis.fetch;

globalThis.fetch = (...args) => vcr(originalFetch, args[0], args[1]);

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

async function tapeToResponse(tape: Tape) {
	return new Response(
		tape.response.body?.startsWith(BASE64_PREFIX) ? (await originalFetch(tape.response.body)).body : tape.response.body,
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
	let url: string;

	if (typeof input === "string") {
		url = input;
	} else if (input instanceof URL) {
		url = input.href;
	} else {
		url = input.url;
	}

	const hash = await hashRequest(url, init);

	const { default: tapes } = await import(TAPES_FILE);

	if (VCR_MODE === MODE.PLAYBACK && !url.startsWith(HF_HUB_URL)) {
		if (!tapes[hash]) {
			throw new Error(`Tape not found: ${hash} (${url})`);
		}

		const response = tapeToResponse(tapes[hash]);

		return response;
	}

	if (VCR_MODE === MODE.CACHE && tapes[hash]) {
		const response = tapeToResponse(tapes[hash]);

		return response;
	}

	const response = await originalFetch(input, init);

	if (url.startsWith(HF_HUB_URL)) {
		return response;
	}

	if (response.status < 500 && (VCR_MODE === MODE.RECORD || VCR_MODE === MODE.CACHE)) {
		const isText =
			response.headers.get("Content-Type")?.includes("json") || response.headers.get("Content-Type")?.includes("text");
		const isJson = response.headers.get("Content-Type")?.includes("json");
		const arrayBuffer = await response.arrayBuffer();

		let body = "";
		if (isText || isJson) {
			body = new TextDecoder().decode(arrayBuffer);
			if (isJson) {
				// check for base64 strings and truncate them
				body = JSON.stringify(
					JSON.parse(body, (key: unknown, value: unknown): unknown => {
						if (
							typeof value === "string" &&
							value.length > 1_000 &&
							// base64 heuristic
							value.length % 4 === 0 &&
							value.match(/^[a-zA-Z0-9+/]+={0,2}$/)
						) {
							return value.slice(0, 1_000);
						} else {
							return value;
						}
					})
				);
			}
		} else {
			// // Alternative to also save binary data:
			// arrayBuffer.byteLength > 30_000
			// 	? ""
			// 	: isText
			// 	? new TextDecoder().decode(arrayBuffer)
			// 	: BASE64_PREFIX + base64FromBytes(new Uint8Array(arrayBuffer)),
			body = "";
		}

		const tape: Tape = {
			url,
			init: {
				headers: init.headers && omit(init.headers as Record<string, string>, "Authorization"),
				method: init.method,
				body: typeof init.body === "string" && init.body.length < 1_000 ? init.body : undefined,
			},
			response: {
				body,
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(
					// Remove varying headers as much as possible
					[...response.headers.entries()].filter(
						([key]) => key !== "date" && key !== "content-length" && !key.startsWith("x-") && key !== "via"
					)
				),
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
