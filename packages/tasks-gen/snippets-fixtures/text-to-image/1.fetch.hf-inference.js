async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
		{
			headers: {
				Authorization: "Bearer api_token",
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.blob();
	return result;
}
query({"inputs": "Astronaut riding a horse"}).then((response) => {
	// Use image
});