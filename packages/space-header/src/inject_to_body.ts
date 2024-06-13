export const inject_to_body = (element: HTMLElement): void => {
	if (document.body === null) {
		return console.error("document.body is null");
	}

	document.body.appendChild(element);
};
