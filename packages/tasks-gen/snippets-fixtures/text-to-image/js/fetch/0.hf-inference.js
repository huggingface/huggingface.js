async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
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


query({     inputs: "\"Astronaut riding a horse\"", }).then((response) => {
    // Use image
});