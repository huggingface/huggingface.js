export type RepoType = "space" | "dataset" | "model";

export interface RepoId {
	name: string;
	type: RepoType;
}

export type AccessToken = `hf_${string}`;

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
