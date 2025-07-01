import { type Response as ExpressResponse } from "express";
import { type ValidatedRequest } from "../middleware/validation.js";
import { type CreateResponseParams } from "../schemas.js";
import { generateUniqueId } from "../lib/generateUniqueId.js";
import { InferenceClient } from "@huggingface/inference";
import type { ChatCompletionInputMessage, ChatCompletionInputMessageChunkType } from "@huggingface/tasks";

import { type Response as OpenAIResponse } from "openai/resources/responses/responses";

export const postCreateResponse = async (
	req: ValidatedRequest<CreateResponseParams>,
	res: ExpressResponse
): Promise<void> => {
	const apiKey = req.headers.authorization?.split(" ")[1];

	if (!apiKey) {
		res.status(401).json({
			success: false,
			error: "Unauthorized",
		});
		return;
	}

	const client = new InferenceClient(apiKey);
	const messages: ChatCompletionInputMessage[] = req.body.instructions
		? [{ role: "system", content: req.body.instructions }]
		: [];

	if (Array.isArray(req.body.input)) {
		messages.push(
			...req.body.input.map((item) => ({
				role: item.role,
				content:
					typeof item.content === "string"
						? item.content
						: item.content.map((content) => {
								if (content.type === "input_image") {
									return {
										type: "image_url" as ChatCompletionInputMessageChunkType,
										image_url: {
											url: content.image_url,
										},
									};
								}
								// content.type must be "input_text" at this point
								return {
									type: "text" as ChatCompletionInputMessageChunkType,
									text: content.text,
								};
						  }),
			}))
		);
	} else {
		messages.push({ role: "user", content: req.body.input });
	}

	try {
		const chatCompletionResponse = await client.chatCompletion({
			model: req.body.model,
			messages: messages,
			temperature: req.body.temperature,
			top_p: req.body.top_p,
		});

		const responseObject: Omit<
			OpenAIResponse,
			"incomplete_details" | "metadata" | "output_text" | "parallel_tool_calls" | "tool_choice" | "tools"
		> = {
			object: "response",
			id: generateUniqueId("resp"),
			status: "completed",
			error: null,
			instructions: req.body.instructions,
			model: req.body.model,
			temperature: req.body.temperature,
			top_p: req.body.top_p,
			created_at: chatCompletionResponse.created,
			output: chatCompletionResponse.choices[0].message.content
				? [
						{
							id: generateUniqueId("msg"),
							type: "message",
							role: "assistant",
							status: "completed",
							content: [
								{
									type: "output_text",
									text: chatCompletionResponse.choices[0].message.content,
									annotations: [],
								},
							],
						},
				  ]
				: [],
		};

		res.json(responseObject);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
};
