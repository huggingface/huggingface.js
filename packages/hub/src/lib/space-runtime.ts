import { HUB_URL } from "../consts";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createApiError, type HubApiError } from "../error";
import type { CredentialsParams, RepoDesignation, SpaceHardwareFlavor, SpaceRuntime } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { toRepoId } from "../utils/toRepoId";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

type SpaceRuntimeParams = {
	repo: RepoDesignation;
	hubUrl?: string;
	fetch?: typeof fetch;
} & Partial<CredentialsParams>;

async function spaceRuntimeRequest(
	params: SpaceRuntimeParams,
	method: "GET" | "POST",
	path: string,
	body?: Record<string, unknown>,
): Promise<SpaceRuntime> {
	const accessToken = params && checkCredentials(params);
	const repoId = toRepoId(params.repo);

	const response = await fetchWithServerWarnings(params.fetch)(
		`${params?.hubUrl || HUB_URL}/api/spaces/${repoId.name}${path}`,
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
 * Get runtime information about a Space: stage, current/requested hardware, sleep time, etc.
 */
export async function spaceRuntime(params: SpaceRuntimeParams): Promise<SpaceRuntime> {
	return spaceRuntimeRequest(params, "GET", "/runtime");
}

/**
 * Pause a Space. A paused Space keeps its build and can be restarted later.
 */
export async function pauseSpace(params: SpaceRuntimeParams): Promise<SpaceRuntime> {
	return spaceRuntimeRequest(params, "POST", "/pause");
}

/**
 * Restart a Space. Pass `factory: true` to rebuild the Space from scratch (factory reboot).
 */
export async function restartSpace(params: SpaceRuntimeParams & { factory?: boolean }): Promise<SpaceRuntime> {
	return spaceRuntimeRequest(params, "POST", params.factory ? "/restart?factory=true" : "/restart");
}

/**
 * Request new hardware for a Space.
 *
 * Optionally set a custom sleep time (in seconds) along with the hardware request.
 */
export async function requestSpaceHardware(
	params: SpaceRuntimeParams & { hardware: SpaceHardwareFlavor; sleepTimeSeconds?: number },
): Promise<SpaceRuntime> {
	return spaceRuntimeRequest(params, "POST", "/hardware", {
		flavor: params.hardware,
		...(params.sleepTimeSeconds !== undefined ? { sleepTimeSeconds: params.sleepTimeSeconds } : {}),
	});
}

/**
 * Set a custom sleep time (in seconds) for a Space running on upgraded hardware.
 *
 * The Space goes to sleep after this many seconds of inactivity and is not billed while sleeping.
 */
export async function setSpaceSleepTime(params: SpaceRuntimeParams & { seconds: number }): Promise<SpaceRuntime> {
	return spaceRuntimeRequest(params, "POST", "/sleeptime", { seconds: params.seconds });
}
