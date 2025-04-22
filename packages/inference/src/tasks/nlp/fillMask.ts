import type { FillMaskInput, FillMaskOutput } from "@huggingface/tasks";
import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type FillMaskArgs = BaseArgs & FillMaskInput;

/**
 * Tries to fill in a hole with a missing word (token to be precise). That’s the base task for BERT models.
 */
export async function fillMask(args: FillMaskArgs, options?: Options): Promise<FillMaskOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "fill-mask");
	const { data: res } = await innerRequest<FillMaskOutput>(args, providerHelper, {
		...options,
		task: "fill-mask",
	});
	return providerHelper.getResponse(res);
}
