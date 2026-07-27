/**
 * Minimal, dependency-free, incremental (SAX-style) JSON parser.
 *
 * `JSON.parse` requires the whole document in memory twice (the source string + the resulting
 * object tree), which makes it unusable for documents that are large but whose *interesting*
 * content is tiny — e.g. a `model.safetensors.index.json` of a big MoE, where the 60 MB
 * `weight_map` only exists to tell us the ~100 distinct shard filenames.
 *
 * This parser instead emits a flat event stream as bytes arrive, so the consumer can keep only
 * what it cares about and let everything else be garbage collected. Memory usage is bounded by
 * the size of the largest individual token (string / number), not by the size of the document.
 *
 * The implementation is a resumable state machine: any token may be split across chunk
 * boundaries (including multi-byte UTF-8 sequences and `\uXXXX` escapes).
 *
 * Strictness: the accepted grammar is RFC 8259 (same as `JSON.parse`), minus a few checks that
 * would cost a lot for little benefit here — notably number *shapes* are validated by `Number()`
 * rather than by the state machine, so a handful of inputs `JSON.parse` rejects are accepted.
 * Everything `JSON.parse` accepts is accepted, with identical values.
 *
 * @example
 * for await (const event of streamJson(blob.stream())) {
 *   if (event.type === "key") { ... }
 * }
 */

export type JsonStreamEvent =
	| { type: "startObject" }
	| { type: "endObject" }
	| { type: "startArray" }
	| { type: "endArray" }
	| { type: "key"; key: string }
	| { type: "value"; value: string | number | boolean | null };

export class JsonStreamParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "JsonStreamParseError";
	}
}

/**
 * Guards against a single unterminated string/number consuming unbounded memory: that is the one
 * thing streaming does *not* protect us from, since a token has to be buffered to be emitted.
 */
const DEFAULT_MAX_TOKEN_LENGTH = 16_000_000; // 16M chars

// Scanner states.
const S_VALUE = 0; // expecting a value
const S_VALUE_OR_ARRAY_END = 1; // right after `[`: a value, or `]` for an empty array
const S_STRING = 2;
const S_STRING_ESCAPE = 3;
const S_STRING_UNICODE = 4;
const S_NUMBER = 5;
const S_LITERAL = 6; // true / false / null
const S_AFTER_VALUE = 7; // expecting `,` or `}` or `]`
const S_KEY = 8; // after `,` in an object: a key is required
const S_KEY_OR_OBJECT_END = 9; // right after `{`: a key, or `}` for an empty object
const S_AFTER_KEY = 10; // expecting `:`
const S_DONE = 11; // the top-level value is complete; only trailing whitespace allowed

const ESCAPES: Record<string, string> = {
	'"': '"',
	"\\": "\\",
	"/": "/",
	b: "\b",
	f: "\f",
	n: "\n",
	r: "\r",
	t: "\t",
};

function isWhitespace(c: string): boolean {
	return c === " " || c === "\n" || c === "\r" || c === "\t";
}

function isNumberChar(c: string): boolean {
	return (c >= "0" && c <= "9") || c === "-" || c === "+" || c === "." || c === "e" || c === "E";
}

function isHexDigit(c: string): boolean {
	return (c >= "0" && c <= "9") || (c >= "a" && c <= "f") || (c >= "A" && c <= "F");
}

/**
 * Normalizes the accepted sources into an async iterable of byte chunks.
 *
 * `ReadableStream` is only async-iterable on Node and recent browsers, so we go through a reader
 * explicitly. The reader is always released/cancelled, which matters for early `break`/`throw`:
 * it lets an underlying HTTP response be torn down instead of downloading the rest of the body.
 */
async function* toByteChunks(
	source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
): AsyncGenerator<Uint8Array> {
	if (!("getReader" in source)) {
		yield* source;
		return;
	}

	const reader = source.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				return;
			}
			if (value) {
				yield value;
			}
		}
	} finally {
		// cancel() rejects if the stream is already errored/closed; we don't care either way
		await reader.cancel().catch(() => undefined);
	}
}

