async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/fal-ai/<fal-ai alias for black-forest-labs/FLUX.1-schnell>",
		{
			headers: {
				Authorization: `Bearer ${process.env.HF_TOKEN}`,
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