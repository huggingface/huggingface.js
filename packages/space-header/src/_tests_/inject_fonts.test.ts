import { inject_fonts } from "../inject_fonts";

describe("inject_fonts", () => {
	beforeEach(() => {
		document.head.innerHTML = "";
	});

	it("should inject Source Sans Pro font", () => {
		inject_fonts();
		const link = document.querySelector('link[href*="Source+Sans+Pro"]');
		expect(link).not.toBeNull();
		expect(link?.getAttribute("rel")).toBe("stylesheet");
	});

	it("should inject IBM Plex Mono font", () => {
		inject_fonts();
		const link = document.querySelector('link[href*="IBM+Plex+Mono"]');
		expect(link).not.toBeNull();
		expect(link?.getAttribute("rel")).toBe("stylesheet");
	});

	it("should not inject duplicate fonts", () => {
		inject_fonts();
		inject_fonts();
		const links = document.querySelectorAll('link[href*="Source+Sans+Pro"]');
		expect(links.length).toBe(1);
	});
});
