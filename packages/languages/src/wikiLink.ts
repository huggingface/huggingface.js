/**
 * @param languageCode 2 or 3 letter language code
 */
export function wikiLink(languageCode: string): string {
	return `https://en.wikipedia.org/wiki/ISO_639:${languageCode}`;
}
