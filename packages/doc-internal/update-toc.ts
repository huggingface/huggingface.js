/**
 * Script to generate entries for interfaces, types & classes in the TOC
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { inspect } from "util";
import { parse, stringify } from "yaml";

interface Section {
	title:     string;
	local?:    string;
	sections?: Section[];
}

const content = readFileSync("../../docs/_toctree.yml");

const TOC = parse(content.toString()) as Section[];

const dirs = readdirSync("../../docs", { withFileTypes: true }).filter((dir) => dir.isDirectory());

for (const dir of dirs) {
	const section = TOC.find((section) => section.sections?.some((file) => file.local?.startsWith(dir.name + "/")));

	if (!section) {
		throw new Error("Missing folder in TOC: " + dir.name);
	}

	// Remove folders under dir
	section.sections = section.sections!.filter((section) => !section.sections);

	const subdirs = readdirSync(join("../../docs", dir.name), { withFileTypes: true }).filter((dir) => dir.isDirectory());

	for (const subdir of subdirs) {
		const newSection: Section = { title: subdir.name[0].toUpperCase() + subdir.name.slice(1), sections: [] };
		section.sections.push(newSection);

		const files = readdirSync(join("../../docs", dir.name, subdir.name), { withFileTypes: true }).filter((dir) =>
			dir.isFile()
		);

		for (const file of files) {
			newSection.sections!.push({
				title: file.name.slice(0, -".md".length),
				local: `${dir.name}/${subdir.name}/${file.name.slice(0, -".md".length)}`,
			});
		}
	}
}

writeFileSync("../../docs/_toctree.yml", stringify(TOC));
