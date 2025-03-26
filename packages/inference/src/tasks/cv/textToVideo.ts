import type { TextToVideoInput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import { makeRequestOptions } from "../../lib/makeRequestOptions";
import type { FalAiQueueOutput } from "../../providers/fal-ai";
import type { NovitaOutput } from "../../providers/novita";
import type { ReplicateOutput } from "../../providers/replicate";
import type { BaseArgs, InferenceProvider, Options } from "../../types";
import { typedInclude } from "../../utils/typedInclude";
import { request } from "../custom/request";

export type TextToVideoArgs = BaseArgs & TextToVideoInput;

export type TextToVideoOutput = Blob;

const SUPPORTED_PROVIDERS = ["fal-ai", "novita", "replicate"] as const satisfies readonly InferenceProvider[];

export async function textToVideo(args: TextToVideoArgs, options?: Options): Promise<TextToVideoOutput> {
	if (!args.provider || !typedInclude(SUPPORTED_PROVIDERS, args.provider)) {
		throw new Error(
			`textToVideo inference is only supported for the following providers: ${SUPPORTED_PROVIDERS.join(", ")}`
		);
	}
	const providerHelper = getProviderHelper(args.provider, "text-to-video");
	const res = await request<FalAiQueueOutput | ReplicateOutput | NovitaOutput>(args, {
		...options,
		task: "text-to-video",
	});
	const { url, info } = await makeRequestOptions(args, { ...options, task: "text-to-video" });
	return await providerHelper.getResponse(res, url, info.headers as Record<string, string>);
}
