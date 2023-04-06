import { expect, it, describe } from "vitest";
import type { ServerSentEvent } from "../src/utils/Uint8ToSseParser";
import { Uint8ToSseParser } from "../src/utils/Uint8ToSseParser";

describe.concurrent("Uint8ToSseStream", () => {
	const enc = new TextEncoder();

	it("basic tests", async () => {
		const parser = new Uint8ToSseParser();
		const expected: ServerSentEvent[] = [];
		const parsed: ServerSentEvent[] = [];

		parser.onEvent = (event: ServerSentEvent) => {
			parsed.push(event);
		};

		// field value spread between chunks + crlf halved between chunks
		parser.addChunk(enc.encode("data:aaaa"));
		parser.addChunk(enc.encode("bbbbb\r"));
		parser.addChunk(enc.encode("\nid:123\n"));
		parser.addChunk(enc.encode("event:123\r\n"));
		expected.push({ data: "aaaabbbbb", event: "123", id: "123", retry: undefined });

		// field name spread between chunks
		parser.addChunk(enc.encode("\r\nda"));
		parser.addChunk(enc.encode("ta:xxxxxxxx"));
		parser.addChunk(enc.encode("\r\n\r\n"));
		expected.push({ data: "xxxxxxxx", event: "", id: "", retry: undefined });

		// mixed crlf/lf
		parser.addChunk(enc.encode("data:abc\r"));
		parser.addChunk(enc.encode("\n\r"));
		expected.push({ data: "abc", event: "", id: "" });
		parser.addChunk(enc.encode("\ndata:xxx\n\n"));
		expected.push({ data: "xxx", event: "", id: "", retry: undefined });

		// mixed cr/lf
		parser.addChunk(enc.encode("data:yyy\r"));
		parser.addChunk(enc.encode("id:aaa\n\n"));
		expected.push({ data: "yyy", event: "", id: "aaa", retry: undefined });

		// multiple lines/events in one chunk
		parser.addChunk(enc.encode("data:yyy\r\nid:123\r\n\r\ndata:zzz\n\n"));
		expected.push({ data: "yyy", event: "", id: "123", retry: undefined });
		expected.push({ data: "zzz", event: "", id: "", retry: undefined });

		// value contains colon
		parser.addChunk(enc.encode("data:my ans"));
		parser.addChunk(enc.encode("wer: AAA\n\n"));
		expected.push({ data: "my answer: AAA", event: "", id: "", retry: undefined });

		// no-value field
		parser.addChunk(enc.encode("data\nid:123\n\n"));
		expected.push({ data: "", event: "", id: "123", retry: undefined });

		// multiple data fields concatenated
		parser.addChunk(enc.encode("data:123\nid:aaa\ndata:456\n\n"));
		expected.push({ data: "123456", event: "", id: "aaa", retry: undefined });

		expect(parsed).toEqual(expected);
	});
});
