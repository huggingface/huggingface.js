import type { Space } from "../type";

import { Avatar } from "./components/avatar";
import { Box } from "./components/box";
import { Username } from "./components/username";
import { Separation } from "./components/separation";
import { Namespace } from "./components/namespace";
import { Like } from "./components/like";

export const create = (space: Space): HTMLElement => {
	const box = Box();

	box.appendChild(Avatar(space.author));
	box.appendChild(Username(space.author));
	box.appendChild(Separation());
	box.appendChild(Namespace(space.id));
	box.appendChild(Like(space));

	return box;
};
