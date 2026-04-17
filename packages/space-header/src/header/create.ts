import type { Space } from "../type";

import { Box } from "./components/box";
import { Collapse } from "./components/collapse";
import { Content } from "./components/content";

export const create = (space: Space): HTMLElement => {
	const box = Box();

	const handleCollapse = () => (box.style.display = "none");

	box.appendChild(Content(space));
	box.appendChild(Collapse(space, handleCollapse));

	return box;
};
