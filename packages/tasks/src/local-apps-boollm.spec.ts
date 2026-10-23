import { describe, expect, it } from "vitest";
import { LOCAL_APPS } from "./local-apps.js";
import type { ModelData } from "./model-data.js";

const gguf = { total: 1, architecture: "qwen2", context_length: 32768 };
const model: ModelData = {
	id: "bartowski/Qwen2.5-3B-Instruct-GGUF",
	tags: ["gguf", "conversational"],
	inference: "",
	pipeline_tag: "text-generation",
	gguf,
};

describe("Boollm local app", () => {
	it.each(["llama", "qwen2"])("shows tested %s text GGUF models", (architecture) => {
		expect(LOCAL_APPS.boollm.displayOnModelPage({ ...model, gguf: { ...gguf, architecture } })).toBe(true);
	});
	it.each(["moonshine", "citrinet", "whisper", "qwen2vl", "clip", "unknown", ""])(
		"does not advertise unsupported or missing architecture %s",
		(architecture) => {
			expect(LOCAL_APPS.boollm.displayOnModelPage({ ...model, gguf: { ...gguf, architecture } })).toBe(false);
		},
	);
	it("hides non-GGUF, missing context and non-text models", () => {
		expect(LOCAL_APPS.boollm.displayOnModelPage({ ...model, gguf: undefined })).toBe(false);
		expect(LOCAL_APPS.boollm.displayOnModelPage({ ...model, gguf: { total: 1, architecture: "llama" } })).toBe(false);
		expect(LOCAL_APPS.boollm.displayOnModelPage({ ...model, pipeline_tag: "automatic-speech-recognition" })).toBe(
			false,
		);
		expect(LOCAL_APPS.boollm.displayOnModelPage({ ...model, pipeline_tag: "image-text-to-text" })).toBe(false);
	});
	it("opens a repository without automatically choosing or running a file", () => {
		const url = LOCAL_APPS.boollm.deeplink(model, undefined);
		expect(url.protocol).toBe("boollm:");
		expect(url.host).toBe("open_from_hf");
		expect([...url.searchParams]).toEqual([["model", model.id]]);
	});
	it("encodes file paths as a single parameter, never extra actions", () => {
		const file = "Q4_K_M/Qwen2.5-3B-Instruct-Q4_K_M.gguf";
		expect(LOCAL_APPS.boollm.deeplink(model, file).searchParams.get("file")).toBe(file);
		const unusual = "weights & action=run.gguf";
		const url = LOCAL_APPS.boollm.deeplink(model, unusual);
		expect(url.searchParams.get("file")).toBe(unusual);
		expect(url.searchParams.has("action")).toBe(false);
	});
});
