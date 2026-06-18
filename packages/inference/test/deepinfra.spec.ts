import { describe, expect, it } from "vitest";
import { DeepInfraAutomaticSpeechRecognitionTask } from "../src/providers/deepinfra.js";

describe("DeepInfra automatic-speech-recognition", () => {
	const helper = new DeepInfraAutomaticSpeechRecognitionTask();

	it("routes to the OpenAI-compatible transcription endpoint", () => {
		expect(helper.makeRoute()).toBe("v1/openai/audio/transcriptions");
	});

	it("builds a multipart body with the audio file and mapped model", () => {
		const body = helper.makeBody({
			args: { data: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/x-wav" }) },
			model: "nvidia/Some-Provider-ASR-Model",
		});
		expect(body).toBeInstanceOf(FormData);
		const formData = body as FormData;
		expect(formData.get("model")).toBe("nvidia/Some-Provider-ASR-Model");
		const file = formData.get("file");
		expect(file).toBeInstanceOf(Blob);
		expect((file as File).name).toBe("audio.wav");
	});

	it("does not let parameters override the mapped model", () => {
		const body = helper.makeBody({
			args: {
				data: new Blob([new Uint8Array([1])], { type: "audio/x-wav" }),
				parameters: { model: "attacker/model" },
			},
			model: "nvidia/Some-Provider-ASR-Model",
		}) as FormData;
		expect(body.get("model")).toBe("nvidia/Some-Provider-ASR-Model");
	});

	it("derives the file extension from a parameterized MIME type", () => {
		const body = helper.makeBody({
			args: { data: new Blob([new Uint8Array([1])], { type: "audio/webm;codecs=opus" }) },
			model: "nvidia/Some-Provider-ASR-Model",
		}) as FormData;
		expect((body.get("file") as File).name).toBe("audio.webm");
	});

	it("maps response segments to chunks", async () => {
		const out = await helper.getResponse({
			text: "hello world",
			segments: [{ start: 0, end: 1.5, text: "hello world" }],
		});
		expect(out).toEqual({ text: "hello world", chunks: [{ text: "hello world", timestamp: [0, 1.5] }] });
	});

	it("throws on a malformed response", async () => {
		await expect(helper.getResponse({} as never)).rejects.toThrow();
	});
});
