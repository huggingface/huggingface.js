import type { BaseArgs, RequestArgs } from "../../types";
import { omit } from "../../utils/omit";

/**
 * @deprecated
 */
export interface LegacyAudioInput {
	data: Blob | ArrayBuffer;
}

export function preparePayload(args: BaseArgs & ({ inputs: Blob } | LegacyAudioInput)): RequestArgs {
	return "data" in args
		? args
		: {
				...omit(args, "inputs"),
				data: args.inputs,
		  };
}
