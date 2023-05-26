import { readFileSync, writeFileSync } from "fs";
import glob from "glob";
import { join } from "path";

const RE_MD_HEADING = /^(#+)\s+(.*)/gm;
const LEVEL_3 = 3 as const;
const LEVEL_4 = 4 as const;
const NON_UNIQUE_HEADINGS = new Set([
	"Defined in",
	"Parameters",
	"Returns",
	"Type parameters",
	"Type declaration",
	"Overrides",
	"Inherited from",
]);

// same rule as defined in https://github.com/huggingface/doc-builder#anchor-link
function createHtmlId(mdHeading: string): string {
	return mdHeading
		.toLowerCase()
		.replaceAll(" ", "-")
		.replace(/[^a-z0-9-]/g, "");
}

// this script fixes a problem where same markdown headings generates html elements
// with same id (non-unique id) (ex: all `#### Returns` headings become `<h4 id="returns">Returns</h4>`)
// to fix this non-unique id problem, doc builder provides a syntax `# {heading_text}[[{custom_id}]]`
// read more https://github.com/huggingface/doc-builder#anchor-link
// (ex: `### Returns` now becomes `#### Returns[[some-function-name.returns]]`)
for (const mdFile of await glob("**/*.md", { cwd: "../../docs" })) {
	const content = readFileSync(join("../../docs", mdFile)).toString();
	let modifiedMarkdown = content;
	let offset = 0;
	let match;
	let current_level_3: string | undefined = undefined;
	while ((match = RE_MD_HEADING.exec(content)) !== null) {
		const headingLevel = match[1].length;
		const headingText = match[2];
		if (headingLevel === LEVEL_3) {
			current_level_3 = headingText;
		} else if (headingLevel === LEVEL_4 && NON_UNIQUE_HEADINGS.has(headingText) && current_level_3) {
			const matchText = match[0];
			const matchIndex = match.index + offset;
			const replacement = matchText + `[[${createHtmlId(current_level_3)}.${createHtmlId(headingText)}]]`;
			modifiedMarkdown =
				modifiedMarkdown.slice(0, matchIndex) + replacement + modifiedMarkdown.slice(matchIndex + matchText.length);
			offset += replacement.length - matchText.length;
		}
	}

	writeFileSync(join("../../docs", mdFile), modifiedMarkdown);
}
