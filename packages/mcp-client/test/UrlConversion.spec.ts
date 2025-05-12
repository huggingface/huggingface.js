// test/UrlConversion.spec.ts
import { describe, expect, it } from "vitest";
import { urlToServerConfig } from "../src/utils";

describe("urlToServerConfig", () => {
	const TOKEN = "test-token";

	describe("Transport Type Selection", () => {
		it("should create streamableHttp config for URLs ending with /mcp", () => {
			const urls = ["https://example.com/api/mcp", "https://test.hf.space/mcp", "http://localhost:3000/mcp"];

			for (const url of urls) {
				const config = urlToServerConfig(url, TOKEN);
				expect(config.type).toBe("streamableHttp");
				if (config.type === "streamableHttp") {
					expect(config.config.url).toBe(url);
				}
			}
		});

		it("should create sse config for URLs ending with /sse", () => {
			const urls = ["https://example.com/api/sse", "https://test.hf.space/sse", "http://localhost:3000/sse"];

			for (const url of urls) {
				const config = urlToServerConfig(url, TOKEN);
				expect(config.type).toBe("sse");
				if (config.type === "sse") {
					expect(config.config.url).toBe(url);
				}
			}
		});

		it("should throw for URLs not ending with /mcp or /sse", () => {
			expect(() => urlToServerConfig("https://example.com/api")).toThrow("Unsupported endpoint");
		});
	});

	describe("Authorization Token Inclusion", () => {
		it("should include token for Hugging Face domains regardless of transport type", () => {
			const urls = [
				"https://test.hf.space/api/mcp", // StreamableHTTP
				"https://api.huggingface.co/models/mcp", // StreamableHTTP
				"https://test.hf.space/api/sse", // SSE
				"https://api.huggingface.co/models/sse", // SSE
			];

			for (const url of urls) {
				const config = urlToServerConfig(url, TOKEN);
				if (config.type === "streamableHttp") {
					const authHeader = config.config.options?.requestInit?.headers as Record<string, string> | undefined;
					expect(authHeader?.Authorization).toBe(`Bearer ${TOKEN}`);
				} else if (config.type === "sse") {
					const authHeader = config.config.options?.requestInit?.headers as Record<string, string> | undefined;
					expect(authHeader?.Authorization).toBe(`Bearer ${TOKEN}`);
				}
			}
		});

		it("should include token for localhost domains regardless of transport type", () => {
			const urls = [
				"http://localhost:3000/mcp", // StreamableHTTP
				"http://127.0.0.1:8000/api/mcp", // StreamableHTTP
				"http://localhost:3000/sse", // SSE
				"http://127.0.0.1:8000/api/sse", // SSE
			];

			for (const url of urls) {
				const config = urlToServerConfig(url, TOKEN);
				if (config.type === "streamableHttp") {
					const authHeader = config.config.options?.requestInit?.headers as Record<string, string> | undefined;
					expect(authHeader?.Authorization).toBe(`Bearer ${TOKEN}`);
				} else if (config.type === "sse") {
					const authHeader = config.config.options?.requestInit?.headers as Record<string, string> | undefined;
					expect(authHeader?.Authorization).toBe(`Bearer ${TOKEN}`);
				}
			}
		});

		it("should NOT include token for non-HF/non-local domains regardless of transport type", () => {
			const urls = [
				"https://example.com/api/mcp", // StreamableHTTP
				"https://someother.org/mcp", // StreamableHTTP
				"https://example.com/api/sse", // SSE
				"https://someother.org/sse", // SSE
			];

			for (const url of urls) {
				const config = urlToServerConfig(url, TOKEN);
				if (config.type === "streamableHttp" || config.type === "sse") {
					expect(config.config.options).toBeUndefined();
				}
			}
		});

		it("should not include token when not provided even for HF domains", () => {
			const urls = ["https://test.hf.space/api/mcp", "https://test.hf.space/api/sse"];

			for (const url of urls) {
				const config = urlToServerConfig(url); // No token provided
				if (config.type === "streamableHttp" || config.type === "sse") {
					expect(config.config.options).toBeUndefined();
				}
			}
		});
	});

	it("should throw for unsupported URL formats", () => {
		expect(() => urlToServerConfig("ftp://example.com/mcp")).toThrow("Unsupported URL format");
	});
});
