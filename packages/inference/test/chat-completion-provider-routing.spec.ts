import { describe, expect, it, vi } from "vitest";
import { chatCompletion } from "../src/tasks/nlp/chatCompletion.js";

const chatResponse = () =>
	new Response(
		JSON.stringify({
			id: "id",
			created: 0,
			model: "meta-llama/Llama-3.3-70B-Instruct",
			choices: [{ message: { role: "assistant", content: "Hi" } }],
			usage: {},
		}),
		{
			headers: { "Content-Type": "application/json" },
		},
	);

describe("chatCompletion with a provider", () => {
	it("goes through the router with a `model:provider` suffix when using a HF token", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => Promise.resolve(chatResponse()));

		await chatCompletion(
			{
				accessToken: "hf_test",
				model: "meta-llama/Llama-3.3-70B-Instruct",
				provider: "together",
				messages: [{ role: "user", content: "Hello" }],
			},
			{ fetch: fetchMock },
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("https://router.huggingface.co/v1/chat/completions");
		expect(JSON.parse(init?.body as string).model).toBe("meta-llama/Llama-3.3-70B-Instruct:together");
	});
});
