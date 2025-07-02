import { createApp } from "./server.js";

const app = createApp();
const port = process.env.PORT || 3000;

// Start server
app.listen(port, () => {
	console.log(`🚀 Server started at ${new Date().toISOString()}`);
	console.log(`🌐 Server is running on http://localhost:${port}`);
	console.log("─".repeat(60));
});

// Graceful shutdown logging
process.on("SIGINT", () => {
	console.log("─".repeat(60));
	console.log(`🛑 Server shutting down at ${new Date().toISOString()}`);
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("─".repeat(60));
	console.log(`🛑 Server shutting down at ${new Date().toISOString()}`);
	process.exit(0);
});

export default app;
