import * as tasks from "./tasks";
import type { Options, RequestArgs } from "./types";
import type { DistributiveOmit } from "./utils/distributive-omit";

/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */

type Task = typeof tasks;

type TaskWithNoAccessToken = {
	[key in keyof Task]: (
		args: DistributiveOmit<Parameters<Task[key]>[0], "accessToken">,
		options?: Parameters<Task[key]>[1]
	) => ReturnType<Task[key]>;
};

type TaskWithNoAccessTokenNoEndpointUrl = {
	[key in keyof Task]: (
		args: DistributiveOmit<Parameters<Task[key]>[0], "accessToken" | "endpointUrl">,
		options?: Parameters<Task[key]>[1]
	) => ReturnType<Task[key]>;
};

export class InferenceClient {
	private readonly accessToken: string;
	private readonly defaultOptions: Options;

	constructor(accessToken = "", defaultOptions: Options = {}) {
		this.accessToken = accessToken;
		this.defaultOptions = defaultOptions;

		for (const [name, fn] of Object.entries(tasks)) {
			Object.defineProperty(this, name, {
				enumerable: false,
				value: (params: RequestArgs, options: Options) =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					fn({ ...params, accessToken } as any, { ...defaultOptions, ...options }),
			});
		}
	}

	/**
	 * Returns copy of InferenceClient tied to a specified endpoint.
	 */
	public endpoint(endpointUrl: string): InferenceClientEndpoint {
		return new InferenceClientEndpoint(endpointUrl, this.accessToken, this.defaultOptions);
	}
}

export class InferenceClientEndpoint {
	constructor(endpointUrl: string, accessToken = "", defaultOptions: Options = {}) {
		accessToken;
		defaultOptions;

		for (const [name, fn] of Object.entries(tasks)) {
			Object.defineProperty(this, name, {
				enumerable: false,
				value: (params: RequestArgs, options: Options) =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					fn({ ...params, accessToken, endpointUrl } as any, { ...defaultOptions, ...options }),
			});
		}
	}
}

export interface InferenceClient extends TaskWithNoAccessToken {}

export interface InferenceClientEndpoint extends TaskWithNoAccessTokenNoEndpointUrl {}

/**
 * For backward compatibility only.
 */
export class HfInference extends InferenceClient {}
