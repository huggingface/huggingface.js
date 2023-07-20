import type { LLM } from "../types";

export function LLMFromOpenAI(openAIKey: string): LLM {
	let openai = null;
	try {
		openai = require("openai");
	} catch (e) {
		throw new Error("OpenAI not installed, use another LLM.");
	}

	const api = new openai.OpenAIApi(new openai.Configuration({ apiKey: openAIKey }));

	return async (prompt: string): Promise<string> => {
		const textAnswer =
			(
				await api.createCompletion({
					model: "text-davinci-003",
					prompt: prompt,
					max_tokens: 1000,
				})
			).data.choices[0].text ?? "";

		return textAnswer;
	};
}
