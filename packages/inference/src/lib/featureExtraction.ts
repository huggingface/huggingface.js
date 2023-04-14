import type { FeatureExtractionArgs, FeatureExtractionReturn, Options } from "../types";
import { request } from "./request";

/**
 * This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.
 */
export async function featureExtraction(
	args: FeatureExtractionArgs,
	options?: Options
): Promise<FeatureExtractionReturn> {
	const res = await request<FeatureExtractionReturn>(args, options);
	let isValidOutput = true;
	// Check if output is an array
	if (Array.isArray(res)) {
		for (const e of res) {
			// Check if output is an array of arrays or numbers
			if (Array.isArray(e)) {
				// if all elements are numbers, continue
				isValidOutput = e.every((x) => typeof x === "number");
				if (!isValidOutput) {
					break;
				}
			} else if (typeof e !== "number") {
				isValidOutput = false;
				break;
			}
		}
	} else {
		isValidOutput = false;
	}
	if (!isValidOutput) {
		throw new TypeError("Invalid inference output: output must be of type Array<Array<number> | number>");
	}
	return res;
}
