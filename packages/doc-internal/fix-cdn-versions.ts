import { readFileSync, writeFileSync } from "fs";

const hubPackage = JSON.parse(readFileSync("../hub/package.json").toString());
const inferencePackage = JSON.parse(readFileSync("../inference/package.json").toString());

for (const readme of ["../../README.md", "../../packages/hub/README.md", "../../packages/inference/README.md"]) {
	let content = readFileSync(readme, "utf-8");

	content = content.replace(
		/@huggingface[/]inference@\d([.]\d)?([.]\d)?/g,
		`@huggingface/inference@${inferencePackage.version}`
	);
	content = content.replace(/@huggingface[/]hub@\d([.]\d)?([.]\d)?/g, `@huggingface/hub@${hubPackage.version}`);

	writeFileSync(readme, Buffer.from(content));
}
