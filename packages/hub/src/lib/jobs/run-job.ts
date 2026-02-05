import { HUB_URL } from "../../consts";
import { createApiError } from "../../error";
import type { CredentialsParams } from "../../types/public";
import { checkCredentials } from "../../utils/checkCredentials";
import type { ApiJob, CreateJobOptions } from "../../types/api/api-jobs";

/**
 * Run a new job.
 */
export async function runJob(
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
	} & CreateJobOptions &
		CredentialsParams,
): Promise<ApiJob> {
	const accessToken = checkCredentials(params);

	if (!params.dockerImage && !params.spaceId) {
		throw new Error("Either dockerImage or spaceId must be provided");
	}

	if (params.dockerImage && params.spaceId) {
		throw new Error("Cannot provide both dockerImage and spaceId");
	}

	const body: Record<string, unknown> = {
		flavor: params.flavor,
		environment: params.environment || {},
	};

	if (params.dockerImage) {
		body.dockerImage = params.dockerImage;
	}
	if (params.spaceId) {
		body.spaceId = params.spaceId;
	}
	if (params.command) {
		body.command = params.command;
	}
	if (params.arguments) {
		body.arguments = params.arguments;
	}
	if (params.secrets) {
		body.secrets = params.secrets;
	}
	if (params.arch) {
		body.arch = params.arch;
	}
	if (params.timeoutSeconds !== undefined) {
		body.timeoutSeconds = params.timeoutSeconds;
	}
	if (params.attempts !== undefined) {
		body.attempts = params.attempts;
	}
	if (params.labels) {
		body.labels = params.labels;
	}

	const response = await (params.fetch || fetch)(`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}`, {
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
