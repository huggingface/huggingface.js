import type { TextToVideoInput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import { isUrl } from "../../lib/isUrl";
import { pollFalResponse, type FalAiQueueOutput } from "../../providers/fal-ai";
import type { BaseArgs, InferenceProvider, Options } from "../../types";
import { omit } from "../../utils/omit";
import { typedInclude } from "../../utils/typedInclude";
import { request, type ResponseWrapper } from "../custom/request";

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
	const response = await request<ResponseWrapper<FalAiQueueOutput | ReplicateOutput | NovitaOutput>>(payload, {
		...options,
		task: "text-to-video",
		withRequestContext: true,
	});

	const { data: res, requestContext } = response;
	if (args.provider === "fal-ai") {
		return await pollFalResponse(res as FalAiQueueOutput, requestContext.url, requestContext.headers);
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
