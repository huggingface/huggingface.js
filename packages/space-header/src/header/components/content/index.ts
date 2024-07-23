import type { Space } from "../../../type";
import { Like } from "../like";
import { Avatar } from "./avatar";
import { Namespace } from "./namespace";
import { Separation } from "./separation";
import { Username } from "./username";

export const Content = (space: Space): HTMLDivElement => {
	const content = document.createElement("div");
	content.style.display = "flex";
	content.style.flexDirection = "row";
	content.style.alignItems = "center";
	content.style.justifyContent = "center";
	content.style.borderRight = "1px solid #e5e7eb";
	content.style.paddingRight = "12px";
	content.style.height = "40px";

	if (space.has_avatar) {
		content.appendChild(Avatar(space.author));
	}
	content.appendChild(Username(space.author));
	content.appendChild(Separation());
	content.appendChild(Namespace(space.id));
	content.appendChild(Like(space));

	return content;
};
