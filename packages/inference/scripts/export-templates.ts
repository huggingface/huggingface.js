/* Script that export all jinja files from packages/inference/src/snippets/templates into a TS module.

Templates are exported in packages/inference/src/snippets/templates.exported.ts.
*/
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const TEMPLATES_DIR = path.join(process.cwd(), "src", "snippets", "templates");

function exportTemplatesAsCode(): string {
	/// language -> client -> templateName -> templateContent
	const templates: Record<string, Record<string, Record<string, string>>> = {};

	// Read all language directories
	const languages = readdirSync(TEMPLATES_DIR);
	for (const language of languages) {
		const languagePath = path.join(TEMPLATES_DIR, language);
		if (!readdirSync(languagePath).length) continue;

		templates[language] = {};

		// Read all client directories
		const clients = readdirSync(languagePath);
		for (const client of clients) {
			const clientPath = path.join(languagePath, client);
			if (!readdirSync(clientPath).length) continue;

			templates[language][client] = {};

			// Read all template files
			const files = readdirSync(clientPath);
			for (const file of files) {
				if (!file.endsWith(".jinja")) continue;

				const templatePath = path.join(clientPath, file);
				const templateContent = readFileSync(templatePath, "utf8");
				const templateName = path.basename(file, ".jinja");

				templates[language][client][templateName] = templateContent;
			}
		}
	}

	const templatesJson = JSON.stringify(templates, null, 2);
	return `// Generated file - do not edit directly
export const templates: Record<string, Record<string, Record<string, string>>> = ${templatesJson} as const;
`;
}

// Generate and write the templates file
const output = exportTemplatesAsCode();
const outputPath = path.join(process.cwd(), "src", "snippets", "templates.exported.ts");
writeFileSync(outputPath, output);
console.log("Templates exported successfully! 🚀");
