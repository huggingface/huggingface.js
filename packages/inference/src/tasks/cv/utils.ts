import type { BaseArgs, RequestArgs } from "../../types";
import { omit } from "../../utils/omit";

/**
 * @deprecated
 */
export interface LegacyImageInput {
	data: Blob | ArrayBuffer;
}

export function preparePayload(args: BaseArgs & ({ inputs: Blob } | LegacyImageInput)): RequestArgs {
	return "data" in args ? args : { ...omit(args, "inputs"), data: args.inputs };
}
