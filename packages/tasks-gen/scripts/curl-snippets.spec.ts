import { describe, expect, it } from "vitest";
import { snippets } from "@huggingface/inference";
import type { ModelDataMinimal } from "@huggingface/tasks";

const { getInferenceSnippets } = snippets;

const model = (pipeline_tag: ModelDataMinimal["pipeline_tag"], id = "test/model"): ModelDataMinimal => ({
	id,
	pipeline_tag,
	inference: "",
	tags: [],
});

// Run the generated command in a POSIX shell, replacing curl so no HTTP request is sent.
async function getCurlPayload(snippets: ReturnType<typeof getInferenceSnippets>): Promise<Record<string, unknown>> {
	const snippet = snippets.find(({ client }) => client === "curl");
	expect(snippet).toBeDefined();
	const { spawnSync } = await import("node:child_process");
	const result = spawnSync(
		"sh",
		[
			"-eu",
			"-c",
			`curl() {
    while [ "$#" -gt 0 ]; do
        if [ "$1" = "-d" ]; then
            shift
            printf '%s' "$1"
            return
        fi
        shift
    done
    return 1
}
${snippet?.content}`,
		],
		{ encoding: "utf8", env: { HF_TOKEN: "hf_test" }, timeout: 5000 },
	);
	expect(result.error).toBeUndefined();
	expect(result.stderr).toBe("");
	expect(result.status).toBe(0);
	return JSON.parse(result.stdout);
}

describe.skipIf(process.platform === "win32")("cURL snippet payloads", () => {
	it("sends the default ranking input as an object and preserves its apostrophe", async () => {
		const payload = await getCurlPayload(getInferenceSnippets(model("text-ranking"), "hf-inference"));
		expect(payload.inputs).toMatchObject({
			query: "Which planet is known as the Red Planet?",
			texts: expect.arrayContaining(["Venus is often called Earth's twin because of its similar size and proximity."]),
		});
	});

	it("sends the default sentence-similarity input as an object", async () => {
		const payload = await getCurlPayload(getInferenceSnippets(model("sentence-similarity"), "hf-inference"));
		expect(payload.inputs).toEqual({
			source_sentence: "That is a happy person",
			sentences: ["That is a happy dog", "That is a very happy person", "Today is a sunny day"],
		});
	});

	it("does not add quotes to a default text input", async () => {
		const payload = await getCurlPayload(getInferenceSnippets(model("token-classification"), "hf-inference"));
		expect(payload.inputs).toBe("My name is Sarah Jessica Parker but you can call me Jessica");
	});

	it("normalizes the input before applying the provider's payload mapping", async () => {
		const payload = await getCurlPayload(getInferenceSnippets(model("feature-extraction"), "deepinfra"));
		expect(payload).toEqual({
			input: "Today is a sunny day and I will get some ice cream.",
			model: "test/model",
		});
	});

	it("preserves custom inputs, including JSON-looking strings and shell characters", async () => {
		const inputs = {
			source_sentence: '{"literal":true}',
			sentences: [
				'It\'s quoted: "hello"\nnext line',
				"true",
				"123",
				"你好",
				"\\ $HOME `printf expanded` $(printf expanded)",
			],
		};
		const payload = await getCurlPayload(
			getInferenceSnippets(model("sentence-similarity"), "hf-inference", undefined, { inputs }),
		);
		expect(payload.inputs).toEqual(inputs);
	});

	it.each([false, true])("preserves conversational messages when streaming=%s", async (streaming) => {
		const messages = [{ role: "user", content: "What's new? $HOME `printf expanded` $(printf expanded)" }];
		const payload = await getCurlPayload(
			getInferenceSnippets(model("text-generation"), "auto", undefined, { messages, streaming }),
		);
		expect(payload).toEqual({ messages, model: "test/model", stream: streaming });
	});

	it("keeps the default zero-shot classification input and labels", async () => {
		const payload = await getCurlPayload(getInferenceSnippets(model("zero-shot-classification"), "hf-inference"));
		expect(payload).toEqual({
			inputs:
				"Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!",
			parameters: { candidate_labels: ["refund", "legal", "faq"] },
		});
	});

	it("preserves custom zero-shot classification inputs", async () => {
		const inputs = ["What's the status?", '{"literal":true}'];
		const payload = await getCurlPayload(
			getInferenceSnippets(model("zero-shot-classification"), "hf-inference", undefined, { inputs }),
		);
		expect(payload).toEqual({ inputs, parameters: { candidate_labels: ["refund", "legal", "faq"] } });
	});
});
