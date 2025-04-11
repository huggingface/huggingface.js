async function query(data) {
    const response = await fetch(
		"https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
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

query({
    inputs: "Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!",
    parameters: { candidate_labels: ["refund", "legal", "faq"] }
}).then((response) => {
    console.log(JSON.stringify(response));
});