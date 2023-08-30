import { compileTemplate } from "../../utils/template";

export const templateFinalAnswer = compileTemplate<{
	prompt: string;
}>(`You can no longer us any tools to answer this question.

Answer your best guess to the initial question: {{prompt}}
`);
