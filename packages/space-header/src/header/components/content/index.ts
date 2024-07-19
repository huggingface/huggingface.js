import type { Space } from "../../../type";
import { SpaceIcon } from "../collapse/space_icon";
import { Like } from "../like";
import { Avatar } from "./avatar";
import { Namespace } from "./namespace";
import { Separation } from "./separation";
import { Username } from "./username";

export const Content = (space: Space, isSvg: boolean = false): HTMLDivElement | SVGElement => {
	const content = document.createElement("div");
	content.style.display = "flex";
	content.style.flexDirection = "row";
	content.style.alignItems = "center";
	content.style.justifyContent = "center";
	content.style.borderRight = "1px solid #e5e7eb";
	content.style.paddingRight = "12px";
	content.style.height = "40px";

	if (isSvg) {
		content.appendChild(SpaceIcon());
	} else {
		content.appendChild(Avatar(space.author));
		content.appendChild(Username(space.author));
		content.appendChild(Separation());
		content.appendChild(Namespace(space.id));
		content.appendChild(Like(space));
	}

	return content;
};
