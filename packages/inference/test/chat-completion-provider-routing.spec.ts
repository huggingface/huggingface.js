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
	it("goes through the router with a `model:provider` suffix", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() => Promise.resolve(chatResponse()));

		/// Any provider the router routes to, not only the client's providers
		for (const provider of ["together", "mistral"]) {
			await chatCompletion(
				{
					accessToken: "hf_test",
					model: "meta-llama/Llama-3.3-70B-Instruct",
					provider,
					messages: [{ role: "user", content: "Hello" }],
				},
				{ fetch: fetchMock },
			);
		}

		expect(fetchMock).toHaveBeenCalledTimes(2);
		for (const [index, provider] of ["together", "mistral"].entries()) {
			const [url, init] = fetchMock.mock.calls[index];
			expect(url).toBe("https://router.huggingface.co/v1/chat/completions");
			expect(JSON.parse(init?.body as string).model).toBe(`meta-llama/Llama-3.3-70B-Instruct:${provider}`);
		}
	});

	it("rejects a provider key", async () => {
		await expect(
			chatCompletion({
				accessToken: "together_key",
				model: "meta-llama/Llama-3.3-70B-Instruct",
				provider: "together",
				messages: [{ role: "user", content: "Hello" }],
			}),
		).rejects.toThrow("Cannot select auto-router when using non-Hugging Face API key.");
	});
});
