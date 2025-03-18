async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection",
		{
			headers: {
				Authorization: "Bearer api_token",
				"Content-Type": "image/jpeg"
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({ inputs: "cats.jpg" }).then((response) => {
    console.log(JSON.stringify(response));
});