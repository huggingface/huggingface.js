import type { Options } from "./type";

export const inject = (element: HTMLElement, options?: Options): void => {
	if (options?.target) {
		if (options.target.appendChild) {
			options.target.appendChild(element);
			return;
		}
		return console.error("the target element does not have an appendChild method");
	}
	if (document.body === null) {
		return console.error("document.body is null");
	}

	document.body.appendChild(element);
};
