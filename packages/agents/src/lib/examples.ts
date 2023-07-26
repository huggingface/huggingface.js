import type { Example } from "../types";

const examples: Example[] = [
	{
		prompt: "Caption the image and give me the caption read out loud.",
		code: `async function generate(image) {
    const caption = await imageToText(image);
    message("First we caption the image", caption);
    const output = await textToSpeech(caption);
    message("Then we read the caption out loud", output);
    return output;
}`,
		tools: ["imageToText", "textToSpeech"],
		inputs: { image: true },
	},
	{
		prompt: "Display an image of a yellow dog wearing a top hat",
		code: `async function generate() {
        const output = await textToImage("yellow dog wearing a top hat");
        message("We generate the dog picture", output);
        return output;
}`,
		tools: ["textToImage"],
	},
	{
		prompt:
			"transcribe the attached audio and only if it contains the word 'dog' generate an image of a dog wearing a top hat",
		code: `async function generate(audio) {
const output = await speechToText(audio);
message("We read the text", output);

if (output.includes("dog")) {
    const image = await textToImage("dog wearing a top hat");
    message("We generate the dog picture", image);
    return image;
} else {
    return null;
}};`,
		tools: ["speechToText", "textToImage"],
		inputs: { audio: true },
	},
	{
		prompt: "Caption the image and generate an image based on the caption, but in a medieval fantasy style.",
		code: `async function generate(image) {
    const caption = await imageToText(image);
    message("First we caption the image", caption);
    const output = await textToImage(caption + " medieval fantasy");
    message("Then we generate an image based on the caption", output);
    return output;
}`,
		tools: ["imageToText", "textToImage"],
		inputs: { image: true },
	},
	{
		prompt: "Who Was Napoléon Bonaparte?",
		code: `async function generate() {
	message("Napoléon Bonaparte was a French military and political leader.");
}`,
		tools: ["message"],
	},
	{
		prompt: "What is 5+5?",
		code: `async function generate() {
	message(\`5+5 is equal to ${5 + 5}\`);
}`,
		tools: ["message"],
	},

	{
		prompt: "Can you draw the current president of France?",
		code: `async function generate() {
	const output = await textToImage("Emmanuel Macron");
	message("The current president of France", output);
	return output
}`,
		tools: ["textToImage", "message"],
	},
];

export default examples;
