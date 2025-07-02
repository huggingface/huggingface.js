import { type Response as ExpressResponse } from "express";
import { type ValidatedRequest } from "../middleware/validation.js";
import { type CreateResponseParams } from "../schemas.js";
import { generateUniqueId } from "../lib/generateUniqueId.js";
import { InferenceClient } from "@huggingface/inference";
import type {
	ChatCompletionInputMessage,
	ChatCompletionInputMessageChunkType,
	ChatCompletionInput,
} from "@huggingface/tasks";

import type {
	Response,
	ResponseStreamEvent,
	ResponseContentPartAddedEvent,
	ResponseOutputMessage,
	ResponseFunctionToolCall,
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
						: item.content
								.map((content) => {
									switch (content.type) {
										case "input_image":
											return {
												type: "image_url" as ChatCompletionInputMessageChunkType,
												image_url: {
													url: content.image_url,
												},
											};
										case "output_text":
											return {
												type: "text" as ChatCompletionInputMessageChunkType,
												text: content.text,
											};
										case "refusal":
											return undefined;
										case "input_text":
											return {
												type: "text" as ChatCompletionInputMessageChunkType,
												text: content.text,
											};
									}
								})
								.filter((item) => item !== undefined),
			}))
		);
	} else {
		messages.push({ role: "user", content: req.body.input });
	}

	const payload: ChatCompletionInput = {
		// main params
		model: req.body.model,
		provider: req.body.provider,
		messages: messages,
		stream: req.body.stream,
		// options
		max_tokens: req.body.max_output_tokens === null ? undefined : req.body.max_output_tokens,
		response_format: req.body.text?.format
			? {
					type: req.body.text.format.type,
					json_schema:
						req.body.text.format.type === "json_schema"
							? {
									description: req.body.text.format.description,
									name: req.body.text.format.name,
									schema: req.body.text.format.schema,
									strict: req.body.text.format.strict,
							  }
							: undefined,
			  }
			: undefined,
		temperature: req.body.temperature,
		tool_choice:
			typeof req.body.tool_choice === "string"
				? req.body.tool_choice
				: req.body.tool_choice
				  ? {
							type: "function",
							function: {
								name: req.body.tool_choice.name,
							},
				    }
				  : undefined,
		tools: req.body.tools
			? req.body.tools.map((tool) => ({
					type: tool.type,
					function: {
						name: tool.name,
						parameters: tool.parameters,
						description: tool.description,
						strict: tool.strict,
					},
			  }))
			: undefined,
		top_p: req.body.top_p,
	};

	const responseObject: Omit<Response, "incomplete_details" | "output_text" | "parallel_tool_calls"> = {
		created_at: new Date().getTime(),
		error: null,
		id: generateUniqueId("resp"),
		instructions: req.body.instructions,
		max_output_tokens: req.body.max_output_tokens,
		metadata: req.body.metadata,
		model: req.body.model,
		object: "response",
		output: [],
		// parallel_tool_calls: req.body.parallel_tool_calls,
		status: "in_progress",
		text: req.body.text,
		tool_choice: req.body.tool_choice ?? "auto",
		tools: req.body.tools ?? [],
		temperature: req.body.temperature,
		top_p: req.body.top_p,
	};

	if (req.body.stream) {
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Connection", "keep-alive");
		let sequenceNumber = 0;

		// Emit events in sequence
		const emitEvent = (event: ResponseStreamEvent) => {
			res.write(`data: ${JSON.stringify(event)}\n\n`);
		};

		try {
			// Response created event
			emitEvent({
				type: "response.created",
				response: responseObject as Response,
				sequence_number: sequenceNumber++,
			});

			// Response in progress event
			emitEvent({
				type: "response.in_progress",
				response: responseObject as Response,
				sequence_number: sequenceNumber++,
			});

			const stream = client.chatCompletionStream(payload);

			for await (const chunk of stream) {
				if (chunk.choices[0].delta.content) {
					if (responseObject.output.length === 0) {
						const outputObject: ResponseOutputMessage = {
							id: generateUniqueId("msg"),
							type: "message",
							role: "assistant",
							status: "in_progress",
							content: [],
						};
						responseObject.output = [outputObject];

						// Response output item added event
						emitEvent({
							type: "response.output_item.added",
							output_index: 0,
							item: outputObject,
							sequence_number: sequenceNumber++,
						});
					}

					const outputObject = responseObject.output.at(-1);
					if (!outputObject || outputObject.type !== "message") {
						throw Error("Not implemented: only single output item type is supported in streaming mode.");
					}

					if (outputObject.content.length === 0) {
						// Response content part added event
						const contentPart: ResponseContentPartAddedEvent["part"] = {
							type: "output_text",
							text: "",
							annotations: [],
						};
						outputObject.content.push(contentPart);

						emitEvent({
							type: "response.content_part.added",
							item_id: outputObject.id,
							output_index: 0,
							content_index: 0,
							part: contentPart,
							sequence_number: sequenceNumber++,
						});
					}

					const contentPart = outputObject.content.at(-1);
					if (!contentPart || contentPart.type !== "output_text") {
						throw Error("Not implemented: only output_text is supported in streaming mode.");
					}

					if (contentPart.type !== "output_text") {
						throw Error("Not implemented: only output_text is supported in streaming mode.");
					}

					// Add text delta
					contentPart.text += chunk.choices[0].delta.content;
					emitEvent({
						type: "response.output_text.delta",
						item_id: outputObject.id,
						output_index: 0,
						content_index: 0,
						delta: chunk.choices[0].delta.content,
						sequence_number: sequenceNumber++,
					});
				} else if (chunk.choices[0].delta.tool_calls) {
					if (chunk.choices[0].delta.tool_calls.length > 1) {
						throw Error("Not implemented: only single tool call is supported in streaming mode.");
					}

					if (responseObject.output.length === 0) {
						if (!chunk.choices[0].delta.tool_calls[0].function.name) {
							throw Error("Tool call function name is required.");
						}

						const outputObject: ResponseFunctionToolCall = {
							type: "function_call",
							id: generateUniqueId("fc"),
							call_id: chunk.choices[0].delta.tool_calls[0].id,
							name: chunk.choices[0].delta.tool_calls[0].function.name,
							arguments: "",
						};
						responseObject.output = [outputObject];

						// Response output item added event
						emitEvent({
							type: "response.output_item.added",
							output_index: 0,
							item: outputObject,
							sequence_number: sequenceNumber++,
						});
					}

					const outputObject = responseObject.output.at(-1);
					if (!outputObject || !outputObject.id || outputObject.type !== "function_call") {
						throw Error("Not implemented: can only support single output item type in streaming mode.");
					}

					outputObject.arguments += chunk.choices[0].delta.tool_calls[0].function.arguments;
					emitEvent({
						type: "response.function_call_arguments.delta",
						item_id: outputObject.id,
						output_index: 0,
						delta: chunk.choices[0].delta.tool_calls[0].function.arguments,
						sequence_number: sequenceNumber++,
					});
				}
			}

			const lastOutputItem = responseObject.output.at(-1);

			if (lastOutputItem) {
				if (lastOutputItem?.type === "message") {
					const contentPart = lastOutputItem.content.at(-1);
					if (contentPart?.type === "output_text") {
						emitEvent({
							type: "response.output_text.done",
							item_id: lastOutputItem.id,
							output_index: responseObject.output.length - 1,
							content_index: lastOutputItem.content.length - 1,
							text: contentPart.text,
							sequence_number: sequenceNumber++,
						});

						emitEvent({
							type: "response.content_part.done",
							item_id: lastOutputItem.id,
							output_index: responseObject.output.length - 1,
							content_index: lastOutputItem.content.length - 1,
							part: contentPart,
							sequence_number: sequenceNumber++,
						});
					} else {
						throw Error("Not implemented: only output_text is supported in streaming mode.");
					}

					// Response output item done event
					lastOutputItem.status = "completed";
					emitEvent({
						type: "response.output_item.done",
						output_index: responseObject.output.length - 1,
						item: lastOutputItem,
						sequence_number: sequenceNumber++,
					});
				} else if (lastOutputItem?.type === "function_call") {
					if (!lastOutputItem.id) {
						throw Error("Function call id is required.");
					}

					emitEvent({
						type: "response.function_call_arguments.done",
						item_id: lastOutputItem.id,
						output_index: responseObject.output.length - 1,
						arguments: lastOutputItem.arguments,
						sequence_number: sequenceNumber++,
					});

					lastOutputItem.status = "completed";
					emitEvent({
						type: "response.output_item.done",
						output_index: responseObject.output.length - 1,
						item: lastOutputItem,
						sequence_number: sequenceNumber++,
					});
				} else {
					throw Error("Not implemented: only message output is supported in streaming mode.");
				}
			}

			// Response completed event
			responseObject.status = "completed";
			emitEvent({
				type: "response.completed",
				response: responseObject as Response,
				sequence_number: sequenceNumber++,
			});
		} catch (streamError: any) {
			console.error("Error in streaming chat completion:", streamError);

			emitEvent({
				type: "error",
				code: null,
				message: streamError.message || "An error occurred while streaming from inference server.",
				param: null,
				sequence_number: sequenceNumber++,
			});
		}
		res.end();
		return;
	}

	try {
		const chatCompletionResponse = await client.chatCompletion(payload);

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
			: chatCompletionResponse.choices[0].message.tool_calls
			  ? chatCompletionResponse.choices[0].message.tool_calls.map((toolCall) => ({
						type: "function_call",
						id: generateUniqueId("fc"),
						call_id: toolCall.id,
						name: toolCall.function.name,
						arguments: toolCall.function.arguments,
						status: "completed",
			    }))
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
