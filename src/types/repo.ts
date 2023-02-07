export type RepoType = "space" | "dataset" | "model";

export type RepoId = {
	name: string;
	type: RepoType;
};

export type AccessToken = `hf_${string}`;

export type Credentials = {
	accessToken: AccessToken;
};
