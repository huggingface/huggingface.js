import express, { type Express } from "express";
import { responsesSchema } from "./schemas/responses.js";
import { validateBody } from "./middleware/validation.js";
import { requestLogger } from "./middleware/logging.js";
import { handleResponses } from "./routes/index.js";

export const createApp = (): Express => {
	const app: Express = express();

	// Middleware
	app.use(requestLogger());
	app.use(express.json());

	// Routes
	app.get("/", (req, res) => {
		res.send("hello world");
	});

	app.post("/v1/responses", validateBody(responsesSchema), handleResponses);

	return app;
};
