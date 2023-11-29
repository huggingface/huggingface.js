import type { PipelineType } from "@huggingface/tasks";

export type RepoType = "space" | "dataset" | "model";

export interface RepoId {
	name: string;
	type: RepoType;
}

export type RepoFullName = string | `spaces/${string}` | `datasets/${string}`;

export type RepoDesignation = RepoId | RepoFullName;

/** Actually `hf_${string}`, but for convenience, using the string type */
export type AccessToken = string;

export interface Credentials {
	accessToken: AccessToken;
}

export type SpaceHardwareFlavor =
	| "cpu-basic"
	| "cpu-upgrade"
	| "t4-small"
	| "t4-medium"
	| "a10g-small"
	| "a10g-large"
	| "a100-large";

export type SpaceSdk = "streamlit" | "gradio" | "docker" | "static";

export type SpaceStage =
	| "NO_APP_FILE"
	| "CONFIG_ERROR"
	| "BUILDING"
	| "BUILD_ERROR"
	| "RUNNING"
	| "RUNNING_BUILDING"
	| "RUNTIME_ERROR"
	| "DELETING"
	| "PAUSED"
	| "SLEEPING";

export type AccessTokenRole = "admin" | "write" | "contributor" | "read";

export type AuthType = "access_token" | "app_token" | "app_token_as_user";

export type { PipelineType };

export interface SpaceRuntime {
	stage: SpaceStage;
	sdk?: SpaceSdk;
	sdkVersion?: string;
	errorMessage?: string;
	hardware?: {
		current: SpaceHardwareFlavor | null;
		currentPrettyName?: string;
		requested: SpaceHardwareFlavor | null;
		requestedPrettyName?: string;
	};
	/** when calling /spaces, those props are only fetched if ?full=true */
	resources?: SpaceResourceConfig;
	/** in seconds */
	gcTimeout?: number | null;
}

export interface SpaceResourceRequirement {
	cpu?: string;
	memory?: string;
	gpu?: string;
	gpuModel?: string;
	ephemeral?: string;
}

export interface SpaceResourceConfig {
	requests: SpaceResourceRequirement;
	limits: SpaceResourceRequirement;
	replicas?: number;
	throttled?: boolean;
	is_custom?: boolean;
}
