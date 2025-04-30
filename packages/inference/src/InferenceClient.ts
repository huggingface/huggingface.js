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

export class InferenceClient {
	private readonly accessToken: string;
	private readonly defaultOptions: Options;

	constructor(
		accessToken = "",
		defaultOptions: Options & {
			endpointUrl?: string;
		} = {}
	) {
		this.accessToken = accessToken;
		this.defaultOptions = defaultOptions;

		for (const [name, fn] of Object.entries(tasks)) {
			Object.defineProperty(this, name, {
				enumerable: false,
				value: (params: RequestArgs, options: Options) =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					fn({ endpointUrl: defaultOptions.endpointUrl, accessToken, ...params } as any, {
						...omit(defaultOptions, ["endpointUrl"]),
						...options,
					}),
			});
		}
	}

	/**
	 * Returns a new instance of InferenceClient tied to a specified endpoint.
	 *
	 * For backward compatibility mostly.
	 */
	public endpoint(endpointUrl: string): InferenceClient {
		return new InferenceClient(this.accessToken, { ...this.defaultOptions, endpointUrl });
	}
}

export interface InferenceClient extends TaskWithNoAccessToken {}

/**
 * For backward compatibility only, will remove soon.
 * @deprecated replace with InferenceClient
 */
export class HfInference extends InferenceClient {}
/**
 * For backward compatibility only, will remove soon.
 * @deprecated replace with InferenceClient
 */
export class InferenceClientEndpoint extends InferenceClient {}
