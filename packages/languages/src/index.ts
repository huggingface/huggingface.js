import { LANGUAGES_ISO_639_1 } from "./languages_iso_639_1";
import { LANGUAGES_ISO_639_3 } from "./languages_iso_639_3";

export type { Language } from "./types";
export { wikiLink } from "./wikiLink";
export { LANGUAGES_ISO_639_1 } from "./languages_iso_639_1";
export { LANGUAGES_ISO_639_3 } from "./languages_iso_639_3";

export const LANGUAGES = { ...LANGUAGES_ISO_639_1, ...LANGUAGES_ISO_639_3 };
