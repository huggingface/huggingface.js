import type { WidgetProps } from "../../shared/types.js";
import type { Load } from "@sveltejs/kit";

export const load: Load = async ({ params, fetch }): Promise<{ model?: WidgetProps["model"]; message?: string }> => {
	const url = `https://huggingface.co/api/models/${params.model}`;
	try {
		const model = await (await fetch(url)).json();
		return {
			model,
		};
	} catch {
		// todo: throw error() instead
		return {
			message: `Model ${params.model} not found (probably)`,
		};
	}
};
