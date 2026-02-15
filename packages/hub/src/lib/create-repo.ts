import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiCreateRepoPayload } from "../types/api/api-create-repo";
import type { CredentialsParams, RepoDesignation, SpaceSdk } from "../types/public";
import { base64FromBytes } from "../utils/base64FromBytes";
import { checkCredentials } from "../utils/checkCredentials";
import { toRepoId } from "../utils/toRepoId";

export async function createRepo(
	params: {
		repo: RepoDesignation;
		/**
		 * If unset, will follow the organization's default setting. (typically public, except for some Enterprise organizations)
		 */
		private?: boolean;
		resourceGroupId?: string;
		/**
		 * Does not work for buckets
		 */
		license?: string;
		/**
		 * Only a few lightweight files are supported at repo creation - and not for buckets
		 */
		files?: Array<{ content: ArrayBuffer | Blob; path: string }>;
		/** @required for when {@link repo.type} === "space" */
		sdk?: SpaceSdk;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams,
): Promise<{ repoUrl: string; id: string }> {
	const accessToken = checkCredentials(params);
	const repoId = toRepoId(params.repo);
	const [namespace, repoName] = repoId.name.split("/");

	if (!namespace || !repoName) {
		throw new TypeError(
			`"${repoId.name}" is not a fully qualified repo name. It should be of the form "{namespace}/{repoName}".`,
		);
	}

	const res =
		repoId.type === "bucket"
			? await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/buckets/${namespace}/${repoName}`, {
					method: "POST",
					body: JSON.stringify({
						private: params.private,
						resourceGroupId: params.resourceGroupId,
					}),
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
				})
			: await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/repos/create`, {
					method: "POST",
					body: JSON.stringify({
						name: repoName,
						private: params.private,
						organization: namespace,
						resourceGroupId: params.resourceGroupId,
						license: params.license,
						...(repoId.type === "space"
							? {
									type: "space",
									sdk: params.sdk ?? "static",
								}
							: {
									type: repoId.type,
								}),
						files: params.files
							? await Promise.all(
									params.files.map(async (file) => ({
										encoding: "base64",
										path: file.path,
										content: base64FromBytes(
											new Uint8Array(file.content instanceof Blob ? await file.content.arrayBuffer() : file.content),
										),
									})),
								)
							: undefined,
					} satisfies ApiCreateRepoPayload),
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
				});

	if (!res.ok) {
		throw await createApiError(res);
	}
	const output = await res.json();
	return { repoUrl: output.url, id: output.id };
}
