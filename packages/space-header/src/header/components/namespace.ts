export const Namespace = (id: string): HTMLAnchorElement => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, spaceName] = id.split("/");
	const element = document.createElement("a");

	element.setAttribute("href", `https://huggingface.co/spaces/${id}`);
	element.setAttribute("rel", "noopener noreferrer");
	element.setAttribute("target", "_blank");

	element.style.color = "#1f2937";
	element.style.textDecoration = "none";
	element.style.fontWeight = "600";
	element.style.fontSize = "16px";
	element.style.lineHeight = "24px";
	element.style.flex = "none";
	element.style.fontFamily = "IBM Plex Mono, sans-serif";

	element.addEventListener("mouseover", () => {
		element.style.color = "#2563eb";
	});
	element.addEventListener("mouseout", () => {
		element.style.color = "#1f2937";
	});

	element.textContent = spaceName;

	return element;
};
