import type { Space } from '../../../type.js';
import { Like } from '../like.js';
import { Avatar } from './avatar.js';
import { Namespace } from './namespace.js';
import { Separation } from './separation.js';
import { Username } from './username.js';

export const Content = (space: Space): HTMLDivElement => {
	const content = document.createElement("div");
	content.style.display = "flex";
	content.style.flexDirection = "row";
	content.style.alignItems = "center";
	content.style.justifyContent = "center";
	content.style.borderRight = "1px solid #e5e7eb";
	content.style.paddingRight = "12px";
	content.style.height = "40px";

	if (space.type !== "unknown") {
		content.appendChild(Avatar(space.author, space.type));
	}
	content.appendChild(Username(space.author));
	content.appendChild(Separation());
	content.appendChild(Namespace(space.id));
	content.appendChild(Like(space));

	return content;
};
