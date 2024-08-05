import type { Options, Space, Header } from "./type";

import { inject_fonts } from "./inject_fonts";

import { create } from "./header/create";
import { check_avatar } from "./utils/check_avatar";
import { get_space } from "./utils/get_space";
import { inject } from "./inject";

async function main(initialSpace: string | Space, options?: Options) {
	if (window === undefined) return console.error("Please run this script in a browser environment");
	// Don't run on huggingface.co to avoid duplicate headers
	const has_huggingface_ancestor = Object.values(
		window.location?.ancestorOrigins ?? {
			0: window.document.referrer,
		}
	).some((origin) => new URL(origin)?.origin === "https://huggingface.co");
	if (has_huggingface_ancestor) return;

	inject_fonts();

	let space;

	if (typeof initialSpace === "string") {
		space = await get_space(initialSpace);
		if (space === null) return console.error("Space not found");
	} else {
		space = initialSpace;
	}

	const [user, org] = await Promise.all([check_avatar(space.author, "user"), check_avatar(space.author, "org")]);
	space.type = user ? "user" : org ? "org" : "unknown";

	const mini_header_element = create(space as Space);
	inject(mini_header_element, options);

	return {
		element: mini_header_element,
	};
}

export const init = (space: string | Space, options?: Options): Promise<Header | void> => main(space, options);
