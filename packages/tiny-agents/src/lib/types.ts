import { z } from "zod";

export interface TinyAgentConfig {
	configJson: string;
	prompt?: string;
}

export const ServerConfigSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("stdio"),
		command: z.string(),
		args: z.array(z.string()).optional(),
		env: z.record(z.string()).optional(),
		cwd: z.string().optional(),
	}),
	z.object({
		type: z.literal("http"),
		url: z.union([z.string(), z.string().url()]),
		headers: z.record(z.string()).optional(),
	}),
	z.object({
		type: z.literal("sse"),
		url: z.union([z.string(), z.string().url()]),
		headers: z.record(z.string()).optional(),
	}),
]);

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export const InputConfigSchema = z.object({
	id: z.string(),
	description: z.string(),
	type: z.string().optional(),
	password: z.boolean().optional(),
});

export type InputConfig = z.infer<typeof InputConfigSchema>;
