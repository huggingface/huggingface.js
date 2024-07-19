export const SpaceIcon = (): SVGElement => {
	const space_icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	space_icon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	space_icon.setAttribute("xmlns:link", "http://www.w3.org/1999/xlink");
	space_icon.setAttribute("aria-hidden", "true");
	space_icon.setAttribute("focusable", "false");
	space_icon.setAttribute("role", "img");
	space_icon.setAttribute("width", "1em");
	space_icon.setAttribute("height", "1em");
	space_icon.setAttribute("preserveAspectRatio", "xMidYMid meet");
	space_icon.setAttribute("viewBox", "0 0 39 40");

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttribute(
		"d",
		"M6.3712 2.04427C3.7183 2.04427 1.56771 4.19486 1.56771 6.84776V18.3546V18.6544V32.7341C1.56771 35.3868 3.71818 37.5377 6.3712 37.5377H17.878H20.7507H32.2575C34.9104 37.5377 37.0612 35.387 37.0612 32.7341V21.6204C37.0612 20.177 36.4252 18.8839 35.4189 18.004C36.4576 16.3895 37.0612 14.4666 37.0612 12.4046C37.0612 6.68274 32.4225 2.04427 26.7007 2.04427C24.6388 2.04427 22.7159 2.64776 21.1014 3.68647C20.2214 2.6802 18.9282 2.04427 17.4849 2.04427H6.3712Z"
	);
	path.setAttribute("stroke-width", "3.07552");

	const path_2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path_2.setAttribute(
		"d",
		"M9.56855 23.5001C8.8406 23.5001 8.25047 24.0902 8.25047 24.8182V29.5361C8.25047 30.2641 8.8406 30.8542 9.56855 30.8542H14.2864C15.0144 30.8542 15.6045 30.2641 15.6045 29.5361V24.8182C15.6045 24.0902 15.0143 23.5001 14.2864 23.5001H9.56855Z"
	);
	path_2.setAttribute("fill", "#FF3270");

	const path_3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path_3.setAttribute(
		"d",
		"M24.3409 23.5001C23.613 23.5001 23.0228 24.0902 23.0228 24.8182V29.5361C23.0228 30.2641 23.613 30.8542 24.3409 30.8542H29.0588C29.7868 30.8542 30.3769 30.2641 30.3769 29.5361V24.8182C30.3769 24.0902 29.7868 23.5001 29.0588 23.5001H24.3409Z"
	);
	path_3.setAttribute("fill", "#861FFF");

	const path_4 = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path_4.setAttribute(
		"d",
		"M9.56855 8.72815C8.8406 8.72815 8.25047 9.31827 8.25047 10.0462V14.7641C8.25047 15.4921 8.8406 16.0822 9.56855 16.0822H14.2864C15.0144 16.0822 15.6045 15.4921 15.6045 14.7641V10.0462C15.6045 9.31827 15.0143 8.72815 14.2864 8.72815H9.56855Z"
	);
	path_4.setAttribute("fill", "#097EFF");

	const path_5 = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path_5.setAttribute(
		"d",
		"M26.6999 8.72815C24.6692 8.72815 23.0228 10.3744 23.0228 12.4052C23.0228 14.4359 24.6692 16.0822 26.6999 16.0822C28.7306 16.0822 30.3769 14.4359 30.3769 12.4052C30.3769 10.3744 28.7306 8.72815 26.6999 8.72815Z"
	);
	path_5.setAttribute("fill", "#FFD702");

	space_icon.appendChild(path);
	space_icon.appendChild(path_2);
	space_icon.appendChild(path_3);
	space_icon.appendChild(path_4);
	space_icon.appendChild(path_5);

	return space_icon;
};
