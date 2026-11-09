import { HUB_URL } from "../consts";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createApiError, type HubApiError } from "../error";
import type { CredentialsParams, RepoDesignation } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { toRepoId } from "../utils/toRepoId";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

/**
 * A Space variable: a publicly visible key/value pair stored on the Space.
 */
export interface SpaceVariableInfo {
	value: string;
	description?: string | null;
	/** ISO date string, present once the variable has been updated at least once */
	updatedAt?: string | null;
}

type SpaceVariablesParams = {
	repo: RepoDesignation;
	hubUrl?: string;
	fetch?: typeof fetch;
} & Partial<CredentialsParams>;

async function spaceVariablesRequest(
	params: SpaceVariablesParams,
	method: "GET" | "POST" | "DELETE",
	body?: Record<string, unknown>,
): Promise<Record<string, SpaceVariableInfo>> {
	const accessToken = params && checkCredentials(params);
	const repoId = toRepoId(params.repo);

	const response = await fetchWithServerWarnings(params.fetch)(
		`${params?.hubUrl || HUB_URL}/api/spaces/${repoId.name}/variables`,
		{
			method,
			headers: {
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
				...(body ? { "Content-Type": "application/json" } : {}),
			},
			...(body ? { body: JSON.stringify(body) } : {}),
		},
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	return response.json();
}

/**
 * List the variables of a Space, keyed by variable name.
 */
export async function listSpaceVariables(params: SpaceVariablesParams): Promise<Record<string, SpaceVariableInfo>> {
	return spaceVariablesRequest(params, "GET");
}

/**
 * Add or update a variable on a Space. Returns the updated variables of the Space.
 */
export async function addSpaceVariable(
	params: SpaceVariablesParams & { key: string; value: string; description?: string },
): Promise<Record<string, SpaceVariableInfo>> {
	return spaceVariablesRequest(params, "POST", {
		key: params.key,
		value: params.value,
		...(params.description !== undefined ? { description: params.description } : {}),
	});
}

/**
 * Delete a variable from a Space. Returns the updated variables of the Space.
 */
export async function deleteSpaceVariable(
	params: SpaceVariablesParams & { key: string },
): Promise<Record<string, SpaceVariableInfo>> {
	return spaceVariablesRequest(params, "DELETE", { key: params.key });
}
