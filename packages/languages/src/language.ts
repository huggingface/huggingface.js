import { LANGUAGES_ISO_639_1 } from "./languages_iso_639_1";
import { LANGUAGES_ISO_639_3 } from "./languages_iso_639_3";
import type { Language } from "./types";

/**
 * Be careful importing this function in frontend code, as it will import all languages.
 */
export function language(code: string): Language | null {
	if (code in LANGUAGES_ISO_639_1) {
		return LANGUAGES_ISO_639_1[code as keyof typeof LANGUAGES_ISO_639_1];
	}
	if (code in LANGUAGES_ISO_639_3) {
		return LANGUAGES_ISO_639_3[code as keyof typeof LANGUAGES_ISO_639_3];
	}

	return null;
}
