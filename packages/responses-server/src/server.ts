import express, { type Express } from "express";
import { createResponseSchema } from "./schemas.js";
import { validateBody } from "./middleware/validation.js";
import { requestLogger } from "./middleware/logging.js";
import { postCreateResponse } from "./routes/index.js";

export const createApp = (): Express => {
	const app: Express = express();

	// Middleware
	app.use(requestLogger());
	app.use(express.json());

	// Routes
	app.get("/", (req, res) => {
		res.send("hello world");
	});

	app.post("/v1/responses", validateBody(createResponseSchema), postCreateResponse);

	return app;
};
