async function query(data) {
	const response = await fetch(
		"http://localhost:8080/v1/chat/completions",
		{
			headers: {
				Authorization: `Bearer ${process.env.API_TOKEN}`,
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
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
    model: "meta-llama/Llama-3.1-8B-Instruct",
}).then((response) => {
    console.log(JSON.stringify(response));
});