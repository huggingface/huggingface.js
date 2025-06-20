import type { IncomingMessage } from "node:http";
import { createServer, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { z } from "zod";
import type { Agent } from "../index";
import { ANSI } from "./utils";
import { stdout } from "node:process";
import type { ChatCompletionStreamOutput } from "@huggingface/tasks";

const REQUEST_ID_HEADER = "X-Request-Id";

const ChatCompletionInputSchema = z.object({
	messages: z.array(
		z.object({
			role: z.enum(["user", "assistant"]),
			content: z.string().or(
				z.array(
					z
						.object({
							type: z.literal("text"),
							text: z.string(),
						})
						.or(
							z.object({
								type: z.literal("image_url"),
								image_url: z.object({
									url: z.string(),
								}),
							})
						)
				)
			),
		})
	),
	/// Only allow stream: true
	stream: z.literal(true),
});
function getJsonBody(req: IncomingMessage) {
	return new Promise((resolve, reject) => {
		let data = "";
		req.on("data", (chunk) => (data += chunk));
		req.on("end", () => {
			try {
				resolve(JSON.parse(data));
			} catch (e) {
				reject(e);
			}
		});
		req.on("error", reject);
	});
}
class ServerResp extends ServerResponse {
	error(statusCode: number, reason: string) {
		this.writeHead(statusCode).end(JSON.stringify({ error: reason }));
	}
}

export function startServer(agent: Agent): void {
	const server = createServer({ ServerResponse: ServerResp }, async (req, res) => {
		res.setHeader(REQUEST_ID_HEADER, crypto.randomUUID());
		res.setHeader("Content-Type", "application/json");
		if (req.method === "POST" && req.url === "/v1/chat/completions") {
			let body: unknown;
			let requestBody: z.infer<typeof ChatCompletionInputSchema>;
			try {
				body = await getJsonBody(req);
			} catch {
				return res.error(400, "Invalid JSON");
			}
			try {
				requestBody = ChatCompletionInputSchema.parse(body);
			} catch (err) {
				if (err instanceof z.ZodError) {
					return res.error(400, "Invalid ChatCompletionInput body \n" + JSON.stringify(err));
				}
				return res.error(400, "Invalid ChatCompletionInput body");
			}
			/// Ok, from now on we will send a SSE (Server-Sent Events) response.
			res.setHeaders(
				new Headers({
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
				})
			);

			/// Prepend the agent's prompt
			const messages = [
				{
					role: "system",
					content: agent.prompt,
				},
				...requestBody.messages,
			];

			for await (const chunk of agent.run(messages)) {
				if ("choices" in chunk) {
					res.write(`data: ${JSON.stringify(chunk)}\n\n`);
				} else {
					/// Tool call info
					/// /!\ We format it as a regular chunk of role = "tool"
					const chunkToolcallInfo = {
						choices: [
							{
								index: 0,
								delta: {
									role: "tool",
									content: `Tool[${chunk.name}] ${chunk.tool_call_id}\n` + chunk.content,
								},
							},
						],
						created: Math.floor(Date.now() / 1000),
						id: chunk.tool_call_id,
						model: "",
						system_fingerprint: "",
					} satisfies ChatCompletionStreamOutput;

					res.write(`data: ${JSON.stringify(chunkToolcallInfo)}\n\n`);
				}
			}
			res.end();
		} else {
			res.error(404, "Route or method not found, try POST /v1/chat/completions");
		}
	});
	server.listen(process.env.PORT ? parseInt(process.env.PORT) : 9_999, () => {
		stdout.write(ANSI.BLUE);
		stdout.write(`Agent loaded with ${agent.availableTools.length} tools:\n`);
		stdout.write(agent.availableTools.map((t) => `- ${t.function.name}`).join("\n"));
		stdout.write(ANSI.RESET);
		stdout.write("\n");
		console.log(ANSI.GRAY + `listening on http://localhost:${(server.address() as AddressInfo).port}` + ANSI.RESET);
	});
}
