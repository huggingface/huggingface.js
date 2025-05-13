// src/types.ts
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";
import type { StreamableHTTPClientTransportOptions } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/** StdioServerParameters is usable as-is */

/**
 * Configuration for an SSE MCP server
 */
export interface SSEServerConfig {
	url: string | URL;
	options?: SSEClientTransportOptions;
}

/**
 * Configuration for a StreamableHTTP MCP server
 */
export interface StreamableHTTPServerConfig {
	url: string | URL;
	options?: StreamableHTTPClientTransportOptions;
}

/**
 * Discriminated union type for different MCP server types
 */
export type ServerConfig =
	| { type: "stdio"; config: StdioServerParameters }
	| { type: "sse"; config: SSEServerConfig }
	| { type: "http"; config: StreamableHTTPServerConfig };
