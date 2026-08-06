import { describe, expect, it } from "vitest";
import { JsonStreamParseError, streamJson, type JsonStreamEvent } from "./streamJson";

const encoder = new TextEncoder();

/** Feeds `text` as a byte stream cut into `chunkSize`-byte pieces (splitting UTF-8 mid-character). */
function byteStream(text: string, chunkSize = Infinity): AsyncIterable<Uint8Array> {
	const bytes = encoder.encode(text);
	return {
		async *[Symbol.asyncIterator]() {
			for (let i = 0; i < bytes.length; i += chunkSize) {
				yield bytes.slice(i, Math.min(i + chunkSize, bytes.length));
			}
		},
	};
}

async function collect(text: string, chunkSize?: number): Promise<JsonStreamEvent[]> {
	const events: JsonStreamEvent[] = [];
	for await (const event of streamJson(byteStream(text, chunkSize))) {
		events.push(event);
	}
	return events;
}

/** Rebuilds a JS value from the event stream, to compare against `JSON.parse`. */
async function reconstruct(text: string, chunkSize?: number): Promise<unknown> {
	let root: unknown;
	const stack: unknown[] = [];
	const keys: (string | undefined)[] = [];
	let pendingKey: string | undefined;

	const attach = (value: unknown): void => {
		const parent = stack[stack.length - 1];
		if (parent === undefined) {
			root = value;
		} else if (Array.isArray(parent)) {
			parent.push(value);
		} else {
			(parent as Record<string, unknown>)[pendingKey as string] = value;
			pendingKey = undefined;
		}
	};

	for await (const event of streamJson(byteStream(text, chunkSize))) {
		switch (event.type) {
			case "startObject":
			case "startArray": {
				const container: unknown = event.type === "startArray" ? [] : {};
				attach(container);
				keys.push(pendingKey);
				pendingKey = undefined;
				stack.push(container);
				break;
			}
			case "endObject":
			case "endArray":
				stack.pop();
				pendingKey = keys.pop();
				break;
			case "key":
				pendingKey = event.key;
				break;
			case "value":
				attach(event.value);
				break;
		}
	}
	return root;
}

