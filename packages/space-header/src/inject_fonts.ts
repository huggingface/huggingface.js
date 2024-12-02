const FONT_URLS = [
	"https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap",
	"https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap",
];

const createLinkElement = (href: string): HTMLLinkElement => {
	const link = document.createElement("link");
	link.href = href;
	link.rel = "stylesheet";
	return link;
};

export const inject_fonts = (): void => {
	FONT_URLS.forEach((url) => {
		if (!document.querySelector(`link[href="${url}"]`)) {
			document.head.appendChild(createLinkElement(url));
		}
	});
};
