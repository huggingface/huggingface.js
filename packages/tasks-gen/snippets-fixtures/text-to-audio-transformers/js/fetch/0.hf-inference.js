async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/hf-inference/models/facebook/musicgen-small",
		{
			headers: {
				Authorization: "Bearer api_token",
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
    const result = await response.json();
    return result;
}

query({ inputs: "liquid drum and bass, atmospheric synths, airy sounds" }).then((response) => {
    console.log(JSON.stringify(response));
});