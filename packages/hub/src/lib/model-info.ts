import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiModelInfo } from "../types/api/api-model";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { pick } from "../utils/pick";
import { MODEL_EXPAND_KEYS, type MODEL_EXPANDABLE_KEYS, type ModelEntry } from "./list-models";

export async function modelInfo<
	const T extends Exclude<(typeof MODEL_EXPANDABLE_KEYS)[number], (typeof MODEL_EXPAND_KEYS)[number]> = never,
>(
	params: {
		name: string;
		hubUrl?: string;
		additionalFields?: T[];
		/**
		 * An optional Git revision id which can be a branch name, a tag, or a commit hash.
		 */
		revision?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>
): Promise<ModelEntry & Pick<ApiModelInfo, T>> {
	const accessToken = params && checkCredentials(params);

	const search = new URLSearchParams([
		...MODEL_EXPAND_KEYS.map((val) => ["expand", val] satisfies [string, string]),
		...(params?.additionalFields?.map((val) => ["expand", val] satisfies [string, string]) ?? []),
	]).toString();

	const response = await (params.fetch || fetch)(
		`${params?.hubUrl || HUB_URL}/api/models/${params.name}/revision/${encodeURIComponent(params.revision ?? "HEAD")}?${search.toString()}`,
		{
			headers: {
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
				Accepts: "application/json",
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	const data = await response.json();

	return {
		...(params?.additionalFields && pick(data, params.additionalFields)),
		id: data._id,
		name: data.id,
		private: data.private,
		task: data.pipeline_tag,
		downloads: data.downloads,
		gated: data.gated,
		likes: data.likes,
		updatedAt: new Date(data.lastModified),
	} as ModelEntry & Pick<ApiModelInfo, T>;
}
