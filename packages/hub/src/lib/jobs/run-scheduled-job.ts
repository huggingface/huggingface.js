import { HUB_URL } from "../../consts";
import { createApiError } from "../../error";
import type { CredentialsParams } from "../../types/public";
import { checkCredentials } from "../../utils/checkCredentials";
import type { ApiJob } from "../../types/api/api-jobs";

/**
 * Trigger a scheduled job to run immediately.
 * Returns the job that was triggered, or null if another instance is already running.
 */
export async function runScheduledJob(
	params: {
		/**
		 * The namespace (username or organization name)
		 */
		namespace: string;
		/**
		 * The scheduled job ID
		 */
		jobId: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams,
): Promise<ApiJob | null> {
	const accessToken = checkCredentials(params);

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/scheduled-jobs/${params.namespace}/${params.jobId}/run`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			},
		},
	);

	if (!response.ok) {
		if (response.status === 409) {
			// Another instance is already running
			return null;
		}
		throw await createApiError(response);
	}

	return await response.json();
}
