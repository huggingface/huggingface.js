/**
 * AI-generated file using Cursor + Claude 4
 */

import { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";

/**
 * Middleware to validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			const validatedBody = schema.parse(req.body);
			req.body = validatedBody;
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				console.log(req.body);
				res.status(400).json({
					success: false,
					error: error.errors,
					details: error.errors,
				});
			} else {
				res.status(500).json({
					success: false,
					error: "Internal server error",
				});
			}
		}
	};
}

/**
 * Type helper to create a properly typed request with validated body
 */
export interface ValidatedRequest<T> extends Request {
	body: T;
}
