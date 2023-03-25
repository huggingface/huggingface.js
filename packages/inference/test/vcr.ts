import { isFrontend } from "../src/utils/env-predicates";

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

const originalFetch = isFrontend ? window.fetch : global.fetch;

global.fetch = (...args) => {
	return vcr(originalFetch, args[0], args[1]);
};

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

	return md5(JSON.stringify(hashObject));
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

	const hash = hashRequest(url, init);
	const tapes = require(TAPES_FILE);

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
				body: Buffer.from(arrayBuffer.slice(30 * 1024)).toString("base64"),
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

/**
 * MD5 implementation in pure JS from https://stackoverflow.com/a/60467595
 * So we can don't have to care about cross platform issues (Node.js vs browser)
 */
function md5(inputString) {
	var hc = "0123456789abcdef";
	function rh(n) {
		var j,
			s = "";
		for (j = 0; j <= 3; j++) s += hc.charAt((n >> (j * 8 + 4)) & 0x0f) + hc.charAt((n >> (j * 8)) & 0x0f);
		return s;
	}
	function ad(x, y) {
		var l = (x & 0xffff) + (y & 0xffff);
		var m = (x >> 16) + (y >> 16) + (l >> 16);
		return (m << 16) | (l & 0xffff);
	}
	function rl(n, c) {
		return (n << c) | (n >>> (32 - c));
	}
	function cm(q, a, b, x, s, t) {
		return ad(rl(ad(ad(a, q), ad(x, t)), s), b);
	}
	function ff(a, b, c, d, x, s, t) {
		return cm((b & c) | (~b & d), a, b, x, s, t);
	}
	function gg(a, b, c, d, x, s, t) {
		return cm((b & d) | (c & ~d), a, b, x, s, t);
	}
	function hh(a, b, c, d, x, s, t) {
		return cm(b ^ c ^ d, a, b, x, s, t);
	}
	function ii(a, b, c, d, x, s, t) {
		return cm(c ^ (b | ~d), a, b, x, s, t);
	}
	function sb(x) {
		var i;
		var nblk = ((x.length + 8) >> 6) + 1;
		var blks = new Array(nblk * 16);
		for (i = 0; i < nblk * 16; i++) blks[i] = 0;
		for (i = 0; i < x.length; i++) blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
		blks[i >> 2] |= 0x80 << ((i % 4) * 8);
		blks[nblk * 16 - 2] = x.length * 8;
		return blks;
	}
	var i,
		x = sb("" + inputString),
		a = 1732584193,
		b = -271733879,
		c = -1732584194,
		d = 271733878,
		olda,
		oldb,
		oldc,
		oldd;
	for (i = 0; i < x.length; i += 16) {
		olda = a;
		oldb = b;
		oldc = c;
		oldd = d;
		a = ff(a, b, c, d, x[i + 0], 7, -680876936);
		d = ff(d, a, b, c, x[i + 1], 12, -389564586);
		c = ff(c, d, a, b, x[i + 2], 17, 606105819);
		b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
		a = ff(a, b, c, d, x[i + 4], 7, -176418897);
		d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
		c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
		b = ff(b, c, d, a, x[i + 7], 22, -45705983);
		a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
		d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
		c = ff(c, d, a, b, x[i + 10], 17, -42063);
		b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
		a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
		d = ff(d, a, b, c, x[i + 13], 12, -40341101);
		c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
		b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
		a = gg(a, b, c, d, x[i + 1], 5, -165796510);
		d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
		c = gg(c, d, a, b, x[i + 11], 14, 643717713);
		b = gg(b, c, d, a, x[i + 0], 20, -373897302);
		a = gg(a, b, c, d, x[i + 5], 5, -701558691);
		d = gg(d, a, b, c, x[i + 10], 9, 38016083);
		c = gg(c, d, a, b, x[i + 15], 14, -660478335);
		b = gg(b, c, d, a, x[i + 4], 20, -405537848);
		a = gg(a, b, c, d, x[i + 9], 5, 568446438);
		d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
		c = gg(c, d, a, b, x[i + 3], 14, -187363961);
		b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
		a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
		d = gg(d, a, b, c, x[i + 2], 9, -51403784);
		c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
		b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
		a = hh(a, b, c, d, x[i + 5], 4, -378558);
		d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
		c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
		b = hh(b, c, d, a, x[i + 14], 23, -35309556);
		a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
		d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
		c = hh(c, d, a, b, x[i + 7], 16, -155497632);
		b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
		a = hh(a, b, c, d, x[i + 13], 4, 681279174);
		d = hh(d, a, b, c, x[i + 0], 11, -358537222);
		c = hh(c, d, a, b, x[i + 3], 16, -722521979);
		b = hh(b, c, d, a, x[i + 6], 23, 76029189);
		a = hh(a, b, c, d, x[i + 9], 4, -640364487);
		d = hh(d, a, b, c, x[i + 12], 11, -421815835);
		c = hh(c, d, a, b, x[i + 15], 16, 530742520);
		b = hh(b, c, d, a, x[i + 2], 23, -995338651);
		a = ii(a, b, c, d, x[i + 0], 6, -198630844);
		d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
		c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
		b = ii(b, c, d, a, x[i + 5], 21, -57434055);
		a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
		d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
		c = ii(c, d, a, b, x[i + 10], 15, -1051523);
		b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
		a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
		d = ii(d, a, b, c, x[i + 15], 10, -30611744);
		c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
		b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
		a = ii(a, b, c, d, x[i + 4], 6, -145523070);
		d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
		c = ii(c, d, a, b, x[i + 2], 15, 718787259);
		b = ii(b, c, d, a, x[i + 9], 21, -343485551);
		a = ad(a, olda);
		b = ad(b, oldb);
		c = ad(c, oldc);
		d = ad(d, oldd);
	}
	return rh(a) + rh(b) + rh(c) + rh(d);
}
