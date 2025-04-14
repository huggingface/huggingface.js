async function query(data) {
	const response = await fetch(
		"https://fal.run/<fal-ai alias for black-forest-labs/FLUX.1-schnell>",
		{
			headers: {
				Authorization: "Key api_token",
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.blob();
	return result;
}


query({     sync_mode: true,
    prompt: "\"Astronaut riding a horse\"", }).then((response) => {
    // Use image
});