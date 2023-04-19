import * as tasks from "./tasks";
import type { Options, RequestArgs } from "./types";
import type { DistributiveOmit } from "./utils/distributive-omit";

type Task = typeof tasks;

type TaskWithNoAccessToken = {
	[key in keyof Task]: (
		args: DistributiveOmit<Parameters<Task[key]>[0], "accessToken">,
		options?: Parameters<Task[key]>[1]
	) => ReturnType<Task[key]>;
};

type TaskWithNoAccessTokenNoModel = {
	[key in keyof Task]: (
		args: DistributiveOmit<Parameters<Task[key]>[0], "accessToken" | "model">,
		options?: Parameters<Task[key]>[1]
	) => ReturnType<Task[key]>;
};

export class HfInference {
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
	 * Returns copy of HfInference tied to a specified endpoint.
	 */
	public endpoint(endpointUrl: string): HfInferenceEndpoint {
		return new HfInferenceEndpoint(endpointUrl, this.accessToken, this.defaultOptions);
	}
}

export class HfInferenceEndpoint {
	constructor(endpointUrl: string, accessToken = "", defaultOptions: Options = {}) {
		accessToken;
		defaultOptions;

		for (const [name, fn] of Object.entries(tasks)) {
			Object.defineProperty(this, name, {
				enumerable: false,
				value: (params: RequestArgs, options: Options) =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					fn({ ...params, accessToken, model: endpointUrl } as any, { ...defaultOptions, ...options }),
			});
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HfInference extends TaskWithNoAccessToken {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HfInferenceEndpoint extends TaskWithNoAccessTokenNoModel {}
