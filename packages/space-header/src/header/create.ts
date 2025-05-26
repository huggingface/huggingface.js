import type { Space } from "../type.js";

import { Box } from "./components/box.js";
import { Collapse } from "./components/collapse.js";
import { Content } from "./components/content.js";

export const create = (space: Space): HTMLElement => {
	const box = Box();

	const handleCollapse = () => (box.style.display = "none");

	box.appendChild(Content(space));
	box.appendChild(Collapse(space, handleCollapse));

	return box;
};
