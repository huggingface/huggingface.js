const image = fs.readFileSync("cat.png");

async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/fal-ai/<fal-ai alias for Wan-AI/Wan2.2-I2V-A14B>?_subdomain=queue",
		{
			headers: {
				Authorization: `Bearer ${process.env.HF_TOKEN}`,
				"Content-Type": "image/jpeg",
			},
			method: "POST",
			body: {
				"image_url": `data:image/png;base64,${data.image.encode("base64")}`,
				"prompt": data.prompt,
			}
		}
	);
	const result = await response.json();
	return result;
}

query({
	"image": image,
	"prompt": "The cat starts to dance",
}).then((response) => {
    // Use video
});