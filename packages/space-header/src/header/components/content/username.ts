export const Username: (username: string) => HTMLAnchorElement = (username: string) => {
	const element = document.createElement("a");

	element.setAttribute("href", `https://huggingface.co/${username}`);
	element.setAttribute("rel", "noopener noreferrer");
	element.setAttribute("target", "_blank");

	element.style.color = "rgb(107, 114, 128)";
	element.style.textDecoration = "none";
	element.style.fontWeight = "400";
	element.style.fontSize = "16px";
	element.style.lineHeight = "24px";
	element.style.flex = "none";
	element.style.fontFamily = "Source Sans Pro, sans-serif";

	element.addEventListener("mouseover", () => {
		element.style.color = "#2563eb";
	});
	element.addEventListener("mouseout", () => {
		element.style.color = "rgb(107, 114, 128)";
	});

	element.textContent = username;

	return element;
};
