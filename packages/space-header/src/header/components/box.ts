export const Box = (): HTMLDivElement => {
	const box = document.createElement("div");

	box.style.backgroundImage = "linear-gradient(to top, #f9fafb, white)";
	box.style.border = "1px solid #e5e7eb";
	box.style.borderRadius = "0.75rem";
	box.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
	box.style.color = "#374151";
	box.style.display = "flex";
	box.style.flexDirection = "row";
	box.style.alignItems = "center";
	box.style.height = "40px";
	box.style.justifyContent = "space-between";
	box.style.overflow = "hidden";
	box.style.position = "fixed";
	box.style.right = ".75rem";
	box.style.top = ".75rem";
	box.style.width = "auto";
	box.style.zIndex = "20";
	// box.style.padding = "0.75rem";
	box.style.paddingLeft = "1rem";
	// box.style.paddingRight = "0rem";

	box.setAttribute("id", "huggingface-space-header");

	window.matchMedia("(max-width: 768px)").addEventListener("change", (e) => {
		if (e.matches) {
			box.style.display = "none";
		} else {
			box.style.display = "flex";
		}
	});

	return box;
};