describe("streamJson", () => {
	const documents: Record<string, string> = {
		"empty object": "{}",
		"empty array": "[]",
		"top-level string": '"hello"',
		"top-level number": "42",
		"top-level negative float": "-3.5e-12",
		"top-level true": "true",
		"top-level false": "false",
		"top-level null": "null",
		"flat object": '{"a":1,"b":"two","c":true,"d":null}',
		nested: '{"a":{"b":{"c":[1,2,{"d":[]}]}}}',
		"array of objects": '[{"x":1},{"x":2},{"x":3}]',
		"whitespace everywhere": ' { "a" : [ 1 , 2 ] , "b" : { } } ',
		escapes: '{"s":"quote:\\" backslash:\\\\ slash:\\/ \\b\\f\\n\\r\\t"}',
		"unicode escapes": '{"s":"\\u00e9\\u4e2d\\u0041"}',
		"surrogate pair escape": '{"s":"\\ud83e\\udd17"}',
		"multi-byte utf8 literal": '{"emoji":"🤗","accents":"éàü","cjk":"中文"}',
		"empty string key and value": '{"":""}',
		"deep numbers": '{"a":0,"b":-0,"c":1e10,"d":1E+2,"e":0.5}',
		"safetensors-ish": JSON.stringify({
			metadata: { total_size: 1234, total_parameters: "5678" },
			weight_map: { "a.weight": "s1.safetensors", "b.weight": "s2.safetensors" },
		}),
	};

	for (const [name, text] of Object.entries(documents)) {
		it(`matches JSON.parse for ${name}`, async () => {
			expect(await reconstruct(text)).toEqual(JSON.parse(text));
		});

		// chunk size 1 exercises every resumption path, including UTF-8 split mid-character
		it(`matches JSON.parse for ${name} when split byte by byte`, async () => {
			expect(await reconstruct(text, 1)).toEqual(JSON.parse(text));
		});

		it(`matches JSON.parse for ${name} at assorted chunk sizes`, async () => {
			const expected = JSON.parse(text);
			for (const chunkSize of [2, 3, 5, 7, 13]) {
				expect(await reconstruct(text, chunkSize)).toEqual(expected);
			}
		});
	}

	it("emits events in document order", async () => {
		expect(await collect('{"a":[1,"x"],"b":null}')).toEqual([
			{ type: "startObject" },
			{ type: "key", key: "a" },
			{ type: "startArray" },
			{ type: "value", value: 1 },
			{ type: "value", value: "x" },
			{ type: "endArray" },
			{ type: "key", key: "b" },
			{ type: "value", value: null },
			{ type: "endObject" },
		]);
	});

	it("does not buffer the whole document", async () => {
		// 200k entries, all pointing at one of 3 files: a consumer keeping only distinct values
		// should never hold more than those 3 strings.
		const entries = Array.from({ length: 200_000 }, (_, i) => `"t${i}":"shard${i % 3}.safetensors"`);
		const text = `{"weight_map":{${entries.join(",")}}}`;

		const distinct = new Set<string>();
		let count = 0;
		for await (const event of streamJson(byteStream(text, 64 * 1024))) {
			if (event.type === "value" && typeof event.value === "string") {
				distinct.add(event.value);
				count++;
			}
		}

		expect(count).toBe(200_000);
		expect([...distinct].sort()).toEqual(["shard0.safetensors", "shard1.safetensors", "shard2.safetensors"]);
	});

	it("stops reading the source once it throws", async () => {
		let produced = 0;
		const source = {
			async *[Symbol.asyncIterator]() {
				for (let i = 0; i < 1000; i++) {
					produced++;
					yield encoder.encode("!!!!"); // invalid JSON
				}
			},
		};

		await expect(async () => {
			for await (const _event of streamJson(source)) {
				void _event;
			}
		}).rejects.toThrow(JsonStreamParseError);

		expect(produced).toBe(1);
	});

	it("enforces maxDepth instead of growing the container stack", async () => {
		// a document of nothing but "[" would otherwise allocate one stack slot per byte
		const text = "[".repeat(100_000);
		await expect(async () => {
			for await (const _event of streamJson(byteStream(text, 1024), { maxDepth: 64 })) {
				void _event;
			}
		}).rejects.toThrow(/nesting is deeper/);
	});

	it("accepts nesting right up to maxDepth", async () => {
		const text = "[".repeat(64) + "]".repeat(64);
		let depth = 0;
		for await (const event of streamJson(byteStream(text), { maxDepth: 64 })) {
			if (event.type === "startArray") {
				depth++;
			}
		}
		expect(depth).toBe(64);
	});

	it("enforces maxTokenLength", async () => {
		const text = `{"a":"${"x".repeat(5000)}"}`;
		await expect(async () => {
			for await (const _event of streamJson(byteStream(text), { maxTokenLength: 100 })) {
				void _event;
			}
		}).rejects.toThrow(/maximum length/);
	});

	const invalid = [
		"",
		"   ",
		"{",
		"}",
		"[",
		"]",
		'{"a"}',
		'{"a":}',
		'{"a":1,}',
		"[1,]",
		'{,"a":1}',
		"[1 2]",
		'{"a":1}{"b":2}',
		'{"a":1} trailing',
		'"unterminated',
		'{"a":tru}',
		"tru",
		"nul",
		'{"a":"\\q"}',
		'{"a":"\\uZZZZ"}',
		'{"a" 1}',
		"[}",
		"{]",
		'{"a":[1}',
		"1 2",
	];

	for (const text of invalid) {
		it(`rejects ${JSON.stringify(text)}`, async () => {
			// sanity check that JSON.parse agrees this is invalid
			expect(() => JSON.parse(text)).toThrow();

			await expect(async () => {
				for await (const _event of streamJson(byteStream(text))) {
					void _event;
				}
			}).rejects.toThrow(JsonStreamParseError);
		});

		it(`rejects ${JSON.stringify(text)} when split byte by byte`, async () => {
			await expect(async () => {
				for await (const _event of streamJson(byteStream(text, 1))) {
					void _event;
				}
			}).rejects.toThrow(JsonStreamParseError);
		});
	}

	it("accepts a ReadableStream as well as an AsyncIterable", async () => {
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(encoder.encode('{"a":'));
				controller.enqueue(encoder.encode("1}"));
				controller.close();
			},
		});

		const events: JsonStreamEvent[] = [];
		for await (const event of streamJson(stream)) {
			events.push(event);
		}
		expect(events).toEqual([
			{ type: "startObject" },
			{ type: "key", key: "a" },
			{ type: "value", value: 1 },
			{ type: "endObject" },
		]);
	});
});
