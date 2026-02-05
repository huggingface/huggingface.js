async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/fal-ai/<fal-ai alias for openfree/flux-chatgpt-ghibli-lora>?_subdomain=queue",
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


query({     prompt: "\"Astronaut riding a horse\"",
    loras: [
        {
            path: "https://huggingface.co/openfree/flux-chatgpt-ghibli-lora/resolve/main/<path to LoRA weights in .safetensors format>",
            scale: 1,
        },
    ], }).then((response) => {
    // Use image
});