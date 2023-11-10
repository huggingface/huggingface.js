import type { Language } from "./types";

export function wikiLink(l: Language): string {
	return `https://en.wikipedia.org/wiki/ISO_639:${l.code}`;
}
