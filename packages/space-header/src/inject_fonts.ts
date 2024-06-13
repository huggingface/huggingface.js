export const inject_fonts = (): void => {
	const source_sans_pro = document.createElement("link");
	source_sans_pro.href =
		"https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap";
	source_sans_pro.rel = "stylesheet";

	const ibm_mono = document.createElement("link");
	ibm_mono.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap";
	ibm_mono.rel = "stylesheet";

	document.head.appendChild(source_sans_pro);
	document.head.appendChild(ibm_mono);
};
