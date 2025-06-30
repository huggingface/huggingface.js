/**
 * AI-generated file using Cursor + Claude 4
 */

import { type Request, type Response, type NextFunction } from "express";

/**
 * Middleware to log all HTTP requests with duration, status code, method, and route
 * @returns Express middleware function
 */
export function requestLogger() {
	return (req: Request, res: Response, next: NextFunction): void => {
		const start = Date.now();
		const { method, url } = req;

		// Log request start
		console.log(`[${new Date().toISOString()}] 📥 ${method} ${url}`);

		// Override res.end to capture response details
		const originalEnd = res.end;
		res.end = function (chunk?: unknown, encoding?: BufferEncoding, cb?: () => void) {
			const duration = Date.now() - start;
			const statusCode = res.statusCode;
			const statusEmoji =
				statusCode >= 200 && statusCode < 300
					? "✅"
					: statusCode >= 400 && statusCode < 500
					  ? "⚠️"
					  : statusCode >= 500
					    ? "❌"
					    : "ℹ️";

			console.log(`[${new Date().toISOString()}] ${statusEmoji} ${statusCode} ${method} ${url} (${duration}ms)`);

			// Call the original end method with proper return type
			return originalEnd.call(this, chunk, encoding, cb);
		};

		next();
	};
}
