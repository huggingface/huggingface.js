import { HUB_URL } from "../../consts";
import { createApiError } from "../../error";
import type { CredentialsParams } from "../../types/public";
import { checkCredentials } from "../../utils/checkCredentials";
import type { ApiScheduledJob, CreateScheduledJobOptions } from "../../types/api/api-jobs";

/**
 * Create a scheduled job.
 */
export async function createScheduledJob(
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
	} & CreateScheduledJobOptions &
		CredentialsParams,
): Promise<ApiScheduledJob> {
	const accessToken = checkCredentials(params);

	const { namespace, hubUrl, fetch: customFetch, ...rest } = params;

	if (!rest.jobSpec.dockerImage && !rest.jobSpec.spaceId) {
		throw new Error("Either dockerImage or spaceId must be provided in jobSpec");
	}

	if (rest.jobSpec.dockerImage && rest.jobSpec.spaceId) {
		throw new Error("Cannot provide both dockerImage and spaceId in jobSpec");
	}

	const body: Record<string, unknown> = {
		jobSpec: {
			flavor: rest.jobSpec.flavor,
		},
		schedule: rest.schedule,
		suspend: rest.suspend ?? false,
		concurrency: rest.concurrency ?? false,
	};

	if (rest.jobSpec.dockerImage) {
		(body.jobSpec as Record<string, unknown>).dockerImage = rest.jobSpec.dockerImage;
	}
	if (rest.jobSpec.spaceId) {
		(body.jobSpec as Record<string, unknown>).spaceId = rest.jobSpec.spaceId;
	}
	if (rest.jobSpec.command) {
		(body.jobSpec as Record<string, unknown>).command = rest.jobSpec.command;
	}
	(body.jobSpec as Record<string, unknown>).environment = rest.jobSpec.environment || {};
	if (rest.jobSpec.secrets) {
		(body.jobSpec as Record<string, unknown>).secrets = rest.jobSpec.secrets;
	}
	if (rest.jobSpec.arch) {
		(body.jobSpec as Record<string, unknown>).arch = rest.jobSpec.arch;
	}
	if (rest.jobSpec.timeoutSeconds !== undefined) {
		(body.jobSpec as Record<string, unknown>).timeoutSeconds = rest.jobSpec.timeoutSeconds;
	}
	if (rest.jobSpec.attempts !== undefined) {
		(body.jobSpec as Record<string, unknown>).attempts = rest.jobSpec.attempts;
	}
	if (rest.jobSpec.labels) {
		(body.jobSpec as Record<string, unknown>).labels = rest.jobSpec.labels;
	}

	const response = await (customFetch || fetch)(`${hubUrl || HUB_URL}/api/scheduled-jobs/${namespace}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}
