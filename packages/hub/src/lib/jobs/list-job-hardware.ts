import { HUB_URL } from "../../consts";
import { createApiError } from "../../error";
import type { CredentialsParams } from "../../types/public";
import { checkCredentials } from "../../utils/checkCredentials";
import type { ApiJobHardware } from "../../types/api/api-jobs";

/**
 * Get the list of available hardware for jobs.
 * This endpoint is public and does not require authentication, but authentication is optional.
 */
export async function listJobHardware(
	params?: {
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<ApiJobHardware[]> {
	const accessToken = checkCredentials(params ?? {});

	const headers: Record<string, string> = {};

	if (accessToken) {
		headers.Authorization = `Bearer ${accessToken}`;
	}

	const response = await (params?.fetch || fetch)(`${params?.hubUrl || HUB_URL}/api/jobs/hardware`, {
		headers,
	});

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}
