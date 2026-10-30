import type { RoboticsInput, RoboticsOutput } from "@huggingface/tasks";
import { resolveProvider } from "../../lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../../lib/getProviderHelper.js";
import type { BaseArgs, Options } from "../../types.js";
import { innerRequest } from "../../utils/request.js";

export type RoboticsArgs = BaseArgs & RoboticsInput;

/**
 * One control tick of a robot policy: observation in (camera images, state, instruction), action chunk out.
 * Recommended model: lerobot/smolvla_base
 */
export async function robotics(args: RoboticsArgs, options?: Options): Promise<RoboticsOutput> {
	const provider = await resolveProvider(args.provider, args.model, args.endpointUrl, options);
	const providerHelper = getProviderHelper(provider, "robotics");
	const { data: res } = await innerRequest<RoboticsOutput>(args, providerHelper, {
		...options,
		task: "robotics",
	});
	return providerHelper.getResponse(res);
}
