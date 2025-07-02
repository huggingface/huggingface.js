/**
 * AI-generated file using Cursor + Claude 4
 *
 * Middleware to log all HTTP requests with duration, status code, method, and route
 */
import { type Request, type Response, type NextFunction } from "express";

interface LogContext {
	timestamp: string;
	method: string;
	url: string;
	statusCode?: number;
	duration?: number;
}

function formatLogMessage(context: LogContext): string {
	const { timestamp, method, url, statusCode, duration } = context;

	if (statusCode === undefined) {
		return `[${timestamp}] 📥 ${method} ${url}`;
	}

	const statusEmoji =
		statusCode >= 200 && statusCode < 300
			? "✅"
			: statusCode >= 400 && statusCode < 500
			  ? "⚠️"
			  : statusCode >= 500
			    ? "❌"
			    : "ℹ️";
	return `[${timestamp}] ${statusEmoji} ${statusCode} ${method} ${url} (${duration}ms)`;
}

/**
 * Middleware to log all HTTP requests with duration, status code, method, and route
 */
export function requestLogger() {
	return (req: Request, res: Response, next: NextFunction): void => {
		const startTime = Date.now();
		const { method, url } = req;

		// Log incoming request
		console.log(
			formatLogMessage({
				timestamp: new Date().toISOString(),
				method,
				url,
			})
		);

		// Listen for when the response finishes
		res.on("finish", () => {
			const duration = Date.now() - startTime;

			console.log(
				formatLogMessage({
					timestamp: new Date().toISOString(),
					method,
					url,
					statusCode: res.statusCode,
					duration,
				})
			);
		});

		next();
	};
}
