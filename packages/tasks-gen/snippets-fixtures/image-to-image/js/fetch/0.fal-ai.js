const image = fs.readFileSync("cat.png");

async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/fal-ai/<fal-ai alias for black-forest-labs/FLUX.1-Kontext-dev>?_subdomain=queue",
		{
			headers: {
				Authorization: `Bearer ${process.env.HF_TOKEN}`,
				"Content-Type": "image/jpeg",
			},
			method: "POST",
			body: {
				"inputs": `data:image/png;base64,${data.inputs.encode("base64")}`,
				"parameters": data.parameters,
			}
		}
	);
	const result = await response.json();
	return result;
}

query({ 
	inputs: image,
	parameters: {
		prompt: "Turn the cat into a tiger.",
	}
}).then((response) => {
    console.log(JSON.stringify(response));
});