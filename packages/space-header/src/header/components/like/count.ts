export const Count = (count: number): HTMLParagraphElement => {
	const text = document.createElement("p");

	text.style.margin = "0";
	text.style.padding = "0";
	text.style.color = "#9ca3af";
	text.style.fontSize = "14px";
	text.style.fontFamily = "Source Sans Pro, sans-serif";
	text.style.padding = "0px 6px";
	text.style.borderLeft = "1px solid #e5e7eb";
	text.style.marginLeft = "4px";

	text.textContent = (count ?? 0).toString();

	return text;
};
