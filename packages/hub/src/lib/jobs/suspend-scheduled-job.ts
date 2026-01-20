import { HUB_URL } from "../../consts";
import { createApiError } from "../../error";
import type { CredentialsParams } from "../../types/public";
import { checkCredentials } from "../../utils/checkCredentials";

/**
 * Suspend (pause) a scheduled job.
 */
export async function suspendScheduledJob(
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
): Promise<void> {
	const accessToken = checkCredentials(params);

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/scheduled-jobs/${params.namespace}/${params.jobId}/suspend`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			},
		},
	);

	if (!response.ok) {
		throw await createApiError(response);
	}
}
