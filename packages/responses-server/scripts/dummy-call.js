#!/usr/bin/env node

import { request } from "http";

const data = JSON.stringify({ input: "" });

const req = request(
	{
		hostname: "localhost",
		port: 3000,
		path: "/v1/responses",
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Content-Length": Buffer.byteLength(data),
		},
	},
	(res) => {
		console.log(`Status: ${res.statusCode}`);

		let body = "";
		res.on("data", (chunk) => (body += chunk));
		res.on("end", () => console.log(body));
	}
);

req.on("error", (e) => console.error(`Problem with request: ${e.message}`));
req.write(data);
req.end();
