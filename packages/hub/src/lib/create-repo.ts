import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiCreateRepoPayload, Credentials, RepoId, SpaceSdk } from "../types";
import { base64FromBytes } from "../utils";

export async function createRepo(params: {
	repo:        RepoId;
	credentials: Credentials;
	private?:    boolean;
	license?:    string;
	/**
	 * Only a few lightweight files are supported at repo creation
	 */
	files?:      Array<{ content: ArrayBuffer | Blob; path: string }>;
	/** @required for when {@link repo.type} === "space" */
	sdk?:        SpaceSdk;
	hubUrl?:     string;
}): Promise<void> {
	const [namespace, repoName] = params.repo.name.split("/");

	const res = await fetch(`${params.hubUrl ?? HUB_URL}/api/repos/create`, {
		method: "POST",
		body:   JSON.stringify({
			name:         repoName,
			private:      params.private,
			organization: namespace,
			license:      params.license,
			...(params.repo.type === "space"
				? {
						type: "space",
						sdk:  "static",
				  }
				: {
						type: params.repo.type,
				  }),
			files: params.files
				? await Promise.all(
						params.files.map(async (file) => ({
							encoding: "base64",
							path:     file.path,
							content:  base64FromBytes(
								new Uint8Array(file.content instanceof Blob ? await file.content.arrayBuffer() : file.content)
							),
						}))
				  )
				: undefined,
		} satisfies ApiCreateRepoPayload),
		headers: {
			Authorization:  `Bearer ${params.credentials.accessToken}`,
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		throw await createApiError(res);
	}
}
