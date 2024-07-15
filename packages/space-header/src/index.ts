import type { Options, Space } from "./type";

import { inject_fonts } from "./inject_fonts";

import { create } from "./header/create";
import { get_space } from "./get_space";
import { inject } from "./inject";

async function main(initialSpace: string | Space, options?: Options) {
	if (window === undefined) return console.error("Please run this script in a browser environment");
	// Don't run on huggingface.co to avoid duplicate headers
	const has_huggingface_ancestor = Object.values(window.location?.ancestorOrigins ?? {}).some((origin) =>
		origin.includes("huggingface.co")
	);
	if (has_huggingface_ancestor) return;

	inject_fonts();

	let space;

	if (typeof initialSpace === "string") {
		space = await get_space(initialSpace);
		if (space === null) return console.error("Space not found");
	}

	const mini_header_element = create(space as Space);
	inject(mini_header_element, options);
}

export const init = (space: string | Space, options?: Options): Promise<void> => main(space, options);
