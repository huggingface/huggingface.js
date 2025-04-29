async function query(data) {
	const response = await fetch(
		"https://fal.run/<fal-ai alias for nari-labs/Dia-1.6B>",
		{
			headers: {
				Authorization: "Key api_token",
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
    const result = await response.json();
    return result;
}

query({ text: "The answer to the universe is 42" }).then((response) => {
    console.log(JSON.stringify(response));
});