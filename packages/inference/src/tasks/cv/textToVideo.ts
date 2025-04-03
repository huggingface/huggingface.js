import type { TextToVideoInput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import { isUrl } from "../../lib/isUrl";
import { pollFalResponse, type FalAiQueueOutput } from "../../providers/fal-ai";
import type { BaseArgs, InferenceProvider, Options } from "../../types";
import { omit } from "../../utils/omit";
import { innerRequest } from "../../utils/request";
import { typedInclude } from "../../utils/typedInclude";

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
	const { data, requestContext } = await innerRequest<FalAiQueueOutput | ReplicateOutput | NovitaOutput>(payload, {
		...options,
		task: "text-to-video",
	});

	if (args.provider === "fal-ai") {
		return await pollFalResponse(
			data as FalAiQueueOutput,
			requestContext.url,
			requestContext.info.headers as Record<string, string>
		);
	} else if (args.provider === "novita") {
		const isValidOutput =
			typeof data === "object" &&
			!!data &&
			"video" in data &&
			typeof data.video === "object" &&
			!!data.video &&
			"video_url" in data.video &&
			typeof data.video.video_url === "string" &&
			isUrl(data.video.video_url);
		if (!isValidOutput) {
			throw new InferenceOutputError("Expected { video: { video_url: string } }");
		}
		const urlResponse = await fetch((data as NovitaOutput).video.video_url);
		return await urlResponse.blob();
	} else {
		/// TODO: Replicate: handle the case where the generation request "times out" / is async (ie output is null)
		/// https://replicate.com/docs/topics/predictions/create-a-prediction
		const isValidOutput =
			typeof data === "object" && !!data && "output" in data && typeof data.output === "string" && isUrl(data.output);
		if (!isValidOutput) {
			throw new InferenceOutputError("Expected { output: string }");
		}
		const urlResponse = await fetch(data.output);
		return await urlResponse.blob();
	}
}
