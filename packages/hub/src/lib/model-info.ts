import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiModelInfo } from "../types/api/api-model";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { normalizeInferenceProviderMapping } from "../utils/normalizeInferenceProviderMapping";
import {
	MODEL_EXPAND_KEYS,
	MODEL_DERIVED_FIELD_TO_API_KEY,
	type ModelAdditionalField,
	type ModelDerivedFields,
	type ResolveModelAdditionalFields,
	type ModelEntry,
} from "./list-models";

export async function modelInfo<const T extends ModelAdditionalField = never>(
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
	} & Partial<CredentialsParams>,
): Promise<ModelEntry & ResolveModelAdditionalFields<T>> {
	const accessToken = params && checkCredentials(params);

	const additionalExpandKeys =
		params?.additionalFields?.map(
			(field) => MODEL_DERIVED_FIELD_TO_API_KEY[field as keyof ModelDerivedFields] ?? field
		) ?? [];

	const search = new URLSearchParams([
		...MODEL_EXPAND_KEYS.map((val) => ["expand", val] satisfies [string, string]),
		...additionalExpandKeys.map((val) => ["expand", val] satisfies [string, string]),
	]).toString();

	const response = await (params.fetch || fetch)(
		`${params?.hubUrl || HUB_URL}/api/models/${params.name}/revision/${encodeURIComponent(
			params.revision ?? "HEAD",
		)}?${search.toString()}`,
		{
			headers: {
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			},
		},
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	const data: ApiModelInfo = await response.json();

	const additional: Record<string, unknown> = {};
	if (params?.additionalFields) {
		for (const field of params.additionalFields) {
			if (field === "filePaths") {
				additional.filePaths = (data.siblings ?? []).map((s) => s.rfilename);
			} else if (field === "inferenceProviderMapping" && data.inferenceProviderMapping) {
				additional.inferenceProviderMapping = normalizeInferenceProviderMapping(
					data.id,
					data.inferenceProviderMapping,
				);
			} else {
				additional[field] = data[field as keyof ApiModelInfo];
			}
		}
	}

	return {
		...additional,
		id: data._id,
		name: data.id,
		private: data.private,
		task: data.pipeline_tag,
		downloads: data.downloads,
		gated: data.gated,
		likes: data.likes,
		updatedAt: new Date(data.lastModified),
	} as ModelEntry & ResolveModelAdditionalFields<T>;
}
