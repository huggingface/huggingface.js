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

export type Task =
	| "text-classification"
	| "token-classification"
	| "table-question-answering"
	| "question-answering"
	| "zero-shot-classification"
	| "translation"
	| "summarization"
	| "conversational"
	| "feature-extraction"
	| "text-generation"
	| "text2text-generation"
	| "fill-mask"
	| "sentence-similarity"
	| "text-to-speech"
	| "automatic-speech-recognition"
	| "audio-to-audio"
	| "audio-classification"
	| "voice-activity-detection"
	| "depth-estimation"
	| "image-classification"
	| "object-detection"
	| "image-segmentation"
	| "text-to-image"
	| "image-to-text"
	| "image-to-image"
	| "image-to-video"
	| "unconditional-image-generation"
	| "video-classification"
	| "reinforcement-learning"
	| "robotics"
	| "tabular-classification"
	| "tabular-regression"
	| "tabular-to-text"
	| "table-to-text"
	| "multiple-choice"
	| "text-retrieval"
	| "time-series-forecasting"
	| "visual-question-answering"
	| "document-question-answering"
	| "zero-shot-image-classification"
	| "graph-ml"
	| "other";

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
