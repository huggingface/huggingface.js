import { inspect } from "util";
import type { ServerConfig } from "./types";

export function debug(...args: unknown[]): void {
	if (process.env.DEBUG) {
		console.debug(inspect(args, { depth: Infinity, colors: true }));
	}
}

export const ANSI = {
	BLUE: "\x1b[34m",
	GRAY: "\x1b[90m",
	GREEN: "\x1b[32m",
	RED: "\x1b[31m",
	RESET: "\x1b[0m",
};

export function urlToServerConfig(urlStr: string, authToken?: string): ServerConfig {
	if (!urlStr.startsWith("http:") && !urlStr.startsWith("https:")) {
		throw new Error(`Unsupported URL format: ${urlStr}. Use http:// or https:// prefix.`);
	}

	const url = new URL(urlStr);
	const hostname = url.hostname;
	const path = url.pathname;

	let type: "http" | "sse";
	if (path.endsWith("/sse")) {
		type = "sse";
	} else if (path.endsWith("/mcp")) {
		type = "http";
	} else {
		throw new Error(`Unsupported endpoint: ${urlStr}. URL must end with /sse or /mcp`);
	}

	// Check if we should include the token
	const shouldIncludeToken =
		!!authToken &&
		(hostname.endsWith(".hf.space") ||
			hostname.endsWith("huggingface.co") ||
			hostname === "localhost" ||
			hostname === "127.0.0.1");

	// Create appropriate config based on type and authorization requirements
	if (type === "http") {
		return {
			type: "http",
			config: {
				url: urlStr,
				options: shouldIncludeToken
					? {
							requestInit: {
								headers: {
									Authorization: `Bearer ${authToken}`,
								},
							},
					  }
					: undefined,
			},
		};
	} else {
		return {
			type: "sse",
			config: {
				url: urlStr,
				options: shouldIncludeToken
					? {
							requestInit: {
								headers: {
									Authorization: `Bearer ${authToken}`,
								},
							},
							// workaround for https://github.com/modelcontextprotocol/typescript-sdk/issues/436
							eventSourceInit: {
								fetch: (url, init) => {
									const reqHeaders = new Headers(init?.headers ?? {});
									reqHeaders.set("Authorization", `Bearer ${authToken}`);
									return fetch(url, {
										...init,
										headers: reqHeaders,
									});
								},
							},
					  }
					: undefined,
			},
		};
	}
}
