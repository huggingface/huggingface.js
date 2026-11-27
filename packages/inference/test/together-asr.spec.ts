import { describe, expect, it } from "vitest";
import { TogetherAutomaticSpeechRecognitionTask } from "../src/providers/together.js";

function uploadedFilename(mimeType: string): string | undefined {
	const body = new TogetherAutomaticSpeechRecognitionTask().makeBody({
		args: { data: new Blob([new Uint8Array([1, 2, 3])], { type: mimeType }) },
		model: "openai/whisper-large-v3",
	});
	const file = (body as FormData).get("file");
	return file instanceof File ? file.name : undefined;
}

describe("Together automatic-speech-recognition upload", () => {
	it.each([
		// Browser MediaRecorder reports codec parameters on the MIME type.
		["audio/webm;codecs=opus", "audio.webm"],
		["audio/ogg; codecs=opus", "audio.ogg"],
		// Formats listed at https://docs.together.ai/docs/speech-to-text
		["audio/mp4", "audio.m4a"],
		["audio/opus", "audio.opus"],
		["audio/aac", "audio.aac"],
		["audio/mpeg", "audio.mp3"],
		["", "audio.wav"],
	])("names a %j blob %s", (mimeType, expected) => {
		expect(uploadedFilename(mimeType)).toBe(expected);
	});
});
