import type { InferenceTask } from "../types";

/**
 * Internal type for InferenceProvider definition.
 *
 * Not exported from the package
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace InferenceProviderTypes {
	export type AuthMethod = "none" | "hf-token" | "credentials-include" | "provider-key";

	export interface Config {
		makeBaseUrl: MakeBaseUrl;
		makeBody: MakeBody;
		makeHeaders: MakeHeaders;
		makeUrl: MakeUrl;
		clientSideRoutingOnly?: boolean;
	}

	export type MakeBody = (params: BodyParams) => Record<string, unknown>;
	export type MakeHeaders = (params: HeaderParams) => Record<string, string | undefined>;
	export type MakeUrl = (params: UrlParams) => string;
	export type MakeBaseUrl = (() => string) | ((task?: InferenceTask) => string);

	export interface HeaderParams {
		accessToken?: string;
		authMethod: AuthMethod;
	}

	export interface UrlParams {
		authMethod: AuthMethod;
		baseUrl: string;
		model: string;
		task?: InferenceTask;
		chatCompletion?: boolean;
	}

	export interface BodyParams {
		args: Record<string, unknown>;
		chatCompletion?: boolean;
		model?: string;
		task?: InferenceTask;
	}
}
