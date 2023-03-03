import { readFileSync, writeFileSync } from "fs";
import glob from "glob";
import { join } from "path";

for (const mdFile of await glob("**/*.md", { cwd: "../../docs" })) {
	console.log(mdFile);
	const content = readFileSync(join("../../docs", mdFile)).toString();
	writeFileSync(
		join("../../docs", mdFile),
		content
			// Fix links
			.replaceAll(/\([^)]+\.md\b(#[^)]+)?\)/g, (val) => val.replace(".md", ""))
			// When on HF, remove links to HF
			.replaceAll(/.*\[full documentation\].*/g, "")
	);
}

// (modules.md#imagesegmentationreturnvalue)
