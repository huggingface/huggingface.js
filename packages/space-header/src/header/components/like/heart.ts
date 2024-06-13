export const Heart = (): SVGElement => {
	const heart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	heart.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	heart.setAttribute("xmlns:link", "http://www.w3.org/1999/xlink");
	heart.setAttribute("aria-hidden", "true");
	heart.setAttribute("focusable", "false");
	heart.setAttribute("role", "img");
	heart.setAttribute("width", "1em");
	heart.setAttribute("height", "1em");
	heart.setAttribute("preserveAspectRatio", "xMidYMid meet");
	heart.setAttribute("viewBox", "0 0 32 32");
	heart.setAttribute("fill", "#6b7280");

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

	path.setAttribute(
		"d",
		"M22.45,6a5.47,5.47,0,0,1,3.91,1.64,5.7,5.7,0,0,1,0,8L16,26.13,5.64,15.64a5.7,5.7,0,0,1,0-8,5.48,5.48,0,0,1,7.82,0L16,10.24l2.53-2.58A5.44,5.44,0,0,1,22.45,6m0-2a7.47,7.47,0,0,0-5.34,2.24L16,7.36,14.89,6.24a7.49,7.49,0,0,0-10.68,0,7.72,7.72,0,0,0,0,10.82L16,29,27.79,17.06a7.72,7.72,0,0,0,0-10.82A7.49,7.49,0,0,0,22.45,4Z"
	);

	heart.appendChild(path);
	return heart;
};