export async function* streamJson(
	source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
	options?: {
		/**
		 * Maximum length, in characters, of a single string / number token.
		 *
		 * @default 16_000_000
		 */
		maxTokenLength?: number;
	},
): AsyncGenerator<JsonStreamEvent, void, undefined> {
	const maxTokenLength = options?.maxTokenLength ?? DEFAULT_MAX_TOKEN_LENGTH;

	let state = S_VALUE;
	/** Container stack; `true` = array, `false` = object. Its depth is the nesting depth. */
	const stack: boolean[] = [];
	/** Buffer for the token being scanned (string contents, number/literal text). */
	let token = "";
	/** Whether the string being scanned is an object key rather than a value. */
	let stringIsKey = false;
	/** Hex digits collected so far for a `\uXXXX` escape. */
	let unicode = "";

	function checkTokenLength(): void {
		if (token.length > maxTokenLength) {
			throw new JsonStreamParseError(`JSON token exceeds the maximum length of ${maxTokenLength} characters`);
		}
	}

	/** Called once a complete value has been emitted, to decide what may follow. */
	function afterValue(): void {
		state = stack.length === 0 ? S_DONE : S_AFTER_VALUE;
	}

	function finishNumber(): JsonStreamEvent {
		const value = Number(token);
		if (token === "" || !Number.isFinite(value)) {
			throw new JsonStreamParseError(`Invalid JSON number: ${JSON.stringify(token)}`);
		}
		token = "";
		afterValue();
		return { type: "value", value };
	}

	function finishLiteral(): JsonStreamEvent {
		const text = token;
		token = "";
		afterValue();
		switch (text) {
			case "true":
				return { type: "value", value: true };
			case "false":
				return { type: "value", value: false };
			case "null":
				return { type: "value", value: null };
			default:
				throw new JsonStreamParseError(`Invalid JSON literal: ${JSON.stringify(text)}`);
		}
	}

	function unexpected(c: string): never {
		throw new JsonStreamParseError(`Unexpected character ${JSON.stringify(c)} in JSON`);
	}

	/**
	 * Consumes a decoded text chunk, yielding every event it completes. All parser state lives in
	 * the enclosing scope, so this can be called once per chunk and resumes mid-token.
	 */
	function* feed(chunk: string): Generator<JsonStreamEvent> {
		let i = 0;

		while (i < chunk.length) {
			// --- string scanning: hot path, so consume runs of plain characters at once -------
			if (state === S_STRING) {
				let j = i;
				while (j < chunk.length && chunk[j] !== '"' && chunk[j] !== "\\") {
					j++;
				}
				if (j > i) {
					token += chunk.slice(i, j);
					checkTokenLength();
					i = j;
					continue;
				}
				if (chunk[i] === "\\") {
					state = S_STRING_ESCAPE;
					i++;
					continue;
				}
				// closing quote
				i++;
				const text = token;
				token = "";
				if (stringIsKey) {
					stringIsKey = false;
					state = S_AFTER_KEY;
					yield { type: "key", key: text };
				} else {
					afterValue();
					yield { type: "value", value: text };
				}
				continue;
			}

			if (state === S_STRING_ESCAPE) {
				const c = chunk[i++];
				if (c === "u") {
					unicode = "";
					state = S_STRING_UNICODE;
					continue;
				}
				const escaped = ESCAPES[c];
				if (escaped === undefined) {
					throw new JsonStreamParseError(`Invalid escape sequence "\\${c}" in JSON string`);
				}
				token += escaped;
				checkTokenLength();
				state = S_STRING;
				continue;
			}

			if (state === S_STRING_UNICODE) {
				const c = chunk[i++];
				if (!isHexDigit(c)) {
					throw new JsonStreamParseError(`Invalid unicode escape "\\u${unicode}${c}" in JSON string`);
				}
				unicode += c;
				if (unicode.length === 4) {
					// Surrogate pairs come through as two consecutive escapes and recombine naturally
					// here, since we append raw code units.
					token += String.fromCharCode(parseInt(unicode, 16));
					checkTokenLength();
					unicode = "";
					state = S_STRING;
				}
				continue;
			}

			// --- numbers and literals end on the first character that can't belong to them ----
			if (state === S_NUMBER) {
				let j = i;
				while (j < chunk.length && isNumberChar(chunk[j])) {
					j++;
				}
				if (j > i) {
					token += chunk.slice(i, j);
					checkTokenLength();
					i = j;
					continue;
				}
				yield finishNumber();
				continue; // reprocess chunk[i] in the new state
			}

			if (state === S_LITERAL) {
				let j = i;
				while (j < chunk.length && chunk[j] >= "a" && chunk[j] <= "z") {
					j++;
				}
				if (j > i) {
					token += chunk.slice(i, j);
					checkTokenLength();
					i = j;
					continue;
				}
				yield finishLiteral();
				continue; // reprocess chunk[i] in the new state
			}

			const c = chunk[i];

			if (isWhitespace(c)) {
				i++;
				continue;
			}

			switch (state) {
				case S_VALUE:
				case S_VALUE_OR_ARRAY_END: {
					if (c === "]") {
						if (state !== S_VALUE_OR_ARRAY_END) {
							unexpected(c);
						}
						stack.pop();
						afterValue();
						i++;
						yield { type: "endArray" };
						break;
					}
					if (c === "{") {
						stack.push(false);
						state = S_KEY_OR_OBJECT_END;
						i++;
						yield { type: "startObject" };
						break;
					}
					if (c === "[") {
						stack.push(true);
						state = S_VALUE_OR_ARRAY_END;
						i++;
						yield { type: "startArray" };
						break;
					}
					if (c === '"') {
						stringIsKey = false;
						state = S_STRING;
						i++;
						break;
					}
					if (c === "-" || (c >= "0" && c <= "9")) {
						state = S_NUMBER;
						break; // don't consume: the number scanner takes it
					}
					if (c >= "a" && c <= "z") {
						state = S_LITERAL;
						break; // don't consume: the literal scanner takes it
					}
					unexpected(c);
					break;
				}

				case S_KEY:
				case S_KEY_OR_OBJECT_END: {
					if (c === "}") {
						if (state !== S_KEY_OR_OBJECT_END) {
							unexpected(c); // trailing comma
						}
						stack.pop();
						afterValue();
						i++;
						yield { type: "endObject" };
						break;
					}
					if (c === '"') {
						stringIsKey = true;
						state = S_STRING;
						i++;
						break;
					}
					unexpected(c);
					break;
				}

				case S_AFTER_KEY: {
					if (c !== ":") {
						unexpected(c);
					}
					state = S_VALUE;
					i++;
					break;
				}

				case S_AFTER_VALUE: {
					if (c === ",") {
						state = stack[stack.length - 1] ? S_VALUE : S_KEY;
						i++;
						break;
					}
					if (c === "}") {
						if (stack[stack.length - 1] !== false) {
							unexpected(c);
						}
						stack.pop();
						afterValue();
						i++;
						yield { type: "endObject" };
						break;
					}
					if (c === "]") {
						if (stack[stack.length - 1] !== true) {
							unexpected(c);
						}
						stack.pop();
						afterValue();
						i++;
						yield { type: "endArray" };
						break;
					}
					unexpected(c);
					break;
				}

				case S_DONE:
					throw new JsonStreamParseError(`Unexpected trailing content ${JSON.stringify(c)} after JSON value`);

				default:
					throw new JsonStreamParseError(`Unreachable parser state ${state}`);
			}
		}
	}

	const decoder = new TextDecoder("utf-8");

	for await (const bytes of toByteChunks(source)) {
		const chunk = decoder.decode(bytes, { stream: true });
		if (chunk.length > 0) {
			yield* feed(chunk);
		}
	}
	// flush any incomplete multi-byte sequence (yields U+FFFD, which JSON.parse would also allow)
	const tail = decoder.decode();
	if (tail.length > 0) {
		yield* feed(tail);
	}

	// a number or literal at the very end of the document has no terminating character
	if (state === S_NUMBER) {
		yield finishNumber();
	} else if (state === S_LITERAL) {
		yield finishLiteral();
	}

	if (state !== S_DONE) {
		throw new JsonStreamParseError("Unexpected end of JSON input");
	}
}
