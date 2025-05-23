import { z } from "zod";

export const ServerConfigSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("stdio"),
		config: z.object({
			command: z.string(),
			args: z.array(z.string()).optional(),
			env: z.record(z.string()).optional(),
			cwd: z.string().optional(),
		}),
	}),
	z.object({
		type: z.literal("http"),
		config: z.object({
			url: z.union([z.string(), z.string().url()]),
			options: z
				.object({
					/**
					 * Session ID for the connection. This is used to identify the session on the server.
					 * When not provided and connecting to a server that supports session IDs, the server will generate a new session ID.
					 */
					sessionId: z.string().optional(),
				})
				.optional(),
		}),
	}),
	z.object({
		type: z.literal("sse"),
		config: z.object({
			url: z.union([z.string(), z.string().url()]),
			options: z.object({}).optional(),
		}),
	}),
]);

export type ServerConfig = z.infer<typeof ServerConfigSchema>;
