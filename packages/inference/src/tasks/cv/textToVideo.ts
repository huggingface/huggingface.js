import type { TextToVideoInput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import { makeRequestOptions } from "../../lib/makeRequestOptions";
import type { FalAiQueueOutput } from "../../providers/fal-ai";
import type { NovitaOutput } from "../../providers/novita";
import type { ReplicateOutput } from "../../providers/replicate";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";

export type TextToVideoArgs = BaseArgs & TextToVideoInput;

export type TextToVideoOutput = Blob;

export async function textToVideo(args: TextToVideoArgs, options?: Options): Promise<TextToVideoOutput> {
	if (!args.provider) {
		throw new Error("you need to provide a provider that supports text-to-video inference");
	}
	const providerHelper = getProviderHelper(args.provider, "text-to-video");
	const response = await request<FalAiQueueOutput | ReplicateOutput | NovitaOutput>(args, {
		...options,
		task: "text-to-video",
	});
	const { url, info } = await makeRequestOptions(args, { ...options, task: "text-to-video" });
	return (await providerHelper.getResponse(response, url, info.headers as Record<string, string>)) as TextToVideoOutput;
}
