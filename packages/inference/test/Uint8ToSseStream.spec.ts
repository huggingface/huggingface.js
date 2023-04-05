import { expect, it, describe } from "vitest";
import type { ServerSentEvent } from "../src/utils/Uint8ToSseStream";
import { Uint8ToSseStream } from "../src/utils/Uint8ToSseStream";

describe.concurrent("Uint8ToSseStream", () => {
	const tr = new Uint8ToSseStream();
	const enc = new TextEncoder();
	const expected: ServerSentEvent[] = [];

	it("basic tests", async () => {
		const source = new ReadableStream({
			start(controller) {
				// field value spread between chunks + crlf halved between chunks
				controller.enqueue(enc.encode("data:aaaa"));
				controller.enqueue(enc.encode("bbbbb\r"));
				controller.enqueue(enc.encode("\nid:123\n"));
				controller.enqueue(enc.encode("event:123\r\n"));
				expected.push({ data: "aaaabbbbb", event: "123", id: "123", retry: undefined });

				// field name spread between chunks
				controller.enqueue(enc.encode("\r\nda"));
				controller.enqueue(enc.encode("ta:xxxxxxxx"));
				controller.enqueue(enc.encode("\r\n\r\n"));
				expected.push({ data: "xxxxxxxx", event: "", id: "", retry: undefined });

				// mixed crlf/lf
				controller.enqueue(enc.encode("data:abc\r"));
				controller.enqueue(enc.encode("\n\r"));
				expected.push({ data: "abc", event: "", id: "" });
				controller.enqueue(enc.encode("\ndata:xxx\n\n"));
				expected.push({ data: "xxx", event: "", id: "", retry: undefined });

				// mixed cr/lf
				controller.enqueue(enc.encode("data:yyy\r"));
				controller.enqueue(enc.encode("id:aaa\n\n"));
				expected.push({ data: "yyy", event: "", id: "aaa", retry: undefined });

				// multiple lines/events in one chunk
				controller.enqueue(enc.encode("data:yyy\r\nid:123\r\n\r\ndata:zzz\n\n"));
				expected.push({ data: "yyy", event: "", id: "123", retry: undefined });
				expected.push({ data: "zzz", event: "", id: "", retry: undefined });

				// value contains colon
				controller.enqueue(enc.encode("data:my ans"));
				controller.enqueue(enc.encode("wer: AAA\n\n"));
				expected.push({ data: "my answer: AAA", event: "", id: "", retry: undefined });

				// no-value field
				controller.enqueue(enc.encode("data\nid:123\n\n"));
				expected.push({ data: "", event: "", id: "123", retry: undefined });

				// multiple data fields concatenated
				controller.enqueue(enc.encode("data:123\nid:aaa\ndata:456\n\n"));
				expected.push({ data: "123456", event: "", id: "aaa", retry: undefined });
				controller.close();
			},
		});
		const events = source.pipeThrough(tr);
		const reader = events.getReader();

		let item: ReadableStreamReadResult<ServerSentEvent>;
		const items: ServerSentEvent[] = [];
		while (!(item = await reader.read()).done) {
			items.push(item.value);
		}
		expect(items).toEqual(expected);
	});
});
