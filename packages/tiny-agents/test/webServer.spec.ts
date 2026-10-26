import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Agent } from "../src/index";
import { startServer } from "../src/lib/webServer";

type AgentRun = (messages: unknown[], opts?: { abortSignal?: AbortSignal }) => AsyncGenerator<unknown>;

function fakeAgent(run: AgentRun): Agent {
	return { prompt: "system prompt", availableTools: [], run } as unknown as Agent;
}

function chunk(content: string) {
	return {
		choices: [{ index: 0, delta: { role: "assistant", content } }],
		created: 1,
		id: "id",
		model: "model",
		system_fingerprint: "",
	};
}

function parseSse(body: string): unknown[] {
	return body
		.split("\n\n")
		.filter((event) => event.startsWith("data: "))
		.map((event) => JSON.parse(event.slice("data: ".length)));
}

describe("tiny-agents web server", () => {
	let server: ReturnType<typeof startServer> | undefined;
	let baseUrl = "";

	beforeEach(() => {
		process.env.PORT = "0";
		vi.spyOn(console, "log").mockImplementation(() => undefined);
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		vi.spyOn(process.stdout, "write").mockImplementation(() => true);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		delete process.env.PORT;
		server?.closeAllConnections();
		await new Promise((resolve) => (server ? server.close(resolve) : resolve(undefined)));
		server = undefined;
	});

	async function start(agent: Agent) {
		const started = startServer(agent);
		server = started;
		if (!started.listening) {
			await new Promise((resolve) => started.once("listening", resolve));
		}
		baseUrl = `http://127.0.0.1:${(started.address() as AddressInfo).port}`;
	}

	function post(content: string, signal?: AbortSignal) {
		return fetch(`${baseUrl}/v1/chat/completions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ stream: true, messages: [{ role: "user", content }] }),
			signal,
		});
	}

	it("decodes multi-byte characters in a request body larger than one chunk", async () => {
		let received: unknown;
		await start(
			fakeAgent(async function* (messages) {
				received = (messages[1] as { content: string }).content;
				yield chunk("ok");
			}),
		);

		// 3 bytes per character, ~360 KB: well over the 64 KiB socket chunk size, so characters straddle chunk boundaries
		const content = "日本語".repeat(40_000);
		const res = await post(content);
		await res.text();

		expect(res.status).toBe(200);
		expect(received).toBe(content);
	});

	it("reports an error thrown by the agent mid-stream as an SSE event and keeps serving", async () => {
		let calls = 0;
		await start(
			fakeAgent(async function* () {
				calls++;
				yield chunk("partial");
				throw new Error("provider failed mid-stream");
			}),
		);

		const res = await post("hello");
		const events = parseSse(await res.text());

		expect(res.status).toBe(200);
		expect(events).toEqual([chunk("partial"), { error: { message: "provider failed mid-stream" } }]);

		// The server must survive: a second request is served normally
		const res2 = await post("hello again");
		expect(parseSse(await res2.text())).toHaveLength(2);
		expect(calls).toBe(2);
	});

	it("aborts the agent when the client disconnects", async () => {
		let signal: AbortSignal | undefined;
		let started: () => void = () => undefined;
		const hasStarted = new Promise<void>((resolve) => (started = resolve));
		await start(
			fakeAgent(async function* (_messages, opts) {
				signal = opts?.abortSignal;
				yield chunk("first");
				started();
				await new Promise<void>((resolve) => signal?.addEventListener("abort", () => resolve()));
			}),
		);

		const controller = new AbortController();
		const res = await post("hello", controller.signal);
		await hasStarted;
		controller.abort();
		await res.text().catch(() => undefined);

		await vi.waitFor(() => expect(signal?.aborted).toBe(true));
	});
});
