import { type Response } from "express";
import { type ValidatedRequest } from "../middleware/validation.js";
import { type ResponsesInput } from "../schemas/responses.js";

export const handleResponses = (req: ValidatedRequest<ResponsesInput>, res: Response): void => {
	res.json({
		success: true,
		input: req.body.input,
		message: "Request processed successfully",
	});
};
