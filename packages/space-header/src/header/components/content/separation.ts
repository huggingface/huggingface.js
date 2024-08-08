export const Separation = (): HTMLDivElement => {
	const separation = document.createElement("div");

	separation.style.marginLeft = ".125rem";
	separation.style.marginRight = ".125rem";
	separation.style.color = "#d1d5db";

	separation.textContent = "/";
	return separation;
};
