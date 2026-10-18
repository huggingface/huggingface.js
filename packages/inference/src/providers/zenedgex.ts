/**
 * ZenEdgeX (Proprio): exact inference for robot policies.
 *
 * See the registered mapping of HF model ID => ZenEdgeX model ID here:
 *
 * https://huggingface.co/api/partners/zenedgex/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at ZenEdgeX and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to ZenEdgeX, please open an issue on the present repo
 * and we will tag ZenEdgeX team members.
 *
 * Thanks!
 */
import type { RoboticsInput, RoboticsOutput } from "@huggingface/tasks";
import { InferenceClientProviderOutputError } from "../errors.js";
import type { BaseArgs, BodyParams, UrlParams } from "../types.js";
import { omit } from "../utils/omit.js";
import type { RoboticsTaskHelper } from "./providerHelper.js";
import { TaskProviderHelper } from "./providerHelper.js";

const ZENEDGEX_API_BASE_URL = "https://api.zenedgex.in";

export class ZenedgexRoboticsTask extends TaskProviderHelper implements RoboticsTaskHelper {
	constructor() {
		super("zenedgex", ZENEDGEX_API_BASE_URL);
	}

	makeRoute(params: UrlParams): string {
		return `/v1/robotics/${params.model}`;
	}

	preparePayload(params: BodyParams<RoboticsInput & BaseArgs>): Record<string, unknown> {
		return {
			...omit(params.args, ["accessToken", "provider", "model", "endpointUrl"]),
			model: params.model,
		};
	}

	override async getResponse(response: unknown): Promise<RoboticsOutput> {
		if (
			typeof response === "object" &&
			response !== null &&
			"actions" in response &&
			Array.isArray(response.actions) &&
			response.actions.every((row: unknown) => Array.isArray(row) && row.every((v) => typeof v === "number"))
		) {
			return response as RoboticsOutput;
		}
		throw new InferenceClientProviderOutputError(
			"Received malformed response from ZenEdgeX robotics API: expected { actions: number[][] }",
		);
	}
}
