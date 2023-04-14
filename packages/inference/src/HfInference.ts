import * as lib from "./lib";
import type { Options, RequestArgs } from "./types";

type Lib = typeof lib;

type LibWithNoAccessToken = {
	[key in keyof Lib]: (
		args: Omit<Parameters<Lib[key]>[0], "accessToken">,
		options?: Parameters<Lib[key]>[1]
	) => ReturnType<Lib[key]>;
};

type LibWithNoAccessTokenNoModel = {
	[key in keyof Lib]: (
		args: Omit<Parameters<Lib[key]>[0], "accessToken" | "model">,
		options?: Parameters<Lib[key]>[1]
	) => ReturnType<Lib[key]>;
};

export class HfInference {
	private readonly accessToken: string;
	private readonly defaultOptions: Options;

	constructor(accessToken = "", defaultOptions: Options = {}) {
		this.accessToken = accessToken;
		this.defaultOptions = defaultOptions;

		for (const [name, fn] of Object.entries(lib)) {
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

		for (const [name, fn] of Object.entries(lib)) {
			Object.defineProperty(this, name, {
				enumerable: false,
				value: (params: Omit<RequestArgs, "model">, options: Options) =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					fn({ ...params, accessToken, model: endpointUrl } as any, { ...defaultOptions, ...options }),
			});
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HfInference extends LibWithNoAccessToken {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HfInferenceEndpoint extends LibWithNoAccessTokenNoModel {}
