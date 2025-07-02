import { z } from "zod";

/**
 * https://platform.openai.com/docs/api-reference/responses/create
 * commented out properties are not supported by the server
 */

const inputContentSchema = z.array(
	z.union([
		z.object({
			type: z.literal("input_text"),
			text: z.string(),
		}),
		z.object({
			type: z.literal("input_image"),
			// file_id: z.string().nullable().default(null),
			image_url: z.string(),
			// detail: z.enum(["auto", "low", "high"]).default("auto"),
		}),
		// z.object({
		// 	type: z.literal("input_file"),
		// 	file_data: z.string().nullable().default(null),
		// 	file_id: z.string().nullable().default(null),
		// 	filename: z.string().nullable().default(null),
		// }),
	])
);

export const createResponseParamsSchema = z.object({
	// background: z.boolean().default(false),
	// include:
	input: z.union([
		z.string(),
		z.array(
			z.union([
				z.object({
					content: z.union([z.string(), inputContentSchema]),
					role: z.enum(["user", "assistant", "system", "developer"]),
					type: z.enum(["message"]).default("message"),
				}),
				z.object({
					role: z.enum(["user", "system", "developer"]),
					status: z.enum(["in_progress", "completed", "incomplete"]).nullable().default(null),
					content: inputContentSchema,
					type: z.enum(["message"]).default("message"),
				}),
				z.object({
					id: z.string().optional(),
					role: z.enum(["assistant"]),
					status: z.enum(["in_progress", "completed", "incomplete"]).optional(),
					type: z.enum(["message"]).default("message"),
					content: z.array(
						z.union([
							z.object({
								type: z.literal("output_text"),
								text: z.string(),
								annotations: z.array(z.object({})).optional(), // TODO: incomplete
								logprobs: z.array(z.object({})).optional(), // TODO: incomplete
							}),
							z.object({
								type: z.literal("refusal"),
								refusal: z.string(),
							}),
							// TODO: much more objects: File search tool call, Computer tool call, Computer tool call output, Web search tool call, Function tool call, Function tool call output, Reasoning, Image generation call, Code interpreter tool call, Local shell call, Local shell call output, MCP list tools, MCP approval request, MCP approval response, MCP tool call
						])
					),
				}),
				// z.object({
				// 	id: z.string(),
				// 	type: z.enum(["item_reference"]).default("item_reference"),
				// }),
			])
		),
	]),
	instructions: z.string().nullable().default(null),
	// max_output_tokens: z.number().min(0).nullable().default(null),
	// max_tool_calls: z.number().min(0).nullable().default(null),
	// metadata: z.record(z.string().max(64), z.string().max(512)).nullable().default(null), // + 16 items max
	model: z.string(),
	// previous_response_id: z.string().nullable().default(null),
	// reasoning: z.object({
	// 	effort: z.enum(["low", "medium", "high"]).default("medium"),
	// 	summary: z.enum(["auto", "concise", "detailed"]).nullable().default(null),
	// }),
	// store: z.boolean().default(true),
	stream: z.boolean().default(false),
	temperature: z.number().min(0).max(2).default(1),
	// text:
	// tool_choice:
	// tools:
	// top_logprobs: z.number().min(0).max(20).nullable().default(null),
	top_p: z.number().min(0).max(1).default(1),
	// truncation: z.enum(["auto", "disabled"]).default("disabled"),
	// user
});

export type CreateResponseParams = z.infer<typeof createResponseParamsSchema>;
