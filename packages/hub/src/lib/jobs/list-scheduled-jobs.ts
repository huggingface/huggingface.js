import { HUB_URL } from "../../consts";
import { createApiError } from "../../error";
import type { CredentialsParams } from "../../types/public";
import { checkCredentials } from "../../utils/checkCredentials";
import type { ApiScheduledJob } from "../../types/api/api-jobs";

/**
 * List scheduled jobs for a namespace.
 */
export async function listScheduledJobs(
	params: {
		/**
		 * The namespace (username or organization name)
		 */
		namespace: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams,
): Promise<ApiScheduledJob[]> {
	const accessToken = checkCredentials(params);

	const response = await (params.fetch || fetch)(`${params.hubUrl || HUB_URL}/api/scheduled-jobs/${params.namespace}`, {
		headers: {
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		},
	});

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}
