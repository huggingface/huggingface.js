import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const VCR_MODE = process.env.VCR_MODE;
if (VCR_MODE) {
	const originalFetch = global.fetch;

	global.fetch = (...args) => {
		return vcr(originalFetch, args[0], args[1]);
	};
}
const tapesDirectory = "test/tapes";

mkdirSync(tapesDirectory, { recursive: true });

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
	return new Response(Buffer.from(tape.response.body, "base64"), {
		status: tape.response.status,
		statusText: tape.response.statusText,
		headers: tape.response.headers,
	});
}

/**
 * Headers are volontarily skipped for now. They are not useful to distinguish requests
 * but bring more complexity because some of them are not deterministics like "date"
 * and it's complex to handle all the formats they can be given in.
 */
function hashRequest(url: string, init: RequestInit): string {
	const hashObject = {
		url,
		method: init.method,
		body: init.body,
	};

	return createHash("sha256")
		.update(url + JSON.stringify(hashObject))
		.digest("hex");
}

/**
 * This function behavior change according to the value of the VCR_MODE environment variable:
 *   - record: requests will be made to the external API and responses will be saved in files
 *   - playback: answers will be read from the filesystem, if they don't have been recorded before then an error will be thrown
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
	const tapeFile = `./${tapesDirectory}/${hash}.json`;
	const tapeFileExists = existsSync(tapeFile);

	if (VCR_MODE === "playback") {
		if (!tapeFileExists) {
			throw new Error(`Tape not found: ${tapeFile} (${url})`);
		}

		const rawTape = readFileSync(tapeFile, "utf-8");
		const tape = JSON.parse(rawTape) as Tape;

		const response = tapeToResponse(tape);

		return response;
	}

	const response = await originalFetch(input, init);

	if (VCR_MODE === "record") {
		const arrayBuffer = await response.arrayBuffer();
		const headers: Record<string, string> = {};
		response.headers.forEach((value, key) => (headers[key] = value));

		const tape: Tape = {
			url,
			init,
			response: {
				body: Buffer.from(arrayBuffer).toString("base64"),
				status: response.status,
				statusText: response.statusText,
			},
		};

		writeFileSync(tapeFile, JSON.stringify(tape, null, 2));

		// Return a new response with an unconsummed body
		return tapeToResponse(tape);
	}

	return response;
}
