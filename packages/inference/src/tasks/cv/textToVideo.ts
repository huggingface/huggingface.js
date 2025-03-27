import type { BaseArgs, InferenceProvider, Options } from "../../types";
import type { TextToVideoInput } from "@huggingface/tasks";
import { request } from "../custom/request";
import { omit } from "../../utils/omit";
import { isUrl } from "../../lib/isUrl";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import { typedInclude } from "../../utils/typedInclude";
import { makeRequestOptions } from "../../lib/makeRequestOptions";
import { pollFalResponse, type FalAiQueueOutput } from "../../providers/fal-ai";

export type TextToVideoArgs = BaseArgs & TextToVideoInput;

export type TextToVideoOutput = Blob;

interface ReplicateOutput {
	output: string;
}

interface NovitaOutput {
	video: {
		video_url: string;
	};
}

const SUPPORTED_PROVIDERS = ["fal-ai", "novita", "replicate"] as const satisfies readonly InferenceProvider[];

export async function textToVideo(args: TextToVideoArgs, options?: Options): Promise<TextToVideoOutput> {
	if (!args.provider || !typedInclude(SUPPORTED_PROVIDERS, args.provider)) {
		throw new Error(
			`textToVideo inference is only supported for the following providers: ${SUPPORTED_PROVIDERS.join(", ")}`
		);
	}

	const payload =
		args.provider === "fal-ai" || args.provider === "replicate" || args.provider === "novita"
			? { ...omit(args, ["inputs", "parameters"]), ...args.parameters, prompt: args.inputs }
			: args;
	const res = await request<FalAiQueueOutput | ReplicateOutput | NovitaOutput>(payload, {
		...options,
		task: "text-to-video",
	});
	if (args.provider === "fal-ai") {
		const { url, info } = await makeRequestOptions(args, { ...options, task: "text-to-video" });
		return await pollFalResponse(res as FalAiQueueOutput, url, info.headers as Record<string, string>);
	} else if (args.provider === "novita") {
		const isValidOutput =
			typeof res === "object" &&
			!!res &&
			"video" in res &&
			typeof res.video === "object" &&
			!!res.video &&
			"video_url" in res.video &&
			typeof res.video.video_url === "string" &&
			isUrl(res.video.video_url);
		if (!isValidOutput) {
			throw new InferenceOutputError("Expected { video: { video_url: string } }");
		}
		const urlResponse = await fetch((res as NovitaOutput).video.video_url);
		return await urlResponse.blob();
	} else {
		/// TODO: Replicate: handle the case where the generation request "times out" / is async (ie output is null)
		/// https://replicate.com/docs/topics/predictions/create-a-prediction
		const isValidOutput =
			typeof res === "object" && !!res && "output" in res && typeof res.output === "string" && isUrl(res.output);
		if (!isValidOutput) {
			throw new InferenceOutputError("Expected { output: string }");
		}
		const urlResponse = await fetch(res.output);
		return await urlResponse.blob();
	}
}
