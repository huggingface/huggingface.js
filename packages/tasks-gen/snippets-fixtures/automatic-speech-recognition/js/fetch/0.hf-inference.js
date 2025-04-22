async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo",
		{
			headers: {
				Authorization: "Bearer api_token",
				"Content-Type": "audio/flac",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({ inputs: "sample1.flac" }).then((response) => {
    console.log(JSON.stringify(response));
});