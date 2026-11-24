async function query(data) {
	const response = await fetch(
		"https://api.openai.com/v1/chat/completions",
		{
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({ 
    model: "<openai alias for meta-llama/Llama-3.1-8B-Instruct>",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
}).then((response) => {
    console.log(JSON.stringify(response));
});