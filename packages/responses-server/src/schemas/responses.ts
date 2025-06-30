import { z } from "zod";

export const responsesSchema = z.object({
	input: z.string(),
});

export type ResponsesInput = z.infer<typeof responsesSchema>;
