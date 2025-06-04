async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct/pipeline/feature-extraction",
		{
			headers: {
				Authorization: `Bearer ${process.env.HF_TOKEN}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({ inputs: "Today is a sunny day and I will get some ice cream." }).then((response) => {
    console.log(JSON.stringify(response));
});