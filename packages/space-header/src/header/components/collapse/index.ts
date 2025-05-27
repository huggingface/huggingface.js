import type { Space } from "../../../type.js";
import { ArrowCollapse } from "./arrow.js";

export const Collapse = (space: Space, callback: () => void): HTMLDivElement | SVGElement => {
	const box = document.createElement("div");

	box.setAttribute("id", "space-header__collapse");

	box.style.display = "flex";
	box.style.flexDirection = "row";
	box.style.alignItems = "center";
	box.style.justifyContent = "center";
	box.style.fontSize = "16px";
	box.style.paddingLeft = "10px";
	box.style.paddingRight = "10px";
	box.style.height = "40px";
	box.style.cursor = "pointer";
	box.style.color = "#40546e";
	box.style.transitionDuration = "0.1s";
	box.style.transitionProperty = "all";
	box.style.transitionTimingFunction = "ease-in-out";

	box.appendChild(ArrowCollapse());

	box.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
		callback();
	});

	box.addEventListener("mouseenter", () => {
		box.style.color = "#213551";
	});
	box.addEventListener("mouseleave", () => {
		box.style.color = "#40546e";
	});

	return box;
};
