import type { BaseArgs, Options } from "../../types";
import type { TextToVideoInput } from "@huggingface/tasks";
import { request } from "../custom/request";
import { omit } from "../../utils/omit";
import { isUrl } from "../../lib/isUrl";
import { InferenceOutputError } from "../../lib/InferenceOutputError";

export type TextToVideoArgs = BaseArgs & TextToVideoInput;

export type TextToVideoOutput = Blob;

interface FalAiOutput {
	video: {
		url: string;
	};
}

export async function textToVideo(args: TextToVideoArgs, options?: Options): Promise<TextToVideoOutput> {
	const payload = args.provider === "fal-ai" ? { ...omit(args, ["inputs", "parameters"]), prompt: args.inputs, ...args.parameters } : args;
	const res = await request<FalAiOutput>(payload, {
		...options,
		taskHint: "text-to-video",
	});
	const isValidOutput =
		typeof res === "object" &&
		!!res &&
		"video" in res &&
		typeof res.video === "object" &&
		!!res.video &&
		"url" in res.video &&
		typeof res.video.url === "string" &&
		isUrl(res.video.url);
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected { video: { url: string } }");
	}
	const urlResponse = await fetch(res.video.url);
	return await urlResponse.blob();
}
