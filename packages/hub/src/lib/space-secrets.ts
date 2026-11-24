import { HUB_URL } from "../consts";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createApiError, type HubApiError } from "../error";
import type { CredentialsParams, RepoDesignation } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { toRepoId } from "../utils/toRepoId";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

/**
 * Metadata of a Space secret. Secret values are write-only and can never be read back.
 */
export interface SpaceSecretInfo {
	description?: string | null;
	/** ISO date string, present once the secret has been updated at least once */
	updatedAt?: string | null;
}

type SpaceSecretsParams = {
	repo: RepoDesignation;
	hubUrl?: string;
	fetch?: typeof fetch;
} & Partial<CredentialsParams>;

/**
 * List the secrets of a Space, keyed by secret name. Values are never returned.
 */
export async function listSpaceSecrets(params: SpaceSecretsParams): Promise<Record<string, SpaceSecretInfo>> {
	const accessToken = params && checkCredentials(params);
	const repoId = toRepoId(params.repo);

	const response = await fetchWithServerWarnings(params.fetch)(
		`${params?.hubUrl || HUB_URL}/api/spaces/${repoId.name}/secrets`,
		{
			headers: {
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			},
		},
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	return response.json();
}

/**
 * Add or update a secret on a Space.
 */
export async function addSpaceSecret(
	params: SpaceSecretsParams & { key: string; value: string; description?: string },
): Promise<void> {
	const accessToken = params && checkCredentials(params);
	const repoId = toRepoId(params.repo);

	const response = await fetchWithServerWarnings(params.fetch)(
		`${params?.hubUrl || HUB_URL}/api/spaces/${repoId.name}/secrets`,
		{
			method: "POST",
			headers: {
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				key: params.key,
				value: params.value,
				...(params.description !== undefined ? { description: params.description } : {}),
			}),
		},
	);

	if (!response.ok) {
		throw await createApiError(response);
	}
}

/**
 * Delete a secret from a Space.
 */
export async function deleteSpaceSecret(params: SpaceSecretsParams & { key: string }): Promise<void> {
	const accessToken = params && checkCredentials(params);
	const repoId = toRepoId(params.repo);

	const response = await fetchWithServerWarnings(params.fetch)(
		`${params?.hubUrl || HUB_URL}/api/spaces/${repoId.name}/secrets`,
		{
			method: "DELETE",
			headers: {
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ key: params.key }),
		},
	);

	if (!response.ok) {
		throw await createApiError(response);
	}
}
