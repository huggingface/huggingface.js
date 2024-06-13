import { inject_to_body } from "./inject_to_body";
import { inject_fonts } from "./inject_fonts";

import { create } from "./header/create";
import { get_space } from "./get_space";

async function main(space_id: string) {
	if (window === undefined) return console.error("Please run this script in a browser environment");
	// Don't run on huggingface.co to avoid duplicate headers
	if (window.location?.origin === "https://huggingface.co") return;

	inject_fonts();

	const space = await get_space(space_id);
	if (space === null) return console.error("Space not found");

	const mini_header_element = create(space);
	inject_to_body(mini_header_element);
}

export const init = (space_id: string): Promise<void> => main(space_id);
