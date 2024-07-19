import type { Space } from "../type";

import { Box } from "./components/box";
import { Collapse } from "./components/collapse";
import { Content } from "./components/content";

export const create = (space: Space): HTMLElement => {
	const box = Box();

	const handleCollapse = (shouldCollapse: boolean) => {
		const collapse = document.getElementById("space-header__collapse");
		if (!collapse) return;
		if (box.firstChild) box.removeChild(box.firstChild);
		box.insertBefore(Content(space, !shouldCollapse), collapse);
	};

	box.appendChild(Content(space));
	box.appendChild(Collapse(space, handleCollapse));

	return box;
};
