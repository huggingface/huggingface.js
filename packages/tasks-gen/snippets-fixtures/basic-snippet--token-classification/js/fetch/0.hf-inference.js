async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/hf-inference/models/FacebookAI/xlm-roberta-large-finetuned-conll03-english",
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

query({ inputs: "My name is Sarah Jessica Parker but you can call me Jessica" }).then((response) => {
    console.log(JSON.stringify(response));
});