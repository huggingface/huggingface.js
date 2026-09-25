import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const output = await client.textRanking({
	model: "cross-encoder/ettin-reranker-68m-v1",
	inputs: {
    "query": "Which planet is known as the Red Planet?",
    "texts": [
        "Venus is often called Earth's twin because of its similar size and proximity.",
        "Mars, known for its reddish appearance, is often referred to as the Red Planet.",
        "Jupiter, the largest planet in our solar system, has a prominent red spot.",
        "Saturn, famous for its rings, is sometimes mistaken for the Red Planet."
    ]
},
	provider: "hf-inference",
});

console.log(output);