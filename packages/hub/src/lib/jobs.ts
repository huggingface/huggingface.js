import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import type {
	ApiJob,
	ApiJobHardware,
	ApiScheduledJob,
	CreateJobOptions,
	CreateScheduledJobOptions,
} from "../types/api/api-jobs";

/**
 * Get the list of available hardware for jobs.
 * This endpoint is public and does not require authentication.
 */
export async function listJobHardware(params?: {
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): Promise<ApiJobHardware[]> {
	const response = await (params?.fetch || fetch)(`${params?.hubUrl || HUB_URL}/api/jobs/hardware`, {
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}

/**
 * List jobs for a namespace (user or organization).
 */
export async function listJobs(
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
	} & CredentialsParams
): Promise<ApiJob[]> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}`, {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}

/**
 * Get a specific job by ID.
 */
export async function getJob(
	params: {
		/**
		 * The namespace (username or organization name)
		 */
		namespace: string;
		/**
		 * The job ID
		 */
		jobId: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams
): Promise<ApiJob> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}/${params.jobId}`,
		{
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}

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
		CredentialsParams
): Promise<ApiJob> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	if (!params.dockerImage && !params.spaceId) {
		throw new Error("Either dockerImage or spaceId must be provided");
	}

	if (params.dockerImage && params.spaceId) {
		throw new Error("Cannot provide both dockerImage and spaceId");
	}

	const body: Record<string, unknown> = {
		flavor: params.flavor,
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
	if (params.environment) {
		body.environment = params.environment;
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

	const response = await (params.fetch || fetch)(`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}

/**
 * Cancel a job.
 */
export async function cancelJob(
	params: {
		/**
		 * The namespace (username or organization name)
		 */
		namespace: string;
		/**
		 * The job ID
		 */
		jobId: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams
): Promise<ApiJob> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}/${params.jobId}/cancel`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}

/**
 * Duplicate a job (re-run with the same spec).
 */
export async function duplicateJob(
	params: {
		/**
		 * The namespace (username or organization name)
		 */
		namespace: string;
		/**
		 * The job ID to duplicate
		 */
		jobId: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams
): Promise<ApiJob> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}/${params.jobId}/duplicate`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}

/**
 * Stream job logs using Server-Sent Events (SSE).
 * Returns an async iterable of log chunks.
 */
export async function* streamJobLogs(
	params: {
		/**
		 * The namespace (username or organization name)
		 */
		namespace: string;
		/**
		 * The job ID
		 */
		jobId: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams
): AsyncGenerator<string, void, unknown> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}/${params.jobId}/logs`,
		{
			headers: {
				Accept: "text/event-stream",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	if (!response.body) {
		return;
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					yield line.slice(6);
				}
			}
		}

		// Process remaining buffer
		if (buffer) {
			const lines = buffer.split("\n");
			for (const line of lines) {
				if (line.startsWith("data: ")) {
					yield line.slice(6);
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

/**
 * Stream job metrics using Server-Sent Events (SSE).
 * Returns an async iterable of metric chunks.
 */
export async function* streamJobMetrics(
	params: {
		/**
		 * The namespace (username or organization name)
		 */
		namespace: string;
		/**
		 * The job ID
		 */
		jobId: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams
): AsyncGenerator<string, void, unknown> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}/${params.jobId}/metrics`,
		{
			headers: {
				Accept: "text/event-stream",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	if (!response.body) {
		return;
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					yield line.slice(6);
				}
			}
		}

		// Process remaining buffer
		if (buffer) {
			const lines = buffer.split("\n");
			for (const line of lines) {
				if (line.startsWith("data: ")) {
					yield line.slice(6);
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

/**
 * Stream job events using Server-Sent Events (SSE).
 * Returns an async iterable of event chunks.
 */
export async function* streamJobEvents(
	params: {
		/**
		 * The namespace (username or organization name)
		 */
		namespace: string;
		/**
		 * The job ID
		 */
		jobId: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams
): AsyncGenerator<string, void, unknown> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/jobs/${params.namespace}/${params.jobId}/events`,
		{
			headers: {
				Accept: "text/event-stream",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	if (!response.body) {
		return;
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					yield line.slice(6);
				}
			}
		}

		// Process remaining buffer
		if (buffer) {
			const lines = buffer.split("\n");
			for (const line of lines) {
				if (line.startsWith("data: ")) {
					yield line.slice(6);
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

// Scheduled Jobs API

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
	} & CredentialsParams
): Promise<ApiScheduledJob[]> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/scheduled-jobs/${params.namespace}`,
		{
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}

/**
 * Get a specific scheduled job by ID.
 */
export async function getScheduledJob(
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
	} & CredentialsParams
): Promise<ApiScheduledJob> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/scheduled-jobs/${params.namespace}/${params.jobId}`,
		{
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}

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
		CredentialsParams
): Promise<ApiScheduledJob> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

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
	if (rest.jobSpec.environment) {
		(body.jobSpec as Record<string, unknown>).environment = rest.jobSpec.environment;
	}
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

	const response = await (customFetch || fetch)(`${hubUrl || HUB_URL}/api/scheduled-jobs/${namespace}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw await createApiError(response);
	}

	return await response.json();
}

/**
 * Delete a scheduled job.
 */
export async function deleteScheduledJob(
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
	} & CredentialsParams
): Promise<void> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/scheduled-jobs/${params.namespace}/${params.jobId}`,
		{
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}
}

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
	} & CredentialsParams
): Promise<void> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/scheduled-jobs/${params.namespace}/${params.jobId}/suspend`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}
}

/**
 * Resume a scheduled job.
 */
export async function resumeScheduledJob(
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
	} & CredentialsParams
): Promise<void> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/scheduled-jobs/${params.namespace}/${params.jobId}/resume`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (!response.ok) {
		throw await createApiError(response);
	}
}

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
	} & CredentialsParams
): Promise<ApiJob | null> {
	const accessToken = checkCredentials(params);
	if (!accessToken) {
		throw new Error("Authentication required. Please provide an access token.");
	}

	const response = await (params.fetch || fetch)(
		`${params.hubUrl || HUB_URL}/api/scheduled-jobs/${params.namespace}/${params.jobId}/run`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		}
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
