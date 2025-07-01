import { type Response as ExpressResponse } from "express";
import { type ValidatedRequest } from "../middleware/validation.js";
import { type CreateResponseParams } from "../schemas.js";
import { generateUniqueId } from "../lib/generateUniqueId.js";
import { InferenceClient } from "@huggingface/inference";
import type { ChatCompletionInputMessage, ChatCompletionInputMessageChunkType } from "@huggingface/tasks";

import type {
	Response,
	ResponseOutputItem,
	ResponseCreatedEvent,
	ResponseInProgressEvent,
	ResponseOutputItemAddedEvent,
	ResponseOutputItemDoneEvent,
	ResponseContentPartAddedEvent,
	ResponseContentPartDoneEvent,
	ResponseCompletedEvent,
	ResponseTextDeltaEvent,
	ResponseTextDoneEvent,
	ResponseErrorEvent,
} from "openai/resources/responses/responses";

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

	const payload = {
		model: req.body.model,
		messages: messages,
		temperature: req.body.temperature,
		top_p: req.body.top_p,
		stream: req.body.stream,
	};

	const responseObject: Omit<
		Response,
		"incomplete_details" | "metadata" | "output_text" | "parallel_tool_calls" | "tool_choice" | "tools"
	> = {
		object: "response",
		id: generateUniqueId("resp"),
		status: "in_progress",
		error: null,
		instructions: req.body.instructions,
		model: req.body.model,
		temperature: req.body.temperature,
		top_p: req.body.top_p,
		created_at: new Date().getTime(),
		output: [],
	};

	if (req.body.stream) {
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Connection", "keep-alive");
		let sequenceNumber = 0;
		try {
			// Response created event
			const responseCreatedEvent: ResponseCreatedEvent = {
				type: "response.created",
				response: responseObject as Response,
				sequence_number: sequenceNumber++,
			};
			res.write(`data: ${JSON.stringify(responseCreatedEvent)}\n\n`);

			// Response in progress event
			const responseInProgressEvent: ResponseInProgressEvent = {
				type: "response.in_progress",
				response: responseObject as Response,
				sequence_number: sequenceNumber++,
			};
			res.write(`data: ${JSON.stringify(responseInProgressEvent)}\n\n`);

			const stream = client.chatCompletionStream(payload);

			const outputObject: ResponseOutputItem = {
				id: generateUniqueId("msg"),
				type: "message",
				role: "assistant",
				status: "in_progress",
				content: [],
			};

			// Response output item added event
			const responseOutputItemAddedEvent: ResponseOutputItemAddedEvent = {
				type: "response.output_item.added",
				output_index: 0,
				item: outputObject,
				sequence_number: sequenceNumber++,
			};
			res.write(`data: ${JSON.stringify(responseOutputItemAddedEvent)}\n\n`);

			// Response content part added event
			const contentPart: ResponseContentPartAddedEvent["part"] = {
				type: "output_text",
				text: "",
				annotations: [],
			};

			const responseContentPartAddedEvent: ResponseContentPartAddedEvent = {
				type: "response.content_part.added",
				item_id: outputObject.id,
				output_index: 0,
				content_index: 0,
				part: contentPart,
				sequence_number: sequenceNumber++,
			};
			res.write(`data: ${JSON.stringify(responseContentPartAddedEvent)}\n\n`);

			for await (const chunk of stream) {
				if (chunk.choices[0].delta.content) {
					contentPart.text += chunk.choices[0].delta.content;

					// Response output text delta event
					const responseTextDeltaEvent: ResponseTextDeltaEvent = {
						type: "response.output_text.delta",
						item_id: outputObject.id,
						output_index: 0,
						content_index: 0,
						delta: chunk.choices[0].delta.content,
						sequence_number: sequenceNumber++,
					};
					res.write(`data: ${JSON.stringify(responseTextDeltaEvent)}\n\n`);
				}
			}

			// Response output text done event
			const responseTextDoneEvent: ResponseTextDoneEvent = {
				type: "response.output_text.done",
				item_id: outputObject.id,
				output_index: 0,
				content_index: 0,
				text: contentPart.text,
				sequence_number: sequenceNumber++,
			};
			res.write(`data: ${JSON.stringify(responseTextDoneEvent)}\n\n`);

			// Response content part done event
			const responseContentPartDoneEvent: ResponseContentPartDoneEvent = {
				type: "response.content_part.done",
				item_id: outputObject.id,
				output_index: 0,
				content_index: 0,
				part: contentPart,
				sequence_number: sequenceNumber++,
			};
			res.write(`data: ${JSON.stringify(responseContentPartDoneEvent)}\n\n`);

			// Response output item done event
			outputObject.status = "completed";
			outputObject.content.push(contentPart);
			const responseOutputItemDoneEvent: ResponseOutputItemDoneEvent = {
				type: "response.output_item.done",
				output_index: 0,
				item: outputObject,
				sequence_number: sequenceNumber++,
			};
			res.write(`data: ${JSON.stringify(responseOutputItemDoneEvent)}\n\n`);

			// Response completed event
			responseObject.status = "completed";
			responseObject.output = [outputObject];
			const responseCompletedEvent: ResponseCompletedEvent = {
				type: "response.completed",
				response: responseObject as Response,
				sequence_number: sequenceNumber++,
			};
			res.write(`data: ${JSON.stringify(responseCompletedEvent)}\n\n`);
		} catch (streamError: any) {
			console.error("Error in streaming chat completion:", streamError);

			const responseErrorEvent: ResponseErrorEvent = {
				type: "error",
				code: null,
				message: streamError.message || "An error occurred while streaming from chat completion inference",
				param: null,
				sequence_number: sequenceNumber++,
			};
			res.write(`data: ${JSON.stringify(responseErrorEvent)}\n\n`);
		}
		res.end();
		return;
	}

	try {
		const chatCompletionResponse = await client.chatCompletion({
			model: req.body.model,
			messages: messages,
			temperature: req.body.temperature,
			top_p: req.body.top_p,
		});

		responseObject.status = "completed";
		responseObject.output = chatCompletionResponse.choices[0].message.content
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
			: [];

		res.json(responseObject);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
};
