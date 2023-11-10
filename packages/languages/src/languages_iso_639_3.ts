import type { Language } from "./types";

/**
 * Only codes in ISO_639_2 that were covered before and not anymore:
 * ber
 * cel
 * roa
 */
export const LANGUAGES_ISO_639_3 = {
	aaa: {
		code: "aaa",
		name: "Ghotuo",
	},
	aab: {
		code: "aab",
		name: "Alumu-Tesu",
	},
	aac: {
		code: "aac",
		name: "Ari",
	},
	aad: {
		code: "aad",
		name: "Amal",
	},
	aae: {
		code: "aae",
		name: "Arbëreshë Albanian",
	},
	aaf: {
		code: "aaf",
		name: "Aranadan",
	},
	aag: {
		code: "aag",
		name: "Ambrak",
	},
	aah: {
		code: "aah",
		name: "Abu' Arapesh",
	},
	aai: {
		code: "aai",
		name: "Arifama-Miniafia",
	},
	aak: {
		code: "aak",
		name: "Ankave",
	},
	aal: {
		code: "aal",
		name: "Afade",
	},
	aan: {
		code: "aan",
		name: "Anambé",
	},
	aao: {
		code: "aao",
		name: "Algerian Saharan Arabic",
	},
	aap: {
		code: "aap",
		name: "Pará Arára",
	},
	aaq: {
		code: "aaq",
		name: "Eastern Abnaki",
	},
	aar: {
		code: "aar",
		name: "Afar",
	},
	aas: {
		code: "aas",
		name: "Aasáx",
	},
	aat: {
		code: "aat",
		name: "Arvanitika Albanian",
	},
	aau: {
		code: "aau",
		name: "Abau",
	},
	aaw: {
		code: "aaw",
		name: "Solong",
	},
	aax: {
		code: "aax",
		name: "Mandobo Atas",
	},
	aaz: {
		code: "aaz",
		name: "Amarasi",
	},
	aba: {
		code: "aba",
		name: "Abé",
	},
	abb: {
		code: "abb",
		name: "Bankon",
	},
	abc: {
		code: "abc",
		name: "Ambala Ayta",
	},
	abd: {
		code: "abd",
		name: "Manide",
	},
	abe: {
		code: "abe",
		name: "Western Abnaki",
	},
	abf: {
		code: "abf",
		name: "Abai Sungai",
	},
	abg: {
		code: "abg",
		name: "Abaga",
	},
	abh: {
		code: "abh",
		name: "Tajiki Arabic",
	},
	abi: {
		code: "abi",
		name: "Abidji",
	},
	abj: {
		code: "abj",
		name: "Aka-Bea",
	},
	abk: {
		code: "abk",
		name: "Abkhazian",
	},
	abl: {
		code: "abl",
		name: "Lampung Nyo",
	},
	abm: {
		code: "abm",
		name: "Abanyom",
	},
	abn: {
		code: "abn",
		name: "Abua",
	},
	abo: {
		code: "abo",
		name: "Abon",
	},
	abp: {
		code: "abp",
		name: "Abellen Ayta",
	},
	abq: {
		code: "abq",
		name: "Abaza",
	},
	abr: {
		code: "abr",
		name: "Abron",
	},
	abs: {
		code: "abs",
		name: "Ambonese Malay",
	},
	abt: {
		code: "abt",
		name: "Ambulas",
	},
	abu: {
		code: "abu",
		name: "Abure",
	},
	abv: {
		code: "abv",
		name: "Baharna Arabic",
	},
	abw: {
		code: "abw",
		name: "Pal",
	},
	abx: {
		code: "abx",
		name: "Inabaknon",
	},
	aby: {
		code: "aby",
		name: "Aneme Wake",
	},
	abz: {
		code: "abz",
		name: "Abui",
	},
	aca: {
		code: "aca",
		name: "Achagua",
	},
	acb: {
		code: "acb",
		name: "Áncá",
	},
	acd: {
		code: "acd",
		name: "Gikyode",
	},
	ace: {
		code: "ace",
		name: "Achinese",
	},
	acf: {
		code: "acf",
		name: "Saint Lucian Creole French",
	},
	ach: {
		code: "ach",
		name: "Acoli",
	},
	aci: {
		code: "aci",
		name: "Aka-Cari",
	},
	ack: {
		code: "ack",
		name: "Aka-Kora",
	},
	acl: {
		code: "acl",
		name: "Akar-Bale",
	},
	acm: {
		code: "acm",
		name: "Mesopotamian Arabic",
	},
	acn: {
		code: "acn",
		name: "Achang",
	},
	acp: {
		code: "acp",
		name: "Eastern Acipa",
	},
	acq: {
		code: "acq",
		name: "Ta'izzi-Adeni Arabic",
	},
	acr: {
		code: "acr",
		name: "Achi",
	},
	acs: {
		code: "acs",
		name: "Acroá",
	},
	act: {
		code: "act",
		name: "Achterhoeks",
	},
	acu: {
		code: "acu",
		name: "Achuar-Shiwiar",
	},
	acv: {
		code: "acv",
		name: "Achumawi",
	},
	acw: {
		code: "acw",
		name: "Hijazi Arabic",
	},
	acx: {
		code: "acx",
		name: "Omani Arabic",
	},
	acy: {
		code: "acy",
		name: "Cypriot Arabic",
	},
	acz: {
		code: "acz",
		name: "Acheron",
	},
	ada: {
		code: "ada",
		name: "Adangme",
	},
	adb: {
		code: "adb",
		name: "Atauran",
	},
	add: {
		code: "add",
		name: "Lidzonka",
	},
	ade: {
		code: "ade",
		name: "Adele",
	},
	adf: {
		code: "adf",
		name: "Dhofari Arabic",
	},
	adg: {
		code: "adg",
		name: "Andegerebinha",
	},
	adh: {
		code: "adh",
		name: "Adhola",
	},
	adi: {
		code: "adi",
		name: "Adi",
	},
	adj: {
		code: "adj",
		name: "Adioukrou",
	},
	adl: {
		code: "adl",
		name: "Galo",
	},
	adn: {
		code: "adn",
		name: "Adang",
	},
	ado: {
		code: "ado",
		name: "Abu",
	},
	adq: {
		code: "adq",
		name: "Adangbe",
	},
	adr: {
		code: "adr",
		name: "Adonara",
	},
	ads: {
		code: "ads",
		name: "Adamorobe Sign Language",
	},
	adt: {
		code: "adt",
		name: "Adnyamathanha",
	},
	adu: {
		code: "adu",
		name: "Aduge",
	},
	adw: {
		code: "adw",
		name: "Amundava",
	},
	adx: {
		code: "adx",
		name: "Amdo Tibetan",
	},
	ady: {
		code: "ady",
		name: "Adyghe",
		nativeName: "Адыгэбзэ Къэбэрдей",
	},
	adz: {
		code: "adz",
		name: "Adzera",
	},
	aea: {
		code: "aea",
		name: "Areba",
	},
	aeb: {
		code: "aeb",
		name: "Tunisian Arabic",
	},
	aec: {
		code: "aec",
		name: "Saidi Arabic",
	},
	aed: {
		code: "aed",
		name: "Argentine Sign Language",
	},
	aee: {
		code: "aee",
		name: "Northeast Pashai",
	},
	aek: {
		code: "aek",
		name: "Haeke",
	},
	ael: {
		code: "ael",
		name: "Ambele",
	},
	aem: {
		code: "aem",
		name: "Arem",
	},
	aen: {
		code: "aen",
		name: "Armenian Sign Language",
	},
	aeq: {
		code: "aeq",
		name: "Aer",
	},
	aer: {
		code: "aer",
		name: "Eastern Arrernte",
	},
	aes: {
		code: "aes",
		name: "Alsea",
	},
	aeu: {
		code: "aeu",
		name: "Akeu",
	},
	aew: {
		code: "aew",
		name: "Ambakich",
	},
	aey: {
		code: "aey",
		name: "Amele",
	},
	aez: {
		code: "aez",
		name: "Aeka",
	},
	afb: {
		code: "afb",
		name: "Gulf Arabic",
	},
	afd: {
		code: "afd",
		name: "Andai",
	},
	afe: {
		code: "afe",
		name: "Putukwam",
	},
	afg: {
		code: "afg",
		name: "Afghan Sign Language",
	},
	afh: {
		code: "afh",
		name: "Afrihili",
	},
	afi: {
		code: "afi",
		name: "Akrukay",
	},
	afk: {
		code: "afk",
		name: "Nanubae",
	},
	afn: {
		code: "afn",
		name: "Defaka",
	},
	afo: {
		code: "afo",
		name: "Eloyi",
	},
	afp: {
		code: "afp",
		name: "Tapei",
	},
	afr: {
		code: "afr",
		name: "Afrikaans",
	},
	afs: {
		code: "afs",
		name: "Afro-Seminole Creole",
	},
	aft: {
		code: "aft",
		name: "Afitti",
	},
	afu: {
		code: "afu",
		name: "Awutu",
	},
	afz: {
		code: "afz",
		name: "Obokuitai",
	},
	aga: {
		code: "aga",
		name: "Aguano",
	},
	agb: {
		code: "agb",
		name: "Legbo",
	},
	agc: {
		code: "agc",
		name: "Agatu",
	},
	agd: {
		code: "agd",
		name: "Agarabi",
	},
	age: {
		code: "age",
		name: "Angal",
	},
	agf: {
		code: "agf",
		name: "Arguni",
	},
	agg: {
		code: "agg",
		name: "Angor",
	},
	agh: {
		code: "agh",
		name: "Ngelima",
	},
	agi: {
		code: "agi",
		name: "Agariya",
	},
	agj: {
		code: "agj",
		name: "Argobba",
	},
	agk: {
		code: "agk",
		name: "Isarog Agta",
	},
	agl: {
		code: "agl",
		name: "Fembe",
	},
	agm: {
		code: "agm",
		name: "Angaataha",
	},
	agn: {
		code: "agn",
		name: "Agutaynen",
	},
	ago: {
		code: "ago",
		name: "Tainae",
	},
	agq: {
		code: "agq",
		name: "Aghem",
	},
	agr: {
		code: "agr",
		name: "Aguaruna",
	},
	ags: {
		code: "ags",
		name: "Esimbi",
	},
	agt: {
		code: "agt",
		name: "Central Cagayan Agta",
	},
	agu: {
		code: "agu",
		name: "Aguacateco",
	},
	agv: {
		code: "agv",
		name: "Remontado Dumagat",
	},
	agw: {
		code: "agw",
		name: "Kahua",
	},
	agx: {
		code: "agx",
		name: "Aghul",
	},
	agy: {
		code: "agy",
		name: "Southern Alta",
	},
	agz: {
		code: "agz",
		name: "Mt. Iriga Agta",
	},
	aha: {
		code: "aha",
		name: "Ahanta",
	},
	ahb: {
		code: "ahb",
		name: "Axamb",
	},
	ahg: {
		code: "ahg",
		name: "Qimant",
	},
	ahh: {
		code: "ahh",
		name: "Aghu",
	},
	ahi: {
		code: "ahi",
		name: "Tiagbamrin Aizi",
	},
	ahk: {
		code: "ahk",
		name: "Akha",
	},
	ahl: {
		code: "ahl",
		name: "Igo",
	},
	ahm: {
		code: "ahm",
		name: "Mobumrin Aizi",
	},
	ahn: {
		code: "ahn",
		name: "Àhàn",
	},
	aho: {
		code: "aho",
		name: "Ahom",
	},
	ahp: {
		code: "ahp",
		name: "Aproumu Aizi",
	},
	ahr: {
		code: "ahr",
		name: "Ahirani",
	},
	ahs: {
		code: "ahs",
		name: "Ashe",
	},
	aht: {
		code: "aht",
		name: "Ahtena",
	},
	aia: {
		code: "aia",
		name: "Arosi",
	},
	aib: {
		code: "aib",
		name: "Ainu (China)",
	},
	aic: {
		code: "aic",
		name: "Ainbai",
	},
	aid: {
		code: "aid",
		name: "Alngith",
	},
	aie: {
		code: "aie",
		name: "Amara",
	},
	aif: {
		code: "aif",
		name: "Agi",
	},
	aig: {
		code: "aig",
		name: "Antigua and Barbuda Creole English",
	},
	aih: {
		code: "aih",
		name: "Ai-Cham",
	},
	aii: {
		code: "aii",
		name: "Assyrian Neo-Aramaic",
	},
	aij: {
		code: "aij",
		name: "Lishanid Noshan",
	},
	aik: {
		code: "aik",
		name: "Ake",
	},
	ail: {
		code: "ail",
		name: "Aimele",
	},
	aim: {
		code: "aim",
		name: "Aimol",
	},
	ain: {
		code: "ain",
		name: "Ainu (Japan)",
	},
	aio: {
		code: "aio",
		name: "Aiton",
	},
	aip: {
		code: "aip",
		name: "Burumakok",
	},
	aiq: {
		code: "aiq",
		name: "Aimaq",
	},
	air: {
		code: "air",
		name: "Airoran",
	},
	ait: {
		code: "ait",
		name: "Arikem",
	},
	aiw: {
		code: "aiw",
		name: "Aari",
	},
	aix: {
		code: "aix",
		name: "Aighon",
	},
	aiy: {
		code: "aiy",
		name: "Ali",
	},
	aja: {
		code: "aja",
		name: "Aja (South Sudan)",
	},
	ajg: {
		code: "ajg",
		name: "Aja (Benin)",
	},
	aji: {
		code: "aji",
		name: "Ajië",
	},
	ajn: {
		code: "ajn",
		name: "Andajin",
	},
	ajs: {
		code: "ajs",
		name: "Algerian Jewish Sign Language",
	},
	aju: {
		code: "aju",
		name: "Judeo-Moroccan Arabic",
	},
	ajw: {
		code: "ajw",
		name: "Ajawa",
	},
	ajz: {
		code: "ajz",
		name: "Amri Karbi",
	},
	aka: {
		code: "aka",
		name: "Akan",
	},
	akb: {
		code: "akb",
		name: "Batak Angkola",
	},
	akc: {
		code: "akc",
		name: "Mpur",
	},
	akd: {
		code: "akd",
		name: "Ukpet-Ehom",
	},
	ake: {
		code: "ake",
		name: "Akawaio",
	},
	akf: {
		code: "akf",
		name: "Akpa",
	},
	akg: {
		code: "akg",
		name: "Anakalangu",
	},
	akh: {
		code: "akh",
		name: "Angal Heneng",
	},
	aki: {
		code: "aki",
		name: "Aiome",
	},
	akj: {
		code: "akj",
		name: "Aka-Jeru",
	},
	akk: {
		code: "akk",
		name: "Akkadian",
	},
	akl: {
		code: "akl",
		name: "Aklanon",
	},
	akm: {
		code: "akm",
		name: "Aka-Bo",
	},
	ako: {
		code: "ako",
		name: "Akurio",
	},
	akp: {
		code: "akp",
		name: "Siwu",
	},
	akq: {
		code: "akq",
		name: "Ak",
	},
	akr: {
		code: "akr",
		name: "Araki",
	},
	aks: {
		code: "aks",
		name: "Akaselem",
	},
	akt: {
		code: "akt",
		name: "Akolet",
	},
	aku: {
		code: "aku",
		name: "Akum",
	},
	akv: {
		code: "akv",
		name: "Akhvakh",
	},
	akw: {
		code: "akw",
		name: "Akwa",
	},
	akx: {
		code: "akx",
		name: "Aka-Kede",
	},
	aky: {
		code: "aky",
		name: "Aka-Kol",
	},
	akz: {
		code: "akz",
		name: "Alabama",
	},
	ala: {
		code: "ala",
		name: "Alago",
	},
	alc: {
		code: "alc",
		name: "Qawasqar",
	},
	ald: {
		code: "ald",
		name: "Alladian",
	},
	ale: {
		code: "ale",
		name: "Aleut",
	},
	alf: {
		code: "alf",
		name: "Alege",
	},
	alh: {
		code: "alh",
		name: "Alawa",
	},
	ali: {
		code: "ali",
		name: "Amaimon",
	},
	alj: {
		code: "alj",
		name: "Alangan",
	},
	alk: {
		code: "alk",
		name: "Alak",
	},
	all: {
		code: "all",
		name: "Allar",
	},
	alm: {
		code: "alm",
		name: "Amblong",
	},
	aln: {
		code: "aln",
		name: "Gheg Albanian",
	},
	alo: {
		code: "alo",
		name: "Larike-Wakasihu",
	},
	alp: {
		code: "alp",
		name: "Alune",
	},
	alq: {
		code: "alq",
		name: "Algonquin",
	},
	alr: {
		code: "alr",
		name: "Alutor",
	},
	als: {
		code: "als",
		name: "Tosk Albanian",
	},
	alt: {
		code: "alt",
		name: "Southern Altai",
	},
	alu: {
		code: "alu",
		name: "'Are'are",
	},
	alw: {
		code: "alw",
		name: "Alaba-K’abeena",
	},
	alx: {
		code: "alx",
		name: "Amol",
	},
	aly: {
		code: "aly",
		name: "Alyawarr",
	},
	alz: {
		code: "alz",
		name: "Alur",
	},
	ama: {
		code: "ama",
		name: "Amanayé",
	},
	amb: {
		code: "amb",
		name: "Ambo",
	},
	amc: {
		code: "amc",
		name: "Amahuaca",
	},
	ame: {
		code: "ame",
		name: "Yanesha'",
	},
	amf: {
		code: "amf",
		name: "Hamer-Banna",
	},
	amg: {
		code: "amg",
		name: "Amurdak",
	},
	amh: {
		code: "amh",
		name: "Amharic",
	},
	ami: {
		code: "ami",
		name: "Amis",
	},
	amj: {
		code: "amj",
		name: "Amdang",
	},
	amk: {
		code: "amk",
		name: "Ambai",
	},
	aml: {
		code: "aml",
		name: "War-Jaintia",
	},
	amm: {
		code: "amm",
		name: "Ama (Papua New Guinea)",
	},
	amn: {
		code: "amn",
		name: "Amanab",
	},
	amo: {
		code: "amo",
		name: "Amo",
	},
	amp: {
		code: "amp",
		name: "Alamblak",
	},
	amq: {
		code: "amq",
		name: "Amahai",
	},
	amr: {
		code: "amr",
		name: "Amarakaeri",
	},
	ams: {
		code: "ams",
		name: "Southern Amami-Oshima",
	},
	amt: {
		code: "amt",
		name: "Amto",
	},
	amu: {
		code: "amu",
		name: "Guerrero Amuzgo",
	},
	amv: {
		code: "amv",
		name: "Ambelau",
	},
	amw: {
		code: "amw",
		name: "Western Neo-Aramaic",
	},
	amx: {
		code: "amx",
		name: "Anmatyerre",
	},
	amy: {
		code: "amy",
		name: "Ami",
	},
	amz: {
		code: "amz",
		name: "Atampaya",
	},
	ana: {
		code: "ana",
		name: "Andaqui",
	},
	anb: {
		code: "anb",
		name: "Andoa",
	},
	anc: {
		code: "anc",
		name: "Ngas",
	},
	and: {
		code: "and",
		name: "Ansus",
	},
	ane: {
		code: "ane",
		name: "Xârâcùù",
	},
	anf: {
		code: "anf",
		name: "Animere",
	},
	ang: {
		code: "ang",
		name: "Old English (ca. 450-1100)",
	},
	anh: {
		code: "anh",
		name: "Nend",
	},
	ani: {
		code: "ani",
		name: "Andi",
	},
	anj: {
		code: "anj",
		name: "Anor",
	},
	ank: {
		code: "ank",
		name: "Goemai",
	},
	anl: {
		code: "anl",
		name: "Anu-Hkongso Chin",
	},
	anm: {
		code: "anm",
		name: "Anal",
	},
	ann: {
		code: "ann",
		name: "Obolo",
	},
	ano: {
		code: "ano",
		name: "Andoque",
	},
	anp: {
		code: "anp",
		name: "Angika",
	},
	anq: {
		code: "anq",
		name: "Jarawa (India)",
	},
	anr: {
		code: "anr",
		name: "Andh",
	},
	ans: {
		code: "ans",
		name: "Anserma",
	},
	ant: {
		code: "ant",
		name: "Antakarinya",
	},
	anu: {
		code: "anu",
		name: "Anuak",
	},
	anv: {
		code: "anv",
		name: "Denya",
	},
	anw: {
		code: "anw",
		name: "Anaang",
	},
	anx: {
		code: "anx",
		name: "Andra-Hus",
	},
	any: {
		code: "any",
		name: "Anyin",
	},
	anz: {
		code: "anz",
		name: "Anem",
	},
	aoa: {
		code: "aoa",
		name: "Angolar",
	},
	aob: {
		code: "aob",
		name: "Abom",
	},
	aoc: {
		code: "aoc",
		name: "Pemon",
	},
	aod: {
		code: "aod",
		name: "Andarum",
	},
	aoe: {
		code: "aoe",
		name: "Angal Enen",
	},
	aof: {
		code: "aof",
		name: "Bragat",
	},
	aog: {
		code: "aog",
		name: "Angoram",
	},
	aoi: {
		code: "aoi",
		name: "Anindilyakwa",
	},
	aoj: {
		code: "aoj",
		name: "Mufian",
	},
	aok: {
		code: "aok",
		name: "Arhö",
	},
	aol: {
		code: "aol",
		name: "Alor",
	},
	aom: {
		code: "aom",
		name: "Ömie",
	},
	aon: {
		code: "aon",
		name: "Bumbita Arapesh",
	},
	aor: {
		code: "aor",
		name: "Aore",
	},
	aos: {
		code: "aos",
		name: "Taikat",
	},
	aot: {
		code: "aot",
		name: "Atong (India)",
	},
	aou: {
		code: "aou",
		name: "A'ou",
	},
	aox: {
		code: "aox",
		name: "Atorada",
	},
	aoz: {
		code: "aoz",
		name: "Uab Meto",
	},
	apb: {
		code: "apb",
		name: "Sa'a",
	},
	apc: {
		code: "apc",
		name: "Levantine Arabic",
	},
	apd: {
		code: "apd",
		name: "Sudanese Arabic",
	},
	ape: {
		code: "ape",
		name: "Bukiyip",
	},
	apf: {
		code: "apf",
		name: "Pahanan Agta",
	},
	apg: {
		code: "apg",
		name: "Ampanang",
	},
	aph: {
		code: "aph",
		name: "Athpariya",
	},
	api: {
		code: "api",
		name: "Apiaká",
	},
	apj: {
		code: "apj",
		name: "Jicarilla Apache",
	},
	apk: {
		code: "apk",
		name: "Kiowa Apache",
	},
	apl: {
		code: "apl",
		name: "Lipan Apache",
	},
	apm: {
		code: "apm",
		name: "Mescalero-Chiricahua Apache",
	},
	apn: {
		code: "apn",
		name: "Apinayé",
	},
	apo: {
		code: "apo",
		name: "Ambul",
	},
	app: {
		code: "app",
		name: "Apma",
	},
	apq: {
		code: "apq",
		name: "A-Pucikwar",
	},
	apr: {
		code: "apr",
		name: "Arop-Lokep",
	},
	aps: {
		code: "aps",
		name: "Arop-Sissano",
	},
	apt: {
		code: "apt",
		name: "Apatani",
	},
	apu: {
		code: "apu",
		name: "Apurinã",
	},
	apv: {
		code: "apv",
		name: "Alapmunte",
	},
	apw: {
		code: "apw",
		name: "Western Apache",
	},
	apx: {
		code: "apx",
		name: "Aputai",
	},
	apy: {
		code: "apy",
		name: "Apalaí",
	},
	apz: {
		code: "apz",
		name: "Safeyoka",
	},
	aqc: {
		code: "aqc",
		name: "Archi",
	},
	aqd: {
		code: "aqd",
		name: "Ampari Dogon",
	},
	aqg: {
		code: "aqg",
		name: "Arigidi",
	},
	aqk: {
		code: "aqk",
		name: "Aninka",
	},
	aqm: {
		code: "aqm",
		name: "Atohwaim",
	},
	aqn: {
		code: "aqn",
		name: "Northern Alta",
	},
	aqp: {
		code: "aqp",
		name: "Atakapa",
	},
	aqr: {
		code: "aqr",
		name: "Arhâ",
	},
	aqt: {
		code: "aqt",
		name: "Angaité",
	},
	aqz: {
		code: "aqz",
		name: "Akuntsu",
	},
	ara: {
		code: "ara",
		name: "Arabic",
	},
	arb: {
		code: "arb",
		name: "Standard Arabic",
	},
	arc: {
		code: "arc",
		name: "Official Aramaic (700-300 BCE)",
	},
	ard: {
		code: "ard",
		name: "Arabana",
	},
	are: {
		code: "are",
		name: "Western Arrarnta",
	},
	arg: {
		code: "arg",
		name: "Aragonese",
	},
	arh: {
		code: "arh",
		name: "Arhuaco",
	},
	ari: {
		code: "ari",
		name: "Arikara",
	},
	arj: {
		code: "arj",
		name: "Arapaso",
	},
	ark: {
		code: "ark",
		name: "Arikapú",
	},
	arl: {
		code: "arl",
		name: "Arabela",
	},
	arn: {
		code: "arn",
		name: "Mapudungun",
	},
	aro: {
		code: "aro",
		name: "Araona",
	},
	arp: {
		code: "arp",
		name: "Arapaho",
	},
	arq: {
		code: "arq",
		name: "Algerian Arabic",
	},
	arr: {
		code: "arr",
		name: "Karo (Brazil)",
	},
	ars: {
		code: "ars",
		name: "Najdi Arabic",
	},
	aru: {
		code: "aru",
		name: "Aruá (Amazonas State)",
	},
	arv: {
		code: "arv",
		name: "Arbore",
	},
	arw: {
		code: "arw",
		name: "Arawak",
	},
	arx: {
		code: "arx",
		name: "Aruá (Rodonia State)",
	},
	ary: {
		code: "ary",
		name: "Moroccan Arabic",
	},
	arz: {
		code: "arz",
		name: "Egyptian Arabic",
	},
	asa: {
		code: "asa",
		name: "Asu (Tanzania)",
	},
	asb: {
		code: "asb",
		name: "Assiniboine",
	},
	asc: {
		code: "asc",
		name: "Casuarina Coast Asmat",
	},
	ase: {
		code: "ase",
		name: "American Sign Language",
	},
	asf: {
		code: "asf",
		name: "Auslan",
	},
	asg: {
		code: "asg",
		name: "Cishingini",
	},
	ash: {
		code: "ash",
		name: "Abishira",
	},
	asi: {
		code: "asi",
		name: "Buruwai",
	},
	asj: {
		code: "asj",
		name: "Sari",
	},
	ask: {
		code: "ask",
		name: "Ashkun",
	},
	asl: {
		code: "asl",
		name: "Asilulu",
	},
	asm: {
		code: "asm",
		name: "Assamese",
	},
	asn: {
		code: "asn",
		name: "Xingú Asuriní",
	},
	aso: {
		code: "aso",
		name: "Dano",
	},
	asp: {
		code: "asp",
		name: "Algerian Sign Language",
	},
	asq: {
		code: "asq",
		name: "Austrian Sign Language",
	},
	asr: {
		code: "asr",
		name: "Asuri",
	},
	ass: {
		code: "ass",
		name: "Ipulo",
	},
	ast: {
		code: "ast",
		name: "Asturian",
	},
	asu: {
		code: "asu",
		name: "Tocantins Asurini",
	},
	asv: {
		code: "asv",
		name: "Asoa",
	},
	asw: {
		code: "asw",
		name: "Australian Aborigines Sign Language",
	},
	asx: {
		code: "asx",
		name: "Muratayak",
	},
	asy: {
		code: "asy",
		name: "Yaosakor Asmat",
	},
	asz: {
		code: "asz",
		name: "As",
	},
	ata: {
		code: "ata",
		name: "Pele-Ata",
	},
	atb: {
		code: "atb",
		name: "Zaiwa",
	},
	atc: {
		code: "atc",
		name: "Atsahuaca",
	},
	atd: {
		code: "atd",
		name: "Ata Manobo",
	},
	ate: {
		code: "ate",
		name: "Atemble",
	},
	atg: {
		code: "atg",
		name: "Ivbie North-Okpela-Arhe",
	},
	ati: {
		code: "ati",
		name: "Attié",
	},
	atj: {
		code: "atj",
		name: "Atikamekw",
	},
	atk: {
		code: "atk",
		name: "Ati",
	},
	atl: {
		code: "atl",
		name: "Mt. Iraya Agta",
	},
	atm: {
		code: "atm",
		name: "Ata",
	},
	atn: {
		code: "atn",
		name: "Ashtiani",
	},
	ato: {
		code: "ato",
		name: "Atong (Cameroon)",
	},
	atp: {
		code: "atp",
		name: "Pudtol Atta",
	},
	atq: {
		code: "atq",
		name: "Aralle-Tabulahan",
	},
	atr: {
		code: "atr",
		name: "Waimiri-Atroari",
	},
	ats: {
		code: "ats",
		name: "Gros Ventre",
	},
	att: {
		code: "att",
		name: "Pamplona Atta",
	},
	atu: {
		code: "atu",
		name: "Reel",
	},
	atv: {
		code: "atv",
		name: "Northern Altai",
	},
	atw: {
		code: "atw",
		name: "Atsugewi",
	},
	atx: {
		code: "atx",
		name: "Arutani",
	},
	aty: {
		code: "aty",
		name: "Aneityum",
	},
	atz: {
		code: "atz",
		name: "Arta",
	},
	aua: {
		code: "aua",
		name: "Asumboa",
	},
	aub: {
		code: "aub",
		name: "Alugu",
	},
	auc: {
		code: "auc",
		name: "Waorani",
	},
	aud: {
		code: "aud",
		name: "Anuta",
	},
	aug: {
		code: "aug",
		name: "Aguna",
	},
	auh: {
		code: "auh",
		name: "Aushi",
	},
	aui: {
		code: "aui",
		name: "Anuki",
	},
	auj: {
		code: "auj",
		name: "Awjilah",
	},
	auk: {
		code: "auk",
		name: "Heyo",
	},
	aul: {
		code: "aul",
		name: "Aulua",
	},
	aum: {
		code: "aum",
		name: "Asu (Nigeria)",
	},
	aun: {
		code: "aun",
		name: "Molmo One",
	},
	auo: {
		code: "auo",
		name: "Auyokawa",
	},
	aup: {
		code: "aup",
		name: "Makayam",
	},
	auq: {
		code: "auq",
		name: "Anus",
	},
	aur: {
		code: "aur",
		name: "Aruek",
	},
	aut: {
		code: "aut",
		name: "Austral",
	},
	auu: {
		code: "auu",
		name: "Auye",
	},
	auw: {
		code: "auw",
		name: "Awyi",
	},
	aux: {
		code: "aux",
		name: "Aurá",
	},
	auy: {
		code: "auy",
		name: "Awiyaana",
	},
	auz: {
		code: "auz",
		name: "Uzbeki Arabic",
	},
	ava: {
		code: "ava",
		name: "Avaric",
	},
	avb: {
		code: "avb",
		name: "Avau",
	},
	avd: {
		code: "avd",
		name: "Alviri-Vidari",
	},
	ave: {
		code: "ave",
		name: "Avestan",
	},
	avi: {
		code: "avi",
		name: "Avikam",
	},
	avk: {
		code: "avk",
		name: "Kotava",
	},
	avl: {
		code: "avl",
		name: "Eastern Egyptian Bedawi Arabic",
	},
	avm: {
		code: "avm",
		name: "Angkamuthi",
	},
	avn: {
		code: "avn",
		name: "Avatime",
	},
	avo: {
		code: "avo",
		name: "Agavotaguerra",
	},
	avs: {
		code: "avs",
		name: "Aushiri",
	},
	avt: {
		code: "avt",
		name: "Au",
	},
	avu: {
		code: "avu",
		name: "Avokaya",
	},
	avv: {
		code: "avv",
		name: "Avá-Canoeiro",
	},
	awa: {
		code: "awa",
		name: "Awadhi",
	},
	awb: {
		code: "awb",
		name: "Awa (Papua New Guinea)",
	},
	awc: {
		code: "awc",
		name: "Cicipu",
	},
	awe: {
		code: "awe",
		name: "Awetí",
	},
	awg: {
		code: "awg",
		name: "Anguthimri",
	},
	awh: {
		code: "awh",
		name: "Awbono",
	},
	awi: {
		code: "awi",
		name: "Aekyom",
	},
	awk: {
		code: "awk",
		name: "Awabakal",
	},
	awm: {
		code: "awm",
		name: "Arawum",
	},
	awn: {
		code: "awn",
		name: "Awngi",
	},
	awo: {
		code: "awo",
		name: "Awak",
	},
	awr: {
		code: "awr",
		name: "Awera",
	},
	aws: {
		code: "aws",
		name: "South Awyu",
	},
	awt: {
		code: "awt",
		name: "Araweté",
	},
	awu: {
		code: "awu",
		name: "Central Awyu",
	},
	awv: {
		code: "awv",
		name: "Jair Awyu",
	},
	aww: {
		code: "aww",
		name: "Awun",
	},
	awx: {
		code: "awx",
		name: "Awara",
	},
	awy: {
		code: "awy",
		name: "Edera Awyu",
	},
	axb: {
		code: "axb",
		name: "Abipon",
	},
	axe: {
		code: "axe",
		name: "Ayerrerenge",
	},
	axg: {
		code: "axg",
		name: "Mato Grosso Arára",
	},
	axk: {
		code: "axk",
		name: "Yaka (Central African Republic)",
	},
	axl: {
		code: "axl",
		name: "Lower Southern Aranda",
	},
	axm: {
		code: "axm",
		name: "Middle Armenian",
	},
	axx: {
		code: "axx",
		name: "Xârâgurè",
	},
	aya: {
		code: "aya",
		name: "Awar",
	},
	ayb: {
		code: "ayb",
		name: "Ayizo Gbe",
	},
	ayc: {
		code: "ayc",
		name: "Southern Aymara",
	},
	ayd: {
		code: "ayd",
		name: "Ayabadhu",
	},
	aye: {
		code: "aye",
		name: "Ayere",
	},
	ayg: {
		code: "ayg",
		name: "Ginyanga",
	},
	ayh: {
		code: "ayh",
		name: "Hadrami Arabic",
	},
	ayi: {
		code: "ayi",
		name: "Leyigha",
	},
	ayk: {
		code: "ayk",
		name: "Akuku",
	},
	ayl: {
		code: "ayl",
		name: "Libyan Arabic",
	},
	aym: {
		code: "aym",
		name: "Aymara",
	},
	ayn: {
		code: "ayn",
		name: "Sanaani Arabic",
	},
	ayo: {
		code: "ayo",
		name: "Ayoreo",
	},
	ayp: {
		code: "ayp",
		name: "North Mesopotamian Arabic",
	},
	ayq: {
		code: "ayq",
		name: "Ayi (Papua New Guinea)",
	},
	ayr: {
		code: "ayr",
		name: "Central Aymara",
	},
	ays: {
		code: "ays",
		name: "Sorsogon Ayta",
	},
	ayt: {
		code: "ayt",
		name: "Magbukun Ayta",
	},
	ayu: {
		code: "ayu",
		name: "Ayu",
	},
	ayz: {
		code: "ayz",
		name: "Mai Brat",
	},
	aza: {
		code: "aza",
		name: "Azha",
	},
	azb: {
		code: "azb",
		name: "South Azerbaijani",
	},
	azd: {
		code: "azd",
		name: "Eastern Durango Nahuatl",
	},
	aze: {
		code: "aze",
		name: "Azerbaijani",
	},
	azg: {
		code: "azg",
		name: "San Pedro Amuzgos Amuzgo",
	},
	azj: {
		code: "azj",
		name: "North Azerbaijani",
	},
	azm: {
		code: "azm",
		name: "Ipalapa Amuzgo",
	},
	azn: {
		code: "azn",
		name: "Western Durango Nahuatl",
	},
	azo: {
		code: "azo",
		name: "Awing",
	},
	azt: {
		code: "azt",
		name: "Faire Atta",
	},
	azz: {
		code: "azz",
		name: "Highland Puebla Nahuatl",
	},
	baa: {
		code: "baa",
		name: "Babatana",
	},
	bab: {
		code: "bab",
		name: "Bainouk-Gunyuño",
	},
	bac: {
		code: "bac",
		name: "Badui",
	},
	bae: {
		code: "bae",
		name: "Baré",
	},
	baf: {
		code: "baf",
		name: "Nubaca",
	},
	bag: {
		code: "bag",
		name: "Tuki",
	},
	bah: {
		code: "bah",
		name: "Bahamas Creole English",
	},
	baj: {
		code: "baj",
		name: "Barakai",
	},
	bak: {
		code: "bak",
		name: "Bashkir",
	},
	bal: {
		code: "bal",
		name: "Baluchi",
	},
	bam: {
		code: "bam",
		name: "Bambara",
	},
	ban: {
		code: "ban",
		name: "Balinese",
	},
	bao: {
		code: "bao",
		name: "Waimaha",
	},
	bap: {
		code: "bap",
		name: "Bantawa",
	},
	bar: {
		code: "bar",
		name: "Bavarian",
	},
	bas: {
		code: "bas",
		name: "Basa (Cameroon)",
	},
	bau: {
		code: "bau",
		name: "Bada (Nigeria)",
	},
	bav: {
		code: "bav",
		name: "Vengo",
	},
	baw: {
		code: "baw",
		name: "Bambili-Bambui",
	},
	bax: {
		code: "bax",
		name: "Bamun",
	},
	bay: {
		code: "bay",
		name: "Batuley",
	},
	bba: {
		code: "bba",
		name: "Baatonum",
	},
	bbb: {
		code: "bbb",
		name: "Barai",
	},
	bbc: {
		code: "bbc",
		name: "Batak Toba",
	},
	bbd: {
		code: "bbd",
		name: "Bau",
	},
	bbe: {
		code: "bbe",
		name: "Bangba",
	},
	bbf: {
		code: "bbf",
		name: "Baibai",
	},
	bbg: {
		code: "bbg",
		name: "Barama",
	},
	bbh: {
		code: "bbh",
		name: "Bugan",
	},
	bbi: {
		code: "bbi",
		name: "Barombi",
	},
	bbj: {
		code: "bbj",
		name: "Ghomálá'",
	},
	bbk: {
		code: "bbk",
		name: "Babanki",
	},
	bbl: {
		code: "bbl",
		name: "Bats",
	},
	bbm: {
		code: "bbm",
		name: "Babango",
	},
	bbn: {
		code: "bbn",
		name: "Uneapa",
	},
	bbo: {
		code: "bbo",
		name: "Northern Bobo Madaré",
	},
	bbp: {
		code: "bbp",
		name: "West Central Banda",
	},
	bbq: {
		code: "bbq",
		name: "Bamali",
	},
	bbr: {
		code: "bbr",
		name: "Girawa",
	},
	bbs: {
		code: "bbs",
		name: "Bakpinka",
	},
	bbt: {
		code: "bbt",
		name: "Mburku",
	},
	bbu: {
		code: "bbu",
		name: "Kulung (Nigeria)",
	},
	bbv: {
		code: "bbv",
		name: "Karnai",
	},
	bbw: {
		code: "bbw",
		name: "Baba",
	},
	bbx: {
		code: "bbx",
		name: "Bubia",
	},
	bby: {
		code: "bby",
		name: "Befang",
	},
	bca: {
		code: "bca",
		name: "Central Bai",
	},
	bcb: {
		code: "bcb",
		name: "Bainouk-Samik",
	},
	bcc: {
		code: "bcc",
		name: "Southern Balochi",
	},
	bcd: {
		code: "bcd",
		name: "North Babar",
	},
	bce: {
		code: "bce",
		name: "Bamenyam",
	},
	bcf: {
		code: "bcf",
		name: "Bamu",
	},
	bcg: {
		code: "bcg",
		name: "Baga Pokur",
	},
	bch: {
		code: "bch",
		name: "Bariai",
	},
	bci: {
		code: "bci",
		name: "Baoulé",
	},
	bcj: {
		code: "bcj",
		name: "Bardi",
	},
	bck: {
		code: "bck",
		name: "Bunuba",
	},
	bcl: {
		code: "bcl",
		name: "Central Bikol",
	},
	bcm: {
		code: "bcm",
		name: "Bannoni",
	},
	bcn: {
		code: "bcn",
		name: "Bali (Nigeria)",
	},
	bco: {
		code: "bco",
		name: "Kaluli",
	},
	bcp: {
		code: "bcp",
		name: "Bali (Democratic Republic of Congo)",
	},
	bcq: {
		code: "bcq",
		name: "Bench",
	},
	bcr: {
		code: "bcr",
		name: "Babine",
	},
	bcs: {
		code: "bcs",
		name: "Kohumono",
	},
	bct: {
		code: "bct",
		name: "Bendi",
	},
	bcu: {
		code: "bcu",
		name: "Awad Bing",
	},
	bcv: {
		code: "bcv",
		name: "Shoo-Minda-Nye",
	},
	bcw: {
		code: "bcw",
		name: "Bana",
	},
	bcy: {
		code: "bcy",
		name: "Bacama",
	},
	bcz: {
		code: "bcz",
		name: "Bainouk-Gunyaamolo",
	},
	bda: {
		code: "bda",
		name: "Bayot",
	},
	bdb: {
		code: "bdb",
		name: "Basap",
	},
	bdc: {
		code: "bdc",
		name: "Emberá-Baudó",
	},
	bdd: {
		code: "bdd",
		name: "Bunama",
	},
	bde: {
		code: "bde",
		name: "Bade",
	},
	bdf: {
		code: "bdf",
		name: "Biage",
	},
	bdg: {
		code: "bdg",
		name: "Bonggi",
	},
	bdh: {
		code: "bdh",
		name: "Baka (South Sudan)",
	},
	bdi: {
		code: "bdi",
		name: "Burun",
	},
	bdj: {
		code: "bdj",
		name: "Bai (South Sudan)",
	},
	bdk: {
		code: "bdk",
		name: "Budukh",
	},
	bdl: {
		code: "bdl",
		name: "Indonesian Bajau",
	},
	bdm: {
		code: "bdm",
		name: "Buduma",
	},
	bdn: {
		code: "bdn",
		name: "Baldemu",
	},
	bdo: {
		code: "bdo",
		name: "Morom",
	},
	bdp: {
		code: "bdp",
		name: "Bende",
	},
	bdq: {
		code: "bdq",
		name: "Bahnar",
	},
	bdr: {
		code: "bdr",
		name: "West Coast Bajau",
	},
	bds: {
		code: "bds",
		name: "Burunge",
	},
	bdt: {
		code: "bdt",
		name: "Bokoto",
	},
	bdu: {
		code: "bdu",
		name: "Oroko",
	},
	bdv: {
		code: "bdv",
		name: "Bodo Parja",
	},
	bdw: {
		code: "bdw",
		name: "Baham",
	},
	bdx: {
		code: "bdx",
		name: "Budong-Budong",
	},
	bdy: {
		code: "bdy",
		name: "Bandjalang",
	},
	bdz: {
		code: "bdz",
		name: "Badeshi",
	},
	bea: {
		code: "bea",
		name: "Beaver",
	},
	beb: {
		code: "beb",
		name: "Bebele",
	},
	bec: {
		code: "bec",
		name: "Iceve-Maci",
	},
	bed: {
		code: "bed",
		name: "Bedoanas",
	},
	bee: {
		code: "bee",
		name: "Byangsi",
	},
	bef: {
		code: "bef",
		name: "Benabena",
	},
	beg: {
		code: "beg",
		name: "Belait",
	},
	beh: {
		code: "beh",
		name: "Biali",
	},
	bei: {
		code: "bei",
		name: "Bekati'",
	},
	bej: {
		code: "bej",
		name: "Beja",
	},
	bek: {
		code: "bek",
		name: "Bebeli",
	},
	bel: {
		code: "bel",
		name: "Belarusian",
	},
	bem: {
		code: "bem",
		name: "Bemba (Zambia)",
	},
	ben: {
		code: "ben",
		name: "Bengali",
	},
	beo: {
		code: "beo",
		name: "Beami",
	},
	bep: {
		code: "bep",
		name: "Besoa",
	},
	beq: {
		code: "beq",
		name: "Beembe",
	},
	bes: {
		code: "bes",
		name: "Besme",
	},
	bet: {
		code: "bet",
		name: "Guiberoua Béte",
	},
	beu: {
		code: "beu",
		name: "Blagar",
	},
	bev: {
		code: "bev",
		name: "Daloa Bété",
	},
	bew: {
		code: "bew",
		name: "Betawi",
	},
	bex: {
		code: "bex",
		name: "Jur Modo",
	},
	bey: {
		code: "bey",
		name: "Beli (Papua New Guinea)",
	},
	bez: {
		code: "bez",
		name: "Bena (Tanzania)",
	},
	bfa: {
		code: "bfa",
		name: "Bari",
	},
	bfb: {
		code: "bfb",
		name: "Pauri Bareli",
	},
	bfc: {
		code: "bfc",
		name: "Panyi Bai",
	},
	bfd: {
		code: "bfd",
		name: "Bafut",
	},
	bfe: {
		code: "bfe",
		name: "Betaf",
	},
	bff: {
		code: "bff",
		name: "Bofi",
	},
	bfg: {
		code: "bfg",
		name: "Busang Kayan",
	},
	bfh: {
		code: "bfh",
		name: "Blafe",
	},
	bfi: {
		code: "bfi",
		name: "British Sign Language",
	},
	bfj: {
		code: "bfj",
		name: "Bafanji",
	},
	bfk: {
		code: "bfk",
		name: "Ban Khor Sign Language",
	},
	bfl: {
		code: "bfl",
		name: "Banda-Ndélé",
	},
	bfm: {
		code: "bfm",
		name: "Mmen",
	},
	bfn: {
		code: "bfn",
		name: "Bunak",
	},
	bfo: {
		code: "bfo",
		name: "Malba Birifor",
	},
	bfp: {
		code: "bfp",
		name: "Beba",
	},
	bfq: {
		code: "bfq",
		name: "Badaga",
	},
	bfr: {
		code: "bfr",
		name: "Bazigar",
	},
	bfs: {
		code: "bfs",
		name: "Southern Bai",
	},
	bft: {
		code: "bft",
		name: "Balti",
	},
	bfu: {
		code: "bfu",
		name: "Gahri",
	},
	bfw: {
		code: "bfw",
		name: "Bondo",
	},
	bfx: {
		code: "bfx",
		name: "Bantayanon",
	},
	bfy: {
		code: "bfy",
		name: "Bagheli",
	},
	bfz: {
		code: "bfz",
		name: "Mahasu Pahari",
	},
	bga: {
		code: "bga",
		name: "Gwamhi-Wuri",
	},
	bgb: {
		code: "bgb",
		name: "Bobongko",
	},
	bgc: {
		code: "bgc",
		name: "Haryanvi",
	},
	bgd: {
		code: "bgd",
		name: "Rathwi Bareli",
	},
	bge: {
		code: "bge",
		name: "Bauria",
	},
	bgf: {
		code: "bgf",
		name: "Bangandu",
	},
	bgg: {
		code: "bgg",
		name: "Bugun",
	},
	bgi: {
		code: "bgi",
		name: "Giangan",
	},
	bgj: {
		code: "bgj",
		name: "Bangolan",
	},
	bgk: {
		code: "bgk",
		name: "Bit",
	},
	bgl: {
		code: "bgl",
		name: "Bo (Laos)",
	},
	bgn: {
		code: "bgn",
		name: "Western Balochi",
	},
	bgo: {
		code: "bgo",
		name: "Baga Koga",
	},
	bgp: {
		code: "bgp",
		name: "Eastern Balochi",
	},
	bgq: {
		code: "bgq",
		name: "Bagri",
	},
	bgr: {
		code: "bgr",
		name: "Bawm Chin",
	},
	bgs: {
		code: "bgs",
		name: "Tagabawa",
	},
	bgt: {
		code: "bgt",
		name: "Bughotu",
	},
	bgu: {
		code: "bgu",
		name: "Mbongno",
	},
	bgv: {
		code: "bgv",
		name: "Warkay-Bipim",
	},
	bgw: {
		code: "bgw",
		name: "Bhatri",
	},
	bgx: {
		code: "bgx",
		name: "Balkan Gagauz Turkish",
	},
	bgy: {
		code: "bgy",
		name: "Benggoi",
	},
	bgz: {
		code: "bgz",
		name: "Banggai",
	},
	bha: {
		code: "bha",
		name: "Bharia",
	},
	bhb: {
		code: "bhb",
		name: "Bhili",
	},
	bhc: {
		code: "bhc",
		name: "Biga",
	},
	bhd: {
		code: "bhd",
		name: "Bhadrawahi",
	},
	bhe: {
		code: "bhe",
		name: "Bhaya",
	},
	bhf: {
		code: "bhf",
		name: "Odiai",
	},
	bhg: {
		code: "bhg",
		name: "Binandere",
	},
	bhh: {
		code: "bhh",
		name: "Bukharic",
	},
	bhi: {
		code: "bhi",
		name: "Bhilali",
	},
	bhj: {
		code: "bhj",
		name: "Bahing",
	},
	bhl: {
		code: "bhl",
		name: "Bimin",
	},
	bhm: {
		code: "bhm",
		name: "Bathari",
	},
	bhn: {
		code: "bhn",
		name: "Bohtan Neo-Aramaic",
	},
	bho: {
		code: "bho",
		name: "Bhojpuri",
	},
	bhp: {
		code: "bhp",
		name: "Bima",
	},
	bhq: {
		code: "bhq",
		name: "Tukang Besi South",
	},
	bhr: {
		code: "bhr",
		name: "Bara Malagasy",
	},
	bhs: {
		code: "bhs",
		name: "Buwal",
	},
	bht: {
		code: "bht",
		name: "Bhattiyali",
	},
	bhu: {
		code: "bhu",
		name: "Bhunjia",
	},
	bhv: {
		code: "bhv",
		name: "Bahau",
	},
	bhw: {
		code: "bhw",
		name: "Biak",
	},
	bhx: {
		code: "bhx",
		name: "Bhalay",
	},
	bhy: {
		code: "bhy",
		name: "Bhele",
	},
	bhz: {
		code: "bhz",
		name: "Bada (Indonesia)",
	},
	bia: {
		code: "bia",
		name: "Badimaya",
	},
	bib: {
		code: "bib",
		name: "Bissa",
	},
	bid: {
		code: "bid",
		name: "Bidiyo",
	},
	bie: {
		code: "bie",
		name: "Bepour",
	},
	bif: {
		code: "bif",
		name: "Biafada",
	},
	big: {
		code: "big",
		name: "Biangai",
	},
	bik: {
		code: "bik",
		name: "Bikol",
	},
	bil: {
		code: "bil",
		name: "Bile",
	},
	bim: {
		code: "bim",
		name: "Bimoba",
	},
	bin: {
		code: "bin",
		name: "Bini",
	},
	bio: {
		code: "bio",
		name: "Nai",
	},
	bip: {
		code: "bip",
		name: "Bila",
	},
	biq: {
		code: "biq",
		name: "Bipi",
	},
	bir: {
		code: "bir",
		name: "Bisorio",
	},
	bis: {
		code: "bis",
		name: "Bislama",
	},
	bit: {
		code: "bit",
		name: "Berinomo",
	},
	biu: {
		code: "biu",
		name: "Biete",
	},
	biv: {
		code: "biv",
		name: "Southern Birifor",
	},
	biw: {
		code: "biw",
		name: "Kol (Cameroon)",
	},
	bix: {
		code: "bix",
		name: "Bijori",
	},
	biy: {
		code: "biy",
		name: "Birhor",
	},
	biz: {
		code: "biz",
		name: "Baloi",
	},
	bja: {
		code: "bja",
		name: "Budza",
	},
	bjb: {
		code: "bjb",
		name: "Banggarla",
	},
	bjc: {
		code: "bjc",
		name: "Bariji",
	},
	bje: {
		code: "bje",
		name: "Biao-Jiao Mien",
	},
	bjf: {
		code: "bjf",
		name: "Barzani Jewish Neo-Aramaic",
	},
	bjg: {
		code: "bjg",
		name: "Bidyogo",
	},
	bjh: {
		code: "bjh",
		name: "Bahinemo",
	},
	bji: {
		code: "bji",
		name: "Burji",
	},
	bjj: {
		code: "bjj",
		name: "Kanauji",
	},
	bjk: {
		code: "bjk",
		name: "Barok",
	},
	bjl: {
		code: "bjl",
		name: "Bulu (Papua New Guinea)",
	},
	bjm: {
		code: "bjm",
		name: "Bajelani",
	},
	bjn: {
		code: "bjn",
		name: "Banjar",
	},
	bjo: {
		code: "bjo",
		name: "Mid-Southern Banda",
	},
	bjp: {
		code: "bjp",
		name: "Fanamaket",
	},
	bjr: {
		code: "bjr",
		name: "Binumarien",
	},
	bjs: {
		code: "bjs",
		name: "Bajan",
	},
	bjt: {
		code: "bjt",
		name: "Balanta-Ganja",
	},
	bju: {
		code: "bju",
		name: "Busuu",
	},
	bjv: {
		code: "bjv",
		name: "Bedjond",
	},
	bjw: {
		code: "bjw",
		name: "Bakwé",
	},
	bjx: {
		code: "bjx",
		name: "Banao Itneg",
	},
	bjy: {
		code: "bjy",
		name: "Bayali",
	},
	bjz: {
		code: "bjz",
		name: "Baruga",
	},
	bka: {
		code: "bka",
		name: "Kyak",
	},
	bkc: {
		code: "bkc",
		name: "Baka (Cameroon)",
	},
	bkd: {
		code: "bkd",
		name: "Binukid",
	},
	bkf: {
		code: "bkf",
		name: "Beeke",
	},
	bkg: {
		code: "bkg",
		name: "Buraka",
	},
	bkh: {
		code: "bkh",
		name: "Bakoko",
	},
	bki: {
		code: "bki",
		name: "Baki",
	},
	bkj: {
		code: "bkj",
		name: "Pande",
	},
	bkk: {
		code: "bkk",
		name: "Brokskat",
	},
	bkl: {
		code: "bkl",
		name: "Berik",
	},
	bkm: {
		code: "bkm",
		name: "Kom (Cameroon)",
	},
	bkn: {
		code: "bkn",
		name: "Bukitan",
	},
	bko: {
		code: "bko",
		name: "Kwa'",
	},
	bkp: {
		code: "bkp",
		name: "Boko (Democratic Republic of Congo)",
	},
	bkq: {
		code: "bkq",
		name: "Bakairí",
	},
	bkr: {
		code: "bkr",
		name: "Bakumpai",
	},
	bks: {
		code: "bks",
		name: "Northern Sorsoganon",
	},
	bkt: {
		code: "bkt",
		name: "Boloki",
	},
	bku: {
		code: "bku",
		name: "Buhid",
	},
	bkv: {
		code: "bkv",
		name: "Bekwarra",
	},
	bkw: {
		code: "bkw",
		name: "Bekwel",
	},
	bkx: {
		code: "bkx",
		name: "Baikeno",
	},
	bky: {
		code: "bky",
		name: "Bokyi",
	},
	bkz: {
		code: "bkz",
		name: "Bungku",
	},
	bla: {
		code: "bla",
		name: "Siksika",
	},
	blb: {
		code: "blb",
		name: "Bilua",
	},
	blc: {
		code: "blc",
		name: "Bella Coola",
	},
	bld: {
		code: "bld",
		name: "Bolango",
	},
	ble: {
		code: "ble",
		name: "Balanta-Kentohe",
	},
	blf: {
		code: "blf",
		name: "Buol",
	},
	blh: {
		code: "blh",
		name: "Kuwaa",
	},
	bli: {
		code: "bli",
		name: "Bolia",
	},
	blj: {
		code: "blj",
		name: "Bolongan",
	},
	blk: {
		code: "blk",
		name: "Pa'o Karen",
	},
	bll: {
		code: "bll",
		name: "Biloxi",
	},
	blm: {
		code: "blm",
		name: "Beli (South Sudan)",
	},
	bln: {
		code: "bln",
		name: "Southern Catanduanes Bikol",
	},
	blo: {
		code: "blo",
		name: "Anii",
	},
	blp: {
		code: "blp",
		name: "Blablanga",
	},
	blq: {
		code: "blq",
		name: "Baluan-Pam",
	},
	blr: {
		code: "blr",
		name: "Blang",
	},
	bls: {
		code: "bls",
		name: "Balaesang",
	},
	blt: {
		code: "blt",
		name: "Tai Dam",
	},
	blv: {
		code: "blv",
		name: "Kibala",
	},
	blw: {
		code: "blw",
		name: "Balangao",
	},
	blx: {
		code: "blx",
		name: "Mag-Indi Ayta",
	},
	bly: {
		code: "bly",
		name: "Notre",
	},
	blz: {
		code: "blz",
		name: "Balantak",
	},
	bma: {
		code: "bma",
		name: "Lame",
	},
	bmb: {
		code: "bmb",
		name: "Bembe",
	},
	bmc: {
		code: "bmc",
		name: "Biem",
	},
	bmd: {
		code: "bmd",
		name: "Baga Manduri",
	},
	bme: {
		code: "bme",
		name: "Limassa",
	},
	bmf: {
		code: "bmf",
		name: "Bom-Kim",
	},
	bmg: {
		code: "bmg",
		name: "Bamwe",
	},
	bmh: {
		code: "bmh",
		name: "Kein",
	},
	bmi: {
		code: "bmi",
		name: "Bagirmi",
	},
	bmj: {
		code: "bmj",
		name: "Bote-Majhi",
	},
	bmk: {
		code: "bmk",
		name: "Ghayavi",
	},
	bml: {
		code: "bml",
		name: "Bomboli",
	},
	bmm: {
		code: "bmm",
		name: "Northern Betsimisaraka Malagasy",
	},
	bmn: {
		code: "bmn",
		name: "Bina (Papua New Guinea)",
	},
	bmo: {
		code: "bmo",
		name: "Bambalang",
	},
	bmp: {
		code: "bmp",
		name: "Bulgebi",
	},
	bmq: {
		code: "bmq",
		name: "Bomu",
	},
	bmr: {
		code: "bmr",
		name: "Muinane",
	},
	bms: {
		code: "bms",
		name: "Bilma Kanuri",
	},
	bmt: {
		code: "bmt",
		name: "Biao Mon",
	},
	bmu: {
		code: "bmu",
		name: "Somba-Siawari",
	},
	bmv: {
		code: "bmv",
		name: "Bum",
	},
	bmw: {
		code: "bmw",
		name: "Bomwali",
	},
	bmx: {
		code: "bmx",
		name: "Baimak",
	},
	bmz: {
		code: "bmz",
		name: "Baramu",
	},
	bna: {
		code: "bna",
		name: "Bonerate",
	},
	bnb: {
		code: "bnb",
		name: "Bookan",
	},
	bnc: {
		code: "bnc",
		name: "Bontok",
	},
	bnd: {
		code: "bnd",
		name: "Banda (Indonesia)",
	},
	bne: {
		code: "bne",
		name: "Bintauna",
	},
	bnf: {
		code: "bnf",
		name: "Masiwang",
	},
	bng: {
		code: "bng",
		name: "Benga",
	},
	bni: {
		code: "bni",
		name: "Bangi",
	},
	bnj: {
		code: "bnj",
		name: "Eastern Tawbuid",
	},
	bnk: {
		code: "bnk",
		name: "Bierebo",
	},
	bnl: {
		code: "bnl",
		name: "Boon",
	},
	bnm: {
		code: "bnm",
		name: "Batanga",
	},
	bnn: {
		code: "bnn",
		name: "Bunun",
	},
	bno: {
		code: "bno",
		name: "Bantoanon",
	},
	bnp: {
		code: "bnp",
		name: "Bola",
	},
	bnq: {
		code: "bnq",
		name: "Bantik",
	},
	bnr: {
		code: "bnr",
		name: "Butmas-Tur",
	},
	bns: {
		code: "bns",
		name: "Bundeli",
	},
	bnu: {
		code: "bnu",
		name: "Bentong",
	},
	bnv: {
		code: "bnv",
		name: "Bonerif",
	},
	bnw: {
		code: "bnw",
		name: "Bisis",
	},
	bnx: {
		code: "bnx",
		name: "Bangubangu",
	},
	bny: {
		code: "bny",
		name: "Bintulu",
	},
	bnz: {
		code: "bnz",
		name: "Beezen",
	},
	boa: {
		code: "boa",
		name: "Bora",
	},
	bob: {
		code: "bob",
		name: "Aweer",
	},
	bod: {
		code: "bod",
		name: "Tibetan",
	},
	boe: {
		code: "boe",
		name: "Mundabli",
	},
	bof: {
		code: "bof",
		name: "Bolon",
	},
	bog: {
		code: "bog",
		name: "Bamako Sign Language",
	},
	boh: {
		code: "boh",
		name: "Boma",
	},
	boi: {
		code: "boi",
		name: "Barbareño",
	},
	boj: {
		code: "boj",
		name: "Anjam",
	},
	bok: {
		code: "bok",
		name: "Bonjo",
	},
	bol: {
		code: "bol",
		name: "Bole",
	},
	bom: {
		code: "bom",
		name: "Berom",
	},
	bon: {
		code: "bon",
		name: "Bine",
	},
	boo: {
		code: "boo",
		name: "Tiemacèwè Bozo",
	},
	bop: {
		code: "bop",
		name: "Bonkiman",
	},
	boq: {
		code: "boq",
		name: "Bogaya",
	},
	bor: {
		code: "bor",
		name: "Borôro",
	},
	bos: {
		code: "bos",
		name: "Bosnian",
	},
	bot: {
		code: "bot",
		name: "Bongo",
	},
	bou: {
		code: "bou",
		name: "Bondei",
	},
	bov: {
		code: "bov",
		name: "Tuwuli",
	},
	bow: {
		code: "bow",
		name: "Rema",
	},
	box: {
		code: "box",
		name: "Buamu",
	},
	boy: {
		code: "boy",
		name: "Bodo (Central African Republic)",
	},
	boz: {
		code: "boz",
		name: "Tiéyaxo Bozo",
	},
	bpa: {
		code: "bpa",
		name: "Daakaka",
	},
	bpc: {
		code: "bpc",
		name: "Mbuk",
	},
	bpd: {
		code: "bpd",
		name: "Banda-Banda",
	},
	bpe: {
		code: "bpe",
		name: "Bauni",
	},
	bpg: {
		code: "bpg",
		name: "Bonggo",
	},
	bph: {
		code: "bph",
		name: "Botlikh",
	},
	bpi: {
		code: "bpi",
		name: "Bagupi",
	},
	bpj: {
		code: "bpj",
		name: "Binji",
	},
	bpk: {
		code: "bpk",
		name: "Orowe",
	},
	bpl: {
		code: "bpl",
		name: "Broome Pearling Lugger Pidgin",
	},
	bpm: {
		code: "bpm",
		name: "Biyom",
	},
	bpn: {
		code: "bpn",
		name: "Dzao Min",
	},
	bpo: {
		code: "bpo",
		name: "Anasi",
	},
	bpp: {
		code: "bpp",
		name: "Kaure",
	},
	bpq: {
		code: "bpq",
		name: "Banda Malay",
	},
	bpr: {
		code: "bpr",
		name: "Koronadal Blaan",
	},
	bps: {
		code: "bps",
		name: "Sarangani Blaan",
	},
	bpt: {
		code: "bpt",
		name: "Barrow Point",
	},
	bpu: {
		code: "bpu",
		name: "Bongu",
	},
	bpv: {
		code: "bpv",
		name: "Bian Marind",
	},
	bpw: {
		code: "bpw",
		name: "Bo (Papua New Guinea)",
	},
	bpx: {
		code: "bpx",
		name: "Palya Bareli",
	},
	bpy: {
		code: "bpy",
		name: "Bishnupriya",
	},
	bpz: {
		code: "bpz",
		name: "Bilba",
	},
	bqa: {
		code: "bqa",
		name: "Tchumbuli",
	},
	bqb: {
		code: "bqb",
		name: "Bagusa",
	},
	bqc: {
		code: "bqc",
		name: "Boko (Benin)",
	},
	bqd: {
		code: "bqd",
		name: "Bung",
	},
	bqf: {
		code: "bqf",
		name: "Baga Kaloum",
	},
	bqg: {
		code: "bqg",
		name: "Bago-Kusuntu",
	},
	bqh: {
		code: "bqh",
		name: "Baima",
	},
	bqi: {
		code: "bqi",
		name: "Bakhtiari",
	},
	bqj: {
		code: "bqj",
		name: "Bandial",
	},
	bqk: {
		code: "bqk",
		name: "Banda-Mbrès",
	},
	bql: {
		code: "bql",
		name: "Bilakura",
	},
	bqm: {
		code: "bqm",
		name: "Wumboko",
	},
	bqn: {
		code: "bqn",
		name: "Bulgarian Sign Language",
	},
	bqo: {
		code: "bqo",
		name: "Balo",
	},
	bqp: {
		code: "bqp",
		name: "Busa",
	},
	bqq: {
		code: "bqq",
		name: "Biritai",
	},
	bqr: {
		code: "bqr",
		name: "Burusu",
	},
	bqs: {
		code: "bqs",
		name: "Bosngun",
	},
	bqt: {
		code: "bqt",
		name: "Bamukumbit",
	},
	bqu: {
		code: "bqu",
		name: "Boguru",
	},
	bqv: {
		code: "bqv",
		name: "Koro Wachi",
	},
	bqw: {
		code: "bqw",
		name: "Buru (Nigeria)",
	},
	bqx: {
		code: "bqx",
		name: "Baangi",
	},
	bqy: {
		code: "bqy",
		name: "Bengkala Sign Language",
	},
	bqz: {
		code: "bqz",
		name: "Bakaka",
	},
	bra: {
		code: "bra",
		name: "Braj",
	},
	brb: {
		code: "brb",
		name: "Brao",
	},
	brc: {
		code: "brc",
		name: "Berbice Creole Dutch",
	},
	brd: {
		code: "brd",
		name: "Baraamu",
	},
	bre: {
		code: "bre",
		name: "Breton",
	},
	brf: {
		code: "brf",
		name: "Bira",
	},
	brg: {
		code: "brg",
		name: "Baure",
	},
	brh: {
		code: "brh",
		name: "Brahui",
	},
	bri: {
		code: "bri",
		name: "Mokpwe",
	},
	brj: {
		code: "brj",
		name: "Bieria",
	},
	brk: {
		code: "brk",
		name: "Birked",
	},
	brl: {
		code: "brl",
		name: "Birwa",
	},
	brm: {
		code: "brm",
		name: "Barambu",
	},
	brn: {
		code: "brn",
		name: "Boruca",
	},
	bro: {
		code: "bro",
		name: "Brokkat",
	},
	brp: {
		code: "brp",
		name: "Barapasi",
	},
	brq: {
		code: "brq",
		name: "Breri",
	},
	brr: {
		code: "brr",
		name: "Birao",
	},
	brs: {
		code: "brs",
		name: "Baras",
	},
	brt: {
		code: "brt",
		name: "Bitare",
	},
	bru: {
		code: "bru",
		name: "Eastern Bru",
	},
	brv: {
		code: "brv",
		name: "Western Bru",
	},
	brw: {
		code: "brw",
		name: "Bellari",
	},
	brx: {
		code: "brx",
		name: "Bodo (India)",
	},
	bry: {
		code: "bry",
		name: "Burui",
	},
	brz: {
		code: "brz",
		name: "Bilbil",
	},
	bsa: {
		code: "bsa",
		name: "Abinomn",
	},
	bsb: {
		code: "bsb",
		name: "Brunei Bisaya",
	},
	bsc: {
		code: "bsc",
		name: "Bassari",
	},
	bse: {
		code: "bse",
		name: "Wushi",
	},
	bsf: {
		code: "bsf",
		name: "Bauchi",
	},
	bsg: {
		code: "bsg",
		name: "Bashkardi",
	},
	bsh: {
		code: "bsh",
		name: "Kati",
	},
	bsi: {
		code: "bsi",
		name: "Bassossi",
	},
	bsj: {
		code: "bsj",
		name: "Bangwinji",
	},
	bsk: {
		code: "bsk",
		name: "Burushaski",
	},
	bsl: {
		code: "bsl",
		name: "Basa-Gumna",
	},
	bsm: {
		code: "bsm",
		name: "Busami",
	},
	bsn: {
		code: "bsn",
		name: "Barasana-Eduria",
	},
	bso: {
		code: "bso",
		name: "Buso",
	},
	bsp: {
		code: "bsp",
		name: "Baga Sitemu",
	},
	bsq: {
		code: "bsq",
		name: "Bassa",
	},
	bsr: {
		code: "bsr",
		name: "Bassa-Kontagora",
	},
	bss: {
		code: "bss",
		name: "Akoose",
	},
	bst: {
		code: "bst",
		name: "Basketo",
	},
	bsu: {
		code: "bsu",
		name: "Bahonsuai",
	},
	bsv: {
		code: "bsv",
		name: "Baga Sobané",
	},
	bsw: {
		code: "bsw",
		name: "Baiso",
	},
	bsx: {
		code: "bsx",
		name: "Yangkam",
	},
	bsy: {
		code: "bsy",
		name: "Sabah Bisaya",
	},
	bta: {
		code: "bta",
		name: "Bata",
	},
	btc: {
		code: "btc",
		name: "Bati (Cameroon)",
	},
	btd: {
		code: "btd",
		name: "Batak Dairi",
	},
	bte: {
		code: "bte",
		name: "Gamo-Ningi",
	},
	btf: {
		code: "btf",
		name: "Birgit",
	},
	btg: {
		code: "btg",
		name: "Gagnoa Bété",
	},
	bth: {
		code: "bth",
		name: "Biatah Bidayuh",
	},
	bti: {
		code: "bti",
		name: "Burate",
	},
	btj: {
		code: "btj",
		name: "Bacanese Malay",
	},
	btm: {
		code: "btm",
		name: "Batak Mandailing",
	},
	btn: {
		code: "btn",
		name: "Ratagnon",
	},
	bto: {
		code: "bto",
		name: "Rinconada Bikol",
	},
	btp: {
		code: "btp",
		name: "Budibud",
	},
	btq: {
		code: "btq",
		name: "Batek",
	},
	btr: {
		code: "btr",
		name: "Baetora",
	},
	bts: {
		code: "bts",
		name: "Batak Simalungun",
	},
	btt: {
		code: "btt",
		name: "Bete-Bendi",
	},
	btu: {
		code: "btu",
		name: "Batu",
	},
	btv: {
		code: "btv",
		name: "Bateri",
	},
	btw: {
		code: "btw",
		name: "Butuanon",
	},
	btx: {
		code: "btx",
		name: "Batak Karo",
	},
	bty: {
		code: "bty",
		name: "Bobot",
	},
	btz: {
		code: "btz",
		name: "Batak Alas-Kluet",
	},
	bua: {
		code: "bua",
		name: "Buriat",
	},
	bub: {
		code: "bub",
		name: "Bua",
	},
	buc: {
		code: "buc",
		name: "Bushi",
	},
	bud: {
		code: "bud",
		name: "Ntcham",
	},
	bue: {
		code: "bue",
		name: "Beothuk",
	},
	buf: {
		code: "buf",
		name: "Bushoong",
	},
	bug: {
		code: "bug",
		name: "Buginese",
	},
	buh: {
		code: "buh",
		name: "Younuo Bunu",
	},
	bui: {
		code: "bui",
		name: "Bongili",
	},
	buj: {
		code: "buj",
		name: "Basa-Gurmana",
	},
	buk: {
		code: "buk",
		name: "Bugawac",
	},
	bul: {
		code: "bul",
		name: "Bulgarian",
	},
	bum: {
		code: "bum",
		name: "Bulu (Cameroon)",
	},
	bun: {
		code: "bun",
		name: "Sherbro",
	},
	buo: {
		code: "buo",
		name: "Terei",
	},
	bup: {
		code: "bup",
		name: "Busoa",
	},
	buq: {
		code: "buq",
		name: "Brem",
	},
	bus: {
		code: "bus",
		name: "Bokobaru",
	},
	but: {
		code: "but",
		name: "Bungain",
	},
	buu: {
		code: "buu",
		name: "Budu",
	},
	buv: {
		code: "buv",
		name: "Bun",
	},
	buw: {
		code: "buw",
		name: "Bubi",
	},
	bux: {
		code: "bux",
		name: "Boghom",
	},
	buy: {
		code: "buy",
		name: "Bullom So",
	},
	buz: {
		code: "buz",
		name: "Bukwen",
	},
	bva: {
		code: "bva",
		name: "Barein",
	},
	bvb: {
		code: "bvb",
		name: "Bube",
	},
	bvc: {
		code: "bvc",
		name: "Baelelea",
	},
	bvd: {
		code: "bvd",
		name: "Baeggu",
	},
	bve: {
		code: "bve",
		name: "Berau Malay",
	},
	bvf: {
		code: "bvf",
		name: "Boor",
	},
	bvg: {
		code: "bvg",
		name: "Bonkeng",
	},
	bvh: {
		code: "bvh",
		name: "Bure",
	},
	bvi: {
		code: "bvi",
		name: "Belanda Viri",
	},
	bvj: {
		code: "bvj",
		name: "Baan",
	},
	bvk: {
		code: "bvk",
		name: "Bukat",
	},
	bvl: {
		code: "bvl",
		name: "Bolivian Sign Language",
	},
	bvm: {
		code: "bvm",
		name: "Bamunka",
	},
	bvn: {
		code: "bvn",
		name: "Buna",
	},
	bvo: {
		code: "bvo",
		name: "Bolgo",
	},
	bvp: {
		code: "bvp",
		name: "Bumang",
	},
	bvq: {
		code: "bvq",
		name: "Birri",
	},
	bvr: {
		code: "bvr",
		name: "Burarra",
	},
	bvt: {
		code: "bvt",
		name: "Bati (Indonesia)",
	},
	bvu: {
		code: "bvu",
		name: "Bukit Malay",
	},
	bvv: {
		code: "bvv",
		name: "Baniva",
	},
	bvw: {
		code: "bvw",
		name: "Boga",
	},
	bvx: {
		code: "bvx",
		name: "Dibole",
	},
	bvy: {
		code: "bvy",
		name: "Baybayanon",
	},
	bvz: {
		code: "bvz",
		name: "Bauzi",
	},
	bwa: {
		code: "bwa",
		name: "Bwatoo",
	},
	bwb: {
		code: "bwb",
		name: "Namosi-Naitasiri-Serua",
	},
	bwc: {
		code: "bwc",
		name: "Bwile",
	},
	bwd: {
		code: "bwd",
		name: "Bwaidoka",
	},
	bwe: {
		code: "bwe",
		name: "Bwe Karen",
	},
	bwf: {
		code: "bwf",
		name: "Boselewa",
	},
	bwg: {
		code: "bwg",
		name: "Barwe",
	},
	bwh: {
		code: "bwh",
		name: "Bishuo",
	},
	bwi: {
		code: "bwi",
		name: "Baniwa",
	},
	bwj: {
		code: "bwj",
		name: "Láá Láá Bwamu",
	},
	bwk: {
		code: "bwk",
		name: "Bauwaki",
	},
	bwl: {
		code: "bwl",
		name: "Bwela",
	},
	bwm: {
		code: "bwm",
		name: "Biwat",
	},
	bwn: {
		code: "bwn",
		name: "Wunai Bunu",
	},
	bwo: {
		code: "bwo",
		name: "Boro (Ethiopia)",
	},
	bwp: {
		code: "bwp",
		name: "Mandobo Bawah",
	},
	bwq: {
		code: "bwq",
		name: "Southern Bobo Madaré",
	},
	bwr: {
		code: "bwr",
		name: "Bura-Pabir",
	},
	bws: {
		code: "bws",
		name: "Bomboma",
	},
	bwt: {
		code: "bwt",
		name: "Bafaw-Balong",
	},
	bwu: {
		code: "bwu",
		name: "Buli (Ghana)",
	},
	bww: {
		code: "bww",
		name: "Bwa",
	},
	bwx: {
		code: "bwx",
		name: "Bu-Nao Bunu",
	},
	bwy: {
		code: "bwy",
		name: "Cwi Bwamu",
	},
	bwz: {
		code: "bwz",
		name: "Bwisi",
	},
	bxa: {
		code: "bxa",
		name: "Tairaha",
	},
	bxb: {
		code: "bxb",
		name: "Belanda Bor",
	},
	bxc: {
		code: "bxc",
		name: "Molengue",
	},
	bxd: {
		code: "bxd",
		name: "Pela",
	},
	bxe: {
		code: "bxe",
		name: "Birale",
	},
	bxf: {
		code: "bxf",
		name: "Bilur",
	},
	bxg: {
		code: "bxg",
		name: "Bangala",
	},
	bxh: {
		code: "bxh",
		name: "Buhutu",
	},
	bxi: {
		code: "bxi",
		name: "Pirlatapa",
	},
	bxj: {
		code: "bxj",
		name: "Bayungu",
	},
	bxk: {
		code: "bxk",
		name: "Bukusu",
	},
	bxl: {
		code: "bxl",
		name: "Jalkunan",
	},
	bxm: {
		code: "bxm",
		name: "Mongolia Buriat",
	},
	bxn: {
		code: "bxn",
		name: "Burduna",
	},
	bxo: {
		code: "bxo",
		name: "Barikanchi",
	},
	bxp: {
		code: "bxp",
		name: "Bebil",
	},
	bxq: {
		code: "bxq",
		name: "Beele",
	},
	bxr: {
		code: "bxr",
		name: "Russia Buriat",
	},
	bxs: {
		code: "bxs",
		name: "Busam",
	},
	bxu: {
		code: "bxu",
		name: "China Buriat",
	},
	bxv: {
		code: "bxv",
		name: "Berakou",
	},
	bxw: {
		code: "bxw",
		name: "Bankagooma",
	},
	bxz: {
		code: "bxz",
		name: "Binahari",
	},
	bya: {
		code: "bya",
		name: "Batak",
	},
	byb: {
		code: "byb",
		name: "Bikya",
	},
	byc: {
		code: "byc",
		name: "Ubaghara",
	},
	byd: {
		code: "byd",
		name: "Benyadu'",
	},
	bye: {
		code: "bye",
		name: "Pouye",
	},
	byf: {
		code: "byf",
		name: "Bete",
	},
	byg: {
		code: "byg",
		name: "Baygo",
	},
	byh: {
		code: "byh",
		name: "Bhujel",
	},
	byi: {
		code: "byi",
		name: "Buyu",
	},
	byj: {
		code: "byj",
		name: "Bina (Nigeria)",
	},
	byk: {
		code: "byk",
		name: "Biao",
	},
	byl: {
		code: "byl",
		name: "Bayono",
	},
	bym: {
		code: "bym",
		name: "Bidjara",
	},
	byn: {
		code: "byn",
		name: "Bilin",
	},
	byo: {
		code: "byo",
		name: "Biyo",
	},
	byp: {
		code: "byp",
		name: "Bumaji",
	},
	byq: {
		code: "byq",
		name: "Basay",
	},
	byr: {
		code: "byr",
		name: "Baruya",
	},
	bys: {
		code: "bys",
		name: "Burak",
	},
	byt: {
		code: "byt",
		name: "Berti",
	},
	byv: {
		code: "byv",
		name: "Medumba",
	},
	byw: {
		code: "byw",
		name: "Belhariya",
	},
	byx: {
		code: "byx",
		name: "Qaqet",
	},
	byz: {
		code: "byz",
		name: "Banaro",
	},
	bza: {
		code: "bza",
		name: "Bandi",
	},
	bzb: {
		code: "bzb",
		name: "Andio",
	},
	bzc: {
		code: "bzc",
		name: "Southern Betsimisaraka Malagasy",
	},
	bzd: {
		code: "bzd",
		name: "Bribri",
	},
	bze: {
		code: "bze",
		name: "Jenaama Bozo",
	},
	bzf: {
		code: "bzf",
		name: "Boikin",
	},
	bzg: {
		code: "bzg",
		name: "Babuza",
	},
	bzh: {
		code: "bzh",
		name: "Mapos Buang",
	},
	bzi: {
		code: "bzi",
		name: "Bisu",
	},
	bzj: {
		code: "bzj",
		name: "Belize Kriol English",
	},
	bzk: {
		code: "bzk",
		name: "Nicaragua Creole English",
	},
	bzl: {
		code: "bzl",
		name: "Boano (Sulawesi)",
	},
	bzm: {
		code: "bzm",
		name: "Bolondo",
	},
	bzn: {
		code: "bzn",
		name: "Boano (Maluku)",
	},
	bzo: {
		code: "bzo",
		name: "Bozaba",
	},
	bzp: {
		code: "bzp",
		name: "Kemberano",
	},
	bzq: {
		code: "bzq",
		name: "Buli (Indonesia)",
	},
	bzr: {
		code: "bzr",
		name: "Biri",
	},
	bzs: {
		code: "bzs",
		name: "Brazilian Sign Language",
	},
	bzt: {
		code: "bzt",
		name: "Brithenig",
	},
	bzu: {
		code: "bzu",
		name: "Burmeso",
	},
	bzv: {
		code: "bzv",
		name: "Naami",
	},
	bzw: {
		code: "bzw",
		name: "Basa (Nigeria)",
	},
	bzx: {
		code: "bzx",
		name: "Kɛlɛngaxo Bozo",
	},
	bzy: {
		code: "bzy",
		name: "Obanliku",
	},
	bzz: {
		code: "bzz",
		name: "Evant",
	},
	caa: {
		code: "caa",
		name: "Chortí",
	},
	cab: {
		code: "cab",
		name: "Garifuna",
	},
	cac: {
		code: "cac",
		name: "Chuj",
	},
	cad: {
		code: "cad",
		name: "Caddo",
	},
	cae: {
		code: "cae",
		name: "Lehar",
	},
	caf: {
		code: "caf",
		name: "Southern Carrier",
	},
	cag: {
		code: "cag",
		name: "Nivaclé",
	},
	cah: {
		code: "cah",
		name: "Cahuarano",
	},
	caj: {
		code: "caj",
		name: "Chané",
	},
	cak: {
		code: "cak",
		name: "Kaqchikel",
	},
	cal: {
		code: "cal",
		name: "Carolinian",
	},
	cam: {
		code: "cam",
		name: "Cemuhî",
	},
	can: {
		code: "can",
		name: "Chambri",
	},
	cao: {
		code: "cao",
		name: "Chácobo",
	},
	cap: {
		code: "cap",
		name: "Chipaya",
	},
	caq: {
		code: "caq",
		name: "Car Nicobarese",
	},
	car: {
		code: "car",
		name: "Galibi Carib",
	},
	cas: {
		code: "cas",
		name: "Tsimané",
	},
	cat: {
		code: "cat",
		name: "Catalan",
	},
	cav: {
		code: "cav",
		name: "Cavineña",
	},
	caw: {
		code: "caw",
		name: "Callawalla",
	},
	cax: {
		code: "cax",
		name: "Chiquitano",
	},
	cay: {
		code: "cay",
		name: "Cayuga",
	},
	caz: {
		code: "caz",
		name: "Canichana",
	},
	cbb: {
		code: "cbb",
		name: "Cabiyarí",
	},
	cbc: {
		code: "cbc",
		name: "Carapana",
	},
	cbd: {
		code: "cbd",
		name: "Carijona",
	},
	cbg: {
		code: "cbg",
		name: "Chimila",
	},
	cbi: {
		code: "cbi",
		name: "Chachi",
	},
	cbj: {
		code: "cbj",
		name: "Ede Cabe",
	},
	cbk: {
		code: "cbk",
		name: "Chavacano",
	},
	cbl: {
		code: "cbl",
		name: "Bualkhaw Chin",
	},
	cbn: {
		code: "cbn",
		name: "Nyahkur",
	},
	cbo: {
		code: "cbo",
		name: "Izora",
	},
	cbq: {
		code: "cbq",
		name: "Tsucuba",
	},
	cbr: {
		code: "cbr",
		name: "Cashibo-Cacataibo",
	},
	cbs: {
		code: "cbs",
		name: "Cashinahua",
	},
	cbt: {
		code: "cbt",
		name: "Chayahuita",
	},
	cbu: {
		code: "cbu",
		name: "Candoshi-Shapra",
	},
	cbv: {
		code: "cbv",
		name: "Cacua",
	},
	cbw: {
		code: "cbw",
		name: "Kinabalian",
	},
	cby: {
		code: "cby",
		name: "Carabayo",
	},
	ccc: {
		code: "ccc",
		name: "Chamicuro",
	},
	ccd: {
		code: "ccd",
		name: "Cafundo Creole",
	},
	cce: {
		code: "cce",
		name: "Chopi",
	},
	ccg: {
		code: "ccg",
		name: "Samba Daka",
	},
	cch: {
		code: "cch",
		name: "Atsam",
	},
	ccj: {
		code: "ccj",
		name: "Kasanga",
	},
	ccl: {
		code: "ccl",
		name: "Cutchi-Swahili",
	},
	ccm: {
		code: "ccm",
		name: "Malaccan Creole Malay",
	},
	cco: {
		code: "cco",
		name: "Comaltepec Chinantec",
	},
	ccp: {
		code: "ccp",
		name: "Chakma",
	},
	ccr: {
		code: "ccr",
		name: "Cacaopera",
	},
	cda: {
		code: "cda",
		name: "Choni",
	},
	cde: {
		code: "cde",
		name: "Chenchu",
	},
	cdf: {
		code: "cdf",
		name: "Chiru",
	},
	cdh: {
		code: "cdh",
		name: "Chambeali",
	},
	cdi: {
		code: "cdi",
		name: "Chodri",
	},
	cdj: {
		code: "cdj",
		name: "Churahi",
	},
	cdm: {
		code: "cdm",
		name: "Chepang",
	},
	cdn: {
		code: "cdn",
		name: "Chaudangsi",
	},
	cdo: {
		code: "cdo",
		name: "Min Dong Chinese",
	},
	cdr: {
		code: "cdr",
		name: "Cinda-Regi-Tiyal",
	},
	cds: {
		code: "cds",
		name: "Chadian Sign Language",
	},
	cdy: {
		code: "cdy",
		name: "Chadong",
	},
	cdz: {
		code: "cdz",
		name: "Koda",
	},
	cea: {
		code: "cea",
		name: "Lower Chehalis",
	},
	ceb: {
		code: "ceb",
		name: "Cebuano",
	},
	ceg: {
		code: "ceg",
		name: "Chamacoco",
	},
	cek: {
		code: "cek",
		name: "Eastern Khumi Chin",
	},
	cen: {
		code: "cen",
		name: "Cen",
	},
	ces: {
		code: "ces",
		name: "Czech",
	},
	cet: {
		code: "cet",
		name: "Centúúm",
	},
	cey: {
		code: "cey",
		name: "Ekai Chin",
	},
	cfa: {
		code: "cfa",
		name: "Dijim-Bwilim",
	},
	cfd: {
		code: "cfd",
		name: "Cara",
	},
	cfg: {
		code: "cfg",
		name: "Como Karim",
	},
	cfm: {
		code: "cfm",
		name: "Falam Chin",
	},
	cga: {
		code: "cga",
		name: "Changriwa",
	},
	cgc: {
		code: "cgc",
		name: "Kagayanen",
	},
	cgg: {
		code: "cgg",
		name: "Chiga",
	},
	cgk: {
		code: "cgk",
		name: "Chocangacakha",
	},
	cha: {
		code: "cha",
		name: "Chamorro",
	},
	chb: {
		code: "chb",
		name: "Chibcha",
	},
	chc: {
		code: "chc",
		name: "Catawba",
	},
	chd: {
		code: "chd",
		name: "Highland Oaxaca Chontal",
	},
	che: {
		code: "che",
		name: "Chechen",
	},
	chf: {
		code: "chf",
		name: "Tabasco Chontal",
	},
	chg: {
		code: "chg",
		name: "Chagatai",
	},
	chh: {
		code: "chh",
		name: "Chinook",
	},
	chj: {
		code: "chj",
		name: "Ojitlán Chinantec",
	},
	chk: {
		code: "chk",
		name: "Chuukese",
	},
	chl: {
		code: "chl",
		name: "Cahuilla",
	},
	chm: {
		code: "chm",
		name: "Mari (Russia)",
	},
	chn: {
		code: "chn",
		name: "Chinook jargon",
	},
	cho: {
		code: "cho",
		name: "Choctaw",
	},
	chp: {
		code: "chp",
		name: "Chipewyan",
	},
	chq: {
		code: "chq",
		name: "Quiotepec Chinantec",
	},
	chr: {
		code: "chr",
		name: "Cherokee",
	},
	cht: {
		code: "cht",
		name: "Cholón",
	},
	chu: {
		code: "chu",
		name: "Church Slavic",
	},
	chv: {
		code: "chv",
		name: "Chuvash",
	},
	chw: {
		code: "chw",
		name: "Chuwabu",
	},
	chx: {
		code: "chx",
		name: "Chantyal",
	},
	chy: {
		code: "chy",
		name: "Cheyenne",
	},
	chz: {
		code: "chz",
		name: "Ozumacín Chinantec",
	},
	cia: {
		code: "cia",
		name: "Cia-Cia",
	},
	cib: {
		code: "cib",
		name: "Ci Gbe",
	},
	cic: {
		code: "cic",
		name: "Chickasaw",
	},
	cid: {
		code: "cid",
		name: "Chimariko",
	},
	cie: {
		code: "cie",
		name: "Cineni",
	},
	cih: {
		code: "cih",
		name: "Chinali",
	},
	cik: {
		code: "cik",
		name: "Chitkuli Kinnauri",
	},
	cim: {
		code: "cim",
		name: "Cimbrian",
	},
	cin: {
		code: "cin",
		name: "Cinta Larga",
	},
	cip: {
		code: "cip",
		name: "Chiapanec",
	},
	cir: {
		code: "cir",
		name: "Tiri",
	},
	ciw: {
		code: "ciw",
		name: "Chippewa",
	},
	ciy: {
		code: "ciy",
		name: "Chaima",
	},
	cja: {
		code: "cja",
		name: "Western Cham",
	},
	cje: {
		code: "cje",
		name: "Chru",
	},
	cjh: {
		code: "cjh",
		name: "Upper Chehalis",
	},
	cji: {
		code: "cji",
		name: "Chamalal",
	},
	cjk: {
		code: "cjk",
		name: "Chokwe",
	},
	cjm: {
		code: "cjm",
		name: "Eastern Cham",
	},
	cjn: {
		code: "cjn",
		name: "Chenapian",
	},
	cjo: {
		code: "cjo",
		name: "Ashéninka Pajonal",
	},
	cjp: {
		code: "cjp",
		name: "Cabécar",
	},
	cjs: {
		code: "cjs",
		name: "Shor",
	},
	cjv: {
		code: "cjv",
		name: "Chuave",
	},
	cjy: {
		code: "cjy",
		name: "Jinyu Chinese",
	},
	ckb: {
		code: "ckb",
		name: "Central Kurdish",
	},
	ckh: {
		code: "ckh",
		name: "Chak",
	},
	ckl: {
		code: "ckl",
		name: "Cibak",
	},
	ckm: {
		code: "ckm",
		name: "Chakavian",
	},
	ckn: {
		code: "ckn",
		name: "Kaang Chin",
	},
	cko: {
		code: "cko",
		name: "Anufo",
	},
	ckq: {
		code: "ckq",
		name: "Kajakse",
	},
	ckr: {
		code: "ckr",
		name: "Kairak",
	},
	cks: {
		code: "cks",
		name: "Tayo",
	},
	ckt: {
		code: "ckt",
		name: "Chukot",
	},
	cku: {
		code: "cku",
		name: "Koasati",
	},
	ckv: {
		code: "ckv",
		name: "Kavalan",
	},
	ckx: {
		code: "ckx",
		name: "Caka",
	},
	cky: {
		code: "cky",
		name: "Cakfem-Mushere",
	},
	ckz: {
		code: "ckz",
		name: "Cakchiquel-Quiché Mixed Language",
	},
	cla: {
		code: "cla",
		name: "Ron",
	},
	clc: {
		code: "clc",
		name: "Chilcotin",
	},
	cld: {
		code: "cld",
		name: "Chaldean Neo-Aramaic",
	},
	cle: {
		code: "cle",
		name: "Lealao Chinantec",
	},
	clh: {
		code: "clh",
		name: "Chilisso",
	},
	cli: {
		code: "cli",
		name: "Chakali",
	},
	clj: {
		code: "clj",
		name: "Laitu Chin",
	},
	clk: {
		code: "clk",
		name: "Idu-Mishmi",
	},
	cll: {
		code: "cll",
		name: "Chala",
	},
	clm: {
		code: "clm",
		name: "Clallam",
	},
	clo: {
		code: "clo",
		name: "Lowland Oaxaca Chontal",
	},
	clt: {
		code: "clt",
		name: "Lautu Chin",
	},
	clu: {
		code: "clu",
		name: "Caluyanun",
	},
	clw: {
		code: "clw",
		name: "Chulym",
	},
	cly: {
		code: "cly",
		name: "Eastern Highland Chatino",
	},
	cma: {
		code: "cma",
		name: "Maa",
	},
	cme: {
		code: "cme",
		name: "Cerma",
	},
	cmg: {
		code: "cmg",
		name: "Classical Mongolian",
	},
	cmi: {
		code: "cmi",
		name: "Emberá-Chamí",
	},
	cml: {
		code: "cml",
		name: "Campalagian",
	},
	cmm: {
		code: "cmm",
		name: "Michigamea",
	},
	cmn: {
		code: "cmn",
		name: "Mandarin Chinese",
	},
	cmo: {
		code: "cmo",
		name: "Central Mnong",
	},
	cmr: {
		code: "cmr",
		name: "Mro-Khimi Chin",
	},
	cms: {
		code: "cms",
		name: "Messapic",
	},
	cmt: {
		code: "cmt",
		name: "Camtho",
	},
	cna: {
		code: "cna",
		name: "Changthang",
	},
	cnb: {
		code: "cnb",
		name: "Chinbon Chin",
	},
	cnc: {
		code: "cnc",
		name: "Côông",
	},
	cng: {
		code: "cng",
		name: "Northern Qiang",
	},
	cnh: {
		code: "cnh",
		name: "Hakha Chin",
	},
	cni: {
		code: "cni",
		name: "Asháninka",
	},
	cnk: {
		code: "cnk",
		name: "Khumi Chin",
	},
	cnl: {
		code: "cnl",
		name: "Lalana Chinantec",
	},
	cno: {
		code: "cno",
		name: "Con",
	},
	cnp: {
		code: "cnp",
		name: "Northern Ping Chinese",
	},
	cnq: {
		code: "cnq",
		name: "Chung",
	},
	cnr: {
		code: "cnr",
		name: "Montenegrin",
	},
	cns: {
		code: "cns",
		name: "Central Asmat",
	},
	cnt: {
		code: "cnt",
		name: "Tepetotutla Chinantec",
	},
	cnu: {
		code: "cnu",
		name: "Chenoua",
	},
	cnw: {
		code: "cnw",
		name: "Ngawn Chin",
	},
	cnx: {
		code: "cnx",
		name: "Middle Cornish",
	},
	coa: {
		code: "coa",
		name: "Cocos Islands Malay",
	},
	cob: {
		code: "cob",
		name: "Chicomuceltec",
	},
	coc: {
		code: "coc",
		name: "Cocopa",
	},
	cod: {
		code: "cod",
		name: "Cocama-Cocamilla",
	},
	coe: {
		code: "coe",
		name: "Koreguaje",
	},
	cof: {
		code: "cof",
		name: "Colorado",
	},
	cog: {
		code: "cog",
		name: "Chong",
	},
	coh: {
		code: "coh",
		name: "Chonyi-Dzihana-Kauma",
	},
	coj: {
		code: "coj",
		name: "Cochimi",
	},
	cok: {
		code: "cok",
		name: "Santa Teresa Cora",
	},
	col: {
		code: "col",
		name: "Columbia-Wenatchi",
	},
	com: {
		code: "com",
		name: "Comanche",
	},
	con: {
		code: "con",
		name: "Cofán",
	},
	coo: {
		code: "coo",
		name: "Comox",
	},
	cop: {
		code: "cop",
		name: "Coptic",
	},
	coq: {
		code: "coq",
		name: "Coquille",
	},
	cor: {
		code: "cor",
		name: "Cornish",
	},
	cos: {
		code: "cos",
		name: "Corsican",
	},
	cot: {
		code: "cot",
		name: "Caquinte",
	},
	cou: {
		code: "cou",
		name: "Wamey",
	},
	cov: {
		code: "cov",
		name: "Cao Miao",
	},
	cow: {
		code: "cow",
		name: "Cowlitz",
	},
	cox: {
		code: "cox",
		name: "Nanti",
	},
	coz: {
		code: "coz",
		name: "Chochotec",
	},
	cpa: {
		code: "cpa",
		name: "Palantla Chinantec",
	},
	cpb: {
		code: "cpb",
		name: "Ucayali-Yurúa Ashéninka",
	},
	cpc: {
		code: "cpc",
		name: "Ajyíninka Apurucayali",
	},
	cpg: {
		code: "cpg",
		name: "Cappadocian Greek",
	},
	cpi: {
		code: "cpi",
		name: "Chinese Pidgin English",
	},
	cpn: {
		code: "cpn",
		name: "Cherepon",
	},
	cpo: {
		code: "cpo",
		name: "Kpeego",
	},
	cps: {
		code: "cps",
		name: "Capiznon",
	},
	cpu: {
		code: "cpu",
		name: "Pichis Ashéninka",
	},
	cpx: {
		code: "cpx",
		name: "Pu-Xian Chinese",
	},
	cpy: {
		code: "cpy",
		name: "South Ucayali Ashéninka",
	},
	cqd: {
		code: "cqd",
		name: "Chuanqiandian Cluster Miao",
	},
	cra: {
		code: "cra",
		name: "Chara",
	},
	crb: {
		code: "crb",
		name: "Island Carib",
	},
	crc: {
		code: "crc",
		name: "Lonwolwol",
	},
	crd: {
		code: "crd",
		name: "Coeur d'Alene",
	},
	cre: {
		code: "cre",
		name: "Cree",
	},
	crf: {
		code: "crf",
		name: "Caramanta",
	},
	crg: {
		code: "crg",
		name: "Michif",
	},
	crh: {
		code: "crh",
		name: "Crimean Tatar",
	},
	cri: {
		code: "cri",
		name: "Sãotomense",
	},
	crj: {
		code: "crj",
		name: "Southern East Cree",
	},
	crk: {
		code: "crk",
		name: "Plains Cree",
	},
	crl: {
		code: "crl",
		name: "Northern East Cree",
	},
	crm: {
		code: "crm",
		name: "Moose Cree",
	},
	crn: {
		code: "crn",
		name: "El Nayar Cora",
	},
	cro: {
		code: "cro",
		name: "Crow",
	},
	crq: {
		code: "crq",
		name: "Iyo'wujwa Chorote",
	},
	crr: {
		code: "crr",
		name: "Carolina Algonquian",
	},
	crs: {
		code: "crs",
		name: "Seselwa Creole French",
	},
	crt: {
		code: "crt",
		name: "Iyojwa'ja Chorote",
	},
	crv: {
		code: "crv",
		name: "Chaura",
	},
	crw: {
		code: "crw",
		name: "Chrau",
	},
	crx: {
		code: "crx",
		name: "Carrier",
	},
	cry: {
		code: "cry",
		name: "Cori",
	},
	crz: {
		code: "crz",
		name: "Cruzeño",
	},
	csa: {
		code: "csa",
		name: "Chiltepec Chinantec",
	},
	csb: {
		code: "csb",
		name: "Kashubian",
	},
	csc: {
		code: "csc",
		name: "Catalan Sign Language",
	},
	csd: {
		code: "csd",
		name: "Chiangmai Sign Language",
	},
	cse: {
		code: "cse",
		name: "Czech Sign Language",
	},
	csf: {
		code: "csf",
		name: "Cuba Sign Language",
	},
	csg: {
		code: "csg",
		name: "Chilean Sign Language",
	},
	csh: {
		code: "csh",
		name: "Asho Chin",
	},
	csi: {
		code: "csi",
		name: "Coast Miwok",
	},
	csj: {
		code: "csj",
		name: "Songlai Chin",
	},
	csk: {
		code: "csk",
		name: "Jola-Kasa",
	},
	csl: {
		code: "csl",
		name: "Chinese Sign Language",
	},
	csm: {
		code: "csm",
		name: "Central Sierra Miwok",
	},
	csn: {
		code: "csn",
		name: "Colombian Sign Language",
	},
	cso: {
		code: "cso",
		name: "Sochiapam Chinantec",
	},
	csp: {
		code: "csp",
		name: "Southern Ping Chinese",
	},
	csq: {
		code: "csq",
		name: "Croatia Sign Language",
	},
	csr: {
		code: "csr",
		name: "Costa Rican Sign Language",
	},
	css: {
		code: "css",
		name: "Southern Ohlone",
	},
	cst: {
		code: "cst",
		name: "Northern Ohlone",
	},
	csv: {
		code: "csv",
		name: "Sumtu Chin",
	},
	csw: {
		code: "csw",
		name: "Swampy Cree",
	},
	csx: {
		code: "csx",
		name: "Cambodian Sign Language",
	},
	csy: {
		code: "csy",
		name: "Siyin Chin",
	},
	csz: {
		code: "csz",
		name: "Coos",
	},
	cta: {
		code: "cta",
		name: "Tataltepec Chatino",
	},
	ctc: {
		code: "ctc",
		name: "Chetco",
	},
	ctd: {
		code: "ctd",
		name: "Tedim Chin",
	},
	cte: {
		code: "cte",
		name: "Tepinapa Chinantec",
	},
	ctg: {
		code: "ctg",
		name: "Chittagonian",
	},
	cth: {
		code: "cth",
		name: "Thaiphum Chin",
	},
	ctl: {
		code: "ctl",
		name: "Tlacoatzintepec Chinantec",
	},
	ctm: {
		code: "ctm",
		name: "Chitimacha",
	},
	ctn: {
		code: "ctn",
		name: "Chhintange",
	},
	cto: {
		code: "cto",
		name: "Emberá-Catío",
	},
	ctp: {
		code: "ctp",
		name: "Western Highland Chatino",
	},
	cts: {
		code: "cts",
		name: "Northern Catanduanes Bikol",
	},
	ctt: {
		code: "ctt",
		name: "Wayanad Chetti",
	},
	ctu: {
		code: "ctu",
		name: "Chol",
	},
	cty: {
		code: "cty",
		name: "Moundadan Chetty",
	},
	ctz: {
		code: "ctz",
		name: "Zacatepec Chatino",
	},
	cua: {
		code: "cua",
		name: "Cua",
	},
	cub: {
		code: "cub",
		name: "Cubeo",
	},
	cuc: {
		code: "cuc",
		name: "Usila Chinantec",
	},
	cuh: {
		code: "cuh",
		name: "Chuka",
	},
	cui: {
		code: "cui",
		name: "Cuiba",
	},
	cuj: {
		code: "cuj",
		name: "Mashco Piro",
	},
	cuk: {
		code: "cuk",
		name: "San Blas Kuna",
	},
	cul: {
		code: "cul",
		name: "Culina",
	},
	cuo: {
		code: "cuo",
		name: "Cumanagoto",
	},
	cup: {
		code: "cup",
		name: "Cupeño",
	},
	cuq: {
		code: "cuq",
		name: "Cun",
	},
	cur: {
		code: "cur",
		name: "Chhulung",
	},
	cut: {
		code: "cut",
		name: "Teutila Cuicatec",
	},
	cuu: {
		code: "cuu",
		name: "Tai Ya",
	},
	cuv: {
		code: "cuv",
		name: "Cuvok",
	},
	cuw: {
		code: "cuw",
		name: "Chukwa",
	},
	cux: {
		code: "cux",
		name: "Tepeuxila Cuicatec",
	},
	cuy: {
		code: "cuy",
		name: "Cuitlatec",
	},
	cvg: {
		code: "cvg",
		name: "Chug",
	},
	cvn: {
		code: "cvn",
		name: "Valle Nacional Chinantec",
	},
	cwa: {
		code: "cwa",
		name: "Kabwa",
	},
	cwb: {
		code: "cwb",
		name: "Maindo",
	},
	cwd: {
		code: "cwd",
		name: "Woods Cree",
	},
	cwe: {
		code: "cwe",
		name: "Kwere",
	},
	cwg: {
		code: "cwg",
		name: "Chewong",
	},
	cwt: {
		code: "cwt",
		name: "Kuwaataay",
	},
	cxh: {
		code: "cxh",
		name: "Cha'ari",
	},
	cya: {
		code: "cya",
		name: "Nopala Chatino",
	},
	cyb: {
		code: "cyb",
		name: "Cayubaba",
	},
	cym: {
		code: "cym",
		name: "Welsh",
	},
	cyo: {
		code: "cyo",
		name: "Cuyonon",
	},
	czh: {
		code: "czh",
		name: "Huizhou Chinese",
	},
	czk: {
		code: "czk",
		name: "Knaanic",
	},
	czn: {
		code: "czn",
		name: "Zenzontepec Chatino",
	},
	czo: {
		code: "czo",
		name: "Min Zhong Chinese",
	},
	czt: {
		code: "czt",
		name: "Zotung Chin",
	},
	daa: {
		code: "daa",
		name: "Dangaléat",
	},
	dac: {
		code: "dac",
		name: "Dambi",
	},
	dad: {
		code: "dad",
		name: "Marik",
	},
	dae: {
		code: "dae",
		name: "Duupa",
	},
	dag: {
		code: "dag",
		name: "Dagbani",
	},
	dah: {
		code: "dah",
		name: "Gwahatike",
	},
	dai: {
		code: "dai",
		name: "Day",
	},
	daj: {
		code: "daj",
		name: "Dar Fur Daju",
	},
	dak: {
		code: "dak",
		name: "Dakota",
	},
	dal: {
		code: "dal",
		name: "Dahalo",
	},
	dam: {
		code: "dam",
		name: "Damakawa",
	},
	dan: {
		code: "dan",
		name: "Danish",
	},
	dao: {
		code: "dao",
		name: "Daai Chin",
	},
	daq: {
		code: "daq",
		name: "Dandami Maria",
	},
	dar: {
		code: "dar",
		name: "Dargwa",
	},
	das: {
		code: "das",
		name: "Daho-Doo",
	},
	dau: {
		code: "dau",
		name: "Dar Sila Daju",
	},
	dav: {
		code: "dav",
		name: "Taita",
	},
	daw: {
		code: "daw",
		name: "Davawenyo",
	},
	dax: {
		code: "dax",
		name: "Dayi",
	},
	daz: {
		code: "daz",
		name: "Dao",
	},
	dba: {
		code: "dba",
		name: "Bangime",
	},
	dbb: {
		code: "dbb",
		name: "Deno",
	},
	dbd: {
		code: "dbd",
		name: "Dadiya",
	},
	dbe: {
		code: "dbe",
		name: "Dabe",
	},
	dbf: {
		code: "dbf",
		name: "Edopi",
	},
	dbg: {
		code: "dbg",
		name: "Dogul Dom Dogon",
	},
	dbi: {
		code: "dbi",
		name: "Doka",
	},
	dbj: {
		code: "dbj",
		name: "Ida'an",
	},
	dbl: {
		code: "dbl",
		name: "Dyirbal",
	},
	dbm: {
		code: "dbm",
		name: "Duguri",
	},
	dbn: {
		code: "dbn",
		name: "Duriankere",
	},
	dbo: {
		code: "dbo",
		name: "Dulbu",
	},
	dbp: {
		code: "dbp",
		name: "Duwai",
	},
	dbq: {
		code: "dbq",
		name: "Daba",
	},
	dbr: {
		code: "dbr",
		name: "Dabarre",
	},
	dbt: {
		code: "dbt",
		name: "Ben Tey Dogon",
	},
	dbu: {
		code: "dbu",
		name: "Bondum Dom Dogon",
	},
	dbv: {
		code: "dbv",
		name: "Dungu",
	},
	dbw: {
		code: "dbw",
		name: "Bankan Tey Dogon",
	},
	dby: {
		code: "dby",
		name: "Dibiyaso",
	},
	dcc: {
		code: "dcc",
		name: "Deccan",
	},
	dcr: {
		code: "dcr",
		name: "Negerhollands",
	},
	dda: {
		code: "dda",
		name: "Dadi Dadi",
	},
	ddd: {
		code: "ddd",
		name: "Dongotono",
	},
	dde: {
		code: "dde",
		name: "Doondo",
	},
	ddg: {
		code: "ddg",
		name: "Fataluku",
	},
	ddi: {
		code: "ddi",
		name: "West Goodenough",
	},
	ddj: {
		code: "ddj",
		name: "Jaru",
	},
	ddn: {
		code: "ddn",
		name: "Dendi (Benin)",
	},
	ddo: {
		code: "ddo",
		name: "Dido",
	},
	ddr: {
		code: "ddr",
		name: "Dhudhuroa",
	},
	dds: {
		code: "dds",
		name: "Donno So Dogon",
	},
	ddw: {
		code: "ddw",
		name: "Dawera-Daweloor",
	},
	dec: {
		code: "dec",
		name: "Dagik",
	},
	ded: {
		code: "ded",
		name: "Dedua",
	},
	dee: {
		code: "dee",
		name: "Dewoin",
	},
	def: {
		code: "def",
		name: "Dezfuli",
	},
	deg: {
		code: "deg",
		name: "Degema",
	},
	deh: {
		code: "deh",
		name: "Dehwari",
	},
	dei: {
		code: "dei",
		name: "Demisa",
	},
	dek: {
		code: "dek",
		name: "Dek",
	},
	del: {
		code: "del",
		name: "Delaware",
	},
	dem: {
		code: "dem",
		name: "Dem",
	},
	den: {
		code: "den",
		name: "Slave (Athapascan)",
	},
	dep: {
		code: "dep",
		name: "Pidgin Delaware",
	},
	deq: {
		code: "deq",
		name: "Dendi (Central African Republic)",
	},
	der: {
		code: "der",
		name: "Deori",
	},
	des: {
		code: "des",
		name: "Desano",
	},
	deu: {
		code: "deu",
		name: "German",
	},
	dev: {
		code: "dev",
		name: "Domung",
	},
	dez: {
		code: "dez",
		name: "Dengese",
	},
	dga: {
		code: "dga",
		name: "Southern Dagaare",
	},
	dgb: {
		code: "dgb",
		name: "Bunoge Dogon",
	},
	dgc: {
		code: "dgc",
		name: "Casiguran Dumagat Agta",
	},
	dgd: {
		code: "dgd",
		name: "Dagaari Dioula",
	},
	dge: {
		code: "dge",
		name: "Degenan",
	},
	dgg: {
		code: "dgg",
		name: "Doga",
	},
	dgh: {
		code: "dgh",
		name: "Dghwede",
	},
	dgi: {
		code: "dgi",
		name: "Northern Dagara",
	},
	dgk: {
		code: "dgk",
		name: "Dagba",
	},
	dgl: {
		code: "dgl",
		name: "Andaandi",
	},
	dgn: {
		code: "dgn",
		name: "Dagoman",
	},
	dgo: {
		code: "dgo",
		name: "Dogri (individual language)",
	},
	dgr: {
		code: "dgr",
		name: "Dogrib",
	},
	dgs: {
		code: "dgs",
		name: "Dogoso",
	},
	dgt: {
		code: "dgt",
		name: "Ndra'ngith",
	},
	dgw: {
		code: "dgw",
		name: "Daungwurrung",
	},
	dgx: {
		code: "dgx",
		name: "Doghoro",
	},
	dgz: {
		code: "dgz",
		name: "Daga",
	},
	dhd: {
		code: "dhd",
		name: "Dhundari",
	},
	dhg: {
		code: "dhg",
		name: "Dhangu-Djangu",
	},
	dhi: {
		code: "dhi",
		name: "Dhimal",
	},
	dhl: {
		code: "dhl",
		name: "Dhalandji",
	},
	dhm: {
		code: "dhm",
		name: "Zemba",
	},
	dhn: {
		code: "dhn",
		name: "Dhanki",
	},
	dho: {
		code: "dho",
		name: "Dhodia",
	},
	dhr: {
		code: "dhr",
		name: "Dhargari",
	},
	dhs: {
		code: "dhs",
		name: "Dhaiso",
	},
	dhu: {
		code: "dhu",
		name: "Dhurga",
	},
	dhv: {
		code: "dhv",
		name: "Dehu",
	},
	dhw: {
		code: "dhw",
		name: "Dhanwar (Nepal)",
	},
	dhx: {
		code: "dhx",
		name: "Dhungaloo",
	},
	dia: {
		code: "dia",
		name: "Dia",
	},
	dib: {
		code: "dib",
		name: "South Central Dinka",
	},
	dic: {
		code: "dic",
		name: "Lakota Dida",
	},
	did: {
		code: "did",
		name: "Didinga",
	},
	dif: {
		code: "dif",
		name: "Dieri",
	},
	dig: {
		code: "dig",
		name: "Digo",
	},
	dih: {
		code: "dih",
		name: "Kumiai",
	},
	dii: {
		code: "dii",
		name: "Dimbong",
	},
	dij: {
		code: "dij",
		name: "Dai",
	},
	dik: {
		code: "dik",
		name: "Southwestern Dinka",
	},
	dil: {
		code: "dil",
		name: "Dilling",
	},
	dim: {
		code: "dim",
		name: "Dime",
	},
	din: {
		code: "din",
		name: "Dinka",
	},
	dio: {
		code: "dio",
		name: "Dibo",
	},
	dip: {
		code: "dip",
		name: "Northeastern Dinka",
	},
	diq: {
		code: "diq",
		name: "Dimli (individual language)",
	},
	dir: {
		code: "dir",
		name: "Dirim",
	},
	dis: {
		code: "dis",
		name: "Dimasa",
	},
	diu: {
		code: "diu",
		name: "Diriku",
	},
	div: {
		code: "div",
		name: "Dhivehi",
	},
	diw: {
		code: "diw",
		name: "Northwestern Dinka",
	},
	dix: {
		code: "dix",
		name: "Dixon Reef",
	},
	diy: {
		code: "diy",
		name: "Diuwe",
	},
	diz: {
		code: "diz",
		name: "Ding",
	},
	dja: {
		code: "dja",
		name: "Djadjawurrung",
	},
	djb: {
		code: "djb",
		name: "Djinba",
	},
	djc: {
		code: "djc",
		name: "Dar Daju Daju",
	},
	djd: {
		code: "djd",
		name: "Djamindjung",
	},
	dje: {
		code: "dje",
		name: "Zarma",
	},
	djf: {
		code: "djf",
		name: "Djangun",
	},
	dji: {
		code: "dji",
		name: "Djinang",
	},
	djj: {
		code: "djj",
		name: "Djeebbana",
	},
	djk: {
		code: "djk",
		name: "Eastern Maroon Creole",
	},
	djm: {
		code: "djm",
		name: "Jamsay Dogon",
	},
	djn: {
		code: "djn",
		name: "Jawoyn",
	},
	djo: {
		code: "djo",
		name: "Jangkang",
	},
	djr: {
		code: "djr",
		name: "Djambarrpuyngu",
	},
	dju: {
		code: "dju",
		name: "Kapriman",
	},
	djw: {
		code: "djw",
		name: "Djawi",
	},
	dka: {
		code: "dka",
		name: "Dakpakha",
	},
	dkg: {
		code: "dkg",
		name: "Kadung",
	},
	dkk: {
		code: "dkk",
		name: "Dakka",
	},
	dkr: {
		code: "dkr",
		name: "Kuijau",
	},
	dks: {
		code: "dks",
		name: "Southeastern Dinka",
	},
	dkx: {
		code: "dkx",
		name: "Mazagway",
	},
	dlg: {
		code: "dlg",
		name: "Dolgan",
	},
	dlk: {
		code: "dlk",
		name: "Dahalik",
	},
	dlm: {
		code: "dlm",
		name: "Dalmatian",
	},
	dln: {
		code: "dln",
		name: "Darlong",
	},
	dma: {
		code: "dma",
		name: "Duma",
	},
	dmb: {
		code: "dmb",
		name: "Mombo Dogon",
	},
	dmc: {
		code: "dmc",
		name: "Gavak",
	},
	dmd: {
		code: "dmd",
		name: "Madhi Madhi",
	},
	dme: {
		code: "dme",
		name: "Dugwor",
	},
	dmf: {
		code: "dmf",
		name: "Medefaidrin",
	},
	dmg: {
		code: "dmg",
		name: "Upper Kinabatangan",
	},
	dmk: {
		code: "dmk",
		name: "Domaaki",
	},
	dml: {
		code: "dml",
		name: "Dameli",
	},
	dmm: {
		code: "dmm",
		name: "Dama",
	},
	dmo: {
		code: "dmo",
		name: "Kemedzung",
	},
	dmr: {
		code: "dmr",
		name: "East Damar",
	},
	dms: {
		code: "dms",
		name: "Dampelas",
	},
	dmu: {
		code: "dmu",
		name: "Dubu",
	},
	dmv: {
		code: "dmv",
		name: "Dumpas",
	},
	dmw: {
		code: "dmw",
		name: "Mudburra",
	},
	dmx: {
		code: "dmx",
		name: "Dema",
	},
	dmy: {
		code: "dmy",
		name: "Demta",
	},
	dna: {
		code: "dna",
		name: "Upper Grand Valley Dani",
	},
	dnd: {
		code: "dnd",
		name: "Daonda",
	},
	dne: {
		code: "dne",
		name: "Ndendeule",
	},
	dng: {
		code: "dng",
		name: "Dungan",
	},
	dni: {
		code: "dni",
		name: "Lower Grand Valley Dani",
	},
	dnj: {
		code: "dnj",
		name: "Dan",
	},
	dnk: {
		code: "dnk",
		name: "Dengka",
	},
	dnn: {
		code: "dnn",
		name: "Dzùùngoo",
	},
	dno: {
		code: "dno",
		name: "Ndrulo",
	},
	dnr: {
		code: "dnr",
		name: "Danaru",
	},
	dnt: {
		code: "dnt",
		name: "Mid Grand Valley Dani",
	},
	dnu: {
		code: "dnu",
		name: "Danau",
	},
	dnv: {
		code: "dnv",
		name: "Danu",
	},
	dnw: {
		code: "dnw",
		name: "Western Dani",
	},
	dny: {
		code: "dny",
		name: "Dení",
	},
	doa: {
		code: "doa",
		name: "Dom",
	},
	dob: {
		code: "dob",
		name: "Dobu",
	},
	doc: {
		code: "doc",
		name: "Northern Dong",
	},
	doe: {
		code: "doe",
		name: "Doe",
	},
	dof: {
		code: "dof",
		name: "Domu",
	},
	doh: {
		code: "doh",
		name: "Dong",
	},
	doi: {
		code: "doi",
		name: "Dogri (macrolanguage)",
	},
	dok: {
		code: "dok",
		name: "Dondo",
	},
	dol: {
		code: "dol",
		name: "Doso",
	},
	don: {
		code: "don",
		name: "Toura (Papua New Guinea)",
	},
	doo: {
		code: "doo",
		name: "Dongo",
	},
	dop: {
		code: "dop",
		name: "Lukpa",
	},
	doq: {
		code: "doq",
		name: "Dominican Sign Language",
	},
	dor: {
		code: "dor",
		name: "Dori'o",
	},
	dos: {
		code: "dos",
		name: "Dogosé",
	},
	dot: {
		code: "dot",
		name: "Dass",
	},
	dov: {
		code: "dov",
		name: "Dombe",
	},
	dow: {
		code: "dow",
		name: "Doyayo",
	},
	dox: {
		code: "dox",
		name: "Bussa",
	},
	doy: {
		code: "doy",
		name: "Dompo",
	},
	doz: {
		code: "doz",
		name: "Dorze",
	},
	dpp: {
		code: "dpp",
		name: "Papar",
	},
	drb: {
		code: "drb",
		name: "Dair",
	},
	drc: {
		code: "drc",
		name: "Minderico",
	},
	drd: {
		code: "drd",
		name: "Darmiya",
	},
	dre: {
		code: "dre",
		name: "Dolpo",
	},
	drg: {
		code: "drg",
		name: "Rungus",
	},
	dri: {
		code: "dri",
		name: "C'Lela",
	},
	drl: {
		code: "drl",
		name: "Paakantyi",
	},
	drn: {
		code: "drn",
		name: "West Damar",
	},
	dro: {
		code: "dro",
		name: "Daro-Matu Melanau",
	},
	drq: {
		code: "drq",
		name: "Dura",
	},
	drs: {
		code: "drs",
		name: "Gedeo",
	},
	drt: {
		code: "drt",
		name: "Drents",
	},
	dru: {
		code: "dru",
		name: "Rukai",
	},
	dry: {
		code: "dry",
		name: "Darai",
	},
	dsb: {
		code: "dsb",
		name: "Lower Sorbian",
	},
	dse: {
		code: "dse",
		name: "Dutch Sign Language",
	},
	dsh: {
		code: "dsh",
		name: "Daasanach",
	},
	dsi: {
		code: "dsi",
		name: "Disa",
	},
	dsk: {
		code: "dsk",
		name: "Dokshi",
	},
	dsl: {
		code: "dsl",
		name: "Danish Sign Language",
	},
	dsn: {
		code: "dsn",
		name: "Dusner",
	},
	dso: {
		code: "dso",
		name: "Desiya",
	},
	dsq: {
		code: "dsq",
		name: "Tadaksahak",
	},
	dsz: {
		code: "dsz",
		name: "Mardin Sign Language",
	},
	dta: {
		code: "dta",
		name: "Daur",
	},
	dtb: {
		code: "dtb",
		name: "Labuk-Kinabatangan Kadazan",
	},
	dtd: {
		code: "dtd",
		name: "Ditidaht",
	},
	dth: {
		code: "dth",
		name: "Adithinngithigh",
	},
	dti: {
		code: "dti",
		name: "Ana Tinga Dogon",
	},
	dtk: {
		code: "dtk",
		name: "Tene Kan Dogon",
	},
	dtm: {
		code: "dtm",
		name: "Tomo Kan Dogon",
	},
	dtn: {
		code: "dtn",
		name: "Daatsʼíin",
	},
	dto: {
		code: "dto",
		name: "Tommo So Dogon",
	},
	dtp: {
		code: "dtp",
		name: "Kadazan Dusun",
	},
	dtr: {
		code: "dtr",
		name: "Lotud",
	},
	dts: {
		code: "dts",
		name: "Toro So Dogon",
	},
	dtt: {
		code: "dtt",
		name: "Toro Tegu Dogon",
	},
	dtu: {
		code: "dtu",
		name: "Tebul Ure Dogon",
	},
	dty: {
		code: "dty",
		name: "Dotyali",
	},
	dua: {
		code: "dua",
		name: "Duala",
	},
	dub: {
		code: "dub",
		name: "Dubli",
	},
	duc: {
		code: "duc",
		name: "Duna",
	},
	due: {
		code: "due",
		name: "Umiray Dumaget Agta",
	},
	duf: {
		code: "duf",
		name: "Dumbea",
	},
	dug: {
		code: "dug",
		name: "Duruma",
	},
	duh: {
		code: "duh",
		name: "Dungra Bhil",
	},
	dui: {
		code: "dui",
		name: "Dumun",
	},
	duk: {
		code: "duk",
		name: "Uyajitaya",
	},
	dul: {
		code: "dul",
		name: "Alabat Island Agta",
	},
	dum: {
		code: "dum",
		name: "Middle Dutch (ca. 1050-1350)",
	},
	dun: {
		code: "dun",
		name: "Dusun Deyah",
	},
	duo: {
		code: "duo",
		name: "Dupaninan Agta",
	},
	dup: {
		code: "dup",
		name: "Duano",
	},
	duq: {
		code: "duq",
		name: "Dusun Malang",
	},
	dur: {
		code: "dur",
		name: "Dii",
	},
	dus: {
		code: "dus",
		name: "Dumi",
	},
	duu: {
		code: "duu",
		name: "Drung",
	},
	duv: {
		code: "duv",
		name: "Duvle",
	},
	duw: {
		code: "duw",
		name: "Dusun Witu",
	},
	dux: {
		code: "dux",
		name: "Duungooma",
	},
	duy: {
		code: "duy",
		name: "Dicamay Agta",
	},
	duz: {
		code: "duz",
		name: "Duli-Gey",
	},
	dva: {
		code: "dva",
		name: "Duau",
	},
	dwa: {
		code: "dwa",
		name: "Diri",
	},
	dwk: {
		code: "dwk",
		name: "Dawik Kui",
	},
	dwr: {
		code: "dwr",
		name: "Dawro",
	},
	dws: {
		code: "dws",
		name: "Dutton World Speedwords",
	},
	dwu: {
		code: "dwu",
		name: "Dhuwal",
	},
	dww: {
		code: "dww",
		name: "Dawawa",
	},
	dwy: {
		code: "dwy",
		name: "Dhuwaya",
	},
	dwz: {
		code: "dwz",
		name: "Dewas Rai",
	},
	dya: {
		code: "dya",
		name: "Dyan",
	},
	dyb: {
		code: "dyb",
		name: "Dyaberdyaber",
	},
	dyd: {
		code: "dyd",
		name: "Dyugun",
	},
	dyg: {
		code: "dyg",
		name: "Villa Viciosa Agta",
	},
	dyi: {
		code: "dyi",
		name: "Djimini Senoufo",
	},
	dym: {
		code: "dym",
		name: "Yanda Dom Dogon",
	},
	dyn: {
		code: "dyn",
		name: "Dyangadi",
	},
	dyo: {
		code: "dyo",
		name: "Jola-Fonyi",
	},
	dyr: {
		code: "dyr",
		name: "Dyarim",
	},
	dyu: {
		code: "dyu",
		name: "Dyula",
	},
	dyy: {
		code: "dyy",
		name: "Djabugay",
	},
	dza: {
		code: "dza",
		name: "Tunzu",
	},
	dzd: {
		code: "dzd",
		name: "Daza",
	},
	dze: {
		code: "dze",
		name: "Djiwarli",
	},
	dzg: {
		code: "dzg",
		name: "Dazaga",
	},
	dzl: {
		code: "dzl",
		name: "Dzalakha",
	},
	dzn: {
		code: "dzn",
		name: "Dzando",
	},
	dzo: {
		code: "dzo",
		name: "Dzongkha",
	},
	eaa: {
		code: "eaa",
		name: "Karenggapa",
	},
	ebc: {
		code: "ebc",
		name: "Beginci",
	},
	ebg: {
		code: "ebg",
		name: "Ebughu",
	},
	ebk: {
		code: "ebk",
		name: "Eastern Bontok",
	},
	ebo: {
		code: "ebo",
		name: "Teke-Ebo",
	},
	ebr: {
		code: "ebr",
		name: "Ebrié",
	},
	ebu: {
		code: "ebu",
		name: "Embu",
	},
	ecr: {
		code: "ecr",
		name: "Eteocretan",
	},
	ecs: {
		code: "ecs",
		name: "Ecuadorian Sign Language",
	},
	ecy: {
		code: "ecy",
		name: "Eteocypriot",
	},
	eee: {
		code: "eee",
		name: "E",
	},
	efa: {
		code: "efa",
		name: "Efai",
	},
	efe: {
		code: "efe",
		name: "Efe",
	},
	efi: {
		code: "efi",
		name: "Efik",
	},
	ega: {
		code: "ega",
		name: "Ega",
	},
	egl: {
		code: "egl",
		name: "Emilian",
	},
	egm: {
		code: "egm",
		name: "Benamanga",
	},
	ego: {
		code: "ego",
		name: "Eggon",
	},
	egy: {
		code: "egy",
		name: "Egyptian (Ancient)",
	},
	ehs: {
		code: "ehs",
		name: "Miyakubo Sign Language",
	},
	ehu: {
		code: "ehu",
		name: "Ehueun",
	},
	eip: {
		code: "eip",
		name: "Eipomek",
	},
	eit: {
		code: "eit",
		name: "Eitiep",
	},
	eiv: {
		code: "eiv",
		name: "Askopan",
	},
	eja: {
		code: "eja",
		name: "Ejamat",
	},
	eka: {
		code: "eka",
		name: "Ekajuk",
	},
	eke: {
		code: "eke",
		name: "Ekit",
	},
	ekg: {
		code: "ekg",
		name: "Ekari",
	},
	eki: {
		code: "eki",
		name: "Eki",
	},
	ekk: {
		code: "ekk",
		name: "Standard Estonian",
	},
	ekl: {
		code: "ekl",
		name: "Kol (Bangladesh)",
	},
	ekm: {
		code: "ekm",
		name: "Elip",
	},
	eko: {
		code: "eko",
		name: "Koti",
	},
	ekp: {
		code: "ekp",
		name: "Ekpeye",
	},
	ekr: {
		code: "ekr",
		name: "Yace",
	},
	eky: {
		code: "eky",
		name: "Eastern Kayah",
	},
	ele: {
		code: "ele",
		name: "Elepi",
	},
	elh: {
		code: "elh",
		name: "El Hugeirat",
	},
	eli: {
		code: "eli",
		name: "Nding",
	},
	elk: {
		code: "elk",
		name: "Elkei",
	},
	ell: {
		code: "ell",
		name: "Modern Greek (1453-)",
	},
	elm: {
		code: "elm",
		name: "Eleme",
	},
	elo: {
		code: "elo",
		name: "El Molo",
	},
	elu: {
		code: "elu",
		name: "Elu",
	},
	elx: {
		code: "elx",
		name: "Elamite",
	},
	ema: {
		code: "ema",
		name: "Emai-Iuleha-Ora",
	},
	emb: {
		code: "emb",
		name: "Embaloh",
	},
	eme: {
		code: "eme",
		name: "Emerillon",
	},
	emg: {
		code: "emg",
		name: "Eastern Meohang",
	},
	emi: {
		code: "emi",
		name: "Mussau-Emira",
	},
	emk: {
		code: "emk",
		name: "Eastern Maninkakan",
	},
	emm: {
		code: "emm",
		name: "Mamulique",
	},
	emn: {
		code: "emn",
		name: "Eman",
	},
	emp: {
		code: "emp",
		name: "Northern Emberá",
	},
	emq: {
		code: "emq",
		name: "Eastern Minyag",
	},
	ems: {
		code: "ems",
		name: "Pacific Gulf Yupik",
	},
	emu: {
		code: "emu",
		name: "Eastern Muria",
	},
	emw: {
		code: "emw",
		name: "Emplawas",
	},
	emx: {
		code: "emx",
		name: "Erromintxela",
	},
	emy: {
		code: "emy",
		name: "Epigraphic Mayan",
	},
	emz: {
		code: "emz",
		name: "Mbessa",
	},
	ena: {
		code: "ena",
		name: "Apali",
	},
	enb: {
		code: "enb",
		name: "Markweeta",
	},
	enc: {
		code: "enc",
		name: "En",
	},
	end: {
		code: "end",
		name: "Ende",
	},
	enf: {
		code: "enf",
		name: "Forest Enets",
	},
	eng: {
		code: "eng",
		name: "English",
	},
	enh: {
		code: "enh",
		name: "Tundra Enets",
	},
	enl: {
		code: "enl",
		name: "Enlhet",
	},
	enm: {
		code: "enm",
		name: "Middle English (1100-1500)",
	},
	enn: {
		code: "enn",
		name: "Engenni",
	},
	eno: {
		code: "eno",
		name: "Enggano",
	},
	enq: {
		code: "enq",
		name: "Enga",
	},
	enr: {
		code: "enr",
		name: "Emumu",
	},
	enu: {
		code: "enu",
		name: "Enu",
	},
	env: {
		code: "env",
		name: "Enwan (Edo State)",
	},
	enw: {
		code: "enw",
		name: "Enwan (Akwa Ibom State)",
	},
	enx: {
		code: "enx",
		name: "Enxet",
	},
	eot: {
		code: "eot",
		name: "Beti (Côte d'Ivoire)",
	},
	epi: {
		code: "epi",
		name: "Epie",
	},
	epo: {
		code: "epo",
		name: "Esperanto",
	},
	era: {
		code: "era",
		name: "Eravallan",
	},
	erg: {
		code: "erg",
		name: "Sie",
	},
	erh: {
		code: "erh",
		name: "Eruwa",
	},
	eri: {
		code: "eri",
		name: "Ogea",
	},
	erk: {
		code: "erk",
		name: "South Efate",
	},
	ero: {
		code: "ero",
		name: "Horpa",
	},
	err: {
		code: "err",
		name: "Erre",
	},
	ers: {
		code: "ers",
		name: "Ersu",
	},
	ert: {
		code: "ert",
		name: "Eritai",
	},
	erw: {
		code: "erw",
		name: "Erokwanas",
	},
	ese: {
		code: "ese",
		name: "Ese Ejja",
	},
	esg: {
		code: "esg",
		name: "Aheri Gondi",
	},
	esh: {
		code: "esh",
		name: "Eshtehardi",
	},
	esi: {
		code: "esi",
		name: "North Alaskan Inupiatun",
	},
	esk: {
		code: "esk",
		name: "Northwest Alaska Inupiatun",
	},
	esl: {
		code: "esl",
		name: "Egypt Sign Language",
	},
	esm: {
		code: "esm",
		name: "Esuma",
	},
	esn: {
		code: "esn",
		name: "Salvadoran Sign Language",
	},
	eso: {
		code: "eso",
		name: "Estonian Sign Language",
	},
	esq: {
		code: "esq",
		name: "Esselen",
	},
	ess: {
		code: "ess",
		name: "Central Siberian Yupik",
	},
	est: {
		code: "est",
		name: "Estonian",
	},
	esu: {
		code: "esu",
		name: "Central Yupik",
	},
	esy: {
		code: "esy",
		name: "Eskayan",
	},
	etb: {
		code: "etb",
		name: "Etebi",
	},
	etc: {
		code: "etc",
		name: "Etchemin",
	},
	eth: {
		code: "eth",
		name: "Ethiopian Sign Language",
	},
	etn: {
		code: "etn",
		name: "Eton (Vanuatu)",
	},
	eto: {
		code: "eto",
		name: "Eton (Cameroon)",
	},
	etr: {
		code: "etr",
		name: "Edolo",
	},
	ets: {
		code: "ets",
		name: "Yekhee",
	},
	ett: {
		code: "ett",
		name: "Etruscan",
	},
	etu: {
		code: "etu",
		name: "Ejagham",
	},
	etx: {
		code: "etx",
		name: "Eten",
	},
	etz: {
		code: "etz",
		name: "Semimi",
	},
	eud: {
		code: "eud",
		name: "Eudeve",
	},
	eus: {
		code: "eus",
		name: "Basque",
	},
	eve: {
		code: "eve",
		name: "Even",
	},
	evh: {
		code: "evh",
		name: "Uvbie",
	},
	evn: {
		code: "evn",
		name: "Evenki",
	},
	ewe: {
		code: "ewe",
		name: "Ewe",
	},
	ewo: {
		code: "ewo",
		name: "Ewondo",
	},
	ext: {
		code: "ext",
		name: "Extremaduran",
	},
	eya: {
		code: "eya",
		name: "Eyak",
	},
	eyo: {
		code: "eyo",
		name: "Keiyo",
	},
	eza: {
		code: "eza",
		name: "Ezaa",
	},
	eze: {
		code: "eze",
		name: "Uzekwe",
	},
	faa: {
		code: "faa",
		name: "Fasu",
	},
	fab: {
		code: "fab",
		name: "Fa d'Ambu",
	},
	fad: {
		code: "fad",
		name: "Wagi",
	},
	faf: {
		code: "faf",
		name: "Fagani",
	},
	fag: {
		code: "fag",
		name: "Finongan",
	},
	fah: {
		code: "fah",
		name: "Baissa Fali",
	},
	fai: {
		code: "fai",
		name: "Faiwol",
	},
	faj: {
		code: "faj",
		name: "Faita",
	},
	fak: {
		code: "fak",
		name: "Fang (Cameroon)",
	},
	fal: {
		code: "fal",
		name: "South Fali",
	},
	fam: {
		code: "fam",
		name: "Fam",
	},
	fan: {
		code: "fan",
		name: "Fang (Equatorial Guinea)",
	},
	fao: {
		code: "fao",
		name: "Faroese",
	},
	fap: {
		code: "fap",
		name: "Paloor",
	},
	far: {
		code: "far",
		name: "Fataleka",
	},
	fas: {
		code: "fas",
		name: "Persian",
	},
	fat: {
		code: "fat",
		name: "Fanti",
	},
	fau: {
		code: "fau",
		name: "Fayu",
	},
	fax: {
		code: "fax",
		name: "Fala",
	},
	fay: {
		code: "fay",
		name: "Southwestern Fars",
	},
	faz: {
		code: "faz",
		name: "Northwestern Fars",
	},
	fbl: {
		code: "fbl",
		name: "West Albay Bikol",
	},
	fcs: {
		code: "fcs",
		name: "Quebec Sign Language",
	},
	fer: {
		code: "fer",
		name: "Feroge",
	},
	ffi: {
		code: "ffi",
		name: "Foia Foia",
	},
	ffm: {
		code: "ffm",
		name: "Maasina Fulfulde",
	},
	fgr: {
		code: "fgr",
		name: "Fongoro",
	},
	fia: {
		code: "fia",
		name: "Nobiin",
	},
	fie: {
		code: "fie",
		name: "Fyer",
	},
	fif: {
		code: "fif",
		name: "Faifi",
	},
	fij: {
		code: "fij",
		name: "Fijian",
	},
	fil: {
		code: "fil",
		name: "Filipino",
	},
	fin: {
		code: "fin",
		name: "Finnish",
	},
	fip: {
		code: "fip",
		name: "Fipa",
	},
	fir: {
		code: "fir",
		name: "Firan",
	},
	fit: {
		code: "fit",
		name: "Tornedalen Finnish",
	},
	fiw: {
		code: "fiw",
		name: "Fiwaga",
	},
	fkk: {
		code: "fkk",
		name: "Kirya-Konzəl",
	},
	fkv: {
		code: "fkv",
		name: "Kven Finnish",
	},
	fla: {
		code: "fla",
		name: "Kalispel-Pend d'Oreille",
	},
	flh: {
		code: "flh",
		name: "Foau",
	},
	fli: {
		code: "fli",
		name: "Fali",
	},
	fll: {
		code: "fll",
		name: "North Fali",
	},
	fln: {
		code: "fln",
		name: "Flinders Island",
	},
	flr: {
		code: "flr",
		name: "Fuliiru",
	},
	fly: {
		code: "fly",
		name: "Flaaitaal",
	},
	fmp: {
		code: "fmp",
		name: "Fe'fe'",
	},
	fmu: {
		code: "fmu",
		name: "Far Western Muria",
	},
	fnb: {
		code: "fnb",
		name: "Fanbak",
	},
	fng: {
		code: "fng",
		name: "Fanagalo",
	},
	fni: {
		code: "fni",
		name: "Fania",
	},
	fod: {
		code: "fod",
		name: "Foodo",
	},
	foi: {
		code: "foi",
		name: "Foi",
	},
	fom: {
		code: "fom",
		name: "Foma",
	},
	fon: {
		code: "fon",
		name: "Fon",
	},
	for: {
		code: "for",
		name: "Fore",
	},
	fos: {
		code: "fos",
		name: "Siraya",
	},
	fpe: {
		code: "fpe",
		name: "Fernando Po Creole English",
	},
	fqs: {
		code: "fqs",
		name: "Fas",
	},
	fra: {
		code: "fra",
		name: "French",
	},
	frc: {
		code: "frc",
		name: "Cajun French",
	},
	frd: {
		code: "frd",
		name: "Fordata",
	},
	frk: {
		code: "frk",
		name: "Frankish",
	},
	frm: {
		code: "frm",
		name: "Middle French (ca. 1400-1600)",
	},
	fro: {
		code: "fro",
		name: "Old French (842-ca. 1400)",
	},
	frp: {
		code: "frp",
		name: "Arpitan",
	},
	frq: {
		code: "frq",
		name: "Forak",
	},
	frr: {
		code: "frr",
		name: "Northern Frisian",
	},
	frs: {
		code: "frs",
		name: "Eastern Frisian",
	},
	frt: {
		code: "frt",
		name: "Fortsenal",
	},
	fry: {
		code: "fry",
		name: "Western Frisian",
	},
	fse: {
		code: "fse",
		name: "Finnish Sign Language",
	},
	fsl: {
		code: "fsl",
		name: "French Sign Language",
	},
	fss: {
		code: "fss",
		name: "Finland-Swedish Sign Language",
	},
	fub: {
		code: "fub",
		name: "Adamawa Fulfulde",
	},
	fuc: {
		code: "fuc",
		name: "Pulaar",
	},
	fud: {
		code: "fud",
		name: "East Futuna",
	},
	fue: {
		code: "fue",
		name: "Borgu Fulfulde",
	},
	fuf: {
		code: "fuf",
		name: "Pular",
	},
	fuh: {
		code: "fuh",
		name: "Western Niger Fulfulde",
	},
	fui: {
		code: "fui",
		name: "Bagirmi Fulfulde",
	},
	fuj: {
		code: "fuj",
		name: "Ko",
	},
	ful: {
		code: "ful",
		name: "Fulah",
	},
	fum: {
		code: "fum",
		name: "Fum",
	},
	fun: {
		code: "fun",
		name: "Fulniô",
	},
	fuq: {
		code: "fuq",
		name: "Central-Eastern Niger Fulfulde",
	},
	fur: {
		code: "fur",
		name: "Friulian",
	},
	fut: {
		code: "fut",
		name: "Futuna-Aniwa",
	},
	fuu: {
		code: "fuu",
		name: "Furu",
	},
	fuv: {
		code: "fuv",
		name: "Nigerian Fulfulde",
	},
	fuy: {
		code: "fuy",
		name: "Fuyug",
	},
	fvr: {
		code: "fvr",
		name: "Fur",
	},
	fwa: {
		code: "fwa",
		name: "Fwâi",
	},
	fwe: {
		code: "fwe",
		name: "Fwe",
	},
	gaa: {
		code: "gaa",
		name: "Ga",
	},
	gab: {
		code: "gab",
		name: "Gabri",
	},
	gac: {
		code: "gac",
		name: "Mixed Great Andamanese",
	},
	gad: {
		code: "gad",
		name: "Gaddang",
	},
	gae: {
		code: "gae",
		name: "Guarequena",
	},
	gaf: {
		code: "gaf",
		name: "Gende",
	},
	gag: {
		code: "gag",
		name: "Gagauz",
	},
	gah: {
		code: "gah",
		name: "Alekano",
	},
	gai: {
		code: "gai",
		name: "Borei",
	},
	gaj: {
		code: "gaj",
		name: "Gadsup",
	},
	gak: {
		code: "gak",
		name: "Gamkonora",
	},
	gal: {
		code: "gal",
		name: "Galolen",
	},
	gam: {
		code: "gam",
		name: "Kandawo",
	},
	gan: {
		code: "gan",
		name: "Gan Chinese",
	},
	gao: {
		code: "gao",
		name: "Gants",
	},
	gap: {
		code: "gap",
		name: "Gal",
	},
	gaq: {
		code: "gaq",
		name: "Gata'",
	},
	gar: {
		code: "gar",
		name: "Galeya",
	},
	gas: {
		code: "gas",
		name: "Adiwasi Garasia",
	},
	gat: {
		code: "gat",
		name: "Kenati",
	},
	gau: {
		code: "gau",
		name: "Mudhili Gadaba",
	},
	gaw: {
		code: "gaw",
		name: "Nobonob",
	},
	gax: {
		code: "gax",
		name: "Borana-Arsi-Guji Oromo",
	},
	gay: {
		code: "gay",
		name: "Gayo",
	},
	gaz: {
		code: "gaz",
		name: "West Central Oromo",
	},
	gba: {
		code: "gba",
		name: "Gbaya (Central African Republic)",
	},
	gbb: {
		code: "gbb",
		name: "Kaytetye",
	},
	gbd: {
		code: "gbd",
		name: "Karajarri",
	},
	gbe: {
		code: "gbe",
		name: "Niksek",
	},
	gbf: {
		code: "gbf",
		name: "Gaikundi",
	},
	gbg: {
		code: "gbg",
		name: "Gbanziri",
	},
	gbh: {
		code: "gbh",
		name: "Defi Gbe",
	},
	gbi: {
		code: "gbi",
		name: "Galela",
	},
	gbj: {
		code: "gbj",
		name: "Bodo Gadaba",
	},
	gbk: {
		code: "gbk",
		name: "Gaddi",
	},
	gbl: {
		code: "gbl",
		name: "Gamit",
	},
	gbm: {
		code: "gbm",
		name: "Garhwali",
	},
	gbn: {
		code: "gbn",
		name: "Mo'da",
	},
	gbo: {
		code: "gbo",
		name: "Northern Grebo",
	},
	gbp: {
		code: "gbp",
		name: "Gbaya-Bossangoa",
	},
	gbq: {
		code: "gbq",
		name: "Gbaya-Bozoum",
	},
	gbr: {
		code: "gbr",
		name: "Gbagyi",
	},
	gbs: {
		code: "gbs",
		name: "Gbesi Gbe",
	},
	gbu: {
		code: "gbu",
		name: "Gagadu",
	},
	gbv: {
		code: "gbv",
		name: "Gbanu",
	},
	gbw: {
		code: "gbw",
		name: "Gabi-Gabi",
	},
	gbx: {
		code: "gbx",
		name: "Eastern Xwla Gbe",
	},
	gby: {
		code: "gby",
		name: "Gbari",
	},
	gbz: {
		code: "gbz",
		name: "Zoroastrian Dari",
	},
	gcc: {
		code: "gcc",
		name: "Mali",
	},
	gcd: {
		code: "gcd",
		name: "Ganggalida",
	},
	gce: {
		code: "gce",
		name: "Galice",
	},
	gcf: {
		code: "gcf",
		name: "Guadeloupean Creole French",
	},
	gcl: {
		code: "gcl",
		name: "Grenadian Creole English",
	},
	gcn: {
		code: "gcn",
		name: "Gaina",
	},
	gcr: {
		code: "gcr",
		name: "Guianese Creole French",
	},
	gct: {
		code: "gct",
		name: "Colonia Tovar German",
	},
	gda: {
		code: "gda",
		name: "Gade Lohar",
	},
	gdb: {
		code: "gdb",
		name: "Pottangi Ollar Gadaba",
	},
	gdc: {
		code: "gdc",
		name: "Gugu Badhun",
	},
	gdd: {
		code: "gdd",
		name: "Gedaged",
	},
	gde: {
		code: "gde",
		name: "Gude",
	},
	gdf: {
		code: "gdf",
		name: "Guduf-Gava",
	},
	gdg: {
		code: "gdg",
		name: "Ga'dang",
	},
	gdh: {
		code: "gdh",
		name: "Gadjerawang",
	},
	gdi: {
		code: "gdi",
		name: "Gundi",
	},
	gdj: {
		code: "gdj",
		name: "Gurdjar",
	},
	gdk: {
		code: "gdk",
		name: "Gadang",
	},
	gdl: {
		code: "gdl",
		name: "Dirasha",
	},
	gdm: {
		code: "gdm",
		name: "Laal",
	},
	gdn: {
		code: "gdn",
		name: "Umanakaina",
	},
	gdo: {
		code: "gdo",
		name: "Ghodoberi",
	},
	gdq: {
		code: "gdq",
		name: "Mehri",
	},
	gdr: {
		code: "gdr",
		name: "Wipi",
	},
	gds: {
		code: "gds",
		name: "Ghandruk Sign Language",
	},
	gdt: {
		code: "gdt",
		name: "Kungardutyi",
	},
	gdu: {
		code: "gdu",
		name: "Gudu",
	},
	gdx: {
		code: "gdx",
		name: "Godwari",
	},
	gea: {
		code: "gea",
		name: "Geruma",
	},
	geb: {
		code: "geb",
		name: "Kire",
	},
	gec: {
		code: "gec",
		name: "Gboloo Grebo",
	},
	ged: {
		code: "ged",
		name: "Gade",
	},
	gef: {
		code: "gef",
		name: "Gerai",
	},
	geg: {
		code: "geg",
		name: "Gengle",
	},
	geh: {
		code: "geh",
		name: "Hutterite German",
	},
	gei: {
		code: "gei",
		name: "Gebe",
	},
	gej: {
		code: "gej",
		name: "Gen",
	},
	gek: {
		code: "gek",
		name: "Ywom",
	},
	gel: {
		code: "gel",
		name: "ut-Ma'in",
	},
	geq: {
		code: "geq",
		name: "Geme",
	},
	ges: {
		code: "ges",
		name: "Geser-Gorom",
	},
	gev: {
		code: "gev",
		name: "Eviya",
	},
	gew: {
		code: "gew",
		name: "Gera",
	},
	gex: {
		code: "gex",
		name: "Garre",
	},
	gey: {
		code: "gey",
		name: "Enya",
	},
	gez: {
		code: "gez",
		name: "Geez",
	},
	gfk: {
		code: "gfk",
		name: "Patpatar",
	},
	gft: {
		code: "gft",
		name: "Gafat",
	},
	gga: {
		code: "gga",
		name: "Gao",
	},
	ggb: {
		code: "ggb",
		name: "Gbii",
	},
	ggd: {
		code: "ggd",
		name: "Gugadj",
	},
	gge: {
		code: "gge",
		name: "Gurr-goni",
	},
	ggg: {
		code: "ggg",
		name: "Gurgula",
	},
	ggk: {
		code: "ggk",
		name: "Kungarakany",
	},
	ggl: {
		code: "ggl",
		name: "Ganglau",
	},
	ggt: {
		code: "ggt",
		name: "Gitua",
	},
	ggu: {
		code: "ggu",
		name: "Gagu",
	},
	ggw: {
		code: "ggw",
		name: "Gogodala",
	},
	gha: {
		code: "gha",
		name: "Ghadamès",
	},
	ghc: {
		code: "ghc",
		name: "Hiberno-Scottish Gaelic",
	},
	ghe: {
		code: "ghe",
		name: "Southern Ghale",
	},
	ghh: {
		code: "ghh",
		name: "Northern Ghale",
	},
	ghk: {
		code: "ghk",
		name: "Geko Karen",
	},
	ghl: {
		code: "ghl",
		name: "Ghulfan",
	},
	ghn: {
		code: "ghn",
		name: "Ghanongga",
	},
	gho: {
		code: "gho",
		name: "Ghomara",
	},
	ghr: {
		code: "ghr",
		name: "Ghera",
	},
	ghs: {
		code: "ghs",
		name: "Guhu-Samane",
	},
	ght: {
		code: "ght",
		name: "Kuke",
	},
	gia: {
		code: "gia",
		name: "Kija",
	},
	gib: {
		code: "gib",
		name: "Gibanawa",
	},
	gic: {
		code: "gic",
		name: "Gail",
	},
	gid: {
		code: "gid",
		name: "Gidar",
	},
	gie: {
		code: "gie",
		name: "Gaɓogbo",
	},
	gig: {
		code: "gig",
		name: "Goaria",
	},
	gih: {
		code: "gih",
		name: "Githabul",
	},
	gii: {
		code: "gii",
		name: "Girirra",
	},
	gil: {
		code: "gil",
		name: "Gilbertese",
	},
	gim: {
		code: "gim",
		name: "Gimi (Eastern Highlands)",
	},
	gin: {
		code: "gin",
		name: "Hinukh",
	},
	gip: {
		code: "gip",
		name: "Gimi (West New Britain)",
	},
	giq: {
		code: "giq",
		name: "Green Gelao",
	},
	gir: {
		code: "gir",
		name: "Red Gelao",
	},
	gis: {
		code: "gis",
		name: "North Giziga",
	},
	git: {
		code: "git",
		name: "Gitxsan",
	},
	giu: {
		code: "giu",
		name: "Mulao",
	},
	giw: {
		code: "giw",
		name: "White Gelao",
	},
	gix: {
		code: "gix",
		name: "Gilima",
	},
	giy: {
		code: "giy",
		name: "Giyug",
	},
	giz: {
		code: "giz",
		name: "South Giziga",
	},
	gjk: {
		code: "gjk",
		name: "Kachi Koli",
	},
	gjm: {
		code: "gjm",
		name: "Gunditjmara",
	},
	gjn: {
		code: "gjn",
		name: "Gonja",
	},
	gjr: {
		code: "gjr",
		name: "Gurindji Kriol",
	},
	gju: {
		code: "gju",
		name: "Gujari",
	},
	gka: {
		code: "gka",
		name: "Guya",
	},
	gkd: {
		code: "gkd",
		name: "Magɨ (Madang Province)",
	},
	gke: {
		code: "gke",
		name: "Ndai",
	},
	gkn: {
		code: "gkn",
		name: "Gokana",
	},
	gko: {
		code: "gko",
		name: "Kok-Nar",
	},
	gkp: {
		code: "gkp",
		name: "Guinea Kpelle",
	},
	gku: {
		code: "gku",
		name: "ǂUngkue",
	},
	gla: {
		code: "gla",
		name: "Scottish Gaelic",
	},
	glb: {
		code: "glb",
		name: "Belning",
	},
	glc: {
		code: "glc",
		name: "Bon Gula",
	},
	gld: {
		code: "gld",
		name: "Nanai",
	},
	gle: {
		code: "gle",
		name: "Irish",
	},
	glg: {
		code: "glg",
		name: "Galician",
	},
	glh: {
		code: "glh",
		name: "Northwest Pashai",
	},
	glj: {
		code: "glj",
		name: "Gula Iro",
	},
	glk: {
		code: "glk",
		name: "Gilaki",
	},
	gll: {
		code: "gll",
		name: "Garlali",
	},
	glo: {
		code: "glo",
		name: "Galambu",
	},
	glr: {
		code: "glr",
		name: "Glaro-Twabo",
	},
	glu: {
		code: "glu",
		name: "Gula (Chad)",
	},
	glv: {
		code: "glv",
		name: "Manx",
	},
	glw: {
		code: "glw",
		name: "Glavda",
	},
	gly: {
		code: "gly",
		name: "Gule",
	},
	gma: {
		code: "gma",
		name: "Gambera",
	},
	gmb: {
		code: "gmb",
		name: "Gula'alaa",
	},
	gmd: {
		code: "gmd",
		name: "Mághdì",
	},
	gmg: {
		code: "gmg",
		name: "Magɨyi",
	},
	gmh: {
		code: "gmh",
		name: "Middle High German (ca. 1050-1500)",
	},
	gml: {
		code: "gml",
		name: "Middle Low German",
	},
	gmm: {
		code: "gmm",
		name: "Gbaya-Mbodomo",
	},
	gmn: {
		code: "gmn",
		name: "Gimnime",
	},
	gmr: {
		code: "gmr",
		name: "Mirning",
	},
	gmu: {
		code: "gmu",
		name: "Gumalu",
	},
	gmv: {
		code: "gmv",
		name: "Gamo",
	},
	gmx: {
		code: "gmx",
		name: "Magoma",
	},
	gmy: {
		code: "gmy",
		name: "Mycenaean Greek",
	},
	gmz: {
		code: "gmz",
		name: "Mgbolizhia",
	},
	gna: {
		code: "gna",
		name: "Kaansa",
	},
	gnb: {
		code: "gnb",
		name: "Gangte",
	},
	gnc: {
		code: "gnc",
		name: "Guanche",
	},
	gnd: {
		code: "gnd",
		name: "Zulgo-Gemzek",
	},
	gne: {
		code: "gne",
		name: "Ganang",
	},
	gng: {
		code: "gng",
		name: "Ngangam",
	},
	gnh: {
		code: "gnh",
		name: "Lere",
	},
	gni: {
		code: "gni",
		name: "Gooniyandi",
	},
	gnj: {
		code: "gnj",
		name: "Ngen",
	},
	gnk: {
		code: "gnk",
		name: "ǁGana",
	},
	gnl: {
		code: "gnl",
		name: "Gangulu",
	},
	gnm: {
		code: "gnm",
		name: "Ginuman",
	},
	gnn: {
		code: "gnn",
		name: "Gumatj",
	},
	gno: {
		code: "gno",
		name: "Northern Gondi",
	},
	gnq: {
		code: "gnq",
		name: "Gana",
	},
	gnr: {
		code: "gnr",
		name: "Gureng Gureng",
	},
	gnt: {
		code: "gnt",
		name: "Guntai",
	},
	gnu: {
		code: "gnu",
		name: "Gnau",
	},
	gnw: {
		code: "gnw",
		name: "Western Bolivian Guaraní",
	},
	gnz: {
		code: "gnz",
		name: "Ganzi",
	},
	goa: {
		code: "goa",
		name: "Guro",
	},
	gob: {
		code: "gob",
		name: "Playero",
	},
	goc: {
		code: "goc",
		name: "Gorakor",
	},
	god: {
		code: "god",
		name: "Godié",
	},
	goe: {
		code: "goe",
		name: "Gongduk",
	},
	gof: {
		code: "gof",
		name: "Gofa",
	},
	gog: {
		code: "gog",
		name: "Gogo",
	},
	goh: {
		code: "goh",
		name: "Old High German (ca. 750-1050)",
	},
	goi: {
		code: "goi",
		name: "Gobasi",
	},
	goj: {
		code: "goj",
		name: "Gowlan",
	},
	gok: {
		code: "gok",
		name: "Gowli",
	},
	gol: {
		code: "gol",
		name: "Gola",
	},
	gom: {
		code: "gom",
		name: "Goan Konkani",
	},
	gon: {
		code: "gon",
		name: "Gondi",
	},
	goo: {
		code: "goo",
		name: "Gone Dau",
	},
	gop: {
		code: "gop",
		name: "Yeretuar",
	},
	goq: {
		code: "goq",
		name: "Gorap",
	},
	gor: {
		code: "gor",
		name: "Gorontalo",
	},
	gos: {
		code: "gos",
		name: "Gronings",
	},
	got: {
		code: "got",
		name: "Gothic",
	},
	gou: {
		code: "gou",
		name: "Gavar",
	},
	gov: {
		code: "gov",
		name: "Goo",
	},
	gow: {
		code: "gow",
		name: "Gorowa",
	},
	gox: {
		code: "gox",
		name: "Gobu",
	},
	goy: {
		code: "goy",
		name: "Goundo",
	},
	goz: {
		code: "goz",
		name: "Gozarkhani",
	},
	gpa: {
		code: "gpa",
		name: "Gupa-Abawa",
	},
	gpe: {
		code: "gpe",
		name: "Ghanaian Pidgin English",
	},
	gpn: {
		code: "gpn",
		name: "Taiap",
	},
	gqa: {
		code: "gqa",
		name: "Ga'anda",
	},
	gqi: {
		code: "gqi",
		name: "Guiqiong",
	},
	gqn: {
		code: "gqn",
		name: "Guana (Brazil)",
	},
	gqr: {
		code: "gqr",
		name: "Gor",
	},
	gqu: {
		code: "gqu",
		name: "Qau",
	},
	gra: {
		code: "gra",
		name: "Rajput Garasia",
	},
	grb: {
		code: "grb",
		name: "Grebo",
	},
	grc: {
		code: "grc",
		name: "Ancient Greek (to 1453)",
	},
	grd: {
		code: "grd",
		name: "Guruntum-Mbaaru",
	},
	grg: {
		code: "grg",
		name: "Madi",
	},
	grh: {
		code: "grh",
		name: "Gbiri-Niragu",
	},
	gri: {
		code: "gri",
		name: "Ghari",
	},
	grj: {
		code: "grj",
		name: "Southern Grebo",
	},
	grm: {
		code: "grm",
		name: "Kota Marudu Talantang",
	},
	grn: {
		code: "grn",
		name: "Guarani",
	},
	gro: {
		code: "gro",
		name: "Groma",
	},
	grq: {
		code: "grq",
		name: "Gorovu",
	},
	grr: {
		code: "grr",
		name: "Taznatit",
	},
	grs: {
		code: "grs",
		name: "Gresi",
	},
	grt: {
		code: "grt",
		name: "Garo",
	},
	gru: {
		code: "gru",
		name: "Kistane",
	},
	grv: {
		code: "grv",
		name: "Central Grebo",
	},
	grw: {
		code: "grw",
		name: "Gweda",
	},
	grx: {
		code: "grx",
		name: "Guriaso",
	},
	gry: {
		code: "gry",
		name: "Barclayville Grebo",
	},
	grz: {
		code: "grz",
		name: "Guramalum",
	},
	gse: {
		code: "gse",
		name: "Ghanaian Sign Language",
	},
	gsg: {
		code: "gsg",
		name: "German Sign Language",
	},
	gsl: {
		code: "gsl",
		name: "Gusilay",
	},
	gsm: {
		code: "gsm",
		name: "Guatemalan Sign Language",
	},
	gsn: {
		code: "gsn",
		name: "Nema",
	},
	gso: {
		code: "gso",
		name: "Southwest Gbaya",
	},
	gsp: {
		code: "gsp",
		name: "Wasembo",
	},
	gss: {
		code: "gss",
		name: "Greek Sign Language",
	},
	gsw: {
		code: "gsw",
		name: "Swiss German",
	},
	gta: {
		code: "gta",
		name: "Guató",
	},
	gtu: {
		code: "gtu",
		name: "Aghu-Tharnggala",
	},
	gua: {
		code: "gua",
		name: "Shiki",
	},
	gub: {
		code: "gub",
		name: "Guajajára",
	},
	guc: {
		code: "guc",
		name: "Wayuu",
	},
	gud: {
		code: "gud",
		name: "Yocoboué Dida",
	},
	gue: {
		code: "gue",
		name: "Gurindji",
	},
	guf: {
		code: "guf",
		name: "Gupapuyngu",
	},
	gug: {
		code: "gug",
		name: "Paraguayan Guaraní",
	},
	guh: {
		code: "guh",
		name: "Guahibo",
	},
	gui: {
		code: "gui",
		name: "Eastern Bolivian Guaraní",
	},
	guj: {
		code: "guj",
		name: "Gujarati",
	},
	guk: {
		code: "guk",
		name: "Gumuz",
	},
	gul: {
		code: "gul",
		name: "Sea Island Creole English",
	},
	gum: {
		code: "gum",
		name: "Guambiano",
	},
	gun: {
		code: "gun",
		name: "Mbyá Guaraní",
	},
	guo: {
		code: "guo",
		name: "Guayabero",
	},
	gup: {
		code: "gup",
		name: "Gunwinggu",
	},
	guq: {
		code: "guq",
		name: "Aché",
	},
	gur: {
		code: "gur",
		name: "Farefare",
	},
	gus: {
		code: "gus",
		name: "Guinean Sign Language",
	},
	gut: {
		code: "gut",
		name: "Maléku Jaíka",
	},
	guu: {
		code: "guu",
		name: "Yanomamö",
	},
	guw: {
		code: "guw",
		name: "Gun",
	},
	gux: {
		code: "gux",
		name: "Gourmanchéma",
	},
	guz: {
		code: "guz",
		name: "Gusii",
	},
	gva: {
		code: "gva",
		name: "Guana (Paraguay)",
	},
	gvc: {
		code: "gvc",
		name: "Guanano",
	},
	gve: {
		code: "gve",
		name: "Duwet",
	},
	gvf: {
		code: "gvf",
		name: "Golin",
	},
	gvj: {
		code: "gvj",
		name: "Guajá",
	},
	gvl: {
		code: "gvl",
		name: "Gulay",
	},
	gvm: {
		code: "gvm",
		name: "Gurmana",
	},
	gvn: {
		code: "gvn",
		name: "Kuku-Yalanji",
	},
	gvo: {
		code: "gvo",
		name: "Gavião Do Jiparaná",
	},
	gvp: {
		code: "gvp",
		name: "Pará Gavião",
	},
	gvr: {
		code: "gvr",
		name: "Gurung",
	},
	gvs: {
		code: "gvs",
		name: "Gumawana",
	},
	gvy: {
		code: "gvy",
		name: "Guyani",
	},
	gwa: {
		code: "gwa",
		name: "Mbato",
	},
	gwb: {
		code: "gwb",
		name: "Gwa",
	},
	gwc: {
		code: "gwc",
		name: "Gawri",
	},
	gwd: {
		code: "gwd",
		name: "Gawwada",
	},
	gwe: {
		code: "gwe",
		name: "Gweno",
	},
	gwf: {
		code: "gwf",
		name: "Gowro",
	},
	gwg: {
		code: "gwg",
		name: "Moo",
	},
	gwi: {
		code: "gwi",
		name: "Gwichʼin",
	},
	gwj: {
		code: "gwj",
		name: "ǀGwi",
	},
	gwm: {
		code: "gwm",
		name: "Awngthim",
	},
	gwn: {
		code: "gwn",
		name: "Gwandara",
	},
	gwr: {
		code: "gwr",
		name: "Gwere",
	},
	gwt: {
		code: "gwt",
		name: "Gawar-Bati",
	},
	gwu: {
		code: "gwu",
		name: "Guwamu",
	},
	gww: {
		code: "gww",
		name: "Kwini",
	},
	gwx: {
		code: "gwx",
		name: "Gua",
	},
	gxx: {
		code: "gxx",
		name: "Wè Southern",
	},
	gya: {
		code: "gya",
		name: "Northwest Gbaya",
	},
	gyb: {
		code: "gyb",
		name: "Garus",
	},
	gyd: {
		code: "gyd",
		name: "Kayardild",
	},
	gye: {
		code: "gye",
		name: "Gyem",
	},
	gyf: {
		code: "gyf",
		name: "Gungabula",
	},
	gyg: {
		code: "gyg",
		name: "Gbayi",
	},
	gyi: {
		code: "gyi",
		name: "Gyele",
	},
	gyl: {
		code: "gyl",
		name: "Gayil",
	},
	gym: {
		code: "gym",
		name: "Ngäbere",
	},
	gyn: {
		code: "gyn",
		name: "Guyanese Creole English",
	},
	gyo: {
		code: "gyo",
		name: "Gyalsumdo",
	},
	gyr: {
		code: "gyr",
		name: "Guarayu",
	},
	gyy: {
		code: "gyy",
		name: "Gunya",
	},
	gyz: {
		code: "gyz",
		name: "Geji",
	},
	gza: {
		code: "gza",
		name: "Ganza",
	},
	gzi: {
		code: "gzi",
		name: "Gazi",
	},
	gzn: {
		code: "gzn",
		name: "Gane",
	},
	haa: {
		code: "haa",
		name: "Han",
	},
	hab: {
		code: "hab",
		name: "Hanoi Sign Language",
	},
	hac: {
		code: "hac",
		name: "Gurani",
	},
	had: {
		code: "had",
		name: "Hatam",
	},
	hae: {
		code: "hae",
		name: "Eastern Oromo",
	},
	haf: {
		code: "haf",
		name: "Haiphong Sign Language",
	},
	hag: {
		code: "hag",
		name: "Hanga",
	},
	hah: {
		code: "hah",
		name: "Hahon",
	},
	hai: {
		code: "hai",
		name: "Haida",
	},
	haj: {
		code: "haj",
		name: "Hajong",
	},
	hak: {
		code: "hak",
		name: "Hakka Chinese",
	},
	hal: {
		code: "hal",
		name: "Halang",
	},
	ham: {
		code: "ham",
		name: "Hewa",
	},
	han: {
		code: "han",
		name: "Hangaza",
	},
	hao: {
		code: "hao",
		name: "Hakö",
	},
	hap: {
		code: "hap",
		name: "Hupla",
	},
	haq: {
		code: "haq",
		name: "Ha",
	},
	har: {
		code: "har",
		name: "Harari",
	},
	has: {
		code: "has",
		name: "Haisla",
	},
	hat: {
		code: "hat",
		name: "Haitian",
	},
	hau: {
		code: "hau",
		name: "Hausa",
	},
	hav: {
		code: "hav",
		name: "Havu",
	},
	haw: {
		code: "haw",
		name: "Hawaiian",
	},
	hax: {
		code: "hax",
		name: "Southern Haida",
	},
	hay: {
		code: "hay",
		name: "Haya",
	},
	haz: {
		code: "haz",
		name: "Hazaragi",
	},
	hba: {
		code: "hba",
		name: "Hamba",
	},
	hbb: {
		code: "hbb",
		name: "Huba",
	},
	hbn: {
		code: "hbn",
		name: "Heiban",
	},
	hbo: {
		code: "hbo",
		name: "Ancient Hebrew",
	},
	hbs: {
		code: "hbs",
		name: "Serbo-Croatian",
	},
	hbu: {
		code: "hbu",
		name: "Habu",
	},
	hca: {
		code: "hca",
		name: "Andaman Creole Hindi",
	},
	hch: {
		code: "hch",
		name: "Huichol",
	},
	hdn: {
		code: "hdn",
		name: "Northern Haida",
	},
	hds: {
		code: "hds",
		name: "Honduras Sign Language",
	},
	hdy: {
		code: "hdy",
		name: "Hadiyya",
	},
	hea: {
		code: "hea",
		name: "Northern Qiandong Miao",
	},
	heb: {
		code: "heb",
		name: "Hebrew",
	},
	hed: {
		code: "hed",
		name: "Herdé",
	},
	heg: {
		code: "heg",
		name: "Helong",
	},
	heh: {
		code: "heh",
		name: "Hehe",
	},
	hei: {
		code: "hei",
		name: "Heiltsuk",
	},
	hem: {
		code: "hem",
		name: "Hemba",
	},
	her: {
		code: "her",
		name: "Herero",
	},
	hgm: {
		code: "hgm",
		name: "Haiǁom",
	},
	hgw: {
		code: "hgw",
		name: "Haigwai",
	},
	hhi: {
		code: "hhi",
		name: "Hoia Hoia",
	},
	hhr: {
		code: "hhr",
		name: "Kerak",
	},
	hhy: {
		code: "hhy",
		name: "Hoyahoya",
	},
	hia: {
		code: "hia",
		name: "Lamang",
	},
	hib: {
		code: "hib",
		name: "Hibito",
	},
	hid: {
		code: "hid",
		name: "Hidatsa",
	},
	hif: {
		code: "hif",
		name: "Fiji Hindi",
	},
	hig: {
		code: "hig",
		name: "Kamwe",
	},
	hih: {
		code: "hih",
		name: "Pamosu",
	},
	hii: {
		code: "hii",
		name: "Hinduri",
	},
	hij: {
		code: "hij",
		name: "Hijuk",
	},
	hik: {
		code: "hik",
		name: "Seit-Kaitetu",
	},
	hil: {
		code: "hil",
		name: "Hiligaynon",
	},
	hin: {
		code: "hin",
		name: "Hindi",
	},
	hio: {
		code: "hio",
		name: "Tsoa",
	},
	hir: {
		code: "hir",
		name: "Himarimã",
	},
	hit: {
		code: "hit",
		name: "Hittite",
	},
	hiw: {
		code: "hiw",
		name: "Hiw",
	},
	hix: {
		code: "hix",
		name: "Hixkaryána",
	},
	hji: {
		code: "hji",
		name: "Haji",
	},
	hka: {
		code: "hka",
		name: "Kahe",
	},
	hke: {
		code: "hke",
		name: "Hunde",
	},
	hkh: {
		code: "hkh",
		name: "Khah",
	},
	hkk: {
		code: "hkk",
		name: "Hunjara-Kaina Ke",
	},
	hkn: {
		code: "hkn",
		name: "Mel-Khaonh",
	},
	hks: {
		code: "hks",
		name: "Hong Kong Sign Language",
	},
	hla: {
		code: "hla",
		name: "Halia",
	},
	hlb: {
		code: "hlb",
		name: "Halbi",
	},
	hld: {
		code: "hld",
		name: "Halang Doan",
	},
	hle: {
		code: "hle",
		name: "Hlersu",
	},
	hlt: {
		code: "hlt",
		name: "Matu Chin",
	},
	hlu: {
		code: "hlu",
		name: "Hieroglyphic Luwian",
	},
	hma: {
		code: "hma",
		name: "Southern Mashan Hmong",
	},
	hmb: {
		code: "hmb",
		name: "Humburi Senni Songhay",
	},
	hmc: {
		code: "hmc",
		name: "Central Huishui Hmong",
	},
	hmd: {
		code: "hmd",
		name: "Large Flowery Miao",
	},
	hme: {
		code: "hme",
		name: "Eastern Huishui Hmong",
	},
	hmf: {
		code: "hmf",
		name: "Hmong Don",
	},
	hmg: {
		code: "hmg",
		name: "Southwestern Guiyang Hmong",
	},
	hmh: {
		code: "hmh",
		name: "Southwestern Huishui Hmong",
	},
	hmi: {
		code: "hmi",
		name: "Northern Huishui Hmong",
	},
	hmj: {
		code: "hmj",
		name: "Ge",
	},
	hmk: {
		code: "hmk",
		name: "Maek",
	},
	hml: {
		code: "hml",
		name: "Luopohe Hmong",
	},
	hmm: {
		code: "hmm",
		name: "Central Mashan Hmong",
	},
	hmn: {
		code: "hmn",
		name: "Hmong",
	},
	hmo: {
		code: "hmo",
		name: "Hiri Motu",
	},
	hmp: {
		code: "hmp",
		name: "Northern Mashan Hmong",
	},
	hmq: {
		code: "hmq",
		name: "Eastern Qiandong Miao",
	},
	hmr: {
		code: "hmr",
		name: "Hmar",
	},
	hms: {
		code: "hms",
		name: "Southern Qiandong Miao",
	},
	hmt: {
		code: "hmt",
		name: "Hamtai",
	},
	hmu: {
		code: "hmu",
		name: "Hamap",
	},
	hmv: {
		code: "hmv",
		name: "Hmong Dô",
	},
	hmw: {
		code: "hmw",
		name: "Western Mashan Hmong",
	},
	hmy: {
		code: "hmy",
		name: "Southern Guiyang Hmong",
	},
	hmz: {
		code: "hmz",
		name: "Hmong Shua",
	},
	hna: {
		code: "hna",
		name: "Mina (Cameroon)",
	},
	hnd: {
		code: "hnd",
		name: "Southern Hindko",
	},
	hne: {
		code: "hne",
		name: "Chhattisgarhi",
	},
	hng: {
		code: "hng",
		name: "Hungu",
	},
	hnh: {
		code: "hnh",
		name: "ǁAni",
	},
	hni: {
		code: "hni",
		name: "Hani",
	},
	hnj: {
		code: "hnj",
		name: "Hmong Njua",
	},
	hnn: {
		code: "hnn",
		name: "Hanunoo",
	},
	hno: {
		code: "hno",
		name: "Northern Hindko",
	},
	hns: {
		code: "hns",
		name: "Caribbean Hindustani",
	},
	hnu: {
		code: "hnu",
		name: "Hung",
	},
	hoa: {
		code: "hoa",
		name: "Hoava",
	},
	hob: {
		code: "hob",
		name: "Mari (Madang Province)",
	},
	hoc: {
		code: "hoc",
		name: "Ho",
	},
	hod: {
		code: "hod",
		name: "Holma",
	},
	hoe: {
		code: "hoe",
		name: "Horom",
	},
	hoh: {
		code: "hoh",
		name: "Hobyót",
	},
	hoi: {
		code: "hoi",
		name: "Holikachuk",
	},
	hoj: {
		code: "hoj",
		name: "Hadothi",
	},
	hol: {
		code: "hol",
		name: "Holu",
	},
	hom: {
		code: "hom",
		name: "Homa",
	},
	hoo: {
		code: "hoo",
		name: "Holoholo",
	},
	hop: {
		code: "hop",
		name: "Hopi",
	},
	hor: {
		code: "hor",
		name: "Horo",
	},
	hos: {
		code: "hos",
		name: "Ho Chi Minh City Sign Language",
	},
	hot: {
		code: "hot",
		name: "Hote",
	},
	hov: {
		code: "hov",
		name: "Hovongan",
	},
	how: {
		code: "how",
		name: "Honi",
	},
	hoy: {
		code: "hoy",
		name: "Holiya",
	},
	hoz: {
		code: "hoz",
		name: "Hozo",
	},
	hpo: {
		code: "hpo",
		name: "Hpon",
	},
	hps: {
		code: "hps",
		name: "Hawai'i Sign Language (HSL)",
	},
	hra: {
		code: "hra",
		name: "Hrangkhol",
	},
	hrc: {
		code: "hrc",
		name: "Niwer Mil",
	},
	hre: {
		code: "hre",
		name: "Hre",
	},
	hrk: {
		code: "hrk",
		name: "Haruku",
	},
	hrm: {
		code: "hrm",
		name: "Horned Miao",
	},
	hro: {
		code: "hro",
		name: "Haroi",
	},
	hrp: {
		code: "hrp",
		name: "Nhirrpi",
	},
	hrt: {
		code: "hrt",
		name: "Hértevin",
	},
	hru: {
		code: "hru",
		name: "Hruso",
	},
	hrv: {
		code: "hrv",
		name: "Croatian",
	},
	hrw: {
		code: "hrw",
		name: "Warwar Feni",
	},
	hrx: {
		code: "hrx",
		name: "Hunsrik",
	},
	hrz: {
		code: "hrz",
		name: "Harzani",
	},
	hsb: {
		code: "hsb",
		name: "Upper Sorbian",
	},
	hsh: {
		code: "hsh",
		name: "Hungarian Sign Language",
	},
	hsl: {
		code: "hsl",
		name: "Hausa Sign Language",
	},
	hsn: {
		code: "hsn",
		name: "Xiang Chinese",
	},
	hss: {
		code: "hss",
		name: "Harsusi",
	},
	hti: {
		code: "hti",
		name: "Hoti",
	},
	hto: {
		code: "hto",
		name: "Minica Huitoto",
	},
	hts: {
		code: "hts",
		name: "Hadza",
	},
	htu: {
		code: "htu",
		name: "Hitu",
	},
	htx: {
		code: "htx",
		name: "Middle Hittite",
	},
	hub: {
		code: "hub",
		name: "Huambisa",
	},
	huc: {
		code: "huc",
		name: "ǂHua",
	},
	hud: {
		code: "hud",
		name: "Huaulu",
	},
	hue: {
		code: "hue",
		name: "San Francisco Del Mar Huave",
	},
	huf: {
		code: "huf",
		name: "Humene",
	},
	hug: {
		code: "hug",
		name: "Huachipaeri",
	},
	huh: {
		code: "huh",
		name: "Huilliche",
	},
	hui: {
		code: "hui",
		name: "Huli",
	},
	huj: {
		code: "huj",
		name: "Northern Guiyang Hmong",
	},
	huk: {
		code: "huk",
		name: "Hulung",
	},
	hul: {
		code: "hul",
		name: "Hula",
	},
	hum: {
		code: "hum",
		name: "Hungana",
	},
	hun: {
		code: "hun",
		name: "Hungarian",
	},
	huo: {
		code: "huo",
		name: "Hu",
	},
	hup: {
		code: "hup",
		name: "Hupa",
	},
	huq: {
		code: "huq",
		name: "Tsat",
	},
	hur: {
		code: "hur",
		name: "Halkomelem",
	},
	hus: {
		code: "hus",
		name: "Huastec",
	},
	hut: {
		code: "hut",
		name: "Humla",
	},
	huu: {
		code: "huu",
		name: "Murui Huitoto",
	},
	huv: {
		code: "huv",
		name: "San Mateo Del Mar Huave",
	},
	huw: {
		code: "huw",
		name: "Hukumina",
	},
	hux: {
		code: "hux",
		name: "Nüpode Huitoto",
	},
	huy: {
		code: "huy",
		name: "Hulaulá",
	},
	huz: {
		code: "huz",
		name: "Hunzib",
	},
	hvc: {
		code: "hvc",
		name: "Haitian Vodoun Culture Language",
	},
	hve: {
		code: "hve",
		name: "San Dionisio Del Mar Huave",
	},
	hvk: {
		code: "hvk",
		name: "Haveke",
	},
	hvn: {
		code: "hvn",
		name: "Sabu",
	},
	hvv: {
		code: "hvv",
		name: "Santa María Del Mar Huave",
	},
	hwa: {
		code: "hwa",
		name: "Wané",
	},
	hwc: {
		code: "hwc",
		name: "Hawai'i Creole English",
	},
	hwo: {
		code: "hwo",
		name: "Hwana",
	},
	hya: {
		code: "hya",
		name: "Hya",
	},
	hye: {
		code: "hye",
		name: "Armenian",
	},
	hyw: {
		code: "hyw",
		name: "Western Armenian",
	},
	iai: {
		code: "iai",
		name: "Iaai",
	},
	ian: {
		code: "ian",
		name: "Iatmul",
	},
	iar: {
		code: "iar",
		name: "Purari",
	},
	iba: {
		code: "iba",
		name: "Iban",
	},
	ibb: {
		code: "ibb",
		name: "Ibibio",
	},
	ibd: {
		code: "ibd",
		name: "Iwaidja",
	},
	ibe: {
		code: "ibe",
		name: "Akpes",
	},
	ibg: {
		code: "ibg",
		name: "Ibanag",
	},
	ibh: {
		code: "ibh",
		name: "Bih",
	},
	ibl: {
		code: "ibl",
		name: "Ibaloi",
	},
	ibm: {
		code: "ibm",
		name: "Agoi",
	},
	ibn: {
		code: "ibn",
		name: "Ibino",
	},
	ibo: {
		code: "ibo",
		name: "Igbo",
	},
	ibr: {
		code: "ibr",
		name: "Ibuoro",
	},
	ibu: {
		code: "ibu",
		name: "Ibu",
	},
	iby: {
		code: "iby",
		name: "Ibani",
	},
	ica: {
		code: "ica",
		name: "Ede Ica",
	},
	ich: {
		code: "ich",
		name: "Etkywan",
	},
	icl: {
		code: "icl",
		name: "Icelandic Sign Language",
	},
	icr: {
		code: "icr",
		name: "Islander Creole English",
	},
	ida: {
		code: "ida",
		name: "Idakho-Isukha-Tiriki",
	},
	idb: {
		code: "idb",
		name: "Indo-Portuguese",
	},
	idc: {
		code: "idc",
		name: "Idon",
	},
	idd: {
		code: "idd",
		name: "Ede Idaca",
	},
	ide: {
		code: "ide",
		name: "Idere",
	},
	idi: {
		code: "idi",
		name: "Idi",
	},
	ido: {
		code: "ido",
		name: "Ido",
	},
	idr: {
		code: "idr",
		name: "Indri",
	},
	ids: {
		code: "ids",
		name: "Idesa",
	},
	idt: {
		code: "idt",
		name: "Idaté",
	},
	idu: {
		code: "idu",
		name: "Idoma",
	},
	ifa: {
		code: "ifa",
		name: "Amganad Ifugao",
	},
	ifb: {
		code: "ifb",
		name: "Batad Ifugao",
	},
	ife: {
		code: "ife",
		name: "Ifè",
	},
	iff: {
		code: "iff",
		name: "Ifo",
	},
	ifk: {
		code: "ifk",
		name: "Tuwali Ifugao",
	},
	ifm: {
		code: "ifm",
		name: "Teke-Fuumu",
	},
	ifu: {
		code: "ifu",
		name: "Mayoyao Ifugao",
	},
	ify: {
		code: "ify",
		name: "Keley-I Kallahan",
	},
	igb: {
		code: "igb",
		name: "Ebira",
	},
	ige: {
		code: "ige",
		name: "Igede",
	},
	igg: {
		code: "igg",
		name: "Igana",
	},
	igl: {
		code: "igl",
		name: "Igala",
	},
	igm: {
		code: "igm",
		name: "Kanggape",
	},
	ign: {
		code: "ign",
		name: "Ignaciano",
	},
	igo: {
		code: "igo",
		name: "Isebe",
	},
	igs: {
		code: "igs",
		name: "Interglossa",
	},
	igw: {
		code: "igw",
		name: "Igwe",
	},
	ihb: {
		code: "ihb",
		name: "Iha Based Pidgin",
	},
	ihi: {
		code: "ihi",
		name: "Ihievbe",
	},
	ihp: {
		code: "ihp",
		name: "Iha",
	},
	ihw: {
		code: "ihw",
		name: "Bidhawal",
	},
	iii: {
		code: "iii",
		name: "Sichuan Yi",
	},
	iin: {
		code: "iin",
		name: "Thiin",
	},
	ijc: {
		code: "ijc",
		name: "Izon",
	},
	ije: {
		code: "ije",
		name: "Biseni",
	},
	ijj: {
		code: "ijj",
		name: "Ede Ije",
	},
	ijn: {
		code: "ijn",
		name: "Kalabari",
	},
	ijs: {
		code: "ijs",
		name: "Southeast Ijo",
	},
	ike: {
		code: "ike",
		name: "Eastern Canadian Inuktitut",
	},
	ikh: {
		code: "ikh",
		name: "Ikhin-Arokho",
	},
	iki: {
		code: "iki",
		name: "Iko",
	},
	ikk: {
		code: "ikk",
		name: "Ika",
	},
	ikl: {
		code: "ikl",
		name: "Ikulu",
	},
	iko: {
		code: "iko",
		name: "Olulumo-Ikom",
	},
	ikp: {
		code: "ikp",
		name: "Ikpeshi",
	},
	ikr: {
		code: "ikr",
		name: "Ikaranggal",
	},
	iks: {
		code: "iks",
		name: "Inuit Sign Language",
	},
	ikt: {
		code: "ikt",
		name: "Inuinnaqtun",
	},
	iku: {
		code: "iku",
		name: "Inuktitut",
	},
	ikv: {
		code: "ikv",
		name: "Iku-Gora-Ankwa",
	},
	ikw: {
		code: "ikw",
		name: "Ikwere",
	},
	ikx: {
		code: "ikx",
		name: "Ik",
	},
	ikz: {
		code: "ikz",
		name: "Ikizu",
	},
	ila: {
		code: "ila",
		name: "Ile Ape",
	},
	ilb: {
		code: "ilb",
		name: "Ila",
	},
	ile: {
		code: "ile",
		name: "Interlingue",
	},
	ilg: {
		code: "ilg",
		name: "Garig-Ilgar",
	},
	ili: {
		code: "ili",
		name: "Ili Turki",
	},
	ilk: {
		code: "ilk",
		name: "Ilongot",
	},
	ilm: {
		code: "ilm",
		name: "Iranun (Malaysia)",
	},
	ilo: {
		code: "ilo",
		name: "Iloko",
	},
	ilp: {
		code: "ilp",
		name: "Iranun (Philippines)",
	},
	ils: {
		code: "ils",
		name: "International Sign",
	},
	ilu: {
		code: "ilu",
		name: "Ili'uun",
	},
	ilv: {
		code: "ilv",
		name: "Ilue",
	},
	ima: {
		code: "ima",
		name: "Mala Malasar",
	},
	imi: {
		code: "imi",
		name: "Anamgura",
	},
	iml: {
		code: "iml",
		name: "Miluk",
	},
	imn: {
		code: "imn",
		name: "Imonda",
	},
	imo: {
		code: "imo",
		name: "Imbongu",
	},
	imr: {
		code: "imr",
		name: "Imroing",
	},
	ims: {
		code: "ims",
		name: "Marsian",
	},
	imt: {
		code: "imt",
		name: "Imotong",
	},
	imy: {
		code: "imy",
		name: "Milyan",
	},
	ina: {
		code: "ina",
		name: "Interlingua (International Auxiliary Language Association)",
	},
	inb: {
		code: "inb",
		name: "Inga",
	},
	ind: {
		code: "ind",
		name: "Indonesian",
	},
	ing: {
		code: "ing",
		name: "Degexit'an",
	},
	inh: {
		code: "inh",
		name: "Ingush",
	},
	inj: {
		code: "inj",
		name: "Jungle Inga",
	},
	inl: {
		code: "inl",
		name: "Indonesian Sign Language",
	},
	inm: {
		code: "inm",
		name: "Minaean",
	},
	inn: {
		code: "inn",
		name: "Isinai",
	},
	ino: {
		code: "ino",
		name: "Inoke-Yate",
	},
	inp: {
		code: "inp",
		name: "Iñapari",
	},
	ins: {
		code: "ins",
		name: "Indian Sign Language",
	},
	int: {
		code: "int",
		name: "Intha",
	},
	inz: {
		code: "inz",
		name: "Ineseño",
	},
	ior: {
		code: "ior",
		name: "Inor",
	},
	iou: {
		code: "iou",
		name: "Tuma-Irumu",
	},
	iow: {
		code: "iow",
		name: "Iowa-Oto",
	},
	ipi: {
		code: "ipi",
		name: "Ipili",
	},
	ipk: {
		code: "ipk",
		name: "Inupiaq",
	},
	ipo: {
		code: "ipo",
		name: "Ipiko",
	},
	iqu: {
		code: "iqu",
		name: "Iquito",
	},
	iqw: {
		code: "iqw",
		name: "Ikwo",
	},
	ire: {
		code: "ire",
		name: "Iresim",
	},
	irh: {
		code: "irh",
		name: "Irarutu",
	},
	iri: {
		code: "iri",
		name: "Rigwe",
	},
	irk: {
		code: "irk",
		name: "Iraqw",
	},
	irn: {
		code: "irn",
		name: "Irántxe",
	},
	irr: {
		code: "irr",
		name: "Ir",
	},
	iru: {
		code: "iru",
		name: "Irula",
	},
	irx: {
		code: "irx",
		name: "Kamberau",
	},
	iry: {
		code: "iry",
		name: "Iraya",
	},
	isa: {
		code: "isa",
		name: "Isabi",
	},
	isc: {
		code: "isc",
		name: "Isconahua",
	},
	isd: {
		code: "isd",
		name: "Isnag",
	},
	ise: {
		code: "ise",
		name: "Italian Sign Language",
	},
	isg: {
		code: "isg",
		name: "Irish Sign Language",
	},
	ish: {
		code: "ish",
		name: "Esan",
	},
	isi: {
		code: "isi",
		name: "Nkem-Nkum",
	},
	isk: {
		code: "isk",
		name: "Ishkashimi",
	},
	isl: {
		code: "isl",
		name: "Icelandic",
	},
	ism: {
		code: "ism",
		name: "Masimasi",
	},
	isn: {
		code: "isn",
		name: "Isanzu",
	},
	iso: {
		code: "iso",
		name: "Isoko",
	},
	isr: {
		code: "isr",
		name: "Israeli Sign Language",
	},
	ist: {
		code: "ist",
		name: "Istriot",
	},
	isu: {
		code: "isu",
		name: "Isu (Menchum Division)",
	},
	ita: {
		code: "ita",
		name: "Italian",
	},
	itb: {
		code: "itb",
		name: "Binongan Itneg",
	},
	itd: {
		code: "itd",
		name: "Southern Tidung",
	},
	ite: {
		code: "ite",
		name: "Itene",
	},
	iti: {
		code: "iti",
		name: "Inlaod Itneg",
	},
	itk: {
		code: "itk",
		name: "Judeo-Italian",
	},
	itl: {
		code: "itl",
		name: "Itelmen",
	},
	itm: {
		code: "itm",
		name: "Itu Mbon Uzo",
	},
	ito: {
		code: "ito",
		name: "Itonama",
	},
	itr: {
		code: "itr",
		name: "Iteri",
	},
	its: {
		code: "its",
		name: "Isekiri",
	},
	itt: {
		code: "itt",
		name: "Maeng Itneg",
	},
	itv: {
		code: "itv",
		name: "Itawit",
	},
	itw: {
		code: "itw",
		name: "Ito",
	},
	itx: {
		code: "itx",
		name: "Itik",
	},
	ity: {
		code: "ity",
		name: "Moyadan Itneg",
	},
	itz: {
		code: "itz",
		name: "Itzá",
	},
	ium: {
		code: "ium",
		name: "Iu Mien",
	},
	ivb: {
		code: "ivb",
		name: "Ibatan",
	},
	ivv: {
		code: "ivv",
		name: "Ivatan",
	},
	iwk: {
		code: "iwk",
		name: "I-Wak",
	},
	iwm: {
		code: "iwm",
		name: "Iwam",
	},
	iwo: {
		code: "iwo",
		name: "Iwur",
	},
	iws: {
		code: "iws",
		name: "Sepik Iwam",
	},
	ixc: {
		code: "ixc",
		name: "Ixcatec",
	},
	ixl: {
		code: "ixl",
		name: "Ixil",
	},
	iya: {
		code: "iya",
		name: "Iyayu",
	},
	iyo: {
		code: "iyo",
		name: "Mesaka",
	},
	iyx: {
		code: "iyx",
		name: "Yaka (Congo)",
	},
	izh: {
		code: "izh",
		name: "Ingrian",
	},
	izm: {
		code: "izm",
		name: "Kizamani",
	},
	izr: {
		code: "izr",
		name: "Izere",
	},
	izz: {
		code: "izz",
		name: "Izii",
	},
	jaa: {
		code: "jaa",
		name: "Jamamadí",
	},
	jab: {
		code: "jab",
		name: "Hyam",
	},
	jac: {
		code: "jac",
		name: "Popti'",
	},
	jad: {
		code: "jad",
		name: "Jahanka",
	},
	jae: {
		code: "jae",
		name: "Yabem",
	},
	jaf: {
		code: "jaf",
		name: "Jara",
	},
	jah: {
		code: "jah",
		name: "Jah Hut",
	},
	jaj: {
		code: "jaj",
		name: "Zazao",
	},
	jak: {
		code: "jak",
		name: "Jakun",
	},
	jal: {
		code: "jal",
		name: "Yalahatan",
	},
	jam: {
		code: "jam",
		name: "Jamaican Creole English",
	},
	jan: {
		code: "jan",
		name: "Jandai",
	},
	jao: {
		code: "jao",
		name: "Yanyuwa",
	},
	jaq: {
		code: "jaq",
		name: "Yaqay",
	},
	jas: {
		code: "jas",
		name: "New Caledonian Javanese",
	},
	jat: {
		code: "jat",
		name: "Jakati",
	},
	jau: {
		code: "jau",
		name: "Yaur",
	},
	jav: {
		code: "jav",
		name: "Javanese",
	},
	jax: {
		code: "jax",
		name: "Jambi Malay",
	},
	jay: {
		code: "jay",
		name: "Yan-nhangu",
	},
	jaz: {
		code: "jaz",
		name: "Jawe",
	},
	jbe: {
		code: "jbe",
		name: "Judeo-Berber",
	},
	jbi: {
		code: "jbi",
		name: "Badjiri",
	},
	jbj: {
		code: "jbj",
		name: "Arandai",
	},
	jbk: {
		code: "jbk",
		name: "Barikewa",
	},
	jbm: {
		code: "jbm",
		name: "Bijim",
	},
	jbn: {
		code: "jbn",
		name: "Nafusi",
	},
	jbo: {
		code: "jbo",
		name: "Lojban",
	},
	jbr: {
		code: "jbr",
		name: "Jofotek-Bromnya",
	},
	jbt: {
		code: "jbt",
		name: "Jabutí",
	},
	jbu: {
		code: "jbu",
		name: "Jukun Takum",
	},
	jbw: {
		code: "jbw",
		name: "Yawijibaya",
	},
	jcs: {
		code: "jcs",
		name: "Jamaican Country Sign Language",
	},
	jct: {
		code: "jct",
		name: "Krymchak",
	},
	jda: {
		code: "jda",
		name: "Jad",
	},
	jdg: {
		code: "jdg",
		name: "Jadgali",
	},
	jdt: {
		code: "jdt",
		name: "Judeo-Tat",
	},
	jeb: {
		code: "jeb",
		name: "Jebero",
	},
	jee: {
		code: "jee",
		name: "Jerung",
	},
	jeh: {
		code: "jeh",
		name: "Jeh",
	},
	jei: {
		code: "jei",
		name: "Yei",
	},
	jek: {
		code: "jek",
		name: "Jeri Kuo",
	},
	jel: {
		code: "jel",
		name: "Yelmek",
	},
	jen: {
		code: "jen",
		name: "Dza",
	},
	jer: {
		code: "jer",
		name: "Jere",
	},
	jet: {
		code: "jet",
		name: "Manem",
	},
	jeu: {
		code: "jeu",
		name: "Jonkor Bourmataguil",
	},
	jgb: {
		code: "jgb",
		name: "Ngbee",
	},
	jge: {
		code: "jge",
		name: "Judeo-Georgian",
	},
	jgk: {
		code: "jgk",
		name: "Gwak",
	},
	jgo: {
		code: "jgo",
		name: "Ngomba",
	},
	jhi: {
		code: "jhi",
		name: "Jehai",
	},
	jhs: {
		code: "jhs",
		name: "Jhankot Sign Language",
	},
	jia: {
		code: "jia",
		name: "Jina",
	},
	jib: {
		code: "jib",
		name: "Jibu",
	},
	jic: {
		code: "jic",
		name: "Tol",
	},
	jid: {
		code: "jid",
		name: "Bu (Kaduna State)",
	},
	jie: {
		code: "jie",
		name: "Jilbe",
	},
	jig: {
		code: "jig",
		name: "Jingulu",
	},
	jih: {
		code: "jih",
		name: "sTodsde",
	},
	jii: {
		code: "jii",
		name: "Jiiddu",
	},
	jil: {
		code: "jil",
		name: "Jilim",
	},
	jim: {
		code: "jim",
		name: "Jimi (Cameroon)",
	},
	jio: {
		code: "jio",
		name: "Jiamao",
	},
	jiq: {
		code: "jiq",
		name: "Guanyinqiao",
	},
	jit: {
		code: "jit",
		name: "Jita",
	},
	jiu: {
		code: "jiu",
		name: "Youle Jinuo",
	},
	jiv: {
		code: "jiv",
		name: "Shuar",
	},
	jiy: {
		code: "jiy",
		name: "Buyuan Jinuo",
	},
	jje: {
		code: "jje",
		name: "Jejueo",
	},
	jjr: {
		code: "jjr",
		name: "Bankal",
	},
	jka: {
		code: "jka",
		name: "Kaera",
	},
	jkm: {
		code: "jkm",
		name: "Mobwa Karen",
	},
	jko: {
		code: "jko",
		name: "Kubo",
	},
	jkp: {
		code: "jkp",
		name: "Paku Karen",
	},
	jkr: {
		code: "jkr",
		name: "Koro (India)",
	},
	jks: {
		code: "jks",
		name: "Amami Koniya Sign Language",
	},
	jku: {
		code: "jku",
		name: "Labir",
	},
	jle: {
		code: "jle",
		name: "Ngile",
	},
	jls: {
		code: "jls",
		name: "Jamaican Sign Language",
	},
	jma: {
		code: "jma",
		name: "Dima",
	},
	jmb: {
		code: "jmb",
		name: "Zumbun",
	},
	jmc: {
		code: "jmc",
		name: "Machame",
	},
	jmd: {
		code: "jmd",
		name: "Yamdena",
	},
	jmi: {
		code: "jmi",
		name: "Jimi (Nigeria)",
	},
	jml: {
		code: "jml",
		name: "Jumli",
	},
	jmn: {
		code: "jmn",
		name: "Makuri Naga",
	},
	jmr: {
		code: "jmr",
		name: "Kamara",
	},
	jms: {
		code: "jms",
		name: "Mashi (Nigeria)",
	},
	jmw: {
		code: "jmw",
		name: "Mouwase",
	},
	jmx: {
		code: "jmx",
		name: "Western Juxtlahuaca Mixtec",
	},
	jna: {
		code: "jna",
		name: "Jangshung",
	},
	jnd: {
		code: "jnd",
		name: "Jandavra",
	},
	jng: {
		code: "jng",
		name: "Yangman",
	},
	jni: {
		code: "jni",
		name: "Janji",
	},
	jnj: {
		code: "jnj",
		name: "Yemsa",
	},
	jnl: {
		code: "jnl",
		name: "Rawat",
	},
	jns: {
		code: "jns",
		name: "Jaunsari",
	},
	job: {
		code: "job",
		name: "Joba",
	},
	jod: {
		code: "jod",
		name: "Wojenaka",
	},
	jog: {
		code: "jog",
		name: "Jogi",
	},
	jor: {
		code: "jor",
		name: "Jorá",
	},
	jos: {
		code: "jos",
		name: "Jordanian Sign Language",
	},
	jow: {
		code: "jow",
		name: "Jowulu",
	},
	jpa: {
		code: "jpa",
		name: "Jewish Palestinian Aramaic",
	},
	jpn: {
		code: "jpn",
		name: "Japanese",
	},
	jpr: {
		code: "jpr",
		name: "Judeo-Persian",
	},
	jqr: {
		code: "jqr",
		name: "Jaqaru",
	},
	jra: {
		code: "jra",
		name: "Jarai",
	},
	jrb: {
		code: "jrb",
		name: "Judeo-Arabic",
	},
	jrr: {
		code: "jrr",
		name: "Jiru",
	},
	jrt: {
		code: "jrt",
		name: "Jakattoe",
	},
	jru: {
		code: "jru",
		name: "Japrería",
	},
	jsl: {
		code: "jsl",
		name: "Japanese Sign Language",
	},
	jua: {
		code: "jua",
		name: "Júma",
	},
	jub: {
		code: "jub",
		name: "Wannu",
	},
	juc: {
		code: "juc",
		name: "Jurchen",
	},
	jud: {
		code: "jud",
		name: "Worodougou",
	},
	juh: {
		code: "juh",
		name: "Hõne",
	},
	jui: {
		code: "jui",
		name: "Ngadjuri",
	},
	juk: {
		code: "juk",
		name: "Wapan",
	},
	jul: {
		code: "jul",
		name: "Jirel",
	},
	jum: {
		code: "jum",
		name: "Jumjum",
	},
	jun: {
		code: "jun",
		name: "Juang",
	},
	juo: {
		code: "juo",
		name: "Jiba",
	},
	jup: {
		code: "jup",
		name: "Hupdë",
	},
	jur: {
		code: "jur",
		name: "Jurúna",
	},
	jus: {
		code: "jus",
		name: "Jumla Sign Language",
	},
	jut: {
		code: "jut",
		name: "Jutish",
	},
	juu: {
		code: "juu",
		name: "Ju",
	},
	juw: {
		code: "juw",
		name: "Wãpha",
	},
	juy: {
		code: "juy",
		name: "Juray",
	},
	jvd: {
		code: "jvd",
		name: "Javindo",
	},
	jvn: {
		code: "jvn",
		name: "Caribbean Javanese",
	},
	jwi: {
		code: "jwi",
		name: "Jwira-Pepesa",
	},
	jya: {
		code: "jya",
		name: "Jiarong",
	},
	jye: {
		code: "jye",
		name: "Judeo-Yemeni Arabic",
	},
	jyy: {
		code: "jyy",
		name: "Jaya",
	},
	kaa: {
		code: "kaa",
		name: "Kara-Kalpak",
	},
	kab: {
		code: "kab",
		name: "Kabyle",
	},
	kac: {
		code: "kac",
		name: "Kachin",
	},
	kad: {
		code: "kad",
		name: "Adara",
	},
	kae: {
		code: "kae",
		name: "Ketangalan",
	},
	kaf: {
		code: "kaf",
		name: "Katso",
	},
	kag: {
		code: "kag",
		name: "Kajaman",
	},
	kah: {
		code: "kah",
		name: "Kara (Central African Republic)",
	},
	kai: {
		code: "kai",
		name: "Karekare",
	},
	kaj: {
		code: "kaj",
		name: "Jju",
	},
	kak: {
		code: "kak",
		name: "Kalanguya",
	},
	kal: {
		code: "kal",
		name: "Kalaallisut",
	},
	kam: {
		code: "kam",
		name: "Kamba (Kenya)",
	},
	kan: {
		code: "kan",
		name: "Kannada",
	},
	kao: {
		code: "kao",
		name: "Xaasongaxango",
	},
	kap: {
		code: "kap",
		name: "Bezhta",
	},
	kaq: {
		code: "kaq",
		name: "Capanahua",
	},
	kas: {
		code: "kas",
		name: "Kashmiri",
	},
	kat: {
		code: "kat",
		name: "Georgian",
	},
	kau: {
		code: "kau",
		name: "Kanuri",
	},
	kav: {
		code: "kav",
		name: "Katukína",
	},
	kaw: {
		code: "kaw",
		name: "Kawi",
	},
	kax: {
		code: "kax",
		name: "Kao",
	},
	kay: {
		code: "kay",
		name: "Kamayurá",
	},
	kaz: {
		code: "kaz",
		name: "Kazakh",
	},
	kba: {
		code: "kba",
		name: "Kalarko",
	},
	kbb: {
		code: "kbb",
		name: "Kaxuiâna",
	},
	kbc: {
		code: "kbc",
		name: "Kadiwéu",
	},
	kbd: {
		code: "kbd",
		name: "Kabardian",
		nativeName: "Адыгэбзэ КIахэ",
	},
	kbe: {
		code: "kbe",
		name: "Kanju",
	},
	kbg: {
		code: "kbg",
		name: "Khamba",
	},
	kbh: {
		code: "kbh",
		name: "Camsá",
	},
	kbi: {
		code: "kbi",
		name: "Kaptiau",
	},
	kbj: {
		code: "kbj",
		name: "Kari",
	},
	kbk: {
		code: "kbk",
		name: "Grass Koiari",
	},
	kbl: {
		code: "kbl",
		name: "Kanembu",
	},
	kbm: {
		code: "kbm",
		name: "Iwal",
	},
	kbn: {
		code: "kbn",
		name: "Kare (Central African Republic)",
	},
	kbo: {
		code: "kbo",
		name: "Keliko",
	},
	kbp: {
		code: "kbp",
		name: "Kabiyè",
	},
	kbq: {
		code: "kbq",
		name: "Kamano",
	},
	kbr: {
		code: "kbr",
		name: "Kafa",
	},
	kbs: {
		code: "kbs",
		name: "Kande",
	},
	kbt: {
		code: "kbt",
		name: "Abadi",
	},
	kbu: {
		code: "kbu",
		name: "Kabutra",
	},
	kbv: {
		code: "kbv",
		name: "Dera (Indonesia)",
	},
	kbw: {
		code: "kbw",
		name: "Kaiep",
	},
	kbx: {
		code: "kbx",
		name: "Ap Ma",
	},
	kby: {
		code: "kby",
		name: "Manga Kanuri",
	},
	kbz: {
		code: "kbz",
		name: "Duhwa",
	},
	kca: {
		code: "kca",
		name: "Khanty",
	},
	kcb: {
		code: "kcb",
		name: "Kawacha",
	},
	kcc: {
		code: "kcc",
		name: "Lubila",
	},
	kcd: {
		code: "kcd",
		name: "Ngkâlmpw Kanum",
	},
	kce: {
		code: "kce",
		name: "Kaivi",
	},
	kcf: {
		code: "kcf",
		name: "Ukaan",
	},
	kcg: {
		code: "kcg",
		name: "Tyap",
	},
	kch: {
		code: "kch",
		name: "Vono",
	},
	kci: {
		code: "kci",
		name: "Kamantan",
	},
	kcj: {
		code: "kcj",
		name: "Kobiana",
	},
	kck: {
		code: "kck",
		name: "Kalanga",
	},
	kcl: {
		code: "kcl",
		name: "Kela (Papua New Guinea)",
	},
	kcm: {
		code: "kcm",
		name: "Gula (Central African Republic)",
	},
	kcn: {
		code: "kcn",
		name: "Nubi",
	},
	kco: {
		code: "kco",
		name: "Kinalakna",
	},
	kcp: {
		code: "kcp",
		name: "Kanga",
	},
	kcq: {
		code: "kcq",
		name: "Kamo",
	},
	kcr: {
		code: "kcr",
		name: "Katla",
	},
	kcs: {
		code: "kcs",
		name: "Koenoem",
	},
	kct: {
		code: "kct",
		name: "Kaian",
	},
	kcu: {
		code: "kcu",
		name: "Kami (Tanzania)",
	},
	kcv: {
		code: "kcv",
		name: "Kete",
	},
	kcw: {
		code: "kcw",
		name: "Kabwari",
	},
	kcx: {
		code: "kcx",
		name: "Kachama-Ganjule",
	},
	kcy: {
		code: "kcy",
		name: "Korandje",
	},
	kcz: {
		code: "kcz",
		name: "Konongo",
	},
	kda: {
		code: "kda",
		name: "Worimi",
	},
	kdc: {
		code: "kdc",
		name: "Kutu",
	},
	kdd: {
		code: "kdd",
		name: "Yankunytjatjara",
	},
	kde: {
		code: "kde",
		name: "Makonde",
	},
	kdf: {
		code: "kdf",
		name: "Mamusi",
	},
	kdg: {
		code: "kdg",
		name: "Seba",
	},
	kdh: {
		code: "kdh",
		name: "Tem",
	},
	kdi: {
		code: "kdi",
		name: "Kumam",
	},
	kdj: {
		code: "kdj",
		name: "Karamojong",
	},
	kdk: {
		code: "kdk",
		name: "Numèè",
	},
	kdl: {
		code: "kdl",
		name: "Tsikimba",
	},
	kdm: {
		code: "kdm",
		name: "Kagoma",
	},
	kdn: {
		code: "kdn",
		name: "Kunda",
	},
	kdp: {
		code: "kdp",
		name: "Kaningdon-Nindem",
	},
	kdq: {
		code: "kdq",
		name: "Koch",
	},
	kdr: {
		code: "kdr",
		name: "Karaim",
	},
	kdt: {
		code: "kdt",
		name: "Kuy",
	},
	kdu: {
		code: "kdu",
		name: "Kadaru",
	},
	kdw: {
		code: "kdw",
		name: "Koneraw",
	},
	kdx: {
		code: "kdx",
		name: "Kam",
	},
	kdy: {
		code: "kdy",
		name: "Keder",
	},
	kdz: {
		code: "kdz",
		name: "Kwaja",
	},
	kea: {
		code: "kea",
		name: "Kabuverdianu",
	},
	keb: {
		code: "keb",
		name: "Kélé",
	},
	kec: {
		code: "kec",
		name: "Keiga",
	},
	ked: {
		code: "ked",
		name: "Kerewe",
	},
	kee: {
		code: "kee",
		name: "Eastern Keres",
	},
	kef: {
		code: "kef",
		name: "Kpessi",
	},
	keg: {
		code: "keg",
		name: "Tese",
	},
	keh: {
		code: "keh",
		name: "Keak",
	},
	kei: {
		code: "kei",
		name: "Kei",
	},
	kej: {
		code: "kej",
		name: "Kadar",
	},
	kek: {
		code: "kek",
		name: "Kekchí",
	},
	kel: {
		code: "kel",
		name: "Kela (Democratic Republic of Congo)",
	},
	kem: {
		code: "kem",
		name: "Kemak",
	},
	ken: {
		code: "ken",
		name: "Kenyang",
	},
	keo: {
		code: "keo",
		name: "Kakwa",
	},
	kep: {
		code: "kep",
		name: "Kaikadi",
	},
	keq: {
		code: "keq",
		name: "Kamar",
	},
	ker: {
		code: "ker",
		name: "Kera",
	},
	kes: {
		code: "kes",
		name: "Kugbo",
	},
	ket: {
		code: "ket",
		name: "Ket",
	},
	keu: {
		code: "keu",
		name: "Akebu",
	},
	kev: {
		code: "kev",
		name: "Kanikkaran",
	},
	kew: {
		code: "kew",
		name: "West Kewa",
	},
	kex: {
		code: "kex",
		name: "Kukna",
	},
	key: {
		code: "key",
		name: "Kupia",
	},
	kez: {
		code: "kez",
		name: "Kukele",
	},
	kfa: {
		code: "kfa",
		name: "Kodava",
	},
	kfb: {
		code: "kfb",
		name: "Northwestern Kolami",
	},
	kfc: {
		code: "kfc",
		name: "Konda-Dora",
	},
	kfd: {
		code: "kfd",
		name: "Korra Koraga",
	},
	kfe: {
		code: "kfe",
		name: "Kota (India)",
	},
	kff: {
		code: "kff",
		name: "Koya",
	},
	kfg: {
		code: "kfg",
		name: "Kudiya",
	},
	kfh: {
		code: "kfh",
		name: "Kurichiya",
	},
	kfi: {
		code: "kfi",
		name: "Kannada Kurumba",
	},
	kfj: {
		code: "kfj",
		name: "Kemiehua",
	},
	kfk: {
		code: "kfk",
		name: "Kinnauri",
	},
	kfl: {
		code: "kfl",
		name: "Kung",
	},
	kfm: {
		code: "kfm",
		name: "Khunsari",
	},
	kfn: {
		code: "kfn",
		name: "Kuk",
	},
	kfo: {
		code: "kfo",
		name: "Koro (Côte d'Ivoire)",
	},
	kfp: {
		code: "kfp",
		name: "Korwa",
	},
	kfq: {
		code: "kfq",
		name: "Korku",
	},
	kfr: {
		code: "kfr",
		name: "Kachhi",
	},
	kfs: {
		code: "kfs",
		name: "Bilaspuri",
	},
	kft: {
		code: "kft",
		name: "Kanjari",
	},
	kfu: {
		code: "kfu",
		name: "Katkari",
	},
	kfv: {
		code: "kfv",
		name: "Kurmukar",
	},
	kfw: {
		code: "kfw",
		name: "Kharam Naga",
	},
	kfx: {
		code: "kfx",
		name: "Kullu Pahari",
	},
	kfy: {
		code: "kfy",
		name: "Kumaoni",
	},
	kfz: {
		code: "kfz",
		name: "Koromfé",
	},
	kga: {
		code: "kga",
		name: "Koyaga",
	},
	kgb: {
		code: "kgb",
		name: "Kawe",
	},
	kge: {
		code: "kge",
		name: "Komering",
	},
	kgf: {
		code: "kgf",
		name: "Kube",
	},
	kgg: {
		code: "kgg",
		name: "Kusunda",
	},
	kgi: {
		code: "kgi",
		name: "Selangor Sign Language",
	},
	kgj: {
		code: "kgj",
		name: "Gamale Kham",
	},
	kgk: {
		code: "kgk",
		name: "Kaiwá",
	},
	kgl: {
		code: "kgl",
		name: "Kunggari",
	},
	kgn: {
		code: "kgn",
		name: "Karingani",
	},
	kgo: {
		code: "kgo",
		name: "Krongo",
	},
	kgp: {
		code: "kgp",
		name: "Kaingang",
	},
	kgq: {
		code: "kgq",
		name: "Kamoro",
	},
	kgr: {
		code: "kgr",
		name: "Abun",
	},
	kgs: {
		code: "kgs",
		name: "Kumbainggar",
	},
	kgt: {
		code: "kgt",
		name: "Somyev",
	},
	kgu: {
		code: "kgu",
		name: "Kobol",
	},
	kgv: {
		code: "kgv",
		name: "Karas",
	},
	kgw: {
		code: "kgw",
		name: "Karon Dori",
	},
	kgx: {
		code: "kgx",
		name: "Kamaru",
	},
	kgy: {
		code: "kgy",
		name: "Kyerung",
	},
	kha: {
		code: "kha",
		name: "Khasi",
	},
	khb: {
		code: "khb",
		name: "Lü",
	},
	khc: {
		code: "khc",
		name: "Tukang Besi North",
	},
	khd: {
		code: "khd",
		name: "Bädi Kanum",
	},
	khe: {
		code: "khe",
		name: "Korowai",
	},
	khf: {
		code: "khf",
		name: "Khuen",
	},
	khg: {
		code: "khg",
		name: "Khams Tibetan",
	},
	khh: {
		code: "khh",
		name: "Kehu",
	},
	khj: {
		code: "khj",
		name: "Kuturmi",
	},
	khk: {
		code: "khk",
		name: "Halh Mongolian",
	},
	khl: {
		code: "khl",
		name: "Lusi",
	},
	khm: {
		code: "khm",
		name: "Khmer",
	},
	khn: {
		code: "khn",
		name: "Khandesi",
	},
	kho: {
		code: "kho",
		name: "Khotanese",
	},
	khp: {
		code: "khp",
		name: "Kapori",
	},
	khq: {
		code: "khq",
		name: "Koyra Chiini Songhay",
	},
	khr: {
		code: "khr",
		name: "Kharia",
	},
	khs: {
		code: "khs",
		name: "Kasua",
	},
	kht: {
		code: "kht",
		name: "Khamti",
	},
	khu: {
		code: "khu",
		name: "Nkhumbi",
	},
	khv: {
		code: "khv",
		name: "Khvarshi",
	},
	khw: {
		code: "khw",
		name: "Khowar",
	},
	khx: {
		code: "khx",
		name: "Kanu",
	},
	khy: {
		code: "khy",
		name: "Kele (Democratic Republic of Congo)",
	},
	khz: {
		code: "khz",
		name: "Keapara",
	},
	kia: {
		code: "kia",
		name: "Kim",
	},
	kib: {
		code: "kib",
		name: "Koalib",
	},
	kic: {
		code: "kic",
		name: "Kickapoo",
	},
	kid: {
		code: "kid",
		name: "Koshin",
	},
	kie: {
		code: "kie",
		name: "Kibet",
	},
	kif: {
		code: "kif",
		name: "Eastern Parbate Kham",
	},
	kig: {
		code: "kig",
		name: "Kimaama",
	},
	kih: {
		code: "kih",
		name: "Kilmeri",
	},
	kii: {
		code: "kii",
		name: "Kitsai",
	},
	kij: {
		code: "kij",
		name: "Kilivila",
	},
	kik: {
		code: "kik",
		name: "Kikuyu",
	},
	kil: {
		code: "kil",
		name: "Kariya",
	},
	kim: {
		code: "kim",
		name: "Karagas",
	},
	kin: {
		code: "kin",
		name: "Kinyarwanda",
	},
	kio: {
		code: "kio",
		name: "Kiowa",
	},
	kip: {
		code: "kip",
		name: "Sheshi Kham",
	},
	kiq: {
		code: "kiq",
		name: "Kosadle",
	},
	kir: {
		code: "kir",
		name: "Kirghiz",
	},
	kis: {
		code: "kis",
		name: "Kis",
	},
	kit: {
		code: "kit",
		name: "Agob",
	},
	kiu: {
		code: "kiu",
		name: "Kirmanjki (individual language)",
	},
	kiv: {
		code: "kiv",
		name: "Kimbu",
	},
	kiw: {
		code: "kiw",
		name: "Northeast Kiwai",
	},
	kix: {
		code: "kix",
		name: "Khiamniungan Naga",
	},
	kiy: {
		code: "kiy",
		name: "Kirikiri",
	},
	kiz: {
		code: "kiz",
		name: "Kisi",
	},
	kja: {
		code: "kja",
		name: "Mlap",
	},
	kjb: {
		code: "kjb",
		name: "Q'anjob'al",
	},
	kjc: {
		code: "kjc",
		name: "Coastal Konjo",
	},
	kjd: {
		code: "kjd",
		name: "Southern Kiwai",
	},
	kje: {
		code: "kje",
		name: "Kisar",
	},
	kjg: {
		code: "kjg",
		name: "Khmu",
	},
	kjh: {
		code: "kjh",
		name: "Khakas",
	},
	kji: {
		code: "kji",
		name: "Zabana",
	},
	kjj: {
		code: "kjj",
		name: "Khinalugh",
	},
	kjk: {
		code: "kjk",
		name: "Highland Konjo",
	},
	kjl: {
		code: "kjl",
		name: "Western Parbate Kham",
	},
	kjm: {
		code: "kjm",
		name: "Kháng",
	},
	kjn: {
		code: "kjn",
		name: "Kunjen",
	},
	kjo: {
		code: "kjo",
		name: "Harijan Kinnauri",
	},
	kjp: {
		code: "kjp",
		name: "Pwo Eastern Karen",
	},
	kjq: {
		code: "kjq",
		name: "Western Keres",
	},
	kjr: {
		code: "kjr",
		name: "Kurudu",
	},
	kjs: {
		code: "kjs",
		name: "East Kewa",
	},
	kjt: {
		code: "kjt",
		name: "Phrae Pwo Karen",
	},
	kju: {
		code: "kju",
		name: "Kashaya",
	},
	kjv: {
		code: "kjv",
		name: "Kaikavian Literary Language",
	},
	kjx: {
		code: "kjx",
		name: "Ramopa",
	},
	kjy: {
		code: "kjy",
		name: "Erave",
	},
	kjz: {
		code: "kjz",
		name: "Bumthangkha",
	},
	kka: {
		code: "kka",
		name: "Kakanda",
	},
	kkb: {
		code: "kkb",
		name: "Kwerisa",
	},
	kkc: {
		code: "kkc",
		name: "Odoodee",
	},
	kkd: {
		code: "kkd",
		name: "Kinuku",
	},
	kke: {
		code: "kke",
		name: "Kakabe",
	},
	kkf: {
		code: "kkf",
		name: "Kalaktang Monpa",
	},
	kkg: {
		code: "kkg",
		name: "Mabaka Valley Kalinga",
	},
	kkh: {
		code: "kkh",
		name: "Khün",
	},
	kki: {
		code: "kki",
		name: "Kagulu",
	},
	kkj: {
		code: "kkj",
		name: "Kako",
	},
	kkk: {
		code: "kkk",
		name: "Kokota",
	},
	kkl: {
		code: "kkl",
		name: "Kosarek Yale",
	},
	kkm: {
		code: "kkm",
		name: "Kiong",
	},
	kkn: {
		code: "kkn",
		name: "Kon Keu",
	},
	kko: {
		code: "kko",
		name: "Karko",
	},
	kkp: {
		code: "kkp",
		name: "Gugubera",
	},
	kkq: {
		code: "kkq",
		name: "Kaeku",
	},
	kkr: {
		code: "kkr",
		name: "Kir-Balar",
	},
	kks: {
		code: "kks",
		name: "Giiwo",
	},
	kkt: {
		code: "kkt",
		name: "Koi",
	},
	kku: {
		code: "kku",
		name: "Tumi",
	},
	kkv: {
		code: "kkv",
		name: "Kangean",
	},
	kkw: {
		code: "kkw",
		name: "Teke-Kukuya",
	},
	kkx: {
		code: "kkx",
		name: "Kohin",
	},
	kky: {
		code: "kky",
		name: "Guugu Yimidhirr",
	},
	kkz: {
		code: "kkz",
		name: "Kaska",
	},
	kla: {
		code: "kla",
		name: "Klamath-Modoc",
	},
	klb: {
		code: "klb",
		name: "Kiliwa",
	},
	klc: {
		code: "klc",
		name: "Kolbila",
	},
	kld: {
		code: "kld",
		name: "Gamilaraay",
	},
	kle: {
		code: "kle",
		name: "Kulung (Nepal)",
	},
	klf: {
		code: "klf",
		name: "Kendeje",
	},
	klg: {
		code: "klg",
		name: "Tagakaulo",
	},
	klh: {
		code: "klh",
		name: "Weliki",
	},
	kli: {
		code: "kli",
		name: "Kalumpang",
	},
	klj: {
		code: "klj",
		name: "Khalaj",
	},
	klk: {
		code: "klk",
		name: "Kono (Nigeria)",
	},
	kll: {
		code: "kll",
		name: "Kagan Kalagan",
	},
	klm: {
		code: "klm",
		name: "Migum",
	},
	kln: {
		code: "kln",
		name: "Kalenjin",
	},
	klo: {
		code: "klo",
		name: "Kapya",
	},
	klp: {
		code: "klp",
		name: "Kamasa",
	},
	klq: {
		code: "klq",
		name: "Rumu",
	},
	klr: {
		code: "klr",
		name: "Khaling",
	},
	kls: {
		code: "kls",
		name: "Kalasha",
	},
	klt: {
		code: "klt",
		name: "Nukna",
	},
	klu: {
		code: "klu",
		name: "Klao",
	},
	klv: {
		code: "klv",
		name: "Maskelynes",
	},
	klw: {
		code: "klw",
		name: "Tado",
	},
	klx: {
		code: "klx",
		name: "Koluwawa",
	},
	kly: {
		code: "kly",
		name: "Kalao",
	},
	klz: {
		code: "klz",
		name: "Kabola",
	},
	kma: {
		code: "kma",
		name: "Konni",
	},
	kmb: {
		code: "kmb",
		name: "Kimbundu",
	},
	kmc: {
		code: "kmc",
		name: "Southern Dong",
	},
	kmd: {
		code: "kmd",
		name: "Majukayang Kalinga",
	},
	kme: {
		code: "kme",
		name: "Bakole",
	},
	kmf: {
		code: "kmf",
		name: "Kare (Papua New Guinea)",
	},
	kmg: {
		code: "kmg",
		name: "Kâte",
	},
	kmh: {
		code: "kmh",
		name: "Kalam",
	},
	kmi: {
		code: "kmi",
		name: "Kami (Nigeria)",
	},
	kmj: {
		code: "kmj",
		name: "Kumarbhag Paharia",
	},
	kmk: {
		code: "kmk",
		name: "Limos Kalinga",
	},
	kml: {
		code: "kml",
		name: "Tanudan Kalinga",
	},
	kmm: {
		code: "kmm",
		name: "Kom (India)",
	},
	kmn: {
		code: "kmn",
		name: "Awtuw",
	},
	kmo: {
		code: "kmo",
		name: "Kwoma",
	},
	kmp: {
		code: "kmp",
		name: "Gimme",
	},
	kmq: {
		code: "kmq",
		name: "Kwama",
	},
	kmr: {
		code: "kmr",
		name: "Northern Kurdish",
	},
	kms: {
		code: "kms",
		name: "Kamasau",
	},
	kmt: {
		code: "kmt",
		name: "Kemtuik",
	},
	kmu: {
		code: "kmu",
		name: "Kanite",
	},
	kmv: {
		code: "kmv",
		name: "Karipúna Creole French",
	},
	kmw: {
		code: "kmw",
		name: "Komo (Democratic Republic of Congo)",
	},
	kmx: {
		code: "kmx",
		name: "Waboda",
	},
	kmy: {
		code: "kmy",
		name: "Koma",
	},
	kmz: {
		code: "kmz",
		name: "Khorasani Turkish",
	},
	kna: {
		code: "kna",
		name: "Dera (Nigeria)",
	},
	knb: {
		code: "knb",
		name: "Lubuagan Kalinga",
	},
	knc: {
		code: "knc",
		name: "Central Kanuri",
	},
	knd: {
		code: "knd",
		name: "Konda",
	},
	kne: {
		code: "kne",
		name: "Kankanaey",
	},
	knf: {
		code: "knf",
		name: "Mankanya",
	},
	kng: {
		code: "kng",
		name: "Koongo",
	},
	kni: {
		code: "kni",
		name: "Kanufi",
	},
	knj: {
		code: "knj",
		name: "Western Kanjobal",
	},
	knk: {
		code: "knk",
		name: "Kuranko",
	},
	knl: {
		code: "knl",
		name: "Keninjal",
	},
	knm: {
		code: "knm",
		name: "Kanamarí",
	},
	knn: {
		code: "knn",
		name: "Konkani (individual language)",
	},
	kno: {
		code: "kno",
		name: "Kono (Sierra Leone)",
	},
	knp: {
		code: "knp",
		name: "Kwanja",
	},
	knq: {
		code: "knq",
		name: "Kintaq",
	},
	knr: {
		code: "knr",
		name: "Kaningra",
	},
	kns: {
		code: "kns",
		name: "Kensiu",
	},
	knt: {
		code: "knt",
		name: "Panoan Katukína",
	},
	knu: {
		code: "knu",
		name: "Kono (Guinea)",
	},
	knv: {
		code: "knv",
		name: "Tabo",
	},
	knw: {
		code: "knw",
		name: "Kung-Ekoka",
	},
	knx: {
		code: "knx",
		name: "Kendayan",
	},
	kny: {
		code: "kny",
		name: "Kanyok",
	},
	knz: {
		code: "knz",
		name: "Kalamsé",
	},
	koa: {
		code: "koa",
		name: "Konomala",
	},
	koc: {
		code: "koc",
		name: "Kpati",
	},
	kod: {
		code: "kod",
		name: "Kodi",
	},
	koe: {
		code: "koe",
		name: "Kacipo-Bale Suri",
	},
	kof: {
		code: "kof",
		name: "Kubi",
	},
	kog: {
		code: "kog",
		name: "Cogui",
	},
	koh: {
		code: "koh",
		name: "Koyo",
	},
	koi: {
		code: "koi",
		name: "Komi-Permyak",
	},
	kok: {
		code: "kok",
		name: "Konkani (macrolanguage)",
	},
	kol: {
		code: "kol",
		name: "Kol (Papua New Guinea)",
	},
	kom: {
		code: "kom",
		name: "Komi",
	},
	kon: {
		code: "kon",
		name: "Kongo",
	},
	koo: {
		code: "koo",
		name: "Konzo",
	},
	kop: {
		code: "kop",
		name: "Waube",
	},
	koq: {
		code: "koq",
		name: "Kota (Gabon)",
	},
	kor: {
		code: "kor",
		name: "Korean",
	},
	kos: {
		code: "kos",
		name: "Kosraean",
	},
	kot: {
		code: "kot",
		name: "Lagwan",
	},
	kou: {
		code: "kou",
		name: "Koke",
	},
	kov: {
		code: "kov",
		name: "Kudu-Camo",
	},
	kow: {
		code: "kow",
		name: "Kugama",
	},
	koy: {
		code: "koy",
		name: "Koyukon",
	},
	koz: {
		code: "koz",
		name: "Korak",
	},
	kpa: {
		code: "kpa",
		name: "Kutto",
	},
	kpb: {
		code: "kpb",
		name: "Mullu Kurumba",
	},
	kpc: {
		code: "kpc",
		name: "Curripaco",
	},
	kpd: {
		code: "kpd",
		name: "Koba",
	},
	kpe: {
		code: "kpe",
		name: "Kpelle",
	},
	kpf: {
		code: "kpf",
		name: "Komba",
	},
	kpg: {
		code: "kpg",
		name: "Kapingamarangi",
	},
	kph: {
		code: "kph",
		name: "Kplang",
	},
	kpi: {
		code: "kpi",
		name: "Kofei",
	},
	kpj: {
		code: "kpj",
		name: "Karajá",
	},
	kpk: {
		code: "kpk",
		name: "Kpan",
	},
	kpl: {
		code: "kpl",
		name: "Kpala",
	},
	kpm: {
		code: "kpm",
		name: "Koho",
	},
	kpn: {
		code: "kpn",
		name: "Kepkiriwát",
	},
	kpo: {
		code: "kpo",
		name: "Ikposo",
	},
	kpq: {
		code: "kpq",
		name: "Korupun-Sela",
	},
	kpr: {
		code: "kpr",
		name: "Korafe-Yegha",
	},
	kps: {
		code: "kps",
		name: "Tehit",
	},
	kpt: {
		code: "kpt",
		name: "Karata",
	},
	kpu: {
		code: "kpu",
		name: "Kafoa",
	},
	kpv: {
		code: "kpv",
		name: "Komi-Zyrian",
	},
	kpw: {
		code: "kpw",
		name: "Kobon",
	},
	kpx: {
		code: "kpx",
		name: "Mountain Koiali",
	},
	kpy: {
		code: "kpy",
		name: "Koryak",
	},
	kpz: {
		code: "kpz",
		name: "Kupsabiny",
	},
	kqa: {
		code: "kqa",
		name: "Mum",
	},
	kqb: {
		code: "kqb",
		name: "Kovai",
	},
	kqc: {
		code: "kqc",
		name: "Doromu-Koki",
	},
	kqd: {
		code: "kqd",
		name: "Koy Sanjaq Surat",
	},
	kqe: {
		code: "kqe",
		name: "Kalagan",
	},
	kqf: {
		code: "kqf",
		name: "Kakabai",
	},
	kqg: {
		code: "kqg",
		name: "Khe",
	},
	kqh: {
		code: "kqh",
		name: "Kisankasa",
	},
	kqi: {
		code: "kqi",
		name: "Koitabu",
	},
	kqj: {
		code: "kqj",
		name: "Koromira",
	},
	kqk: {
		code: "kqk",
		name: "Kotafon Gbe",
	},
	kql: {
		code: "kql",
		name: "Kyenele",
	},
	kqm: {
		code: "kqm",
		name: "Khisa",
	},
	kqn: {
		code: "kqn",
		name: "Kaonde",
	},
	kqo: {
		code: "kqo",
		name: "Eastern Krahn",
	},
	kqp: {
		code: "kqp",
		name: "Kimré",
	},
	kqq: {
		code: "kqq",
		name: "Krenak",
	},
	kqr: {
		code: "kqr",
		name: "Kimaragang",
	},
	kqs: {
		code: "kqs",
		name: "Northern Kissi",
	},
	kqt: {
		code: "kqt",
		name: "Klias River Kadazan",
	},
	kqu: {
		code: "kqu",
		name: "Seroa",
	},
	kqv: {
		code: "kqv",
		name: "Okolod",
	},
	kqw: {
		code: "kqw",
		name: "Kandas",
	},
	kqx: {
		code: "kqx",
		name: "Mser",
	},
	kqy: {
		code: "kqy",
		name: "Koorete",
	},
	kqz: {
		code: "kqz",
		name: "Korana",
	},
	kra: {
		code: "kra",
		name: "Kumhali",
	},
	krb: {
		code: "krb",
		name: "Karkin",
	},
	krc: {
		code: "krc",
		name: "Karachay-Balkar",
	},
	krd: {
		code: "krd",
		name: "Kairui-Midiki",
	},
	kre: {
		code: "kre",
		name: "Panará",
	},
	krf: {
		code: "krf",
		name: "Koro (Vanuatu)",
	},
	krh: {
		code: "krh",
		name: "Kurama",
	},
	kri: {
		code: "kri",
		name: "Krio",
	},
	krj: {
		code: "krj",
		name: "Kinaray-A",
	},
	krk: {
		code: "krk",
		name: "Kerek",
	},
	krl: {
		code: "krl",
		name: "Karelian",
	},
	krn: {
		code: "krn",
		name: "Sapo",
	},
	krp: {
		code: "krp",
		name: "Durop",
	},
	krr: {
		code: "krr",
		name: "Krung",
	},
	krs: {
		code: "krs",
		name: "Gbaya (Sudan)",
	},
	krt: {
		code: "krt",
		name: "Tumari Kanuri",
	},
	kru: {
		code: "kru",
		name: "Kurukh",
	},
	krv: {
		code: "krv",
		name: "Kavet",
	},
	krw: {
		code: "krw",
		name: "Western Krahn",
	},
	krx: {
		code: "krx",
		name: "Karon",
	},
	kry: {
		code: "kry",
		name: "Kryts",
	},
	krz: {
		code: "krz",
		name: "Sota Kanum",
	},
	ksb: {
		code: "ksb",
		name: "Shambala",
	},
	ksc: {
		code: "ksc",
		name: "Southern Kalinga",
	},
	ksd: {
		code: "ksd",
		name: "Kuanua",
	},
	kse: {
		code: "kse",
		name: "Kuni",
	},
	ksf: {
		code: "ksf",
		name: "Bafia",
	},
	ksg: {
		code: "ksg",
		name: "Kusaghe",
	},
	ksh: {
		code: "ksh",
		name: "Kölsch",
	},
	ksi: {
		code: "ksi",
		name: "Krisa",
	},
	ksj: {
		code: "ksj",
		name: "Uare",
	},
	ksk: {
		code: "ksk",
		name: "Kansa",
	},
	ksl: {
		code: "ksl",
		name: "Kumalu",
	},
	ksm: {
		code: "ksm",
		name: "Kumba",
	},
	ksn: {
		code: "ksn",
		name: "Kasiguranin",
	},
	kso: {
		code: "kso",
		name: "Kofa",
	},
	ksp: {
		code: "ksp",
		name: "Kaba",
	},
	ksq: {
		code: "ksq",
		name: "Kwaami",
	},
	ksr: {
		code: "ksr",
		name: "Borong",
	},
	kss: {
		code: "kss",
		name: "Southern Kisi",
	},
	kst: {
		code: "kst",
		name: "Winyé",
	},
	ksu: {
		code: "ksu",
		name: "Khamyang",
	},
	ksv: {
		code: "ksv",
		name: "Kusu",
	},
	ksw: {
		code: "ksw",
		name: "S'gaw Karen",
	},
	ksx: {
		code: "ksx",
		name: "Kedang",
	},
	ksy: {
		code: "ksy",
		name: "Kharia Thar",
	},
	ksz: {
		code: "ksz",
		name: "Kodaku",
	},
	kta: {
		code: "kta",
		name: "Katua",
	},
	ktb: {
		code: "ktb",
		name: "Kambaata",
	},
	ktc: {
		code: "ktc",
		name: "Kholok",
	},
	ktd: {
		code: "ktd",
		name: "Kokata",
	},
	kte: {
		code: "kte",
		name: "Nubri",
	},
	ktf: {
		code: "ktf",
		name: "Kwami",
	},
	ktg: {
		code: "ktg",
		name: "Kalkutung",
	},
	kth: {
		code: "kth",
		name: "Karanga",
	},
	kti: {
		code: "kti",
		name: "North Muyu",
	},
	ktj: {
		code: "ktj",
		name: "Plapo Krumen",
	},
	ktk: {
		code: "ktk",
		name: "Kaniet",
	},
	ktl: {
		code: "ktl",
		name: "Koroshi",
	},
	ktm: {
		code: "ktm",
		name: "Kurti",
	},
	ktn: {
		code: "ktn",
		name: "Karitiâna",
	},
	kto: {
		code: "kto",
		name: "Kuot",
	},
	ktp: {
		code: "ktp",
		name: "Kaduo",
	},
	ktq: {
		code: "ktq",
		name: "Katabaga",
	},
	kts: {
		code: "kts",
		name: "South Muyu",
	},
	ktt: {
		code: "ktt",
		name: "Ketum",
	},
	ktu: {
		code: "ktu",
		name: "Kituba (Democratic Republic of Congo)",
	},
	ktv: {
		code: "ktv",
		name: "Eastern Katu",
	},
	ktw: {
		code: "ktw",
		name: "Kato",
	},
	ktx: {
		code: "ktx",
		name: "Kaxararí",
	},
	kty: {
		code: "kty",
		name: "Kango (Bas-Uélé District)",
	},
	ktz: {
		code: "ktz",
		name: "Juǀʼhoan",
	},
	kua: {
		code: "kua",
		name: "Kuanyama",
	},
	kub: {
		code: "kub",
		name: "Kutep",
	},
	kuc: {
		code: "kuc",
		name: "Kwinsu",
	},
	kud: {
		code: "kud",
		name: "'Auhelawa",
	},
	kue: {
		code: "kue",
		name: "Kuman (Papua New Guinea)",
	},
	kuf: {
		code: "kuf",
		name: "Western Katu",
	},
	kug: {
		code: "kug",
		name: "Kupa",
	},
	kuh: {
		code: "kuh",
		name: "Kushi",
	},
	kui: {
		code: "kui",
		name: "Kuikúro-Kalapálo",
	},
	kuj: {
		code: "kuj",
		name: "Kuria",
	},
	kuk: {
		code: "kuk",
		name: "Kepo'",
	},
	kul: {
		code: "kul",
		name: "Kulere",
	},
	kum: {
		code: "kum",
		name: "Kumyk",
	},
	kun: {
		code: "kun",
		name: "Kunama",
	},
	kuo: {
		code: "kuo",
		name: "Kumukio",
	},
	kup: {
		code: "kup",
		name: "Kunimaipa",
	},
	kuq: {
		code: "kuq",
		name: "Karipuna",
	},
	kur: {
		code: "kur",
		name: "Kurdish",
	},
	kus: {
		code: "kus",
		name: "Kusaal",
	},
	kut: {
		code: "kut",
		name: "Kutenai",
	},
	kuu: {
		code: "kuu",
		name: "Upper Kuskokwim",
	},
	kuv: {
		code: "kuv",
		name: "Kur",
	},
	kuw: {
		code: "kuw",
		name: "Kpagua",
	},
	kux: {
		code: "kux",
		name: "Kukatja",
	},
	kuy: {
		code: "kuy",
		name: "Kuuku-Ya'u",
	},
	kuz: {
		code: "kuz",
		name: "Kunza",
	},
	kva: {
		code: "kva",
		name: "Bagvalal",
	},
	kvb: {
		code: "kvb",
		name: "Kubu",
	},
	kvc: {
		code: "kvc",
		name: "Kove",
	},
	kvd: {
		code: "kvd",
		name: "Kui (Indonesia)",
	},
	kve: {
		code: "kve",
		name: "Kalabakan",
	},
	kvf: {
		code: "kvf",
		name: "Kabalai",
	},
	kvg: {
		code: "kvg",
		name: "Kuni-Boazi",
	},
	kvh: {
		code: "kvh",
		name: "Komodo",
	},
	kvi: {
		code: "kvi",
		name: "Kwang",
	},
	kvj: {
		code: "kvj",
		name: "Psikye",
	},
	kvk: {
		code: "kvk",
		name: "Korean Sign Language",
	},
	kvl: {
		code: "kvl",
		name: "Kayaw",
	},
	kvm: {
		code: "kvm",
		name: "Kendem",
	},
	kvn: {
		code: "kvn",
		name: "Border Kuna",
	},
	kvo: {
		code: "kvo",
		name: "Dobel",
	},
	kvp: {
		code: "kvp",
		name: "Kompane",
	},
	kvq: {
		code: "kvq",
		name: "Geba Karen",
	},
	kvr: {
		code: "kvr",
		name: "Kerinci",
	},
	kvt: {
		code: "kvt",
		name: "Lahta Karen",
	},
	kvu: {
		code: "kvu",
		name: "Yinbaw Karen",
	},
	kvv: {
		code: "kvv",
		name: "Kola",
	},
	kvw: {
		code: "kvw",
		name: "Wersing",
	},
	kvx: {
		code: "kvx",
		name: "Parkari Koli",
	},
	kvy: {
		code: "kvy",
		name: "Yintale Karen",
	},
	kvz: {
		code: "kvz",
		name: "Tsakwambo",
	},
	kwa: {
		code: "kwa",
		name: "Dâw",
	},
	kwb: {
		code: "kwb",
		name: "Kwa",
	},
	kwc: {
		code: "kwc",
		name: "Likwala",
	},
	kwd: {
		code: "kwd",
		name: "Kwaio",
	},
	kwe: {
		code: "kwe",
		name: "Kwerba",
	},
	kwf: {
		code: "kwf",
		name: "Kwara'ae",
	},
	kwg: {
		code: "kwg",
		name: "Sara Kaba Deme",
	},
	kwh: {
		code: "kwh",
		name: "Kowiai",
	},
	kwi: {
		code: "kwi",
		name: "Awa-Cuaiquer",
	},
	kwj: {
		code: "kwj",
		name: "Kwanga",
	},
	kwk: {
		code: "kwk",
		name: "Kwakiutl",
	},
	kwl: {
		code: "kwl",
		name: "Kofyar",
	},
	kwm: {
		code: "kwm",
		name: "Kwambi",
	},
	kwn: {
		code: "kwn",
		name: "Kwangali",
	},
	kwo: {
		code: "kwo",
		name: "Kwomtari",
	},
	kwp: {
		code: "kwp",
		name: "Kodia",
	},
	kwr: {
		code: "kwr",
		name: "Kwer",
	},
	kws: {
		code: "kws",
		name: "Kwese",
	},
	kwt: {
		code: "kwt",
		name: "Kwesten",
	},
	kwu: {
		code: "kwu",
		name: "Kwakum",
	},
	kwv: {
		code: "kwv",
		name: "Sara Kaba Náà",
	},
	kww: {
		code: "kww",
		name: "Kwinti",
	},
	kwx: {
		code: "kwx",
		name: "Khirwar",
	},
	kwy: {
		code: "kwy",
		name: "San Salvador Kongo",
	},
	kwz: {
		code: "kwz",
		name: "Kwadi",
	},
	kxa: {
		code: "kxa",
		name: "Kairiru",
	},
	kxb: {
		code: "kxb",
		name: "Krobu",
	},
	kxc: {
		code: "kxc",
		name: "Konso",
	},
	kxd: {
		code: "kxd",
		name: "Brunei",
	},
	kxf: {
		code: "kxf",
		name: "Manumanaw Karen",
	},
	kxh: {
		code: "kxh",
		name: "Karo (Ethiopia)",
	},
	kxi: {
		code: "kxi",
		name: "Keningau Murut",
	},
	kxj: {
		code: "kxj",
		name: "Kulfa",
	},
	kxk: {
		code: "kxk",
		name: "Zayein Karen",
	},
	kxm: {
		code: "kxm",
		name: "Northern Khmer",
	},
	kxn: {
		code: "kxn",
		name: "Kanowit-Tanjong Melanau",
	},
	kxo: {
		code: "kxo",
		name: "Kanoé",
	},
	kxp: {
		code: "kxp",
		name: "Wadiyara Koli",
	},
	kxq: {
		code: "kxq",
		name: "Smärky Kanum",
	},
	kxr: {
		code: "kxr",
		name: "Koro (Papua New Guinea)",
	},
	kxs: {
		code: "kxs",
		name: "Kangjia",
	},
	kxt: {
		code: "kxt",
		name: "Koiwat",
	},
	kxv: {
		code: "kxv",
		name: "Kuvi",
	},
	kxw: {
		code: "kxw",
		name: "Konai",
	},
	kxx: {
		code: "kxx",
		name: "Likuba",
	},
	kxy: {
		code: "kxy",
		name: "Kayong",
	},
	kxz: {
		code: "kxz",
		name: "Kerewo",
	},
	kya: {
		code: "kya",
		name: "Kwaya",
	},
	kyb: {
		code: "kyb",
		name: "Butbut Kalinga",
	},
	kyc: {
		code: "kyc",
		name: "Kyaka",
	},
	kyd: {
		code: "kyd",
		name: "Karey",
	},
	kye: {
		code: "kye",
		name: "Krache",
	},
	kyf: {
		code: "kyf",
		name: "Kouya",
	},
	kyg: {
		code: "kyg",
		name: "Keyagana",
	},
	kyh: {
		code: "kyh",
		name: "Karok",
	},
	kyi: {
		code: "kyi",
		name: "Kiput",
	},
	kyj: {
		code: "kyj",
		name: "Karao",
	},
	kyk: {
		code: "kyk",
		name: "Kamayo",
	},
	kyl: {
		code: "kyl",
		name: "Kalapuya",
	},
	kym: {
		code: "kym",
		name: "Kpatili",
	},
	kyn: {
		code: "kyn",
		name: "Northern Binukidnon",
	},
	kyo: {
		code: "kyo",
		name: "Kelon",
	},
	kyp: {
		code: "kyp",
		name: "Kang",
	},
	kyq: {
		code: "kyq",
		name: "Kenga",
	},
	kyr: {
		code: "kyr",
		name: "Kuruáya",
	},
	kys: {
		code: "kys",
		name: "Baram Kayan",
	},
	kyt: {
		code: "kyt",
		name: "Kayagar",
	},
	kyu: {
		code: "kyu",
		name: "Western Kayah",
	},
	kyv: {
		code: "kyv",
		name: "Kayort",
	},
	kyw: {
		code: "kyw",
		name: "Kudmali",
	},
	kyx: {
		code: "kyx",
		name: "Rapoisi",
	},
	kyy: {
		code: "kyy",
		name: "Kambaira",
	},
	kyz: {
		code: "kyz",
		name: "Kayabí",
	},
	kza: {
		code: "kza",
		name: "Western Karaboro",
	},
	kzb: {
		code: "kzb",
		name: "Kaibobo",
	},
	kzc: {
		code: "kzc",
		name: "Bondoukou Kulango",
	},
	kzd: {
		code: "kzd",
		name: "Kadai",
	},
	kze: {
		code: "kze",
		name: "Kosena",
	},
	kzf: {
		code: "kzf",
		name: "Da'a Kaili",
	},
	kzg: {
		code: "kzg",
		name: "Kikai",
	},
	kzi: {
		code: "kzi",
		name: "Kelabit",
	},
	kzk: {
		code: "kzk",
		name: "Kazukuru",
	},
	kzl: {
		code: "kzl",
		name: "Kayeli",
	},
	kzm: {
		code: "kzm",
		name: "Kais",
	},
	kzn: {
		code: "kzn",
		name: "Kokola",
	},
	kzo: {
		code: "kzo",
		name: "Kaningi",
	},
	kzp: {
		code: "kzp",
		name: "Kaidipang",
	},
	kzq: {
		code: "kzq",
		name: "Kaike",
	},
	kzr: {
		code: "kzr",
		name: "Karang",
	},
	kzs: {
		code: "kzs",
		name: "Sugut Dusun",
	},
	kzu: {
		code: "kzu",
		name: "Kayupulau",
	},
	kzv: {
		code: "kzv",
		name: "Komyandaret",
	},
	kzw: {
		code: "kzw",
		name: "Karirí-Xocó",
	},
	kzx: {
		code: "kzx",
		name: "Kamarian",
	},
	kzy: {
		code: "kzy",
		name: "Kango (Tshopo District)",
	},
	kzz: {
		code: "kzz",
		name: "Kalabra",
	},
	laa: {
		code: "laa",
		name: "Southern Subanen",
	},
	lab: {
		code: "lab",
		name: "Linear A",
	},
	lac: {
		code: "lac",
		name: "Lacandon",
	},
	lad: {
		code: "lad",
		name: "Ladino",
	},
	lae: {
		code: "lae",
		name: "Pattani",
	},
	laf: {
		code: "laf",
		name: "Lafofa",
	},
	lag: {
		code: "lag",
		name: "Rangi",
	},
	lah: {
		code: "lah",
		name: "Lahnda",
	},
	lai: {
		code: "lai",
		name: "Lambya",
	},
	laj: {
		code: "laj",
		name: "Lango (Uganda)",
	},
	lal: {
		code: "lal",
		name: "Lalia",
	},
	lam: {
		code: "lam",
		name: "Lamba",
	},
	lan: {
		code: "lan",
		name: "Laru",
	},
	lao: {
		code: "lao",
		name: "Lao",
	},
	lap: {
		code: "lap",
		name: "Laka (Chad)",
	},
	laq: {
		code: "laq",
		name: "Qabiao",
	},
	lar: {
		code: "lar",
		name: "Larteh",
	},
	las: {
		code: "las",
		name: "Lama (Togo)",
	},
	lat: {
		code: "lat",
		name: "Latin",
	},
	lau: {
		code: "lau",
		name: "Laba",
	},
	lav: {
		code: "lav",
		name: "Latvian",
	},
	law: {
		code: "law",
		name: "Lauje",
	},
	lax: {
		code: "lax",
		name: "Tiwa",
	},
	lay: {
		code: "lay",
		name: "Lama Bai",
	},
	laz: {
		code: "laz",
		name: "Aribwatsa",
	},
	lbb: {
		code: "lbb",
		name: "Label",
	},
	lbc: {
		code: "lbc",
		name: "Lakkia",
	},
	lbe: {
		code: "lbe",
		name: "Lak",
	},
	lbf: {
		code: "lbf",
		name: "Tinani",
	},
	lbg: {
		code: "lbg",
		name: "Laopang",
	},
	lbi: {
		code: "lbi",
		name: "La'bi",
	},
	lbj: {
		code: "lbj",
		name: "Ladakhi",
	},
	lbk: {
		code: "lbk",
		name: "Central Bontok",
	},
	lbl: {
		code: "lbl",
		name: "Libon Bikol",
	},
	lbm: {
		code: "lbm",
		name: "Lodhi",
	},
	lbn: {
		code: "lbn",
		name: "Rmeet",
	},
	lbo: {
		code: "lbo",
		name: "Laven",
	},
	lbq: {
		code: "lbq",
		name: "Wampar",
	},
	lbr: {
		code: "lbr",
		name: "Lohorung",
	},
	lbs: {
		code: "lbs",
		name: "Libyan Sign Language",
	},
	lbt: {
		code: "lbt",
		name: "Lachi",
	},
	lbu: {
		code: "lbu",
		name: "Labu",
	},
	lbv: {
		code: "lbv",
		name: "Lavatbura-Lamusong",
	},
	lbw: {
		code: "lbw",
		name: "Tolaki",
	},
	lbx: {
		code: "lbx",
		name: "Lawangan",
	},
	lby: {
		code: "lby",
		name: "Lamalama",
	},
	lbz: {
		code: "lbz",
		name: "Lardil",
	},
	lcc: {
		code: "lcc",
		name: "Legenyem",
	},
	lcd: {
		code: "lcd",
		name: "Lola",
	},
	lce: {
		code: "lce",
		name: "Loncong",
	},
	lcf: {
		code: "lcf",
		name: "Lubu",
	},
	lch: {
		code: "lch",
		name: "Luchazi",
	},
	lcl: {
		code: "lcl",
		name: "Lisela",
	},
	lcm: {
		code: "lcm",
		name: "Tungag",
	},
	lcp: {
		code: "lcp",
		name: "Western Lawa",
	},
	lcq: {
		code: "lcq",
		name: "Luhu",
	},
	lcs: {
		code: "lcs",
		name: "Lisabata-Nuniali",
	},
	lda: {
		code: "lda",
		name: "Kla-Dan",
	},
	ldb: {
		code: "ldb",
		name: "Dũya",
	},
	ldd: {
		code: "ldd",
		name: "Luri",
	},
	ldg: {
		code: "ldg",
		name: "Lenyima",
	},
	ldh: {
		code: "ldh",
		name: "Lamja-Dengsa-Tola",
	},
	ldi: {
		code: "ldi",
		name: "Laari",
	},
	ldj: {
		code: "ldj",
		name: "Lemoro",
	},
	ldk: {
		code: "ldk",
		name: "Leelau",
	},
	ldl: {
		code: "ldl",
		name: "Kaan",
	},
	ldm: {
		code: "ldm",
		name: "Landoma",
	},
	ldn: {
		code: "ldn",
		name: "Láadan",
	},
	ldo: {
		code: "ldo",
		name: "Loo",
	},
	ldp: {
		code: "ldp",
		name: "Tso",
	},
	ldq: {
		code: "ldq",
		name: "Lufu",
	},
	lea: {
		code: "lea",
		name: "Lega-Shabunda",
	},
	leb: {
		code: "leb",
		name: "Lala-Bisa",
	},
	lec: {
		code: "lec",
		name: "Leco",
	},
	led: {
		code: "led",
		name: "Lendu",
	},
	lee: {
		code: "lee",
		name: "Lyélé",
	},
	lef: {
		code: "lef",
		name: "Lelemi",
	},
	leh: {
		code: "leh",
		name: "Lenje",
	},
	lei: {
		code: "lei",
		name: "Lemio",
	},
	lej: {
		code: "lej",
		name: "Lengola",
	},
	lek: {
		code: "lek",
		name: "Leipon",
	},
	lel: {
		code: "lel",
		name: "Lele (Democratic Republic of Congo)",
	},
	lem: {
		code: "lem",
		name: "Nomaande",
	},
	len: {
		code: "len",
		name: "Lenca",
	},
	leo: {
		code: "leo",
		name: "Leti (Cameroon)",
	},
	lep: {
		code: "lep",
		name: "Lepcha",
	},
	leq: {
		code: "leq",
		name: "Lembena",
	},
	ler: {
		code: "ler",
		name: "Lenkau",
	},
	les: {
		code: "les",
		name: "Lese",
	},
	let: {
		code: "let",
		name: "Lesing-Gelimi",
	},
	leu: {
		code: "leu",
		name: "Kara (Papua New Guinea)",
	},
	lev: {
		code: "lev",
		name: "Lamma",
	},
	lew: {
		code: "lew",
		name: "Ledo Kaili",
	},
	lex: {
		code: "lex",
		name: "Luang",
	},
	ley: {
		code: "ley",
		name: "Lemolang",
	},
	lez: {
		code: "lez",
		name: "Lezghian",
	},
	lfa: {
		code: "lfa",
		name: "Lefa",
	},
	lfn: {
		code: "lfn",
		name: "Lingua Franca Nova",
	},
	lga: {
		code: "lga",
		name: "Lungga",
	},
	lgb: {
		code: "lgb",
		name: "Laghu",
	},
	lgg: {
		code: "lgg",
		name: "Lugbara",
	},
	lgh: {
		code: "lgh",
		name: "Laghuu",
	},
	lgi: {
		code: "lgi",
		name: "Lengilu",
	},
	lgk: {
		code: "lgk",
		name: "Lingarak",
	},
	lgl: {
		code: "lgl",
		name: "Wala",
	},
	lgm: {
		code: "lgm",
		name: "Lega-Mwenga",
	},
	lgn: {
		code: "lgn",
		name: "T'apo",
	},
	lgo: {
		code: "lgo",
		name: "Lango (South Sudan)",
	},
	lgq: {
		code: "lgq",
		name: "Logba",
	},
	lgr: {
		code: "lgr",
		name: "Lengo",
	},
	lgs: {
		code: "lgs",
		name: "Guinea-Bissau Sign Language",
	},
	lgt: {
		code: "lgt",
		name: "Pahi",
	},
	lgu: {
		code: "lgu",
		name: "Longgu",
	},
	lgz: {
		code: "lgz",
		name: "Ligenza",
	},
	lha: {
		code: "lha",
		name: "Laha (Viet Nam)",
	},
	lhh: {
		code: "lhh",
		name: "Laha (Indonesia)",
	},
	lhi: {
		code: "lhi",
		name: "Lahu Shi",
	},
	lhl: {
		code: "lhl",
		name: "Lahul Lohar",
	},
	lhm: {
		code: "lhm",
		name: "Lhomi",
	},
	lhn: {
		code: "lhn",
		name: "Lahanan",
	},
	lhp: {
		code: "lhp",
		name: "Lhokpu",
	},
	lhs: {
		code: "lhs",
		name: "Mlahsö",
	},
	lht: {
		code: "lht",
		name: "Lo-Toga",
	},
	lhu: {
		code: "lhu",
		name: "Lahu",
	},
	lia: {
		code: "lia",
		name: "West-Central Limba",
	},
	lib: {
		code: "lib",
		name: "Likum",
	},
	lic: {
		code: "lic",
		name: "Hlai",
	},
	lid: {
		code: "lid",
		name: "Nyindrou",
	},
	lie: {
		code: "lie",
		name: "Likila",
	},
	lif: {
		code: "lif",
		name: "Limbu",
	},
	lig: {
		code: "lig",
		name: "Ligbi",
	},
	lih: {
		code: "lih",
		name: "Lihir",
	},
	lij: {
		code: "lij",
		name: "Ligurian",
	},
	lik: {
		code: "lik",
		name: "Lika",
	},
	lil: {
		code: "lil",
		name: "Lillooet",
	},
	lim: {
		code: "lim",
		name: "Limburgan",
	},
	lin: {
		code: "lin",
		name: "Lingala",
	},
	lio: {
		code: "lio",
		name: "Liki",
	},
	lip: {
		code: "lip",
		name: "Sekpele",
	},
	liq: {
		code: "liq",
		name: "Libido",
	},
	lir: {
		code: "lir",
		name: "Liberian English",
	},
	lis: {
		code: "lis",
		name: "Lisu",
	},
	lit: {
		code: "lit",
		name: "Lithuanian",
	},
	liu: {
		code: "liu",
		name: "Logorik",
	},
	liv: {
		code: "liv",
		name: "Liv",
	},
	liw: {
		code: "liw",
		name: "Col",
	},
	lix: {
		code: "lix",
		name: "Liabuku",
	},
	liy: {
		code: "liy",
		name: "Banda-Bambari",
	},
	liz: {
		code: "liz",
		name: "Libinza",
	},
	lja: {
		code: "lja",
		name: "Golpa",
	},
	lje: {
		code: "lje",
		name: "Rampi",
	},
	lji: {
		code: "lji",
		name: "Laiyolo",
	},
	ljl: {
		code: "ljl",
		name: "Li'o",
	},
	ljp: {
		code: "ljp",
		name: "Lampung Api",
	},
	ljw: {
		code: "ljw",
		name: "Yirandali",
	},
	ljx: {
		code: "ljx",
		name: "Yuru",
	},
	lka: {
		code: "lka",
		name: "Lakalei",
	},
	lkb: {
		code: "lkb",
		name: "Kabras",
	},
	lkc: {
		code: "lkc",
		name: "Kucong",
	},
	lkd: {
		code: "lkd",
		name: "Lakondê",
	},
	lke: {
		code: "lke",
		name: "Kenyi",
	},
	lkh: {
		code: "lkh",
		name: "Lakha",
	},
	lki: {
		code: "lki",
		name: "Laki",
	},
	lkj: {
		code: "lkj",
		name: "Remun",
	},
	lkl: {
		code: "lkl",
		name: "Laeko-Libuat",
	},
	lkm: {
		code: "lkm",
		name: "Kalaamaya",
	},
	lkn: {
		code: "lkn",
		name: "Lakon",
	},
	lko: {
		code: "lko",
		name: "Khayo",
	},
	lkr: {
		code: "lkr",
		name: "Päri",
	},
	lks: {
		code: "lks",
		name: "Kisa",
	},
	lkt: {
		code: "lkt",
		name: "Lakota",
	},
	lku: {
		code: "lku",
		name: "Kungkari",
	},
	lky: {
		code: "lky",
		name: "Lokoya",
	},
	lla: {
		code: "lla",
		name: "Lala-Roba",
	},
	llb: {
		code: "llb",
		name: "Lolo",
	},
	llc: {
		code: "llc",
		name: "Lele (Guinea)",
	},
	lld: {
		code: "lld",
		name: "Ladin",
	},
	lle: {
		code: "lle",
		name: "Lele (Papua New Guinea)",
	},
	llf: {
		code: "llf",
		name: "Hermit",
	},
	llg: {
		code: "llg",
		name: "Lole",
	},
	llh: {
		code: "llh",
		name: "Lamu",
	},
	lli: {
		code: "lli",
		name: "Teke-Laali",
	},
	llj: {
		code: "llj",
		name: "Ladji Ladji",
	},
	llk: {
		code: "llk",
		name: "Lelak",
	},
	lll: {
		code: "lll",
		name: "Lilau",
	},
	llm: {
		code: "llm",
		name: "Lasalimu",
	},
	lln: {
		code: "lln",
		name: "Lele (Chad)",
	},
	llp: {
		code: "llp",
		name: "North Efate",
	},
	llq: {
		code: "llq",
		name: "Lolak",
	},
	lls: {
		code: "lls",
		name: "Lithuanian Sign Language",
	},
	llu: {
		code: "llu",
		name: "Lau",
	},
	llx: {
		code: "llx",
		name: "Lauan",
	},
	lma: {
		code: "lma",
		name: "East Limba",
	},
	lmb: {
		code: "lmb",
		name: "Merei",
	},
	lmc: {
		code: "lmc",
		name: "Limilngan",
	},
	lmd: {
		code: "lmd",
		name: "Lumun",
	},
	lme: {
		code: "lme",
		name: "Pévé",
	},
	lmf: {
		code: "lmf",
		name: "South Lembata",
	},
	lmg: {
		code: "lmg",
		name: "Lamogai",
	},
	lmh: {
		code: "lmh",
		name: "Lambichhong",
	},
	lmi: {
		code: "lmi",
		name: "Lombi",
	},
	lmj: {
		code: "lmj",
		name: "West Lembata",
	},
	lmk: {
		code: "lmk",
		name: "Lamkang",
	},
	lml: {
		code: "lml",
		name: "Hano",
	},
	lmn: {
		code: "lmn",
		name: "Lambadi",
	},
	lmo: {
		code: "lmo",
		name: "Lombard",
	},
	lmp: {
		code: "lmp",
		name: "Limbum",
	},
	lmq: {
		code: "lmq",
		name: "Lamatuka",
	},
	lmr: {
		code: "lmr",
		name: "Lamalera",
	},
	lmu: {
		code: "lmu",
		name: "Lamenu",
	},
	lmv: {
		code: "lmv",
		name: "Lomaiviti",
	},
	lmw: {
		code: "lmw",
		name: "Lake Miwok",
	},
	lmx: {
		code: "lmx",
		name: "Laimbue",
	},
	lmy: {
		code: "lmy",
		name: "Lamboya",
	},
	lna: {
		code: "lna",
		name: "Langbashe",
	},
	lnb: {
		code: "lnb",
		name: "Mbalanhu",
	},
	lnd: {
		code: "lnd",
		name: "Lundayeh",
	},
	lng: {
		code: "lng",
		name: "Langobardic",
	},
	lnh: {
		code: "lnh",
		name: "Lanoh",
	},
	lni: {
		code: "lni",
		name: "Daantanai'",
	},
	lnj: {
		code: "lnj",
		name: "Leningitij",
	},
	lnl: {
		code: "lnl",
		name: "South Central Banda",
	},
	lnm: {
		code: "lnm",
		name: "Langam",
	},
	lnn: {
		code: "lnn",
		name: "Lorediakarkar",
	},
	lns: {
		code: "lns",
		name: "Lamnso'",
	},
	lnu: {
		code: "lnu",
		name: "Longuda",
	},
	lnw: {
		code: "lnw",
		name: "Lanima",
	},
	lnz: {
		code: "lnz",
		name: "Lonzo",
	},
	loa: {
		code: "loa",
		name: "Loloda",
	},
	lob: {
		code: "lob",
		name: "Lobi",
	},
	loc: {
		code: "loc",
		name: "Inonhan",
	},
	loe: {
		code: "loe",
		name: "Saluan",
	},
	lof: {
		code: "lof",
		name: "Logol",
	},
	log: {
		code: "log",
		name: "Logo",
	},
	loh: {
		code: "loh",
		name: "Laarim",
	},
	loi: {
		code: "loi",
		name: "Loma (Côte d'Ivoire)",
	},
	loj: {
		code: "loj",
		name: "Lou",
	},
	lok: {
		code: "lok",
		name: "Loko",
	},
	lol: {
		code: "lol",
		name: "Mongo",
	},
	lom: {
		code: "lom",
		name: "Loma (Liberia)",
	},
	lon: {
		code: "lon",
		name: "Malawi Lomwe",
	},
	loo: {
		code: "loo",
		name: "Lombo",
	},
	lop: {
		code: "lop",
		name: "Lopa",
	},
	loq: {
		code: "loq",
		name: "Lobala",
	},
	lor: {
		code: "lor",
		name: "Téén",
	},
	los: {
		code: "los",
		name: "Loniu",
	},
	lot: {
		code: "lot",
		name: "Otuho",
	},
	lou: {
		code: "lou",
		name: "Louisiana Creole",
	},
	lov: {
		code: "lov",
		name: "Lopi",
	},
	low: {
		code: "low",
		name: "Tampias Lobu",
	},
	lox: {
		code: "lox",
		name: "Loun",
	},
	loy: {
		code: "loy",
		name: "Loke",
	},
	loz: {
		code: "loz",
		name: "Lozi",
	},
	lpa: {
		code: "lpa",
		name: "Lelepa",
	},
	lpe: {
		code: "lpe",
		name: "Lepki",
	},
	lpn: {
		code: "lpn",
		name: "Long Phuri Naga",
	},
	lpo: {
		code: "lpo",
		name: "Lipo",
	},
	lpx: {
		code: "lpx",
		name: "Lopit",
	},
	lqr: {
		code: "lqr",
		name: "Logir",
	},
	lra: {
		code: "lra",
		name: "Rara Bakati'",
	},
	lrc: {
		code: "lrc",
		name: "Northern Luri",
	},
	lre: {
		code: "lre",
		name: "Laurentian",
	},
	lrg: {
		code: "lrg",
		name: "Laragia",
	},
	lri: {
		code: "lri",
		name: "Marachi",
	},
	lrk: {
		code: "lrk",
		name: "Loarki",
	},
	lrl: {
		code: "lrl",
		name: "Lari",
	},
	lrm: {
		code: "lrm",
		name: "Marama",
	},
	lrn: {
		code: "lrn",
		name: "Lorang",
	},
	lro: {
		code: "lro",
		name: "Laro",
	},
	lrr: {
		code: "lrr",
		name: "Southern Yamphu",
	},
	lrt: {
		code: "lrt",
		name: "Larantuka Malay",
	},
	lrv: {
		code: "lrv",
		name: "Larevat",
	},
	lrz: {
		code: "lrz",
		name: "Lemerig",
	},
	lsa: {
		code: "lsa",
		name: "Lasgerdi",
	},
	lsb: {
		code: "lsb",
		name: "Burundian Sign Language",
	},
	lsc: {
		code: "lsc",
		name: "Albarradas Sign Language",
	},
	lsd: {
		code: "lsd",
		name: "Lishana Deni",
	},
	lse: {
		code: "lse",
		name: "Lusengo",
	},
	lsh: {
		code: "lsh",
		name: "Lish",
	},
	lsi: {
		code: "lsi",
		name: "Lashi",
	},
	lsl: {
		code: "lsl",
		name: "Latvian Sign Language",
	},
	lsm: {
		code: "lsm",
		name: "Saamia",
	},
	lsn: {
		code: "lsn",
		name: "Tibetan Sign Language",
	},
	lso: {
		code: "lso",
		name: "Laos Sign Language",
	},
	lsp: {
		code: "lsp",
		name: "Panamanian Sign Language",
	},
	lsr: {
		code: "lsr",
		name: "Aruop",
	},
	lss: {
		code: "lss",
		name: "Lasi",
	},
	lst: {
		code: "lst",
		name: "Trinidad and Tobago Sign Language",
	},
	lsv: {
		code: "lsv",
		name: "Sivia Sign Language",
	},
	lsw: {
		code: "lsw",
		name: "Seychelles Sign Language",
	},
	lsy: {
		code: "lsy",
		name: "Mauritian Sign Language",
	},
	ltc: {
		code: "ltc",
		name: "Late Middle Chinese",
	},
	ltg: {
		code: "ltg",
		name: "Latgalian",
	},
	lth: {
		code: "lth",
		name: "Thur",
	},
	lti: {
		code: "lti",
		name: "Leti (Indonesia)",
	},
	ltn: {
		code: "ltn",
		name: "Latundê",
	},
	lto: {
		code: "lto",
		name: "Tsotso",
	},
	lts: {
		code: "lts",
		name: "Tachoni",
	},
	ltu: {
		code: "ltu",
		name: "Latu",
	},
	ltz: {
		code: "ltz",
		name: "Luxembourgish",
	},
	lua: {
		code: "lua",
		name: "Luba-Lulua",
	},
	lub: {
		code: "lub",
		name: "Luba-Katanga",
	},
	luc: {
		code: "luc",
		name: "Aringa",
	},
	lud: {
		code: "lud",
		name: "Ludian",
	},
	lue: {
		code: "lue",
		name: "Luvale",
	},
	luf: {
		code: "luf",
		name: "Laua",
	},
	lug: {
		code: "lug",
		name: "Ganda",
	},
	lui: {
		code: "lui",
		name: "Luiseno",
	},
	luj: {
		code: "luj",
		name: "Luna",
	},
	luk: {
		code: "luk",
		name: "Lunanakha",
	},
	lul: {
		code: "lul",
		name: "Olu'bo",
	},
	lum: {
		code: "lum",
		name: "Luimbi",
	},
	lun: {
		code: "lun",
		name: "Lunda",
	},
	luo: {
		code: "luo",
		name: "Luo (Kenya and Tanzania)",
	},
	lup: {
		code: "lup",
		name: "Lumbu",
	},
	luq: {
		code: "luq",
		name: "Lucumi",
	},
	lur: {
		code: "lur",
		name: "Laura",
	},
	lus: {
		code: "lus",
		name: "Lushai",
	},
	lut: {
		code: "lut",
		name: "Lushootseed",
	},
	luu: {
		code: "luu",
		name: "Lumba-Yakkha",
	},
	luv: {
		code: "luv",
		name: "Luwati",
	},
	luw: {
		code: "luw",
		name: "Luo (Cameroon)",
	},
	luy: {
		code: "luy",
		name: "Luyia",
	},
	luz: {
		code: "luz",
		name: "Southern Luri",
	},
	lva: {
		code: "lva",
		name: "Maku'a",
	},
	lvi: {
		code: "lvi",
		name: "Lavi",
	},
	lvk: {
		code: "lvk",
		name: "Lavukaleve",
	},
	lvl: {
		code: "lvl",
		name: "Lwel",
	},
	lvs: {
		code: "lvs",
		name: "Standard Latvian",
	},
	lvu: {
		code: "lvu",
		name: "Levuka",
	},
	lwa: {
		code: "lwa",
		name: "Lwalu",
	},
	lwe: {
		code: "lwe",
		name: "Lewo Eleng",
	},
	lwg: {
		code: "lwg",
		name: "Wanga",
	},
	lwh: {
		code: "lwh",
		name: "White Lachi",
	},
	lwl: {
		code: "lwl",
		name: "Eastern Lawa",
	},
	lwm: {
		code: "lwm",
		name: "Laomian",
	},
	lwo: {
		code: "lwo",
		name: "Luwo",
	},
	lws: {
		code: "lws",
		name: "Malawian Sign Language",
	},
	lwt: {
		code: "lwt",
		name: "Lewotobi",
	},
	lwu: {
		code: "lwu",
		name: "Lawu",
	},
	lww: {
		code: "lww",
		name: "Lewo",
	},
	lxm: {
		code: "lxm",
		name: "Lakurumau",
	},
	lya: {
		code: "lya",
		name: "Layakha",
	},
	lyg: {
		code: "lyg",
		name: "Lyngngam",
	},
	lyn: {
		code: "lyn",
		name: "Luyana",
	},
	lzh: {
		code: "lzh",
		name: "Literary Chinese",
		nativeName: "文言",
	},
	lzl: {
		code: "lzl",
		name: "Litzlitz",
	},
	lzn: {
		code: "lzn",
		name: "Leinong Naga",
	},
	lzz: {
		code: "lzz",
		name: "Laz",
	},
	maa: {
		code: "maa",
		name: "San Jerónimo Tecóatl Mazatec",
	},
	mab: {
		code: "mab",
		name: "Yutanduchi Mixtec",
	},
	mad: {
		code: "mad",
		name: "Madurese",
	},
	mae: {
		code: "mae",
		name: "Bo-Rukul",
	},
	maf: {
		code: "maf",
		name: "Mafa",
	},
	mag: {
		code: "mag",
		name: "Magahi",
	},
	mah: {
		code: "mah",
		name: "Marshallese",
	},
	mai: {
		code: "mai",
		name: "Maithili",
	},
	maj: {
		code: "maj",
		name: "Jalapa De Díaz Mazatec",
	},
	mak: {
		code: "mak",
		name: "Makasar",
	},
	mal: {
		code: "mal",
		name: "Malayalam",
	},
	mam: {
		code: "mam",
		name: "Mam",
	},
	man: {
		code: "man",
		name: "Mandingo",
	},
	maq: {
		code: "maq",
		name: "Chiquihuitlán Mazatec",
	},
	mar: {
		code: "mar",
		name: "Marathi",
	},
	mas: {
		code: "mas",
		name: "Masai",
	},
	mat: {
		code: "mat",
		name: "San Francisco Matlatzinca",
	},
	mau: {
		code: "mau",
		name: "Huautla Mazatec",
	},
	mav: {
		code: "mav",
		name: "Sateré-Mawé",
	},
	maw: {
		code: "maw",
		name: "Mampruli",
	},
	max: {
		code: "max",
		name: "North Moluccan Malay",
	},
	maz: {
		code: "maz",
		name: "Central Mazahua",
	},
	mba: {
		code: "mba",
		name: "Higaonon",
	},
	mbb: {
		code: "mbb",
		name: "Western Bukidnon Manobo",
	},
	mbc: {
		code: "mbc",
		name: "Macushi",
	},
	mbd: {
		code: "mbd",
		name: "Dibabawon Manobo",
	},
	mbe: {
		code: "mbe",
		name: "Molale",
	},
	mbf: {
		code: "mbf",
		name: "Baba Malay",
	},
	mbh: {
		code: "mbh",
		name: "Mangseng",
	},
	mbi: {
		code: "mbi",
		name: "Ilianen Manobo",
	},
	mbj: {
		code: "mbj",
		name: "Nadëb",
	},
	mbk: {
		code: "mbk",
		name: "Malol",
	},
	mbl: {
		code: "mbl",
		name: "Maxakalí",
	},
	mbm: {
		code: "mbm",
		name: "Ombamba",
	},
	mbn: {
		code: "mbn",
		name: "Macaguán",
	},
	mbo: {
		code: "mbo",
		name: "Mbo (Cameroon)",
	},
	mbp: {
		code: "mbp",
		name: "Malayo",
	},
	mbq: {
		code: "mbq",
		name: "Maisin",
	},
	mbr: {
		code: "mbr",
		name: "Nukak Makú",
	},
	mbs: {
		code: "mbs",
		name: "Sarangani Manobo",
	},
	mbt: {
		code: "mbt",
		name: "Matigsalug Manobo",
	},
	mbu: {
		code: "mbu",
		name: "Mbula-Bwazza",
	},
	mbv: {
		code: "mbv",
		name: "Mbulungish",
	},
	mbw: {
		code: "mbw",
		name: "Maring",
	},
	mbx: {
		code: "mbx",
		name: "Mari (East Sepik Province)",
	},
	mby: {
		code: "mby",
		name: "Memoni",
	},
	mbz: {
		code: "mbz",
		name: "Amoltepec Mixtec",
	},
	mca: {
		code: "mca",
		name: "Maca",
	},
	mcb: {
		code: "mcb",
		name: "Machiguenga",
	},
	mcc: {
		code: "mcc",
		name: "Bitur",
	},
	mcd: {
		code: "mcd",
		name: "Sharanahua",
	},
	mce: {
		code: "mce",
		name: "Itundujia Mixtec",
	},
	mcf: {
		code: "mcf",
		name: "Matsés",
	},
	mcg: {
		code: "mcg",
		name: "Mapoyo",
	},
	mch: {
		code: "mch",
		name: "Maquiritari",
	},
	mci: {
		code: "mci",
		name: "Mese",
	},
	mcj: {
		code: "mcj",
		name: "Mvanip",
	},
	mck: {
		code: "mck",
		name: "Mbunda",
	},
	mcl: {
		code: "mcl",
		name: "Macaguaje",
	},
	mcm: {
		code: "mcm",
		name: "Malaccan Creole Portuguese",
	},
	mcn: {
		code: "mcn",
		name: "Masana",
	},
	mco: {
		code: "mco",
		name: "Coatlán Mixe",
	},
	mcp: {
		code: "mcp",
		name: "Makaa",
	},
	mcq: {
		code: "mcq",
		name: "Ese",
	},
	mcr: {
		code: "mcr",
		name: "Menya",
	},
	mcs: {
		code: "mcs",
		name: "Mambai",
	},
	mct: {
		code: "mct",
		name: "Mengisa",
	},
	mcu: {
		code: "mcu",
		name: "Cameroon Mambila",
	},
	mcv: {
		code: "mcv",
		name: "Minanibai",
	},
	mcw: {
		code: "mcw",
		name: "Mawa (Chad)",
	},
	mcx: {
		code: "mcx",
		name: "Mpiemo",
	},
	mcy: {
		code: "mcy",
		name: "South Watut",
	},
	mcz: {
		code: "mcz",
		name: "Mawan",
	},
	mda: {
		code: "mda",
		name: "Mada (Nigeria)",
	},
	mdb: {
		code: "mdb",
		name: "Morigi",
	},
	mdc: {
		code: "mdc",
		name: "Male (Papua New Guinea)",
	},
	mdd: {
		code: "mdd",
		name: "Mbum",
	},
	mde: {
		code: "mde",
		name: "Maba (Chad)",
	},
	mdf: {
		code: "mdf",
		name: "Moksha",
	},
	mdg: {
		code: "mdg",
		name: "Massalat",
	},
	mdh: {
		code: "mdh",
		name: "Maguindanaon",
	},
	mdi: {
		code: "mdi",
		name: "Mamvu",
	},
	mdj: {
		code: "mdj",
		name: "Mangbetu",
	},
	mdk: {
		code: "mdk",
		name: "Mangbutu",
	},
	mdl: {
		code: "mdl",
		name: "Maltese Sign Language",
	},
	mdm: {
		code: "mdm",
		name: "Mayogo",
	},
	mdn: {
		code: "mdn",
		name: "Mbati",
	},
	mdp: {
		code: "mdp",
		name: "Mbala",
	},
	mdq: {
		code: "mdq",
		name: "Mbole",
	},
	mdr: {
		code: "mdr",
		name: "Mandar",
	},
	mds: {
		code: "mds",
		name: "Maria (Papua New Guinea)",
	},
	mdt: {
		code: "mdt",
		name: "Mbere",
	},
	mdu: {
		code: "mdu",
		name: "Mboko",
	},
	mdv: {
		code: "mdv",
		name: "Santa Lucía Monteverde Mixtec",
	},
	mdw: {
		code: "mdw",
		name: "Mbosi",
	},
	mdx: {
		code: "mdx",
		name: "Dizin",
	},
	mdy: {
		code: "mdy",
		name: "Male (Ethiopia)",
	},
	mdz: {
		code: "mdz",
		name: "Suruí Do Pará",
	},
	mea: {
		code: "mea",
		name: "Menka",
	},
	meb: {
		code: "meb",
		name: "Ikobi",
	},
	mec: {
		code: "mec",
		name: "Marra",
	},
	med: {
		code: "med",
		name: "Melpa",
	},
	mee: {
		code: "mee",
		name: "Mengen",
	},
	mef: {
		code: "mef",
		name: "Megam",
	},
	meh: {
		code: "meh",
		name: "Southwestern Tlaxiaco Mixtec",
	},
	mei: {
		code: "mei",
		name: "Midob",
	},
	mej: {
		code: "mej",
		name: "Meyah",
	},
	mek: {
		code: "mek",
		name: "Mekeo",
	},
	mel: {
		code: "mel",
		name: "Central Melanau",
	},
	mem: {
		code: "mem",
		name: "Mangala",
	},
	men: {
		code: "men",
		name: "Mende (Sierra Leone)",
	},
	meo: {
		code: "meo",
		name: "Kedah Malay",
	},
	mep: {
		code: "mep",
		name: "Miriwoong",
	},
	meq: {
		code: "meq",
		name: "Merey",
	},
	mer: {
		code: "mer",
		name: "Meru",
	},
	mes: {
		code: "mes",
		name: "Masmaje",
	},
	met: {
		code: "met",
		name: "Mato",
	},
	meu: {
		code: "meu",
		name: "Motu",
	},
	mev: {
		code: "mev",
		name: "Mano",
	},
	mew: {
		code: "mew",
		name: "Maaka",
	},
	mey: {
		code: "mey",
		name: "Hassaniyya",
	},
	mez: {
		code: "mez",
		name: "Menominee",
	},
	mfa: {
		code: "mfa",
		name: "Pattani Malay",
	},
	mfb: {
		code: "mfb",
		name: "Bangka",
	},
	mfc: {
		code: "mfc",
		name: "Mba",
	},
	mfd: {
		code: "mfd",
		name: "Mendankwe-Nkwen",
	},
	mfe: {
		code: "mfe",
		name: "Morisyen",
	},
	mff: {
		code: "mff",
		name: "Naki",
	},
	mfg: {
		code: "mfg",
		name: "Mogofin",
	},
	mfh: {
		code: "mfh",
		name: "Matal",
	},
	mfi: {
		code: "mfi",
		name: "Wandala",
	},
	mfj: {
		code: "mfj",
		name: "Mefele",
	},
	mfk: {
		code: "mfk",
		name: "North Mofu",
	},
	mfl: {
		code: "mfl",
		name: "Putai",
	},
	mfm: {
		code: "mfm",
		name: "Marghi South",
	},
	mfn: {
		code: "mfn",
		name: "Cross River Mbembe",
	},
	mfo: {
		code: "mfo",
		name: "Mbe",
	},
	mfp: {
		code: "mfp",
		name: "Makassar Malay",
	},
	mfq: {
		code: "mfq",
		name: "Moba",
	},
	mfr: {
		code: "mfr",
		name: "Marrithiyel",
	},
	mfs: {
		code: "mfs",
		name: "Mexican Sign Language",
	},
	mft: {
		code: "mft",
		name: "Mokerang",
	},
	mfu: {
		code: "mfu",
		name: "Mbwela",
	},
	mfv: {
		code: "mfv",
		name: "Mandjak",
	},
	mfw: {
		code: "mfw",
		name: "Mulaha",
	},
	mfx: {
		code: "mfx",
		name: "Melo",
	},
	mfy: {
		code: "mfy",
		name: "Mayo",
	},
	mfz: {
		code: "mfz",
		name: "Mabaan",
	},
	mga: {
		code: "mga",
		name: "Middle Irish (900-1200)",
	},
	mgb: {
		code: "mgb",
		name: "Mararit",
	},
	mgc: {
		code: "mgc",
		name: "Morokodo",
	},
	mgd: {
		code: "mgd",
		name: "Moru",
	},
	mge: {
		code: "mge",
		name: "Mango",
	},
	mgf: {
		code: "mgf",
		name: "Maklew",
	},
	mgg: {
		code: "mgg",
		name: "Mpumpong",
	},
	mgh: {
		code: "mgh",
		name: "Makhuwa-Meetto",
	},
	mgi: {
		code: "mgi",
		name: "Lijili",
	},
	mgj: {
		code: "mgj",
		name: "Abureni",
	},
	mgk: {
		code: "mgk",
		name: "Mawes",
	},
	mgl: {
		code: "mgl",
		name: "Maleu-Kilenge",
	},
	mgm: {
		code: "mgm",
		name: "Mambae",
	},
	mgn: {
		code: "mgn",
		name: "Mbangi",
	},
	mgo: {
		code: "mgo",
		name: "Meta'",
	},
	mgp: {
		code: "mgp",
		name: "Eastern Magar",
	},
	mgq: {
		code: "mgq",
		name: "Malila",
	},
	mgr: {
		code: "mgr",
		name: "Mambwe-Lungu",
	},
	mgs: {
		code: "mgs",
		name: "Manda (Tanzania)",
	},
	mgt: {
		code: "mgt",
		name: "Mongol",
	},
	mgu: {
		code: "mgu",
		name: "Mailu",
	},
	mgv: {
		code: "mgv",
		name: "Matengo",
	},
	mgw: {
		code: "mgw",
		name: "Matumbi",
	},
	mgy: {
		code: "mgy",
		name: "Mbunga",
	},
	mgz: {
		code: "mgz",
		name: "Mbugwe",
	},
	mha: {
		code: "mha",
		name: "Manda (India)",
	},
	mhb: {
		code: "mhb",
		name: "Mahongwe",
	},
	mhc: {
		code: "mhc",
		name: "Mocho",
	},
	mhd: {
		code: "mhd",
		name: "Mbugu",
	},
	mhe: {
		code: "mhe",
		name: "Besisi",
	},
	mhf: {
		code: "mhf",
		name: "Mamaa",
	},
	mhg: {
		code: "mhg",
		name: "Margu",
	},
	mhi: {
		code: "mhi",
		name: "Ma'di",
	},
	mhj: {
		code: "mhj",
		name: "Mogholi",
	},
	mhk: {
		code: "mhk",
		name: "Mungaka",
	},
	mhl: {
		code: "mhl",
		name: "Mauwake",
	},
	mhm: {
		code: "mhm",
		name: "Makhuwa-Moniga",
	},
	mhn: {
		code: "mhn",
		name: "Mócheno",
	},
	mho: {
		code: "mho",
		name: "Mashi (Zambia)",
	},
	mhp: {
		code: "mhp",
		name: "Balinese Malay",
	},
	mhq: {
		code: "mhq",
		name: "Mandan",
	},
	mhr: {
		code: "mhr",
		name: "Eastern Mari",
		nativeName: "олык марий",
	},
	mhs: {
		code: "mhs",
		name: "Buru (Indonesia)",
	},
	mht: {
		code: "mht",
		name: "Mandahuaca",
	},
	mhu: {
		code: "mhu",
		name: "Digaro-Mishmi",
	},
	mhw: {
		code: "mhw",
		name: "Mbukushu",
	},
	mhx: {
		code: "mhx",
		name: "Maru",
	},
	mhy: {
		code: "mhy",
		name: "Ma'anyan",
	},
	mhz: {
		code: "mhz",
		name: "Mor (Mor Islands)",
	},
	mia: {
		code: "mia",
		name: "Miami",
	},
	mib: {
		code: "mib",
		name: "Atatláhuca Mixtec",
	},
	mic: {
		code: "mic",
		name: "Mi'kmaq",
	},
	mid: {
		code: "mid",
		name: "Mandaic",
	},
	mie: {
		code: "mie",
		name: "Ocotepec Mixtec",
	},
	mif: {
		code: "mif",
		name: "Mofu-Gudur",
	},
	mig: {
		code: "mig",
		name: "San Miguel El Grande Mixtec",
	},
	mih: {
		code: "mih",
		name: "Chayuco Mixtec",
	},
	mii: {
		code: "mii",
		name: "Chigmecatitlán Mixtec",
	},
	mij: {
		code: "mij",
		name: "Abar",
	},
	mik: {
		code: "mik",
		name: "Mikasuki",
	},
	mil: {
		code: "mil",
		name: "Peñoles Mixtec",
	},
	mim: {
		code: "mim",
		name: "Alacatlatzala Mixtec",
	},
	min: {
		code: "min",
		name: "Minangkabau",
	},
	mio: {
		code: "mio",
		name: "Pinotepa Nacional Mixtec",
	},
	mip: {
		code: "mip",
		name: "Apasco-Apoala Mixtec",
	},
	miq: {
		code: "miq",
		name: "Mískito",
	},
	mir: {
		code: "mir",
		name: "Isthmus Mixe",
	},
	mis: {
		code: "mis",
		name: "Uncoded languages",
	},
	mit: {
		code: "mit",
		name: "Southern Puebla Mixtec",
	},
	miu: {
		code: "miu",
		name: "Cacaloxtepec Mixtec",
	},
	miw: {
		code: "miw",
		name: "Akoye",
	},
	mix: {
		code: "mix",
		name: "Mixtepec Mixtec",
	},
	miy: {
		code: "miy",
		name: "Ayutla Mixtec",
	},
	miz: {
		code: "miz",
		name: "Coatzospan Mixtec",
	},
	mjb: {
		code: "mjb",
		name: "Makalero",
	},
	mjc: {
		code: "mjc",
		name: "San Juan Colorado Mixtec",
	},
	mjd: {
		code: "mjd",
		name: "Northwest Maidu",
	},
	mje: {
		code: "mje",
		name: "Muskum",
	},
	mjg: {
		code: "mjg",
		name: "Tu",
	},
	mjh: {
		code: "mjh",
		name: "Mwera (Nyasa)",
	},
	mji: {
		code: "mji",
		name: "Kim Mun",
	},
	mjj: {
		code: "mjj",
		name: "Mawak",
	},
	mjk: {
		code: "mjk",
		name: "Matukar",
	},
	mjl: {
		code: "mjl",
		name: "Mandeali",
	},
	mjm: {
		code: "mjm",
		name: "Medebur",
	},
	mjn: {
		code: "mjn",
		name: "Ma (Papua New Guinea)",
	},
	mjo: {
		code: "mjo",
		name: "Malankuravan",
	},
	mjp: {
		code: "mjp",
		name: "Malapandaram",
	},
	mjq: {
		code: "mjq",
		name: "Malaryan",
	},
	mjr: {
		code: "mjr",
		name: "Malavedan",
	},
	mjs: {
		code: "mjs",
		name: "Miship",
	},
	mjt: {
		code: "mjt",
		name: "Sauria Paharia",
	},
	mju: {
		code: "mju",
		name: "Manna-Dora",
	},
	mjv: {
		code: "mjv",
		name: "Mannan",
	},
	mjw: {
		code: "mjw",
		name: "Karbi",
	},
	mjx: {
		code: "mjx",
		name: "Mahali",
	},
	mjy: {
		code: "mjy",
		name: "Mahican",
	},
	mjz: {
		code: "mjz",
		name: "Majhi",
	},
	mka: {
		code: "mka",
		name: "Mbre",
	},
	mkb: {
		code: "mkb",
		name: "Mal Paharia",
	},
	mkc: {
		code: "mkc",
		name: "Siliput",
	},
	mkd: {
		code: "mkd",
		name: "Macedonian",
	},
	mke: {
		code: "mke",
		name: "Mawchi",
	},
	mkf: {
		code: "mkf",
		name: "Miya",
	},
	mkg: {
		code: "mkg",
		name: "Mak (China)",
	},
	mki: {
		code: "mki",
		name: "Dhatki",
	},
	mkj: {
		code: "mkj",
		name: "Mokilese",
	},
	mkk: {
		code: "mkk",
		name: "Byep",
	},
	mkl: {
		code: "mkl",
		name: "Mokole",
	},
	mkm: {
		code: "mkm",
		name: "Moklen",
	},
	mkn: {
		code: "mkn",
		name: "Kupang Malay",
	},
	mko: {
		code: "mko",
		name: "Mingang Doso",
	},
	mkp: {
		code: "mkp",
		name: "Moikodi",
	},
	mkq: {
		code: "mkq",
		name: "Bay Miwok",
	},
	mkr: {
		code: "mkr",
		name: "Malas",
	},
	mks: {
		code: "mks",
		name: "Silacayoapan Mixtec",
	},
	mkt: {
		code: "mkt",
		name: "Vamale",
	},
	mku: {
		code: "mku",
		name: "Konyanka Maninka",
	},
	mkv: {
		code: "mkv",
		name: "Mafea",
	},
	mkw: {
		code: "mkw",
		name: "Kituba (Congo)",
	},
	mkx: {
		code: "mkx",
		name: "Kinamiging Manobo",
	},
	mky: {
		code: "mky",
		name: "East Makian",
	},
	mkz: {
		code: "mkz",
		name: "Makasae",
	},
	mla: {
		code: "mla",
		name: "Malo",
	},
	mlb: {
		code: "mlb",
		name: "Mbule",
	},
	mlc: {
		code: "mlc",
		name: "Cao Lan",
	},
	mle: {
		code: "mle",
		name: "Manambu",
	},
	mlf: {
		code: "mlf",
		name: "Mal",
	},
	mlg: {
		code: "mlg",
		name: "Malagasy",
	},
	mlh: {
		code: "mlh",
		name: "Mape",
	},
	mli: {
		code: "mli",
		name: "Malimpung",
	},
	mlj: {
		code: "mlj",
		name: "Miltu",
	},
	mlk: {
		code: "mlk",
		name: "Ilwana",
	},
	mll: {
		code: "mll",
		name: "Malua Bay",
	},
	mlm: {
		code: "mlm",
		name: "Mulam",
	},
	mln: {
		code: "mln",
		name: "Malango",
	},
	mlo: {
		code: "mlo",
		name: "Mlomp",
	},
	mlp: {
		code: "mlp",
		name: "Bargam",
	},
	mlq: {
		code: "mlq",
		name: "Western Maninkakan",
	},
	mlr: {
		code: "mlr",
		name: "Vame",
	},
	mls: {
		code: "mls",
		name: "Masalit",
	},
	mlt: {
		code: "mlt",
		name: "Maltese",
	},
	mlu: {
		code: "mlu",
		name: "To'abaita",
	},
	mlv: {
		code: "mlv",
		name: "Motlav",
	},
	mlw: {
		code: "mlw",
		name: "Moloko",
	},
	mlx: {
		code: "mlx",
		name: "Malfaxal",
	},
	mlz: {
		code: "mlz",
		name: "Malaynon",
	},
	mma: {
		code: "mma",
		name: "Mama",
	},
	mmb: {
		code: "mmb",
		name: "Momina",
	},
	mmc: {
		code: "mmc",
		name: "Michoacán Mazahua",
	},
	mmd: {
		code: "mmd",
		name: "Maonan",
	},
	mme: {
		code: "mme",
		name: "Mae",
	},
	mmf: {
		code: "mmf",
		name: "Mundat",
	},
	mmg: {
		code: "mmg",
		name: "North Ambrym",
	},
	mmh: {
		code: "mmh",
		name: "Mehináku",
	},
	mmi: {
		code: "mmi",
		name: "Musar",
	},
	mmj: {
		code: "mmj",
		name: "Majhwar",
	},
	mmk: {
		code: "mmk",
		name: "Mukha-Dora",
	},
	mml: {
		code: "mml",
		name: "Man Met",
	},
	mmm: {
		code: "mmm",
		name: "Maii",
	},
	mmn: {
		code: "mmn",
		name: "Mamanwa",
	},
	mmo: {
		code: "mmo",
		name: "Mangga Buang",
	},
	mmp: {
		code: "mmp",
		name: "Siawi",
	},
	mmq: {
		code: "mmq",
		name: "Musak",
	},
	mmr: {
		code: "mmr",
		name: "Western Xiangxi Miao",
	},
	mmt: {
		code: "mmt",
		name: "Malalamai",
	},
	mmu: {
		code: "mmu",
		name: "Mmaala",
	},
	mmv: {
		code: "mmv",
		name: "Miriti",
	},
	mmw: {
		code: "mmw",
		name: "Emae",
	},
	mmx: {
		code: "mmx",
		name: "Madak",
	},
	mmy: {
		code: "mmy",
		name: "Migaama",
	},
	mmz: {
		code: "mmz",
		name: "Mabaale",
	},
	mna: {
		code: "mna",
		name: "Mbula",
	},
	mnb: {
		code: "mnb",
		name: "Muna",
	},
	mnc: {
		code: "mnc",
		name: "Manchu",
	},
	mnd: {
		code: "mnd",
		name: "Mondé",
	},
	mne: {
		code: "mne",
		name: "Naba",
	},
	mnf: {
		code: "mnf",
		name: "Mundani",
	},
	mng: {
		code: "mng",
		name: "Eastern Mnong",
	},
	mnh: {
		code: "mnh",
		name: "Mono (Democratic Republic of Congo)",
	},
	mni: {
		code: "mni",
		name: "Manipuri",
	},
	mnj: {
		code: "mnj",
		name: "Munji",
	},
	mnk: {
		code: "mnk",
		name: "Mandinka",
	},
	mnl: {
		code: "mnl",
		name: "Tiale",
	},
	mnm: {
		code: "mnm",
		name: "Mapena",
	},
	mnn: {
		code: "mnn",
		name: "Southern Mnong",
	},
	mnp: {
		code: "mnp",
		name: "Min Bei Chinese",
	},
	mnq: {
		code: "mnq",
		name: "Minriq",
	},
	mnr: {
		code: "mnr",
		name: "Mono (USA)",
	},
	mns: {
		code: "mns",
		name: "Mansi",
	},
	mnu: {
		code: "mnu",
		name: "Mer",
	},
	mnv: {
		code: "mnv",
		name: "Rennell-Bellona",
	},
	mnw: {
		code: "mnw",
		name: "Mon",
	},
	mnx: {
		code: "mnx",
		name: "Manikion",
	},
	mny: {
		code: "mny",
		name: "Manyawa",
	},
	mnz: {
		code: "mnz",
		name: "Moni",
	},
	moa: {
		code: "moa",
		name: "Mwan",
	},
	moc: {
		code: "moc",
		name: "Mocoví",
	},
	mod: {
		code: "mod",
		name: "Mobilian",
	},
	moe: {
		code: "moe",
		name: "Innu",
	},
	mog: {
		code: "mog",
		name: "Mongondow",
	},
	moh: {
		code: "moh",
		name: "Mohawk",
	},
	moi: {
		code: "moi",
		name: "Mboi",
	},
	moj: {
		code: "moj",
		name: "Monzombo",
	},
	mok: {
		code: "mok",
		name: "Morori",
	},
	mom: {
		code: "mom",
		name: "Mangue",
	},
	mon: {
		code: "mon",
		name: "Mongolian",
	},
	moo: {
		code: "moo",
		name: "Monom",
	},
	mop: {
		code: "mop",
		name: "Mopán Maya",
	},
	moq: {
		code: "moq",
		name: "Mor (Bomberai Peninsula)",
	},
	mor: {
		code: "mor",
		name: "Moro",
	},
	mos: {
		code: "mos",
		name: "Mossi",
	},
	mot: {
		code: "mot",
		name: "Barí",
	},
	mou: {
		code: "mou",
		name: "Mogum",
	},
	mov: {
		code: "mov",
		name: "Mohave",
	},
	mow: {
		code: "mow",
		name: "Moi (Congo)",
	},
	mox: {
		code: "mox",
		name: "Molima",
	},
	moy: {
		code: "moy",
		name: "Shekkacho",
	},
	moz: {
		code: "moz",
		name: "Mukulu",
	},
	mpa: {
		code: "mpa",
		name: "Mpoto",
	},
	mpb: {
		code: "mpb",
		name: "Malak Malak",
	},
	mpc: {
		code: "mpc",
		name: "Mangarrayi",
	},
	mpd: {
		code: "mpd",
		name: "Machinere",
	},
	mpe: {
		code: "mpe",
		name: "Majang",
	},
	mpg: {
		code: "mpg",
		name: "Marba",
	},
	mph: {
		code: "mph",
		name: "Maung",
	},
	mpi: {
		code: "mpi",
		name: "Mpade",
	},
	mpj: {
		code: "mpj",
		name: "Martu Wangka",
	},
	mpk: {
		code: "mpk",
		name: "Mbara (Chad)",
	},
	mpl: {
		code: "mpl",
		name: "Middle Watut",
	},
	mpm: {
		code: "mpm",
		name: "Yosondúa Mixtec",
	},
	mpn: {
		code: "mpn",
		name: "Mindiri",
	},
	mpo: {
		code: "mpo",
		name: "Miu",
	},
	mpp: {
		code: "mpp",
		name: "Migabac",
	},
	mpq: {
		code: "mpq",
		name: "Matís",
	},
	mpr: {
		code: "mpr",
		name: "Vangunu",
	},
	mps: {
		code: "mps",
		name: "Dadibi",
	},
	mpt: {
		code: "mpt",
		name: "Mian",
	},
	mpu: {
		code: "mpu",
		name: "Makuráp",
	},
	mpv: {
		code: "mpv",
		name: "Mungkip",
	},
	mpw: {
		code: "mpw",
		name: "Mapidian",
	},
	mpx: {
		code: "mpx",
		name: "Misima-Panaeati",
	},
	mpy: {
		code: "mpy",
		name: "Mapia",
	},
	mpz: {
		code: "mpz",
		name: "Mpi",
	},
	mqa: {
		code: "mqa",
		name: "Maba (Indonesia)",
	},
	mqb: {
		code: "mqb",
		name: "Mbuko",
	},
	mqc: {
		code: "mqc",
		name: "Mangole",
	},
	mqe: {
		code: "mqe",
		name: "Matepi",
	},
	mqf: {
		code: "mqf",
		name: "Momuna",
	},
	mqg: {
		code: "mqg",
		name: "Kota Bangun Kutai Malay",
	},
	mqh: {
		code: "mqh",
		name: "Tlazoyaltepec Mixtec",
	},
	mqi: {
		code: "mqi",
		name: "Mariri",
	},
	mqj: {
		code: "mqj",
		name: "Mamasa",
	},
	mqk: {
		code: "mqk",
		name: "Rajah Kabunsuwan Manobo",
	},
	mql: {
		code: "mql",
		name: "Mbelime",
	},
	mqm: {
		code: "mqm",
		name: "South Marquesan",
	},
	mqn: {
		code: "mqn",
		name: "Moronene",
	},
	mqo: {
		code: "mqo",
		name: "Modole",
	},
	mqp: {
		code: "mqp",
		name: "Manipa",
	},
	mqq: {
		code: "mqq",
		name: "Minokok",
	},
	mqr: {
		code: "mqr",
		name: "Mander",
	},
	mqs: {
		code: "mqs",
		name: "West Makian",
	},
	mqt: {
		code: "mqt",
		name: "Mok",
	},
	mqu: {
		code: "mqu",
		name: "Mandari",
	},
	mqv: {
		code: "mqv",
		name: "Mosimo",
	},
	mqw: {
		code: "mqw",
		name: "Murupi",
	},
	mqx: {
		code: "mqx",
		name: "Mamuju",
	},
	mqy: {
		code: "mqy",
		name: "Manggarai",
	},
	mqz: {
		code: "mqz",
		name: "Pano",
	},
	mra: {
		code: "mra",
		name: "Mlabri",
	},
	mrb: {
		code: "mrb",
		name: "Marino",
	},
	mrc: {
		code: "mrc",
		name: "Maricopa",
	},
	mrd: {
		code: "mrd",
		name: "Western Magar",
	},
	mre: {
		code: "mre",
		name: "Martha's Vineyard Sign Language",
	},
	mrf: {
		code: "mrf",
		name: "Elseng",
	},
	mrg: {
		code: "mrg",
		name: "Mising",
	},
	mrh: {
		code: "mrh",
		name: "Mara Chin",
	},
	mri: {
		code: "mri",
		name: "Maori",
	},
	mrj: {
		code: "mrj",
		name: "Western Mari",
	},
	mrk: {
		code: "mrk",
		name: "Hmwaveke",
	},
	mrl: {
		code: "mrl",
		name: "Mortlockese",
	},
	mrm: {
		code: "mrm",
		name: "Merlav",
	},
	mrn: {
		code: "mrn",
		name: "Cheke Holo",
	},
	mro: {
		code: "mro",
		name: "Mru",
	},
	mrp: {
		code: "mrp",
		name: "Morouas",
	},
	mrq: {
		code: "mrq",
		name: "North Marquesan",
	},
	mrr: {
		code: "mrr",
		name: "Maria (India)",
	},
	mrs: {
		code: "mrs",
		name: "Maragus",
	},
	mrt: {
		code: "mrt",
		name: "Marghi Central",
	},
	mru: {
		code: "mru",
		name: "Mono (Cameroon)",
	},
	mrv: {
		code: "mrv",
		name: "Mangareva",
	},
	mrw: {
		code: "mrw",
		name: "Maranao",
	},
	mrx: {
		code: "mrx",
		name: "Maremgi",
	},
	mry: {
		code: "mry",
		name: "Mandaya",
	},
	mrz: {
		code: "mrz",
		name: "Marind",
	},
	msa: {
		code: "msa",
		name: "Malay (macrolanguage)",
	},
	msb: {
		code: "msb",
		name: "Masbatenyo",
	},
	msc: {
		code: "msc",
		name: "Sankaran Maninka",
	},
	msd: {
		code: "msd",
		name: "Yucatec Maya Sign Language",
	},
	mse: {
		code: "mse",
		name: "Musey",
	},
	msf: {
		code: "msf",
		name: "Mekwei",
	},
	msg: {
		code: "msg",
		name: "Moraid",
	},
	msh: {
		code: "msh",
		name: "Masikoro Malagasy",
	},
	msi: {
		code: "msi",
		name: "Sabah Malay",
	},
	msj: {
		code: "msj",
		name: "Ma (Democratic Republic of Congo)",
	},
	msk: {
		code: "msk",
		name: "Mansaka",
	},
	msl: {
		code: "msl",
		name: "Molof",
	},
	msm: {
		code: "msm",
		name: "Agusan Manobo",
	},
	msn: {
		code: "msn",
		name: "Vurës",
	},
	mso: {
		code: "mso",
		name: "Mombum",
	},
	msp: {
		code: "msp",
		name: "Maritsauá",
	},
	msq: {
		code: "msq",
		name: "Caac",
	},
	msr: {
		code: "msr",
		name: "Mongolian Sign Language",
	},
	mss: {
		code: "mss",
		name: "West Masela",
	},
	msu: {
		code: "msu",
		name: "Musom",
	},
	msv: {
		code: "msv",
		name: "Maslam",
	},
	msw: {
		code: "msw",
		name: "Mansoanka",
	},
	msx: {
		code: "msx",
		name: "Moresada",
	},
	msy: {
		code: "msy",
		name: "Aruamu",
	},
	msz: {
		code: "msz",
		name: "Momare",
	},
	mta: {
		code: "mta",
		name: "Cotabato Manobo",
	},
	mtb: {
		code: "mtb",
		name: "Anyin Morofo",
	},
	mtc: {
		code: "mtc",
		name: "Munit",
	},
	mtd: {
		code: "mtd",
		name: "Mualang",
	},
	mte: {
		code: "mte",
		name: "Mono (Solomon Islands)",
	},
	mtf: {
		code: "mtf",
		name: "Murik (Papua New Guinea)",
	},
	mtg: {
		code: "mtg",
		name: "Una",
	},
	mth: {
		code: "mth",
		name: "Munggui",
	},
	mti: {
		code: "mti",
		name: "Maiwa (Papua New Guinea)",
	},
	mtj: {
		code: "mtj",
		name: "Moskona",
	},
	mtk: {
		code: "mtk",
		name: "Mbe'",
	},
	mtl: {
		code: "mtl",
		name: "Montol",
	},
	mtm: {
		code: "mtm",
		name: "Mator",
	},
	mtn: {
		code: "mtn",
		name: "Matagalpa",
	},
	mto: {
		code: "mto",
		name: "Totontepec Mixe",
	},
	mtp: {
		code: "mtp",
		name: "Wichí Lhamtés Nocten",
	},
	mtq: {
		code: "mtq",
		name: "Muong",
	},
	mtr: {
		code: "mtr",
		name: "Mewari",
	},
	mts: {
		code: "mts",
		name: "Yora",
	},
	mtt: {
		code: "mtt",
		name: "Mota",
	},
	mtu: {
		code: "mtu",
		name: "Tututepec Mixtec",
	},
	mtv: {
		code: "mtv",
		name: "Asaro'o",
	},
	mtw: {
		code: "mtw",
		name: "Southern Binukidnon",
	},
	mtx: {
		code: "mtx",
		name: "Tidaá Mixtec",
	},
	mty: {
		code: "mty",
		name: "Nabi",
	},
	mua: {
		code: "mua",
		name: "Mundang",
	},
	mub: {
		code: "mub",
		name: "Mubi",
	},
	muc: {
		code: "muc",
		name: "Ajumbu",
	},
	mud: {
		code: "mud",
		name: "Mednyj Aleut",
	},
	mue: {
		code: "mue",
		name: "Media Lengua",
	},
	mug: {
		code: "mug",
		name: "Musgu",
	},
	muh: {
		code: "muh",
		name: "Mündü",
	},
	mui: {
		code: "mui",
		name: "Musi",
	},
	muj: {
		code: "muj",
		name: "Mabire",
	},
	muk: {
		code: "muk",
		name: "Mugom",
	},
	mul: {
		code: "mul",
		name: "Multiple languages",
	},
	mum: {
		code: "mum",
		name: "Maiwala",
	},
	muo: {
		code: "muo",
		name: "Nyong",
	},
	mup: {
		code: "mup",
		name: "Malvi",
	},
	muq: {
		code: "muq",
		name: "Eastern Xiangxi Miao",
	},
	mur: {
		code: "mur",
		name: "Murle",
	},
	mus: {
		code: "mus",
		name: "Creek",
	},
	mut: {
		code: "mut",
		name: "Western Muria",
	},
	muu: {
		code: "muu",
		name: "Yaaku",
	},
	muv: {
		code: "muv",
		name: "Muthuvan",
	},
	mux: {
		code: "mux",
		name: "Bo-Ung",
	},
	muy: {
		code: "muy",
		name: "Muyang",
	},
	muz: {
		code: "muz",
		name: "Mursi",
	},
	mva: {
		code: "mva",
		name: "Manam",
	},
	mvb: {
		code: "mvb",
		name: "Mattole",
	},
	mvd: {
		code: "mvd",
		name: "Mamboru",
	},
	mve: {
		code: "mve",
		name: "Marwari (Pakistan)",
	},
	mvf: {
		code: "mvf",
		name: "Peripheral Mongolian",
	},
	mvg: {
		code: "mvg",
		name: "Yucuañe Mixtec",
	},
	mvh: {
		code: "mvh",
		name: "Mulgi",
	},
	mvi: {
		code: "mvi",
		name: "Miyako",
	},
	mvk: {
		code: "mvk",
		name: "Mekmek",
	},
	mvl: {
		code: "mvl",
		name: "Mbara (Australia)",
	},
	mvn: {
		code: "mvn",
		name: "Minaveha",
	},
	mvo: {
		code: "mvo",
		name: "Marovo",
	},
	mvp: {
		code: "mvp",
		name: "Duri",
	},
	mvq: {
		code: "mvq",
		name: "Moere",
	},
	mvr: {
		code: "mvr",
		name: "Marau",
	},
	mvs: {
		code: "mvs",
		name: "Massep",
	},
	mvt: {
		code: "mvt",
		name: "Mpotovoro",
	},
	mvu: {
		code: "mvu",
		name: "Marfa",
	},
	mvv: {
		code: "mvv",
		name: "Tagal Murut",
	},
	mvw: {
		code: "mvw",
		name: "Machinga",
	},
	mvx: {
		code: "mvx",
		name: "Meoswar",
	},
	mvy: {
		code: "mvy",
		name: "Indus Kohistani",
	},
	mvz: {
		code: "mvz",
		name: "Mesqan",
	},
	mwa: {
		code: "mwa",
		name: "Mwatebu",
	},
	mwb: {
		code: "mwb",
		name: "Juwal",
	},
	mwc: {
		code: "mwc",
		name: "Are",
	},
	mwe: {
		code: "mwe",
		name: "Mwera (Chimwera)",
	},
	mwf: {
		code: "mwf",
		name: "Murrinh-Patha",
	},
	mwg: {
		code: "mwg",
		name: "Aiklep",
	},
	mwh: {
		code: "mwh",
		name: "Mouk-Aria",
	},
	mwi: {
		code: "mwi",
		name: "Labo",
	},
	mwk: {
		code: "mwk",
		name: "Kita Maninkakan",
	},
	mwl: {
		code: "mwl",
		name: "Mirandese",
	},
	mwm: {
		code: "mwm",
		name: "Sar",
	},
	mwn: {
		code: "mwn",
		name: "Nyamwanga",
	},
	mwo: {
		code: "mwo",
		name: "Central Maewo",
	},
	mwp: {
		code: "mwp",
		name: "Kala Lagaw Ya",
	},
	mwq: {
		code: "mwq",
		name: "Mün Chin",
	},
	mwr: {
		code: "mwr",
		name: "Marwari",
	},
	mws: {
		code: "mws",
		name: "Mwimbi-Muthambi",
	},
	mwt: {
		code: "mwt",
		name: "Moken",
	},
	mwu: {
		code: "mwu",
		name: "Mittu",
	},
	mwv: {
		code: "mwv",
		name: "Mentawai",
	},
	mww: {
		code: "mww",
		name: "Hmong Daw",
	},
	mwz: {
		code: "mwz",
		name: "Moingi",
	},
	mxa: {
		code: "mxa",
		name: "Northwest Oaxaca Mixtec",
	},
	mxb: {
		code: "mxb",
		name: "Tezoatlán Mixtec",
	},
	mxc: {
		code: "mxc",
		name: "Manyika",
	},
	mxd: {
		code: "mxd",
		name: "Modang",
	},
	mxe: {
		code: "mxe",
		name: "Mele-Fila",
	},
	mxf: {
		code: "mxf",
		name: "Malgbe",
	},
	mxg: {
		code: "mxg",
		name: "Mbangala",
	},
	mxh: {
		code: "mxh",
		name: "Mvuba",
	},
	mxi: {
		code: "mxi",
		name: "Mozarabic",
	},
	mxj: {
		code: "mxj",
		name: "Miju-Mishmi",
	},
	mxk: {
		code: "mxk",
		name: "Monumbo",
	},
	mxl: {
		code: "mxl",
		name: "Maxi Gbe",
	},
	mxm: {
		code: "mxm",
		name: "Meramera",
	},
	mxn: {
		code: "mxn",
		name: "Moi (Indonesia)",
	},
	mxo: {
		code: "mxo",
		name: "Mbowe",
	},
	mxp: {
		code: "mxp",
		name: "Tlahuitoltepec Mixe",
	},
	mxq: {
		code: "mxq",
		name: "Juquila Mixe",
	},
	mxr: {
		code: "mxr",
		name: "Murik (Malaysia)",
	},
	mxs: {
		code: "mxs",
		name: "Huitepec Mixtec",
	},
	mxt: {
		code: "mxt",
		name: "Jamiltepec Mixtec",
	},
	mxu: {
		code: "mxu",
		name: "Mada (Cameroon)",
	},
	mxv: {
		code: "mxv",
		name: "Metlatónoc Mixtec",
	},
	mxw: {
		code: "mxw",
		name: "Namo",
	},
	mxx: {
		code: "mxx",
		name: "Mahou",
	},
	mxy: {
		code: "mxy",
		name: "Southeastern Nochixtlán Mixtec",
	},
	mxz: {
		code: "mxz",
		name: "Central Masela",
	},
	mya: {
		code: "mya",
		name: "Burmese",
	},
	myb: {
		code: "myb",
		name: "Mbay",
	},
	myc: {
		code: "myc",
		name: "Mayeka",
	},
	mye: {
		code: "mye",
		name: "Myene",
	},
	myf: {
		code: "myf",
		name: "Bambassi",
	},
	myg: {
		code: "myg",
		name: "Manta",
	},
	myh: {
		code: "myh",
		name: "Makah",
	},
	myj: {
		code: "myj",
		name: "Mangayat",
	},
	myk: {
		code: "myk",
		name: "Mamara Senoufo",
	},
	myl: {
		code: "myl",
		name: "Moma",
	},
	mym: {
		code: "mym",
		name: "Me'en",
	},
	myo: {
		code: "myo",
		name: "Anfillo",
	},
	myp: {
		code: "myp",
		name: "Pirahã",
	},
	myr: {
		code: "myr",
		name: "Muniche",
	},
	mys: {
		code: "mys",
		name: "Mesmes",
	},
	myu: {
		code: "myu",
		name: "Mundurukú",
	},
	myv: {
		code: "myv",
		name: "Erzya",
		nativeName: "эрзянь кель",
	},
	myw: {
		code: "myw",
		name: "Muyuw",
	},
	myx: {
		code: "myx",
		name: "Masaaba",
	},
	myy: {
		code: "myy",
		name: "Macuna",
	},
	myz: {
		code: "myz",
		name: "Classical Mandaic",
	},
	mza: {
		code: "mza",
		name: "Santa María Zacatepec Mixtec",
	},
	mzb: {
		code: "mzb",
		name: "Tumzabt",
	},
	mzc: {
		code: "mzc",
		name: "Madagascar Sign Language",
	},
	mzd: {
		code: "mzd",
		name: "Malimba",
	},
	mze: {
		code: "mze",
		name: "Morawa",
	},
	mzg: {
		code: "mzg",
		name: "Monastic Sign Language",
	},
	mzh: {
		code: "mzh",
		name: "Wichí Lhamtés Güisnay",
	},
	mzi: {
		code: "mzi",
		name: "Ixcatlán Mazatec",
	},
	mzj: {
		code: "mzj",
		name: "Manya",
	},
	mzk: {
		code: "mzk",
		name: "Nigeria Mambila",
	},
	mzl: {
		code: "mzl",
		name: "Mazatlán Mixe",
	},
	mzm: {
		code: "mzm",
		name: "Mumuye",
	},
	mzn: {
		code: "mzn",
		name: "Mazanderani",
	},
	mzo: {
		code: "mzo",
		name: "Matipuhy",
	},
	mzp: {
		code: "mzp",
		name: "Movima",
	},
	mzq: {
		code: "mzq",
		name: "Mori Atas",
	},
	mzr: {
		code: "mzr",
		name: "Marúbo",
	},
	mzs: {
		code: "mzs",
		name: "Macanese",
	},
	mzt: {
		code: "mzt",
		name: "Mintil",
	},
	mzu: {
		code: "mzu",
		name: "Inapang",
	},
	mzv: {
		code: "mzv",
		name: "Manza",
	},
	mzw: {
		code: "mzw",
		name: "Deg",
	},
	mzx: {
		code: "mzx",
		name: "Mawayana",
	},
	mzy: {
		code: "mzy",
		name: "Mozambican Sign Language",
	},
	mzz: {
		code: "mzz",
		name: "Maiadomu",
	},
	naa: {
		code: "naa",
		name: "Namla",
	},
	nab: {
		code: "nab",
		name: "Southern Nambikuára",
	},
	nac: {
		code: "nac",
		name: "Narak",
	},
	nae: {
		code: "nae",
		name: "Naka'ela",
	},
	naf: {
		code: "naf",
		name: "Nabak",
	},
	nag: {
		code: "nag",
		name: "Naga Pidgin",
	},
	naj: {
		code: "naj",
		name: "Nalu",
	},
	nak: {
		code: "nak",
		name: "Nakanai",
	},
	nal: {
		code: "nal",
		name: "Nalik",
	},
	nam: {
		code: "nam",
		name: "Ngan'gityemerri",
	},
	nan: {
		code: "nan",
		name: "Min Nan Chinese",
	},
	nao: {
		code: "nao",
		name: "Naaba",
	},
	nap: {
		code: "nap",
		name: "Neapolitan",
	},
	naq: {
		code: "naq",
		name: "Khoekhoe",
	},
	nar: {
		code: "nar",
		name: "Iguta",
	},
	nas: {
		code: "nas",
		name: "Naasioi",
	},
	nat: {
		code: "nat",
		name: "Ca̱hungwa̱rya̱",
	},
	nau: {
		code: "nau",
		name: "Nauru",
	},
	nav: {
		code: "nav",
		name: "Navajo",
	},
	naw: {
		code: "naw",
		name: "Nawuri",
	},
	nax: {
		code: "nax",
		name: "Nakwi",
	},
	nay: {
		code: "nay",
		name: "Ngarrindjeri",
	},
	naz: {
		code: "naz",
		name: "Coatepec Nahuatl",
	},
	nba: {
		code: "nba",
		name: "Nyemba",
	},
	nbb: {
		code: "nbb",
		name: "Ndoe",
	},
	nbc: {
		code: "nbc",
		name: "Chang Naga",
	},
	nbd: {
		code: "nbd",
		name: "Ngbinda",
	},
	nbe: {
		code: "nbe",
		name: "Konyak Naga",
	},
	nbg: {
		code: "nbg",
		name: "Nagarchal",
	},
	nbh: {
		code: "nbh",
		name: "Ngamo",
	},
	nbi: {
		code: "nbi",
		name: "Mao Naga",
	},
	nbj: {
		code: "nbj",
		name: "Ngarinyman",
	},
	nbk: {
		code: "nbk",
		name: "Nake",
	},
	nbl: {
		code: "nbl",
		name: "South Ndebele",
	},
	nbm: {
		code: "nbm",
		name: "Ngbaka Ma'bo",
	},
	nbn: {
		code: "nbn",
		name: "Kuri",
	},
	nbo: {
		code: "nbo",
		name: "Nkukoli",
	},
	nbp: {
		code: "nbp",
		name: "Nnam",
	},
	nbq: {
		code: "nbq",
		name: "Nggem",
	},
	nbr: {
		code: "nbr",
		name: "Numana",
	},
	nbs: {
		code: "nbs",
		name: "Namibian Sign Language",
	},
	nbt: {
		code: "nbt",
		name: "Na",
	},
	nbu: {
		code: "nbu",
		name: "Rongmei Naga",
	},
	nbv: {
		code: "nbv",
		name: "Ngamambo",
	},
	nbw: {
		code: "nbw",
		name: "Southern Ngbandi",
	},
	nby: {
		code: "nby",
		name: "Ningera",
	},
	nca: {
		code: "nca",
		name: "Iyo",
	},
	ncb: {
		code: "ncb",
		name: "Central Nicobarese",
	},
	ncc: {
		code: "ncc",
		name: "Ponam",
	},
	ncd: {
		code: "ncd",
		name: "Nachering",
	},
	nce: {
		code: "nce",
		name: "Yale",
	},
	ncf: {
		code: "ncf",
		name: "Notsi",
	},
	ncg: {
		code: "ncg",
		name: "Nisga'a",
	},
	nch: {
		code: "nch",
		name: "Central Huasteca Nahuatl",
	},
	nci: {
		code: "nci",
		name: "Classical Nahuatl",
	},
	ncj: {
		code: "ncj",
		name: "Northern Puebla Nahuatl",
	},
	nck: {
		code: "nck",
		name: "Na-kara",
	},
	ncl: {
		code: "ncl",
		name: "Michoacán Nahuatl",
	},
	ncm: {
		code: "ncm",
		name: "Nambo",
	},
	ncn: {
		code: "ncn",
		name: "Nauna",
	},
	nco: {
		code: "nco",
		name: "Sibe",
	},
	ncq: {
		code: "ncq",
		name: "Northern Katang",
	},
	ncr: {
		code: "ncr",
		name: "Ncane",
	},
	ncs: {
		code: "ncs",
		name: "Nicaraguan Sign Language",
	},
	nct: {
		code: "nct",
		name: "Chothe Naga",
	},
	ncu: {
		code: "ncu",
		name: "Chumburung",
	},
	ncx: {
		code: "ncx",
		name: "Central Puebla Nahuatl",
	},
	ncz: {
		code: "ncz",
		name: "Natchez",
	},
	nda: {
		code: "nda",
		name: "Ndasa",
	},
	ndb: {
		code: "ndb",
		name: "Kenswei Nsei",
	},
	ndc: {
		code: "ndc",
		name: "Ndau",
	},
	ndd: {
		code: "ndd",
		name: "Nde-Nsele-Nta",
	},
	nde: {
		code: "nde",
		name: "North Ndebele",
	},
	ndf: {
		code: "ndf",
		name: "Nadruvian",
	},
	ndg: {
		code: "ndg",
		name: "Ndengereko",
	},
	ndh: {
		code: "ndh",
		name: "Ndali",
	},
	ndi: {
		code: "ndi",
		name: "Samba Leko",
	},
	ndj: {
		code: "ndj",
		name: "Ndamba",
	},
	ndk: {
		code: "ndk",
		name: "Ndaka",
	},
	ndl: {
		code: "ndl",
		name: "Ndolo",
	},
	ndm: {
		code: "ndm",
		name: "Ndam",
	},
	ndn: {
		code: "ndn",
		name: "Ngundi",
	},
	ndo: {
		code: "ndo",
		name: "Ndonga",
	},
	ndp: {
		code: "ndp",
		name: "Ndo",
	},
	ndq: {
		code: "ndq",
		name: "Ndombe",
	},
	ndr: {
		code: "ndr",
		name: "Ndoola",
	},
	nds: {
		code: "nds",
		name: "Low German",
	},
	ndt: {
		code: "ndt",
		name: "Ndunga",
	},
	ndu: {
		code: "ndu",
		name: "Dugun",
	},
	ndv: {
		code: "ndv",
		name: "Ndut",
	},
	ndw: {
		code: "ndw",
		name: "Ndobo",
	},
	ndx: {
		code: "ndx",
		name: "Nduga",
	},
	ndy: {
		code: "ndy",
		name: "Lutos",
	},
	ndz: {
		code: "ndz",
		name: "Ndogo",
	},
	nea: {
		code: "nea",
		name: "Eastern Ngad'a",
	},
	neb: {
		code: "neb",
		name: "Toura (Côte d'Ivoire)",
	},
	nec: {
		code: "nec",
		name: "Nedebang",
	},
	ned: {
		code: "ned",
		name: "Nde-Gbite",
	},
	nee: {
		code: "nee",
		name: "Nêlêmwa-Nixumwak",
	},
	nef: {
		code: "nef",
		name: "Nefamese",
	},
	neg: {
		code: "neg",
		name: "Negidal",
	},
	neh: {
		code: "neh",
		name: "Nyenkha",
	},
	nei: {
		code: "nei",
		name: "Neo-Hittite",
	},
	nej: {
		code: "nej",
		name: "Neko",
	},
	nek: {
		code: "nek",
		name: "Neku",
	},
	nem: {
		code: "nem",
		name: "Nemi",
	},
	nen: {
		code: "nen",
		name: "Nengone",
	},
	neo: {
		code: "neo",
		name: "Ná-Meo",
	},
	nep: {
		code: "nep",
		name: "Nepali (macrolanguage)",
	},
	neq: {
		code: "neq",
		name: "North Central Mixe",
	},
	ner: {
		code: "ner",
		name: "Yahadian",
	},
	nes: {
		code: "nes",
		name: "Bhoti Kinnauri",
	},
	net: {
		code: "net",
		name: "Nete",
	},
	neu: {
		code: "neu",
		name: "Neo",
	},
	nev: {
		code: "nev",
		name: "Nyaheun",
	},
	new: {
		code: "new",
		name: "Newari",
	},
	nex: {
		code: "nex",
		name: "Neme",
	},
	ney: {
		code: "ney",
		name: "Neyo",
	},
	nez: {
		code: "nez",
		name: "Nez Perce",
	},
	nfa: {
		code: "nfa",
		name: "Dhao",
	},
	nfd: {
		code: "nfd",
		name: "Ahwai",
	},
	nfl: {
		code: "nfl",
		name: "Ayiwo",
	},
	nfr: {
		code: "nfr",
		name: "Nafaanra",
	},
	nfu: {
		code: "nfu",
		name: "Mfumte",
	},
	nga: {
		code: "nga",
		name: "Ngbaka",
	},
	ngb: {
		code: "ngb",
		name: "Northern Ngbandi",
	},
	ngc: {
		code: "ngc",
		name: "Ngombe (Democratic Republic of Congo)",
	},
	ngd: {
		code: "ngd",
		name: "Ngando (Central African Republic)",
	},
	nge: {
		code: "nge",
		name: "Ngemba",
	},
	ngg: {
		code: "ngg",
		name: "Ngbaka Manza",
	},
	ngh: {
		code: "ngh",
		name: "Nǁng",
	},
	ngi: {
		code: "ngi",
		name: "Ngizim",
	},
	ngj: {
		code: "ngj",
		name: "Ngie",
	},
	ngk: {
		code: "ngk",
		name: "Dalabon",
	},
	ngl: {
		code: "ngl",
		name: "Lomwe",
	},
	ngm: {
		code: "ngm",
		name: "Ngatik Men's Creole",
	},
	ngn: {
		code: "ngn",
		name: "Ngwo",
	},
	ngp: {
		code: "ngp",
		name: "Ngulu",
	},
	ngq: {
		code: "ngq",
		name: "Ngurimi",
	},
	ngr: {
		code: "ngr",
		name: "Engdewu",
	},
	ngs: {
		code: "ngs",
		name: "Gvoko",
	},
	ngt: {
		code: "ngt",
		name: "Kriang",
	},
	ngu: {
		code: "ngu",
		name: "Guerrero Nahuatl",
	},
	ngv: {
		code: "ngv",
		name: "Nagumi",
	},
	ngw: {
		code: "ngw",
		name: "Ngwaba",
	},
	ngx: {
		code: "ngx",
		name: "Nggwahyi",
	},
	ngy: {
		code: "ngy",
		name: "Tibea",
	},
	ngz: {
		code: "ngz",
		name: "Ngungwel",
	},
	nha: {
		code: "nha",
		name: "Nhanda",
	},
	nhb: {
		code: "nhb",
		name: "Beng",
	},
	nhc: {
		code: "nhc",
		name: "Tabasco Nahuatl",
	},
	nhd: {
		code: "nhd",
		name: "Chiripá",
	},
	nhe: {
		code: "nhe",
		name: "Eastern Huasteca Nahuatl",
	},
	nhf: {
		code: "nhf",
		name: "Nhuwala",
	},
	nhg: {
		code: "nhg",
		name: "Tetelcingo Nahuatl",
	},
	nhh: {
		code: "nhh",
		name: "Nahari",
	},
	nhi: {
		code: "nhi",
		name: "Zacatlán-Ahuacatlán-Tepetzintla Nahuatl",
	},
	nhk: {
		code: "nhk",
		name: "Isthmus-Cosoleacaque Nahuatl",
	},
	nhm: {
		code: "nhm",
		name: "Morelos Nahuatl",
	},
	nhn: {
		code: "nhn",
		name: "Central Nahuatl",
	},
	nho: {
		code: "nho",
		name: "Takuu",
	},
	nhp: {
		code: "nhp",
		name: "Isthmus-Pajapan Nahuatl",
	},
	nhq: {
		code: "nhq",
		name: "Huaxcaleca Nahuatl",
	},
	nhr: {
		code: "nhr",
		name: "Naro",
	},
	nht: {
		code: "nht",
		name: "Ometepec Nahuatl",
	},
	nhu: {
		code: "nhu",
		name: "Noone",
	},
	nhv: {
		code: "nhv",
		name: "Temascaltepec Nahuatl",
	},
	nhw: {
		code: "nhw",
		name: "Western Huasteca Nahuatl",
	},
	nhx: {
		code: "nhx",
		name: "Isthmus-Mecayapan Nahuatl",
	},
	nhy: {
		code: "nhy",
		name: "Northern Oaxaca Nahuatl",
	},
	nhz: {
		code: "nhz",
		name: "Santa María La Alta Nahuatl",
	},
	nia: {
		code: "nia",
		name: "Nias",
	},
	nib: {
		code: "nib",
		name: "Nakame",
	},
	nid: {
		code: "nid",
		name: "Ngandi",
	},
	nie: {
		code: "nie",
		name: "Niellim",
	},
	nif: {
		code: "nif",
		name: "Nek",
	},
	nig: {
		code: "nig",
		name: "Ngalakgan",
	},
	nih: {
		code: "nih",
		name: "Nyiha (Tanzania)",
	},
	nii: {
		code: "nii",
		name: "Nii",
	},
	nij: {
		code: "nij",
		name: "Ngaju",
	},
	nik: {
		code: "nik",
		name: "Southern Nicobarese",
	},
	nil: {
		code: "nil",
		name: "Nila",
	},
	nim: {
		code: "nim",
		name: "Nilamba",
	},
	nin: {
		code: "nin",
		name: "Ninzo",
	},
	nio: {
		code: "nio",
		name: "Nganasan",
	},
	niq: {
		code: "niq",
		name: "Nandi",
	},
	nir: {
		code: "nir",
		name: "Nimboran",
	},
	nis: {
		code: "nis",
		name: "Nimi",
	},
	nit: {
		code: "nit",
		name: "Southeastern Kolami",
	},
	niu: {
		code: "niu",
		name: "Niuean",
	},
	niv: {
		code: "niv",
		name: "Gilyak",
	},
	niw: {
		code: "niw",
		name: "Nimo",
	},
	nix: {
		code: "nix",
		name: "Hema",
	},
	niy: {
		code: "niy",
		name: "Ngiti",
	},
	niz: {
		code: "niz",
		name: "Ningil",
	},
	nja: {
		code: "nja",
		name: "Nzanyi",
	},
	njb: {
		code: "njb",
		name: "Nocte Naga",
	},
	njd: {
		code: "njd",
		name: "Ndonde Hamba",
	},
	njh: {
		code: "njh",
		name: "Lotha Naga",
	},
	nji: {
		code: "nji",
		name: "Gudanji",
	},
	njj: {
		code: "njj",
		name: "Njen",
	},
	njl: {
		code: "njl",
		name: "Njalgulgule",
	},
	njm: {
		code: "njm",
		name: "Angami Naga",
	},
	njn: {
		code: "njn",
		name: "Liangmai Naga",
	},
	njo: {
		code: "njo",
		name: "Ao Naga",
	},
	njr: {
		code: "njr",
		name: "Njerep",
	},
	njs: {
		code: "njs",
		name: "Nisa",
	},
	njt: {
		code: "njt",
		name: "Ndyuka-Trio Pidgin",
	},
	nju: {
		code: "nju",
		name: "Ngadjunmaya",
	},
	njx: {
		code: "njx",
		name: "Kunyi",
	},
	njy: {
		code: "njy",
		name: "Njyem",
	},
	njz: {
		code: "njz",
		name: "Nyishi",
	},
	nka: {
		code: "nka",
		name: "Nkoya",
	},
	nkb: {
		code: "nkb",
		name: "Khoibu Naga",
	},
	nkc: {
		code: "nkc",
		name: "Nkongho",
	},
	nkd: {
		code: "nkd",
		name: "Koireng",
	},
	nke: {
		code: "nke",
		name: "Duke",
	},
	nkf: {
		code: "nkf",
		name: "Inpui Naga",
	},
	nkg: {
		code: "nkg",
		name: "Nekgini",
	},
	nkh: {
		code: "nkh",
		name: "Khezha Naga",
	},
	nki: {
		code: "nki",
		name: "Thangal Naga",
	},
	nkj: {
		code: "nkj",
		name: "Nakai",
	},
	nkk: {
		code: "nkk",
		name: "Nokuku",
	},
	nkm: {
		code: "nkm",
		name: "Namat",
	},
	nkn: {
		code: "nkn",
		name: "Nkangala",
	},
	nko: {
		code: "nko",
		name: "Nkonya",
	},
	nkp: {
		code: "nkp",
		name: "Niuatoputapu",
	},
	nkq: {
		code: "nkq",
		name: "Nkami",
	},
	nkr: {
		code: "nkr",
		name: "Nukuoro",
	},
	nks: {
		code: "nks",
		name: "North Asmat",
	},
	nkt: {
		code: "nkt",
		name: "Nyika (Tanzania)",
	},
	nku: {
		code: "nku",
		name: "Bouna Kulango",
	},
	nkv: {
		code: "nkv",
		name: "Nyika (Malawi and Zambia)",
	},
	nkw: {
		code: "nkw",
		name: "Nkutu",
	},
	nkx: {
		code: "nkx",
		name: "Nkoroo",
	},
	nkz: {
		code: "nkz",
		name: "Nkari",
	},
	nla: {
		code: "nla",
		name: "Ngombale",
	},
	nlc: {
		code: "nlc",
		name: "Nalca",
	},
	nld: {
		code: "nld",
		name: "Dutch",
	},
	nle: {
		code: "nle",
		name: "East Nyala",
	},
	nlg: {
		code: "nlg",
		name: "Gela",
	},
	nli: {
		code: "nli",
		name: "Grangali",
	},
	nlj: {
		code: "nlj",
		name: "Nyali",
	},
	nlk: {
		code: "nlk",
		name: "Ninia Yali",
	},
	nll: {
		code: "nll",
		name: "Nihali",
	},
	nlm: {
		code: "nlm",
		name: "Mankiyali",
	},
	nlo: {
		code: "nlo",
		name: "Ngul",
	},
	nlq: {
		code: "nlq",
		name: "Lao Naga",
	},
	nlu: {
		code: "nlu",
		name: "Nchumbulu",
	},
	nlv: {
		code: "nlv",
		name: "Orizaba Nahuatl",
	},
	nlw: {
		code: "nlw",
		name: "Walangama",
	},
	nlx: {
		code: "nlx",
		name: "Nahali",
	},
	nly: {
		code: "nly",
		name: "Nyamal",
	},
	nlz: {
		code: "nlz",
		name: "Nalögo",
	},
	nma: {
		code: "nma",
		name: "Maram Naga",
	},
	nmb: {
		code: "nmb",
		name: "Big Nambas",
	},
	nmc: {
		code: "nmc",
		name: "Ngam",
	},
	nmd: {
		code: "nmd",
		name: "Ndumu",
	},
	nme: {
		code: "nme",
		name: "Mzieme Naga",
	},
	nmf: {
		code: "nmf",
		name: "Tangkhul Naga (India)",
	},
	nmg: {
		code: "nmg",
		name: "Kwasio",
	},
	nmh: {
		code: "nmh",
		name: "Monsang Naga",
	},
	nmi: {
		code: "nmi",
		name: "Nyam",
	},
	nmj: {
		code: "nmj",
		name: "Ngombe (Central African Republic)",
	},
	nmk: {
		code: "nmk",
		name: "Namakura",
	},
	nml: {
		code: "nml",
		name: "Ndemli",
	},
	nmm: {
		code: "nmm",
		name: "Manangba",
	},
	nmn: {
		code: "nmn",
		name: "ǃXóõ",
	},
	nmo: {
		code: "nmo",
		name: "Moyon Naga",
	},
	nmp: {
		code: "nmp",
		name: "Nimanbur",
	},
	nmq: {
		code: "nmq",
		name: "Nambya",
	},
	nmr: {
		code: "nmr",
		name: "Nimbari",
	},
	nms: {
		code: "nms",
		name: "Letemboi",
	},
	nmt: {
		code: "nmt",
		name: "Namonuito",
	},
	nmu: {
		code: "nmu",
		name: "Northeast Maidu",
	},
	nmv: {
		code: "nmv",
		name: "Ngamini",
	},
	nmw: {
		code: "nmw",
		name: "Nimoa",
	},
	nmx: {
		code: "nmx",
		name: "Nama (Papua New Guinea)",
	},
	nmy: {
		code: "nmy",
		name: "Namuyi",
	},
	nmz: {
		code: "nmz",
		name: "Nawdm",
	},
	nna: {
		code: "nna",
		name: "Nyangumarta",
	},
	nnb: {
		code: "nnb",
		name: "Nande",
	},
	nnc: {
		code: "nnc",
		name: "Nancere",
	},
	nnd: {
		code: "nnd",
		name: "West Ambae",
	},
	nne: {
		code: "nne",
		name: "Ngandyera",
	},
	nnf: {
		code: "nnf",
		name: "Ngaing",
	},
	nng: {
		code: "nng",
		name: "Maring Naga",
	},
	nnh: {
		code: "nnh",
		name: "Ngiemboon",
	},
	nni: {
		code: "nni",
		name: "North Nuaulu",
	},
	nnj: {
		code: "nnj",
		name: "Nyangatom",
	},
	nnk: {
		code: "nnk",
		name: "Nankina",
	},
	nnl: {
		code: "nnl",
		name: "Northern Rengma Naga",
	},
	nnm: {
		code: "nnm",
		name: "Namia",
	},
	nnn: {
		code: "nnn",
		name: "Ngete",
	},
	nno: {
		code: "nno",
		name: "Norwegian Nynorsk",
	},
	nnp: {
		code: "nnp",
		name: "Wancho Naga",
	},
	nnq: {
		code: "nnq",
		name: "Ngindo",
	},
	nnr: {
		code: "nnr",
		name: "Narungga",
	},
	nnt: {
		code: "nnt",
		name: "Nanticoke",
	},
	nnu: {
		code: "nnu",
		name: "Dwang",
	},
	nnv: {
		code: "nnv",
		name: "Nugunu (Australia)",
	},
	nnw: {
		code: "nnw",
		name: "Southern Nuni",
	},
	nny: {
		code: "nny",
		name: "Nyangga",
	},
	nnz: {
		code: "nnz",
		name: "Nda'nda'",
	},
	noa: {
		code: "noa",
		name: "Woun Meu",
	},
	nob: {
		code: "nob",
		name: "Norwegian Bokmål",
	},
	noc: {
		code: "noc",
		name: "Nuk",
	},
	nod: {
		code: "nod",
		name: "Northern Thai",
	},
	noe: {
		code: "noe",
		name: "Nimadi",
	},
	nof: {
		code: "nof",
		name: "Nomane",
	},
	nog: {
		code: "nog",
		name: "Nogai",
	},
	noh: {
		code: "noh",
		name: "Nomu",
	},
	noi: {
		code: "noi",
		name: "Noiri",
	},
	noj: {
		code: "noj",
		name: "Nonuya",
	},
	nok: {
		code: "nok",
		name: "Nooksack",
	},
	nol: {
		code: "nol",
		name: "Nomlaki",
	},
	non: {
		code: "non",
		name: "Old Norse",
	},
	nop: {
		code: "nop",
		name: "Numanggang",
	},
	noq: {
		code: "noq",
		name: "Ngongo",
	},
	nor: {
		code: "nor",
		name: "Norwegian",
	},
	nos: {
		code: "nos",
		name: "Eastern Nisu",
	},
	not: {
		code: "not",
		name: "Nomatsiguenga",
	},
	nou: {
		code: "nou",
		name: "Ewage-Notu",
	},
	nov: {
		code: "nov",
		name: "Novial",
	},
	now: {
		code: "now",
		name: "Nyambo",
	},
	noy: {
		code: "noy",
		name: "Noy",
	},
	noz: {
		code: "noz",
		name: "Nayi",
	},
	npa: {
		code: "npa",
		name: "Nar Phu",
	},
	npb: {
		code: "npb",
		name: "Nupbikha",
	},
	npg: {
		code: "npg",
		name: "Ponyo-Gongwang Naga",
	},
	nph: {
		code: "nph",
		name: "Phom Naga",
	},
	npi: {
		code: "npi",
		name: "Nepali (individual language)",
	},
	npl: {
		code: "npl",
		name: "Southeastern Puebla Nahuatl",
	},
	npn: {
		code: "npn",
		name: "Mondropolon",
	},
	npo: {
		code: "npo",
		name: "Pochuri Naga",
	},
	nps: {
		code: "nps",
		name: "Nipsan",
	},
	npu: {
		code: "npu",
		name: "Puimei Naga",
	},
	npx: {
		code: "npx",
		name: "Noipx",
	},
	npy: {
		code: "npy",
		name: "Napu",
	},
	nqg: {
		code: "nqg",
		name: "Southern Nago",
	},
	nqk: {
		code: "nqk",
		name: "Kura Ede Nago",
	},
	nql: {
		code: "nql",
		name: "Ngendelengo",
	},
	nqm: {
		code: "nqm",
		name: "Ndom",
	},
	nqn: {
		code: "nqn",
		name: "Nen",
	},
	nqo: {
		code: "nqo",
		name: "N'Ko",
	},
	nqq: {
		code: "nqq",
		name: "Kyan-Karyaw Naga",
	},
	nqt: {
		code: "nqt",
		name: "Nteng",
	},
	nqy: {
		code: "nqy",
		name: "Akyaung Ari Naga",
	},
	nra: {
		code: "nra",
		name: "Ngom",
	},
	nrb: {
		code: "nrb",
		name: "Nara",
	},
	nrc: {
		code: "nrc",
		name: "Noric",
	},
	nre: {
		code: "nre",
		name: "Southern Rengma Naga",
	},
	nrf: {
		code: "nrf",
		name: "Jèrriais",
	},
	nrg: {
		code: "nrg",
		name: "Narango",
	},
	nri: {
		code: "nri",
		name: "Chokri Naga",
	},
	nrk: {
		code: "nrk",
		name: "Ngarla",
	},
	nrl: {
		code: "nrl",
		name: "Ngarluma",
	},
	nrm: {
		code: "nrm",
		name: "Narom",
	},
	nrn: {
		code: "nrn",
		name: "Norn",
	},
	nrp: {
		code: "nrp",
		name: "North Picene",
	},
	nrr: {
		code: "nrr",
		name: "Norra",
	},
	nrt: {
		code: "nrt",
		name: "Northern Kalapuya",
	},
	nru: {
		code: "nru",
		name: "Narua",
	},
	nrx: {
		code: "nrx",
		name: "Ngurmbur",
	},
	nrz: {
		code: "nrz",
		name: "Lala",
	},
	nsa: {
		code: "nsa",
		name: "Sangtam Naga",
	},
	nsb: {
		code: "nsb",
		name: "Lower Nossob",
	},
	nsc: {
		code: "nsc",
		name: "Nshi",
	},
	nsd: {
		code: "nsd",
		name: "Southern Nisu",
	},
	nse: {
		code: "nse",
		name: "Nsenga",
	},
	nsf: {
		code: "nsf",
		name: "Northwestern Nisu",
	},
	nsg: {
		code: "nsg",
		name: "Ngasa",
	},
	nsh: {
		code: "nsh",
		name: "Ngoshie",
	},
	nsi: {
		code: "nsi",
		name: "Nigerian Sign Language",
	},
	nsk: {
		code: "nsk",
		name: "Naskapi",
	},
	nsl: {
		code: "nsl",
		name: "Norwegian Sign Language",
	},
	nsm: {
		code: "nsm",
		name: "Sumi Naga",
	},
	nsn: {
		code: "nsn",
		name: "Nehan",
	},
	nso: {
		code: "nso",
		name: "Pedi",
	},
	nsp: {
		code: "nsp",
		name: "Nepalese Sign Language",
	},
	nsq: {
		code: "nsq",
		name: "Northern Sierra Miwok",
	},
	nsr: {
		code: "nsr",
		name: "Maritime Sign Language",
	},
	nss: {
		code: "nss",
		name: "Nali",
	},
	nst: {
		code: "nst",
		name: "Tase Naga",
	},
	nsu: {
		code: "nsu",
		name: "Sierra Negra Nahuatl",
	},
	nsv: {
		code: "nsv",
		name: "Southwestern Nisu",
	},
	nsw: {
		code: "nsw",
		name: "Navut",
	},
	nsx: {
		code: "nsx",
		name: "Nsongo",
	},
	nsy: {
		code: "nsy",
		name: "Nasal",
	},
	nsz: {
		code: "nsz",
		name: "Nisenan",
	},
	ntd: {
		code: "ntd",
		name: "Northern Tidung",
	},
	nte: {
		code: "nte",
		name: "Nathembo",
	},
	ntg: {
		code: "ntg",
		name: "Ngantangarra",
	},
	nti: {
		code: "nti",
		name: "Natioro",
	},
	ntj: {
		code: "ntj",
		name: "Ngaanyatjarra",
	},
	ntk: {
		code: "ntk",
		name: "Ikoma-Nata-Isenye",
	},
	ntm: {
		code: "ntm",
		name: "Nateni",
	},
	nto: {
		code: "nto",
		name: "Ntomba",
	},
	ntp: {
		code: "ntp",
		name: "Northern Tepehuan",
	},
	ntr: {
		code: "ntr",
		name: "Delo",
	},
	ntu: {
		code: "ntu",
		name: "Natügu",
	},
	ntw: {
		code: "ntw",
		name: "Nottoway",
	},
	ntx: {
		code: "ntx",
		name: "Tangkhul Naga (Myanmar)",
	},
	nty: {
		code: "nty",
		name: "Mantsi",
	},
	ntz: {
		code: "ntz",
		name: "Natanzi",
	},
	nua: {
		code: "nua",
		name: "Yuanga",
	},
	nuc: {
		code: "nuc",
		name: "Nukuini",
	},
	nud: {
		code: "nud",
		name: "Ngala",
	},
	nue: {
		code: "nue",
		name: "Ngundu",
	},
	nuf: {
		code: "nuf",
		name: "Nusu",
	},
	nug: {
		code: "nug",
		name: "Nungali",
	},
	nuh: {
		code: "nuh",
		name: "Ndunda",
	},
	nui: {
		code: "nui",
		name: "Ngumbi",
	},
	nuj: {
		code: "nuj",
		name: "Nyole",
	},
	nuk: {
		code: "nuk",
		name: "Nuu-chah-nulth",
	},
	nul: {
		code: "nul",
		name: "Nusa Laut",
	},
	num: {
		code: "num",
		name: "Niuafo'ou",
	},
	nun: {
		code: "nun",
		name: "Anong",
	},
	nuo: {
		code: "nuo",
		name: "Nguôn",
	},
	nup: {
		code: "nup",
		name: "Nupe-Nupe-Tako",
	},
	nuq: {
		code: "nuq",
		name: "Nukumanu",
	},
	nur: {
		code: "nur",
		name: "Nukuria",
	},
	nus: {
		code: "nus",
		name: "Nuer",
	},
	nut: {
		code: "nut",
		name: "Nung (Viet Nam)",
	},
	nuu: {
		code: "nuu",
		name: "Ngbundu",
	},
	nuv: {
		code: "nuv",
		name: "Northern Nuni",
	},
	nuw: {
		code: "nuw",
		name: "Nguluwan",
	},
	nux: {
		code: "nux",
		name: "Mehek",
	},
	nuy: {
		code: "nuy",
		name: "Nunggubuyu",
	},
	nuz: {
		code: "nuz",
		name: "Tlamacazapa Nahuatl",
	},
	nvh: {
		code: "nvh",
		name: "Nasarian",
	},
	nvm: {
		code: "nvm",
		name: "Namiae",
	},
	nvo: {
		code: "nvo",
		name: "Nyokon",
	},
	nwa: {
		code: "nwa",
		name: "Nawathinehena",
	},
	nwb: {
		code: "nwb",
		name: "Nyabwa",
	},
	nwc: {
		code: "nwc",
		name: "Classical Newari",
	},
	nwe: {
		code: "nwe",
		name: "Ngwe",
	},
	nwg: {
		code: "nwg",
		name: "Ngayawung",
	},
	nwi: {
		code: "nwi",
		name: "Southwest Tanna",
	},
	nwm: {
		code: "nwm",
		name: "Nyamusa-Molo",
	},
	nwo: {
		code: "nwo",
		name: "Nauo",
	},
	nwr: {
		code: "nwr",
		name: "Nawaru",
	},
	nww: {
		code: "nww",
		name: "Ndwewe",
	},
	nwx: {
		code: "nwx",
		name: "Middle Newar",
	},
	nwy: {
		code: "nwy",
		name: "Nottoway-Meherrin",
	},
	nxa: {
		code: "nxa",
		name: "Nauete",
	},
	nxd: {
		code: "nxd",
		name: "Ngando (Democratic Republic of Congo)",
	},
	nxe: {
		code: "nxe",
		name: "Nage",
	},
	nxg: {
		code: "nxg",
		name: "Ngad'a",
	},
	nxi: {
		code: "nxi",
		name: "Nindi",
	},
	nxk: {
		code: "nxk",
		name: "Koki Naga",
	},
	nxl: {
		code: "nxl",
		name: "South Nuaulu",
	},
	nxm: {
		code: "nxm",
		name: "Numidian",
	},
	nxn: {
		code: "nxn",
		name: "Ngawun",
	},
	nxo: {
		code: "nxo",
		name: "Ndambomo",
	},
	nxq: {
		code: "nxq",
		name: "Naxi",
	},
	nxr: {
		code: "nxr",
		name: "Ninggerum",
	},
	nxx: {
		code: "nxx",
		name: "Nafri",
	},
	nya: {
		code: "nya",
		name: "Nyanja",
	},
	nyb: {
		code: "nyb",
		name: "Nyangbo",
	},
	nyc: {
		code: "nyc",
		name: "Nyanga-li",
	},
	nyd: {
		code: "nyd",
		name: "Nyore",
	},
	nye: {
		code: "nye",
		name: "Nyengo",
	},
	nyf: {
		code: "nyf",
		name: "Giryama",
	},
	nyg: {
		code: "nyg",
		name: "Nyindu",
	},
	nyh: {
		code: "nyh",
		name: "Nyikina",
	},
	nyi: {
		code: "nyi",
		name: "Ama (Sudan)",
	},
	nyj: {
		code: "nyj",
		name: "Nyanga",
	},
	nyk: {
		code: "nyk",
		name: "Nyaneka",
	},
	nyl: {
		code: "nyl",
		name: "Nyeu",
	},
	nym: {
		code: "nym",
		name: "Nyamwezi",
	},
	nyn: {
		code: "nyn",
		name: "Nyankole",
	},
	nyo: {
		code: "nyo",
		name: "Nyoro",
	},
	nyp: {
		code: "nyp",
		name: "Nyang'i",
	},
	nyq: {
		code: "nyq",
		name: "Nayini",
	},
	nyr: {
		code: "nyr",
		name: "Nyiha (Malawi)",
	},
	nys: {
		code: "nys",
		name: "Nyungar",
	},
	nyt: {
		code: "nyt",
		name: "Nyawaygi",
	},
	nyu: {
		code: "nyu",
		name: "Nyungwe",
	},
	nyv: {
		code: "nyv",
		name: "Nyulnyul",
	},
	nyw: {
		code: "nyw",
		name: "Nyaw",
	},
	nyx: {
		code: "nyx",
		name: "Nganyaywana",
	},
	nyy: {
		code: "nyy",
		name: "Nyakyusa-Ngonde",
	},
	nza: {
		code: "nza",
		name: "Tigon Mbembe",
	},
	nzb: {
		code: "nzb",
		name: "Njebi",
	},
	nzd: {
		code: "nzd",
		name: "Nzadi",
	},
	nzi: {
		code: "nzi",
		name: "Nzima",
	},
	nzk: {
		code: "nzk",
		name: "Nzakara",
	},
	nzm: {
		code: "nzm",
		name: "Zeme Naga",
	},
	nzr: {
		code: "nzr",
		name: "Dir-Nyamzak-Mbarimi",
	},
	nzs: {
		code: "nzs",
		name: "New Zealand Sign Language",
	},
	nzu: {
		code: "nzu",
		name: "Teke-Nzikou",
	},
	nzy: {
		code: "nzy",
		name: "Nzakambay",
	},
	nzz: {
		code: "nzz",
		name: "Nanga Dama Dogon",
	},
	oaa: {
		code: "oaa",
		name: "Orok",
	},
	oac: {
		code: "oac",
		name: "Oroch",
	},
	oar: {
		code: "oar",
		name: "Old Aramaic (up to 700 BCE)",
	},
	oav: {
		code: "oav",
		name: "Old Avar",
	},
	obi: {
		code: "obi",
		name: "Obispeño",
	},
	obk: {
		code: "obk",
		name: "Southern Bontok",
	},
	obl: {
		code: "obl",
		name: "Oblo",
	},
	obm: {
		code: "obm",
		name: "Moabite",
	},
	obo: {
		code: "obo",
		name: "Obo Manobo",
	},
	obr: {
		code: "obr",
		name: "Old Burmese",
	},
	obt: {
		code: "obt",
		name: "Old Breton",
	},
	obu: {
		code: "obu",
		name: "Obulom",
	},
	oca: {
		code: "oca",
		name: "Ocaina",
	},
	och: {
		code: "och",
		name: "Old Chinese",
	},
	oci: {
		code: "oci",
		name: "Occitan (post 1500)",
	},
	ocm: {
		code: "ocm",
		name: "Old Cham",
	},
	oco: {
		code: "oco",
		name: "Old Cornish",
	},
	ocu: {
		code: "ocu",
		name: "Atzingo Matlatzinca",
	},
	oda: {
		code: "oda",
		name: "Odut",
	},
	odk: {
		code: "odk",
		name: "Od",
	},
	odt: {
		code: "odt",
		name: "Old Dutch",
	},
	odu: {
		code: "odu",
		name: "Odual",
	},
	ofo: {
		code: "ofo",
		name: "Ofo",
	},
	ofs: {
		code: "ofs",
		name: "Old Frisian",
	},
	ofu: {
		code: "ofu",
		name: "Efutop",
	},
	ogb: {
		code: "ogb",
		name: "Ogbia",
	},
	ogc: {
		code: "ogc",
		name: "Ogbah",
	},
	oge: {
		code: "oge",
		name: "Old Georgian",
	},
	ogg: {
		code: "ogg",
		name: "Ogbogolo",
	},
	ogo: {
		code: "ogo",
		name: "Khana",
	},
	ogu: {
		code: "ogu",
		name: "Ogbronuagum",
	},
	oht: {
		code: "oht",
		name: "Old Hittite",
	},
	ohu: {
		code: "ohu",
		name: "Old Hungarian",
	},
	oia: {
		code: "oia",
		name: "Oirata",
	},
	oie: {
		code: "oie",
		name: "Okolie",
	},
	oin: {
		code: "oin",
		name: "Inebu One",
	},
	ojb: {
		code: "ojb",
		name: "Northwestern Ojibwa",
	},
	ojc: {
		code: "ojc",
		name: "Central Ojibwa",
	},
	ojg: {
		code: "ojg",
		name: "Eastern Ojibwa",
	},
	oji: {
		code: "oji",
		name: "Ojibwa",
	},
	ojp: {
		code: "ojp",
		name: "Old Japanese",
	},
	ojs: {
		code: "ojs",
		name: "Severn Ojibwa",
	},
	ojv: {
		code: "ojv",
		name: "Ontong Java",
	},
	ojw: {
		code: "ojw",
		name: "Western Ojibwa",
	},
	oka: {
		code: "oka",
		name: "Okanagan",
	},
	okb: {
		code: "okb",
		name: "Okobo",
	},
	okc: {
		code: "okc",
		name: "Kobo",
	},
	okd: {
		code: "okd",
		name: "Okodia",
	},
	oke: {
		code: "oke",
		name: "Okpe (Southwestern Edo)",
	},
	okg: {
		code: "okg",
		name: "Koko Babangk",
	},
	okh: {
		code: "okh",
		name: "Koresh-e Rostam",
	},
	oki: {
		code: "oki",
		name: "Okiek",
	},
	okj: {
		code: "okj",
		name: "Oko-Juwoi",
	},
	okk: {
		code: "okk",
		name: "Kwamtim One",
	},
	okl: {
		code: "okl",
		name: "Old Kentish Sign Language",
	},
	okm: {
		code: "okm",
		name: "Middle Korean (10th-16th cent.)",
	},
	okn: {
		code: "okn",
		name: "Oki-No-Erabu",
	},
	oko: {
		code: "oko",
		name: "Old Korean (3rd-9th cent.)",
	},
	okr: {
		code: "okr",
		name: "Kirike",
	},
	oks: {
		code: "oks",
		name: "Oko-Eni-Osayen",
	},
	oku: {
		code: "oku",
		name: "Oku",
	},
	okv: {
		code: "okv",
		name: "Orokaiva",
	},
	okx: {
		code: "okx",
		name: "Okpe (Northwestern Edo)",
	},
	okz: {
		code: "okz",
		name: "Old Khmer",
	},
	ola: {
		code: "ola",
		name: "Walungge",
	},
	old: {
		code: "old",
		name: "Mochi",
	},
	ole: {
		code: "ole",
		name: "Olekha",
	},
	olk: {
		code: "olk",
		name: "Olkol",
	},
	olm: {
		code: "olm",
		name: "Oloma",
	},
	olo: {
		code: "olo",
		name: "Livvi",
	},
	olr: {
		code: "olr",
		name: "Olrat",
	},
	olt: {
		code: "olt",
		name: "Old Lithuanian",
	},
	olu: {
		code: "olu",
		name: "Kuvale",
	},
	oma: {
		code: "oma",
		name: "Omaha-Ponca",
	},
	omb: {
		code: "omb",
		name: "East Ambae",
	},
	omc: {
		code: "omc",
		name: "Mochica",
	},
	omg: {
		code: "omg",
		name: "Omagua",
	},
	omi: {
		code: "omi",
		name: "Omi",
	},
	omk: {
		code: "omk",
		name: "Omok",
	},
	oml: {
		code: "oml",
		name: "Ombo",
	},
	omn: {
		code: "omn",
		name: "Minoan",
	},
	omo: {
		code: "omo",
		name: "Utarmbung",
	},
	omp: {
		code: "omp",
		name: "Old Manipuri",
	},
	omr: {
		code: "omr",
		name: "Old Marathi",
	},
	omt: {
		code: "omt",
		name: "Omotik",
	},
	omu: {
		code: "omu",
		name: "Omurano",
	},
	omw: {
		code: "omw",
		name: "South Tairora",
	},
	omx: {
		code: "omx",
		name: "Old Mon",
	},
	omy: {
		code: "omy",
		name: "Old Malay",
	},
	ona: {
		code: "ona",
		name: "Ona",
	},
	onb: {
		code: "onb",
		name: "Lingao",
	},
	one: {
		code: "one",
		name: "Oneida",
	},
	ong: {
		code: "ong",
		name: "Olo",
	},
	oni: {
		code: "oni",
		name: "Onin",
	},
	onj: {
		code: "onj",
		name: "Onjob",
	},
	onk: {
		code: "onk",
		name: "Kabore One",
	},
	onn: {
		code: "onn",
		name: "Onobasulu",
	},
	ono: {
		code: "ono",
		name: "Onondaga",
	},
	onp: {
		code: "onp",
		name: "Sartang",
	},
	onr: {
		code: "onr",
		name: "Northern One",
	},
	ons: {
		code: "ons",
		name: "Ono",
	},
	ont: {
		code: "ont",
		name: "Ontenu",
	},
	onu: {
		code: "onu",
		name: "Unua",
	},
	onw: {
		code: "onw",
		name: "Old Nubian",
	},
	onx: {
		code: "onx",
		name: "Onin Based Pidgin",
	},
	ood: {
		code: "ood",
		name: "Tohono O'odham",
	},
	oog: {
		code: "oog",
		name: "Ong",
	},
	oon: {
		code: "oon",
		name: "Önge",
	},
	oor: {
		code: "oor",
		name: "Oorlams",
	},
	oos: {
		code: "oos",
		name: "Old Ossetic",
	},
	opa: {
		code: "opa",
		name: "Okpamheri",
	},
	opk: {
		code: "opk",
		name: "Kopkaka",
	},
	opm: {
		code: "opm",
		name: "Oksapmin",
	},
	opo: {
		code: "opo",
		name: "Opao",
	},
	opt: {
		code: "opt",
		name: "Opata",
	},
	opy: {
		code: "opy",
		name: "Ofayé",
	},
	ora: {
		code: "ora",
		name: "Oroha",
	},
	orc: {
		code: "orc",
		name: "Orma",
	},
	ore: {
		code: "ore",
		name: "Orejón",
	},
	org: {
		code: "org",
		name: "Oring",
	},
	orh: {
		code: "orh",
		name: "Oroqen",
	},
	ori: {
		code: "ori",
		name: "Oriya (macrolanguage)",
	},
	orm: {
		code: "orm",
		name: "Oromo",
	},
	orn: {
		code: "orn",
		name: "Orang Kanaq",
	},
	oro: {
		code: "oro",
		name: "Orokolo",
	},
	orr: {
		code: "orr",
		name: "Oruma",
	},
	ors: {
		code: "ors",
		name: "Orang Seletar",
	},
	ort: {
		code: "ort",
		name: "Adivasi Oriya",
	},
	oru: {
		code: "oru",
		name: "Ormuri",
	},
	orv: {
		code: "orv",
		name: "Old Russian",
	},
	orw: {
		code: "orw",
		name: "Oro Win",
	},
	orx: {
		code: "orx",
		name: "Oro",
	},
	ory: {
		code: "ory",
		name: "Odia",
	},
	orz: {
		code: "orz",
		name: "Ormu",
	},
	osa: {
		code: "osa",
		name: "Osage",
	},
	osc: {
		code: "osc",
		name: "Oscan",
	},
	osi: {
		code: "osi",
		name: "Osing",
	},
	osn: {
		code: "osn",
		name: "Old Sundanese",
	},
	oso: {
		code: "oso",
		name: "Ososo",
	},
	osp: {
		code: "osp",
		name: "Old Spanish",
	},
	oss: {
		code: "oss",
		name: "Ossetian",
	},
	ost: {
		code: "ost",
		name: "Osatu",
	},
	osu: {
		code: "osu",
		name: "Southern One",
	},
	osx: {
		code: "osx",
		name: "Old Saxon",
	},
	ota: {
		code: "ota",
		name: "Ottoman Turkish (1500-1928)",
	},
	otb: {
		code: "otb",
		name: "Old Tibetan",
	},
	otd: {
		code: "otd",
		name: "Ot Danum",
	},
	ote: {
		code: "ote",
		name: "Mezquital Otomi",
	},
	oti: {
		code: "oti",
		name: "Oti",
	},
	otk: {
		code: "otk",
		name: "Old Turkish",
	},
	otl: {
		code: "otl",
		name: "Tilapa Otomi",
	},
	otm: {
		code: "otm",
		name: "Eastern Highland Otomi",
	},
	otn: {
		code: "otn",
		name: "Tenango Otomi",
	},
	otq: {
		code: "otq",
		name: "Querétaro Otomi",
	},
	otr: {
		code: "otr",
		name: "Otoro",
	},
	ots: {
		code: "ots",
		name: "Estado de México Otomi",
	},
	ott: {
		code: "ott",
		name: "Temoaya Otomi",
	},
	otu: {
		code: "otu",
		name: "Otuke",
	},
	otw: {
		code: "otw",
		name: "Ottawa",
	},
	otx: {
		code: "otx",
		name: "Texcatepec Otomi",
	},
	oty: {
		code: "oty",
		name: "Old Tamil",
	},
	otz: {
		code: "otz",
		name: "Ixtenco Otomi",
	},
	oua: {
		code: "oua",
		name: "Tagargrent",
	},
	oub: {
		code: "oub",
		name: "Glio-Oubi",
	},
	oue: {
		code: "oue",
		name: "Oune",
	},
	oui: {
		code: "oui",
		name: "Old Uighur",
	},
	oum: {
		code: "oum",
		name: "Ouma",
	},
	ovd: {
		code: "ovd",
		name: "Elfdalian",
	},
	owi: {
		code: "owi",
		name: "Owiniga",
	},
	owl: {
		code: "owl",
		name: "Old Welsh",
	},
	oyb: {
		code: "oyb",
		name: "Oy",
	},
	oyd: {
		code: "oyd",
		name: "Oyda",
	},
	oym: {
		code: "oym",
		name: "Wayampi",
	},
	oyy: {
		code: "oyy",
		name: "Oya'oya",
	},
	ozm: {
		code: "ozm",
		name: "Koonzime",
	},
	pab: {
		code: "pab",
		name: "Parecís",
	},
	pac: {
		code: "pac",
		name: "Pacoh",
	},
	pad: {
		code: "pad",
		name: "Paumarí",
	},
	pae: {
		code: "pae",
		name: "Pagibete",
	},
	paf: {
		code: "paf",
		name: "Paranawát",
	},
	pag: {
		code: "pag",
		name: "Pangasinan",
	},
	pah: {
		code: "pah",
		name: "Tenharim",
	},
	pai: {
		code: "pai",
		name: "Pe",
	},
	pak: {
		code: "pak",
		name: "Parakanã",
	},
	pal: {
		code: "pal",
		name: "Pahlavi",
	},
	pam: {
		code: "pam",
		name: "Pampanga",
	},
	pan: {
		code: "pan",
		name: "Panjabi",
	},
	pao: {
		code: "pao",
		name: "Northern Paiute",
	},
	pap: {
		code: "pap",
		name: "Papiamento",
	},
	paq: {
		code: "paq",
		name: "Parya",
	},
	par: {
		code: "par",
		name: "Panamint",
	},
	pas: {
		code: "pas",
		name: "Papasena",
	},
	pau: {
		code: "pau",
		name: "Palauan",
	},
	pav: {
		code: "pav",
		name: "Pakaásnovos",
	},
	paw: {
		code: "paw",
		name: "Pawnee",
	},
	pax: {
		code: "pax",
		name: "Pankararé",
	},
	pay: {
		code: "pay",
		name: "Pech",
	},
	paz: {
		code: "paz",
		name: "Pankararú",
	},
	pbb: {
		code: "pbb",
		name: "Páez",
	},
	pbc: {
		code: "pbc",
		name: "Patamona",
	},
	pbe: {
		code: "pbe",
		name: "Mezontla Popoloca",
	},
	pbf: {
		code: "pbf",
		name: "Coyotepec Popoloca",
	},
	pbg: {
		code: "pbg",
		name: "Paraujano",
	},
	pbh: {
		code: "pbh",
		name: "E'ñapa Woromaipu",
	},
	pbi: {
		code: "pbi",
		name: "Parkwa",
	},
	pbl: {
		code: "pbl",
		name: "Mak (Nigeria)",
	},
	pbm: {
		code: "pbm",
		name: "Puebla Mazatec",
	},
	pbn: {
		code: "pbn",
		name: "Kpasam",
	},
	pbo: {
		code: "pbo",
		name: "Papel",
	},
	pbp: {
		code: "pbp",
		name: "Badyara",
	},
	pbr: {
		code: "pbr",
		name: "Pangwa",
	},
	pbs: {
		code: "pbs",
		name: "Central Pame",
	},
	pbt: {
		code: "pbt",
		name: "Southern Pashto",
	},
	pbu: {
		code: "pbu",
		name: "Northern Pashto",
	},
	pbv: {
		code: "pbv",
		name: "Pnar",
	},
	pby: {
		code: "pby",
		name: "Pyu (Papua New Guinea)",
	},
	pca: {
		code: "pca",
		name: "Santa Inés Ahuatempan Popoloca",
	},
	pcb: {
		code: "pcb",
		name: "Pear",
	},
	pcc: {
		code: "pcc",
		name: "Bouyei",
	},
	pcd: {
		code: "pcd",
		name: "Picard",
	},
	pce: {
		code: "pce",
		name: "Ruching Palaung",
	},
	pcf: {
		code: "pcf",
		name: "Paliyan",
	},
	pcg: {
		code: "pcg",
		name: "Paniya",
	},
	pch: {
		code: "pch",
		name: "Pardhan",
	},
	pci: {
		code: "pci",
		name: "Duruwa",
	},
	pcj: {
		code: "pcj",
		name: "Parenga",
	},
	pck: {
		code: "pck",
		name: "Paite Chin",
	},
	pcl: {
		code: "pcl",
		name: "Pardhi",
	},
	pcm: {
		code: "pcm",
		name: "Nigerian Pidgin",
	},
	pcn: {
		code: "pcn",
		name: "Piti",
	},
	pcp: {
		code: "pcp",
		name: "Pacahuara",
	},
	pcw: {
		code: "pcw",
		name: "Pyapun",
	},
	pda: {
		code: "pda",
		name: "Anam",
	},
	pdc: {
		code: "pdc",
		name: "Pennsylvania German",
	},
	pdi: {
		code: "pdi",
		name: "Pa Di",
	},
	pdn: {
		code: "pdn",
		name: "Podena",
	},
	pdo: {
		code: "pdo",
		name: "Padoe",
	},
	pdt: {
		code: "pdt",
		name: "Plautdietsch",
	},
	pdu: {
		code: "pdu",
		name: "Kayan",
	},
	pea: {
		code: "pea",
		name: "Peranakan Indonesian",
	},
	peb: {
		code: "peb",
		name: "Eastern Pomo",
	},
	ped: {
		code: "ped",
		name: "Mala (Papua New Guinea)",
	},
	pee: {
		code: "pee",
		name: "Taje",
	},
	pef: {
		code: "pef",
		name: "Northeastern Pomo",
	},
	peg: {
		code: "peg",
		name: "Pengo",
	},
	peh: {
		code: "peh",
		name: "Bonan",
	},
	pei: {
		code: "pei",
		name: "Chichimeca-Jonaz",
	},
	pej: {
		code: "pej",
		name: "Northern Pomo",
	},
	pek: {
		code: "pek",
		name: "Penchal",
	},
	pel: {
		code: "pel",
		name: "Pekal",
	},
	pem: {
		code: "pem",
		name: "Phende",
	},
	peo: {
		code: "peo",
		name: "Old Persian (ca. 600-400 B.C.)",
	},
	pep: {
		code: "pep",
		name: "Kunja",
	},
	peq: {
		code: "peq",
		name: "Southern Pomo",
	},
	pes: {
		code: "pes",
		name: "Iranian Persian",
	},
	pev: {
		code: "pev",
		name: "Pémono",
	},
	pex: {
		code: "pex",
		name: "Petats",
	},
	pey: {
		code: "pey",
		name: "Petjo",
	},
	pez: {
		code: "pez",
		name: "Eastern Penan",
	},
	pfa: {
		code: "pfa",
		name: "Pááfang",
	},
	pfe: {
		code: "pfe",
		name: "Pere",
	},
	pfl: {
		code: "pfl",
		name: "Pfaelzisch",
	},
	pga: {
		code: "pga",
		name: "Sudanese Creole Arabic",
	},
	pgd: {
		code: "pgd",
		name: "Gāndhārī",
	},
	pgg: {
		code: "pgg",
		name: "Pangwali",
	},
	pgi: {
		code: "pgi",
		name: "Pagi",
	},
	pgk: {
		code: "pgk",
		name: "Rerep",
	},
	pgl: {
		code: "pgl",
		name: "Primitive Irish",
	},
	pgn: {
		code: "pgn",
		name: "Paelignian",
	},
	pgs: {
		code: "pgs",
		name: "Pangseng",
	},
	pgu: {
		code: "pgu",
		name: "Pagu",
	},
	pgz: {
		code: "pgz",
		name: "Papua New Guinean Sign Language",
	},
	pha: {
		code: "pha",
		name: "Pa-Hng",
	},
	phd: {
		code: "phd",
		name: "Phudagi",
	},
	phg: {
		code: "phg",
		name: "Phuong",
	},
	phh: {
		code: "phh",
		name: "Phukha",
	},
	phj: {
		code: "phj",
		name: "Pahari",
	},
	phk: {
		code: "phk",
		name: "Phake",
	},
	phl: {
		code: "phl",
		name: "Phalura",
	},
	phm: {
		code: "phm",
		name: "Phimbi",
	},
	phn: {
		code: "phn",
		name: "Phoenician",
	},
	pho: {
		code: "pho",
		name: "Phunoi",
	},
	phq: {
		code: "phq",
		name: "Phana'",
	},
	phr: {
		code: "phr",
		name: "Pahari-Potwari",
	},
	pht: {
		code: "pht",
		name: "Phu Thai",
	},
	phu: {
		code: "phu",
		name: "Phuan",
	},
	phv: {
		code: "phv",
		name: "Pahlavani",
	},
	phw: {
		code: "phw",
		name: "Phangduwali",
	},
	pia: {
		code: "pia",
		name: "Pima Bajo",
	},
	pib: {
		code: "pib",
		name: "Yine",
	},
	pic: {
		code: "pic",
		name: "Pinji",
	},
	pid: {
		code: "pid",
		name: "Piaroa",
	},
	pie: {
		code: "pie",
		name: "Piro",
	},
	pif: {
		code: "pif",
		name: "Pingelapese",
	},
	pig: {
		code: "pig",
		name: "Pisabo",
	},
	pih: {
		code: "pih",
		name: "Pitcairn-Norfolk",
	},
	pij: {
		code: "pij",
		name: "Pijao",
	},
	pil: {
		code: "pil",
		name: "Yom",
	},
	pim: {
		code: "pim",
		name: "Powhatan",
	},
	pin: {
		code: "pin",
		name: "Piame",
	},
	pio: {
		code: "pio",
		name: "Piapoco",
	},
	pip: {
		code: "pip",
		name: "Pero",
	},
	pir: {
		code: "pir",
		name: "Piratapuyo",
	},
	pis: {
		code: "pis",
		name: "Pijin",
	},
	pit: {
		code: "pit",
		name: "Pitta Pitta",
	},
	piu: {
		code: "piu",
		name: "Pintupi-Luritja",
	},
	piv: {
		code: "piv",
		name: "Pileni",
	},
	piw: {
		code: "piw",
		name: "Pimbwe",
	},
	pix: {
		code: "pix",
		name: "Piu",
	},
	piy: {
		code: "piy",
		name: "Piya-Kwonci",
	},
	piz: {
		code: "piz",
		name: "Pije",
	},
	pjt: {
		code: "pjt",
		name: "Pitjantjatjara",
	},
	pka: {
		code: "pka",
		name: "Ardhamāgadhī Prākrit",
	},
	pkb: {
		code: "pkb",
		name: "Pokomo",
	},
	pkc: {
		code: "pkc",
		name: "Paekche",
	},
	pkg: {
		code: "pkg",
		name: "Pak-Tong",
	},
	pkh: {
		code: "pkh",
		name: "Pankhu",
	},
	pkn: {
		code: "pkn",
		name: "Pakanha",
	},
	pko: {
		code: "pko",
		name: "Pökoot",
	},
	pkp: {
		code: "pkp",
		name: "Pukapuka",
	},
	pkr: {
		code: "pkr",
		name: "Attapady Kurumba",
	},
	pks: {
		code: "pks",
		name: "Pakistan Sign Language",
	},
	pkt: {
		code: "pkt",
		name: "Maleng",
	},
	pku: {
		code: "pku",
		name: "Paku",
	},
	pla: {
		code: "pla",
		name: "Miani",
	},
	plb: {
		code: "plb",
		name: "Polonombauk",
	},
	plc: {
		code: "plc",
		name: "Central Palawano",
	},
	pld: {
		code: "pld",
		name: "Polari",
	},
	ple: {
		code: "ple",
		name: "Palu'e",
	},
	plg: {
		code: "plg",
		name: "Pilagá",
	},
	plh: {
		code: "plh",
		name: "Paulohi",
	},
	pli: {
		code: "pli",
		name: "Pali",
	},
	plk: {
		code: "plk",
		name: "Kohistani Shina",
	},
	pll: {
		code: "pll",
		name: "Shwe Palaung",
	},
	pln: {
		code: "pln",
		name: "Palenquero",
	},
	plo: {
		code: "plo",
		name: "Oluta Popoluca",
	},
	plq: {
		code: "plq",
		name: "Palaic",
	},
	plr: {
		code: "plr",
		name: "Palaka Senoufo",
	},
	pls: {
		code: "pls",
		name: "San Marcos Tlacoyalco Popoloca",
	},
	plt: {
		code: "plt",
		name: "Plateau Malagasy",
	},
	plu: {
		code: "plu",
		name: "Palikúr",
	},
	plv: {
		code: "plv",
		name: "Southwest Palawano",
	},
	plw: {
		code: "plw",
		name: "Brooke's Point Palawano",
	},
	ply: {
		code: "ply",
		name: "Bolyu",
	},
	plz: {
		code: "plz",
		name: "Paluan",
	},
	pma: {
		code: "pma",
		name: "Paama",
	},
	pmb: {
		code: "pmb",
		name: "Pambia",
	},
	pmd: {
		code: "pmd",
		name: "Pallanganmiddang",
	},
	pme: {
		code: "pme",
		name: "Pwaamei",
	},
	pmf: {
		code: "pmf",
		name: "Pamona",
	},
	pmh: {
		code: "pmh",
		name: "Māhārāṣṭri Prākrit",
	},
	pmi: {
		code: "pmi",
		name: "Northern Pumi",
	},
	pmj: {
		code: "pmj",
		name: "Southern Pumi",
	},
	pml: {
		code: "pml",
		name: "Lingua Franca",
	},
	pmm: {
		code: "pmm",
		name: "Pomo",
	},
	pmn: {
		code: "pmn",
		name: "Pam",
	},
	pmo: {
		code: "pmo",
		name: "Pom",
	},
	pmq: {
		code: "pmq",
		name: "Northern Pame",
	},
	pmr: {
		code: "pmr",
		name: "Paynamar",
	},
	pms: {
		code: "pms",
		name: "Piemontese",
	},
	pmt: {
		code: "pmt",
		name: "Tuamotuan",
	},
	pmw: {
		code: "pmw",
		name: "Plains Miwok",
	},
	pmx: {
		code: "pmx",
		name: "Poumei Naga",
	},
	pmy: {
		code: "pmy",
		name: "Papuan Malay",
	},
	pmz: {
		code: "pmz",
		name: "Southern Pame",
	},
	pna: {
		code: "pna",
		name: "Punan Bah-Biau",
	},
	pnb: {
		code: "pnb",
		name: "Western Panjabi",
	},
	pnc: {
		code: "pnc",
		name: "Pannei",
	},
	pnd: {
		code: "pnd",
		name: "Mpinda",
	},
	pne: {
		code: "pne",
		name: "Western Penan",
	},
	png: {
		code: "png",
		name: "Pangu",
	},
	pnh: {
		code: "pnh",
		name: "Penrhyn",
	},
	pni: {
		code: "pni",
		name: "Aoheng",
	},
	pnj: {
		code: "pnj",
		name: "Pinjarup",
	},
	pnk: {
		code: "pnk",
		name: "Paunaka",
	},
	pnl: {
		code: "pnl",
		name: "Paleni",
	},
	pnm: {
		code: "pnm",
		name: "Punan Batu 1",
	},
	pnn: {
		code: "pnn",
		name: "Pinai-Hagahai",
	},
	pno: {
		code: "pno",
		name: "Panobo",
	},
	pnp: {
		code: "pnp",
		name: "Pancana",
	},
	pnq: {
		code: "pnq",
		name: "Pana (Burkina Faso)",
	},
	pnr: {
		code: "pnr",
		name: "Panim",
	},
	pns: {
		code: "pns",
		name: "Ponosakan",
	},
	pnt: {
		code: "pnt",
		name: "Pontic",
	},
	pnu: {
		code: "pnu",
		name: "Jiongnai Bunu",
	},
	pnv: {
		code: "pnv",
		name: "Pinigura",
	},
	pnw: {
		code: "pnw",
		name: "Banyjima",
	},
	pnx: {
		code: "pnx",
		name: "Phong-Kniang",
	},
	pny: {
		code: "pny",
		name: "Pinyin",
	},
	pnz: {
		code: "pnz",
		name: "Pana (Central African Republic)",
	},
	poc: {
		code: "poc",
		name: "Poqomam",
	},
	poe: {
		code: "poe",
		name: "San Juan Atzingo Popoloca",
	},
	pof: {
		code: "pof",
		name: "Poke",
	},
	pog: {
		code: "pog",
		name: "Potiguára",
	},
	poh: {
		code: "poh",
		name: "Poqomchi'",
	},
	poi: {
		code: "poi",
		name: "Highland Popoluca",
	},
	pok: {
		code: "pok",
		name: "Pokangá",
	},
	pol: {
		code: "pol",
		name: "Polish",
	},
	pom: {
		code: "pom",
		name: "Southeastern Pomo",
	},
	pon: {
		code: "pon",
		name: "Pohnpeian",
	},
	poo: {
		code: "poo",
		name: "Central Pomo",
	},
	pop: {
		code: "pop",
		name: "Pwapwâ",
	},
	poq: {
		code: "poq",
		name: "Texistepec Popoluca",
	},
	por: {
		code: "por",
		name: "Portuguese",
	},
	pos: {
		code: "pos",
		name: "Sayula Popoluca",
	},
	pot: {
		code: "pot",
		name: "Potawatomi",
	},
	pov: {
		code: "pov",
		name: "Upper Guinea Crioulo",
	},
	pow: {
		code: "pow",
		name: "San Felipe Otlaltepec Popoloca",
	},
	pox: {
		code: "pox",
		name: "Polabian",
	},
	poy: {
		code: "poy",
		name: "Pogolo",
	},
	ppe: {
		code: "ppe",
		name: "Papi",
	},
	ppi: {
		code: "ppi",
		name: "Paipai",
	},
	ppk: {
		code: "ppk",
		name: "Uma",
	},
	ppl: {
		code: "ppl",
		name: "Pipil",
	},
	ppm: {
		code: "ppm",
		name: "Papuma",
	},
	ppn: {
		code: "ppn",
		name: "Papapana",
	},
	ppo: {
		code: "ppo",
		name: "Folopa",
	},
	ppp: {
		code: "ppp",
		name: "Pelende",
	},
	ppq: {
		code: "ppq",
		name: "Pei",
	},
	pps: {
		code: "pps",
		name: "San Luís Temalacayuca Popoloca",
	},
	ppt: {
		code: "ppt",
		name: "Pare",
	},
	ppu: {
		code: "ppu",
		name: "Papora",
	},
	pqa: {
		code: "pqa",
		name: "Pa'a",
	},
	pqm: {
		code: "pqm",
		name: "Malecite-Passamaquoddy",
	},
	prc: {
		code: "prc",
		name: "Parachi",
	},
	prd: {
		code: "prd",
		name: "Parsi-Dari",
	},
	pre: {
		code: "pre",
		name: "Principense",
	},
	prf: {
		code: "prf",
		name: "Paranan",
	},
	prg: {
		code: "prg",
		name: "Prussian",
	},
	prh: {
		code: "prh",
		name: "Porohanon",
	},
	pri: {
		code: "pri",
		name: "Paicî",
	},
	prk: {
		code: "prk",
		name: "Parauk",
	},
	prl: {
		code: "prl",
		name: "Peruvian Sign Language",
	},
	prm: {
		code: "prm",
		name: "Kibiri",
	},
	prn: {
		code: "prn",
		name: "Prasuni",
	},
	pro: {
		code: "pro",
		name: "Old Provençal (to 1500)",
	},
	prq: {
		code: "prq",
		name: "Ashéninka Perené",
	},
	prr: {
		code: "prr",
		name: "Puri",
	},
	prs: {
		code: "prs",
		name: "Dari",
	},
	prt: {
		code: "prt",
		name: "Phai",
	},
	pru: {
		code: "pru",
		name: "Puragi",
	},
	prw: {
		code: "prw",
		name: "Parawen",
	},
	prx: {
		code: "prx",
		name: "Purik",
	},
	prz: {
		code: "prz",
		name: "Providencia Sign Language",
	},
	psa: {
		code: "psa",
		name: "Asue Awyu",
	},
	psc: {
		code: "psc",
		name: "Iranian Sign Language",
	},
	psd: {
		code: "psd",
		name: "Plains Indian Sign Language",
	},
	pse: {
		code: "pse",
		name: "Central Malay",
	},
	psg: {
		code: "psg",
		name: "Penang Sign Language",
	},
	psh: {
		code: "psh",
		name: "Southwest Pashai",
	},
	psi: {
		code: "psi",
		name: "Southeast Pashai",
	},
	psl: {
		code: "psl",
		name: "Puerto Rican Sign Language",
	},
	psm: {
		code: "psm",
		name: "Pauserna",
	},
	psn: {
		code: "psn",
		name: "Panasuan",
	},
	pso: {
		code: "pso",
		name: "Polish Sign Language",
	},
	psp: {
		code: "psp",
		name: "Philippine Sign Language",
	},
	psq: {
		code: "psq",
		name: "Pasi",
	},
	psr: {
		code: "psr",
		name: "Portuguese Sign Language",
	},
	pss: {
		code: "pss",
		name: "Kaulong",
	},
	pst: {
		code: "pst",
		name: "Central Pashto",
	},
	psu: {
		code: "psu",
		name: "Sauraseni Prākrit",
	},
	psw: {
		code: "psw",
		name: "Port Sandwich",
	},
	psy: {
		code: "psy",
		name: "Piscataway",
	},
	pta: {
		code: "pta",
		name: "Pai Tavytera",
	},
	pth: {
		code: "pth",
		name: "Pataxó Hã-Ha-Hãe",
	},
	pti: {
		code: "pti",
		name: "Pindiini",
	},
	ptn: {
		code: "ptn",
		name: "Patani",
	},
	pto: {
		code: "pto",
		name: "Zo'é",
	},
	ptp: {
		code: "ptp",
		name: "Patep",
	},
	ptq: {
		code: "ptq",
		name: "Pattapu",
	},
	ptr: {
		code: "ptr",
		name: "Piamatsina",
	},
	ptt: {
		code: "ptt",
		name: "Enrekang",
	},
	ptu: {
		code: "ptu",
		name: "Bambam",
	},
	ptv: {
		code: "ptv",
		name: "Port Vato",
	},
	ptw: {
		code: "ptw",
		name: "Pentlatch",
	},
	pty: {
		code: "pty",
		name: "Pathiya",
	},
	pua: {
		code: "pua",
		name: "Western Highland Purepecha",
	},
	pub: {
		code: "pub",
		name: "Purum",
	},
	puc: {
		code: "puc",
		name: "Punan Merap",
	},
	pud: {
		code: "pud",
		name: "Punan Aput",
	},
	pue: {
		code: "pue",
		name: "Puelche",
	},
	puf: {
		code: "puf",
		name: "Punan Merah",
	},
	pug: {
		code: "pug",
		name: "Phuie",
	},
	pui: {
		code: "pui",
		name: "Puinave",
	},
	puj: {
		code: "puj",
		name: "Punan Tubu",
	},
	pum: {
		code: "pum",
		name: "Puma",
	},
	puo: {
		code: "puo",
		name: "Puoc",
	},
	pup: {
		code: "pup",
		name: "Pulabu",
	},
	puq: {
		code: "puq",
		name: "Puquina",
	},
	pur: {
		code: "pur",
		name: "Puruborá",
	},
	pus: {
		code: "pus",
		name: "Pushto",
	},
	put: {
		code: "put",
		name: "Putoh",
	},
	puu: {
		code: "puu",
		name: "Punu",
	},
	puw: {
		code: "puw",
		name: "Puluwatese",
	},
	pux: {
		code: "pux",
		name: "Puare",
	},
	puy: {
		code: "puy",
		name: "Purisimeño",
	},
	pwa: {
		code: "pwa",
		name: "Pawaia",
	},
	pwb: {
		code: "pwb",
		name: "Panawa",
	},
	pwg: {
		code: "pwg",
		name: "Gapapaiwa",
	},
	pwi: {
		code: "pwi",
		name: "Patwin",
	},
	pwm: {
		code: "pwm",
		name: "Molbog",
	},
	pwn: {
		code: "pwn",
		name: "Paiwan",
	},
	pwo: {
		code: "pwo",
		name: "Pwo Western Karen",
	},
	pwr: {
		code: "pwr",
		name: "Powari",
	},
	pww: {
		code: "pww",
		name: "Pwo Northern Karen",
	},
	pxm: {
		code: "pxm",
		name: "Quetzaltepec Mixe",
	},
	pye: {
		code: "pye",
		name: "Pye Krumen",
	},
	pym: {
		code: "pym",
		name: "Fyam",
	},
	pyn: {
		code: "pyn",
		name: "Poyanáwa",
	},
	pys: {
		code: "pys",
		name: "Paraguayan Sign Language",
	},
	pyu: {
		code: "pyu",
		name: "Puyuma",
	},
	pyx: {
		code: "pyx",
		name: "Pyu (Myanmar)",
	},
	pyy: {
		code: "pyy",
		name: "Pyen",
	},
	pze: {
		code: "pze",
		name: "Pesse",
	},
	pzh: {
		code: "pzh",
		name: "Pazeh",
	},
	pzn: {
		code: "pzn",
		name: "Jejara Naga",
	},
	qua: {
		code: "qua",
		name: "Quapaw",
	},
	qub: {
		code: "qub",
		name: "Huallaga Huánuco Quechua",
	},
	quc: {
		code: "quc",
		name: "K'iche'",
	},
	qud: {
		code: "qud",
		name: "Calderón Highland Quichua",
	},
	que: {
		code: "que",
		name: "Quechua",
	},
	quf: {
		code: "quf",
		name: "Lambayeque Quechua",
	},
	qug: {
		code: "qug",
		name: "Chimborazo Highland Quichua",
	},
	quh: {
		code: "quh",
		name: "South Bolivian Quechua",
	},
	qui: {
		code: "qui",
		name: "Quileute",
	},
	quk: {
		code: "quk",
		name: "Chachapoyas Quechua",
	},
	qul: {
		code: "qul",
		name: "North Bolivian Quechua",
	},
	qum: {
		code: "qum",
		name: "Sipacapense",
	},
	qun: {
		code: "qun",
		name: "Quinault",
	},
	qup: {
		code: "qup",
		name: "Southern Pastaza Quechua",
	},
	quq: {
		code: "quq",
		name: "Quinqui",
	},
	qur: {
		code: "qur",
		name: "Yanahuanca Pasco Quechua",
	},
	qus: {
		code: "qus",
		name: "Santiago del Estero Quichua",
	},
	quv: {
		code: "quv",
		name: "Sacapulteco",
	},
	quw: {
		code: "quw",
		name: "Tena Lowland Quichua",
	},
	qux: {
		code: "qux",
		name: "Yauyos Quechua",
	},
	quy: {
		code: "quy",
		name: "Ayacucho Quechua",
	},
	quz: {
		code: "quz",
		name: "Cusco Quechua",
	},
	qva: {
		code: "qva",
		name: "Ambo-Pasco Quechua",
	},
	qvc: {
		code: "qvc",
		name: "Cajamarca Quechua",
	},
	qve: {
		code: "qve",
		name: "Eastern Apurímac Quechua",
	},
	qvh: {
		code: "qvh",
		name: "Huamalíes-Dos de Mayo Huánuco Quechua",
	},
	qvi: {
		code: "qvi",
		name: "Imbabura Highland Quichua",
	},
	qvj: {
		code: "qvj",
		name: "Loja Highland Quichua",
	},
	qvl: {
		code: "qvl",
		name: "Cajatambo North Lima Quechua",
	},
	qvm: {
		code: "qvm",
		name: "Margos-Yarowilca-Lauricocha Quechua",
	},
	qvn: {
		code: "qvn",
		name: "North Junín Quechua",
	},
	qvo: {
		code: "qvo",
		name: "Napo Lowland Quechua",
	},
	qvp: {
		code: "qvp",
		name: "Pacaraos Quechua",
	},
	qvs: {
		code: "qvs",
		name: "San Martín Quechua",
	},
	qvw: {
		code: "qvw",
		name: "Huaylla Wanca Quechua",
	},
	qvy: {
		code: "qvy",
		name: "Queyu",
	},
	qvz: {
		code: "qvz",
		name: "Northern Pastaza Quichua",
	},
	qwa: {
		code: "qwa",
		name: "Corongo Ancash Quechua",
	},
	qwc: {
		code: "qwc",
		name: "Classical Quechua",
	},
	qwh: {
		code: "qwh",
		name: "Huaylas Ancash Quechua",
	},
	qwm: {
		code: "qwm",
		name: "Kuman (Russia)",
	},
	qws: {
		code: "qws",
		name: "Sihuas Ancash Quechua",
	},
	qwt: {
		code: "qwt",
		name: "Kwalhioqua-Tlatskanai",
	},
	qxa: {
		code: "qxa",
		name: "Chiquián Ancash Quechua",
	},
	qxc: {
		code: "qxc",
		name: "Chincha Quechua",
	},
	qxh: {
		code: "qxh",
		name: "Panao Huánuco Quechua",
	},
	qxl: {
		code: "qxl",
		name: "Salasaca Highland Quichua",
	},
	qxn: {
		code: "qxn",
		name: "Northern Conchucos Ancash Quechua",
	},
	qxo: {
		code: "qxo",
		name: "Southern Conchucos Ancash Quechua",
	},
	qxp: {
		code: "qxp",
		name: "Puno Quechua",
	},
	qxq: {
		code: "qxq",
		name: "Qashqa'i",
	},
	qxr: {
		code: "qxr",
		name: "Cañar Highland Quichua",
	},
	qxs: {
		code: "qxs",
		name: "Southern Qiang",
	},
	qxt: {
		code: "qxt",
		name: "Santa Ana de Tusi Pasco Quechua",
	},
	qxu: {
		code: "qxu",
		name: "Arequipa-La Unión Quechua",
	},
	qxw: {
		code: "qxw",
		name: "Jauja Wanca Quechua",
	},
	qya: {
		code: "qya",
		name: "Quenya",
	},
	qyp: {
		code: "qyp",
		name: "Quiripi",
	},
	raa: {
		code: "raa",
		name: "Dungmali",
	},
	rab: {
		code: "rab",
		name: "Camling",
	},
	rac: {
		code: "rac",
		name: "Rasawa",
	},
	rad: {
		code: "rad",
		name: "Rade",
	},
	raf: {
		code: "raf",
		name: "Western Meohang",
	},
	rag: {
		code: "rag",
		name: "Logooli",
	},
	rah: {
		code: "rah",
		name: "Rabha",
	},
	rai: {
		code: "rai",
		name: "Ramoaaina",
	},
	raj: {
		code: "raj",
		name: "Rajasthani",
	},
	rak: {
		code: "rak",
		name: "Tulu-Bohuai",
	},
	ral: {
		code: "ral",
		name: "Ralte",
	},
	ram: {
		code: "ram",
		name: "Canela",
	},
	ran: {
		code: "ran",
		name: "Riantana",
	},
	rao: {
		code: "rao",
		name: "Rao",
	},
	rap: {
		code: "rap",
		name: "Rapanui",
	},
	raq: {
		code: "raq",
		name: "Saam",
	},
	rar: {
		code: "rar",
		name: "Rarotongan",
	},
	ras: {
		code: "ras",
		name: "Tegali",
	},
	rat: {
		code: "rat",
		name: "Razajerdi",
	},
	rau: {
		code: "rau",
		name: "Raute",
	},
	rav: {
		code: "rav",
		name: "Sampang",
	},
	raw: {
		code: "raw",
		name: "Rawang",
	},
	rax: {
		code: "rax",
		name: "Rang",
	},
	ray: {
		code: "ray",
		name: "Rapa",
	},
	raz: {
		code: "raz",
		name: "Rahambuu",
	},
	rbb: {
		code: "rbb",
		name: "Rumai Palaung",
	},
	rbk: {
		code: "rbk",
		name: "Northern Bontok",
	},
	rbl: {
		code: "rbl",
		name: "Miraya Bikol",
	},
	rbp: {
		code: "rbp",
		name: "Barababaraba",
	},
	rcf: {
		code: "rcf",
		name: "Réunion Creole French",
	},
	rdb: {
		code: "rdb",
		name: "Rudbari",
	},
	rea: {
		code: "rea",
		name: "Rerau",
	},
	reb: {
		code: "reb",
		name: "Rembong",
	},
	ree: {
		code: "ree",
		name: "Rejang Kayan",
	},
	reg: {
		code: "reg",
		name: "Kara (Tanzania)",
	},
	rei: {
		code: "rei",
		name: "Reli",
	},
	rej: {
		code: "rej",
		name: "Rejang",
	},
	rel: {
		code: "rel",
		name: "Rendille",
	},
	rem: {
		code: "rem",
		name: "Remo",
	},
	ren: {
		code: "ren",
		name: "Rengao",
	},
	rer: {
		code: "rer",
		name: "Rer Bare",
	},
	res: {
		code: "res",
		name: "Reshe",
	},
	ret: {
		code: "ret",
		name: "Retta",
	},
	rey: {
		code: "rey",
		name: "Reyesano",
	},
	rga: {
		code: "rga",
		name: "Roria",
	},
	rge: {
		code: "rge",
		name: "Romano-Greek",
	},
	rgk: {
		code: "rgk",
		name: "Rangkas",
	},
	rgn: {
		code: "rgn",
		name: "Romagnol",
	},
	rgr: {
		code: "rgr",
		name: "Resígaro",
	},
	rgs: {
		code: "rgs",
		name: "Southern Roglai",
	},
	rgu: {
		code: "rgu",
		name: "Ringgou",
	},
	rhg: {
		code: "rhg",
		name: "Rohingya",
	},
	rhp: {
		code: "rhp",
		name: "Yahang",
	},
	ria: {
		code: "ria",
		name: "Riang (India)",
	},
	rib: {
		code: "rib",
		name: "Bribri Sign Language",
	},
	rif: {
		code: "rif",
		name: "Tarifit",
	},
	ril: {
		code: "ril",
		name: "Riang Lang",
	},
	rim: {
		code: "rim",
		name: "Nyaturu",
	},
	rin: {
		code: "rin",
		name: "Nungu",
	},
	rir: {
		code: "rir",
		name: "Ribun",
	},
	rit: {
		code: "rit",
		name: "Ritharrngu",
	},
	riu: {
		code: "riu",
		name: "Riung",
	},
	rjg: {
		code: "rjg",
		name: "Rajong",
	},
	rji: {
		code: "rji",
		name: "Raji",
	},
	rjs: {
		code: "rjs",
		name: "Rajbanshi",
	},
	rka: {
		code: "rka",
		name: "Kraol",
	},
	rkb: {
		code: "rkb",
		name: "Rikbaktsa",
	},
	rkh: {
		code: "rkh",
		name: "Rakahanga-Manihiki",
	},
	rki: {
		code: "rki",
		name: "Rakhine",
	},
	rkm: {
		code: "rkm",
		name: "Marka",
	},
	rkt: {
		code: "rkt",
		name: "Rangpuri",
	},
	rkw: {
		code: "rkw",
		name: "Arakwal",
	},
	rma: {
		code: "rma",
		name: "Rama",
	},
	rmb: {
		code: "rmb",
		name: "Rembarrnga",
	},
	rmc: {
		code: "rmc",
		name: "Carpathian Romani",
	},
	rmd: {
		code: "rmd",
		name: "Traveller Danish",
	},
	rme: {
		code: "rme",
		name: "Angloromani",
	},
	rmf: {
		code: "rmf",
		name: "Kalo Finnish Romani",
	},
	rmg: {
		code: "rmg",
		name: "Traveller Norwegian",
	},
	rmh: {
		code: "rmh",
		name: "Murkim",
	},
	rmi: {
		code: "rmi",
		name: "Lomavren",
	},
	rmk: {
		code: "rmk",
		name: "Romkun",
	},
	rml: {
		code: "rml",
		name: "Baltic Romani",
	},
	rmm: {
		code: "rmm",
		name: "Roma",
	},
	rmn: {
		code: "rmn",
		name: "Balkan Romani",
	},
	rmo: {
		code: "rmo",
		name: "Sinte Romani",
	},
	rmp: {
		code: "rmp",
		name: "Rempi",
	},
	rmq: {
		code: "rmq",
		name: "Caló",
	},
	rms: {
		code: "rms",
		name: "Romanian Sign Language",
	},
	rmt: {
		code: "rmt",
		name: "Domari",
	},
	rmu: {
		code: "rmu",
		name: "Tavringer Romani",
	},
	rmv: {
		code: "rmv",
		name: "Romanova",
	},
	rmw: {
		code: "rmw",
		name: "Welsh Romani",
	},
	rmx: {
		code: "rmx",
		name: "Romam",
	},
	rmy: {
		code: "rmy",
		name: "Vlax Romani",
	},
	rmz: {
		code: "rmz",
		name: "Marma",
	},
	rnb: {
		code: "rnb",
		name: "Brunca Sign Language",
	},
	rnd: {
		code: "rnd",
		name: "Ruund",
	},
	rng: {
		code: "rng",
		name: "Ronga",
	},
	rnl: {
		code: "rnl",
		name: "Ranglong",
	},
	rnn: {
		code: "rnn",
		name: "Roon",
	},
	rnp: {
		code: "rnp",
		name: "Rongpo",
	},
	rnr: {
		code: "rnr",
		name: "Nari Nari",
	},
	rnw: {
		code: "rnw",
		name: "Rungwa",
	},
	rob: {
		code: "rob",
		name: "Tae'",
	},
	roc: {
		code: "roc",
		name: "Cacgia Roglai",
	},
	rod: {
		code: "rod",
		name: "Rogo",
	},
	roe: {
		code: "roe",
		name: "Ronji",
	},
	rof: {
		code: "rof",
		name: "Rombo",
	},
	rog: {
		code: "rog",
		name: "Northern Roglai",
	},
	roh: {
		code: "roh",
		name: "Romansh",
	},
	rol: {
		code: "rol",
		name: "Romblomanon",
	},
	rom: {
		code: "rom",
		name: "Romany",
	},
	ron: {
		code: "ron",
		name: "Romanian",
	},
	roo: {
		code: "roo",
		name: "Rotokas",
	},
	rop: {
		code: "rop",
		name: "Kriol",
	},
	ror: {
		code: "ror",
		name: "Rongga",
	},
	rou: {
		code: "rou",
		name: "Runga",
	},
	row: {
		code: "row",
		name: "Dela-Oenale",
	},
	rpn: {
		code: "rpn",
		name: "Repanbitip",
	},
	rpt: {
		code: "rpt",
		name: "Rapting",
	},
	rri: {
		code: "rri",
		name: "Ririo",
	},
	rro: {
		code: "rro",
		name: "Waima",
	},
	rrt: {
		code: "rrt",
		name: "Arritinngithigh",
	},
	rsb: {
		code: "rsb",
		name: "Romano-Serbian",
	},
	rsk: {
		code: "rsk",
		name: "Ruthenian",
	},
	rsl: {
		code: "rsl",
		name: "Russian Sign Language",
	},
	rsm: {
		code: "rsm",
		name: "Miriwoong Sign Language",
	},
	rsn: {
		code: "rsn",
		name: "Rwandan Sign Language",
	},
	rsw: {
		code: "rsw",
		name: "Rishiwa",
	},
	rtc: {
		code: "rtc",
		name: "Rungtu Chin",
	},
	rth: {
		code: "rth",
		name: "Ratahan",
	},
	rtm: {
		code: "rtm",
		name: "Rotuman",
	},
	rts: {
		code: "rts",
		name: "Yurats",
	},
	rtw: {
		code: "rtw",
		name: "Rathawi",
	},
	rub: {
		code: "rub",
		name: "Gungu",
	},
	ruc: {
		code: "ruc",
		name: "Ruuli",
	},
	rue: {
		code: "rue",
		name: "Rusyn",
	},
	ruf: {
		code: "ruf",
		name: "Luguru",
	},
	rug: {
		code: "rug",
		name: "Roviana",
	},
	ruh: {
		code: "ruh",
		name: "Ruga",
	},
	rui: {
		code: "rui",
		name: "Rufiji",
	},
	ruk: {
		code: "ruk",
		name: "Che",
	},
	run: {
		code: "run",
		name: "Rundi",
	},
	ruo: {
		code: "ruo",
		name: "Istro Romanian",
	},
	rup: {
		code: "rup",
		name: "Macedo-Romanian",
	},
	ruq: {
		code: "ruq",
		name: "Megleno Romanian",
	},
	rus: {
		code: "rus",
		name: "Russian",
	},
	rut: {
		code: "rut",
		name: "Rutul",
	},
	ruu: {
		code: "ruu",
		name: "Lanas Lobu",
	},
	ruy: {
		code: "ruy",
		name: "Mala (Nigeria)",
	},
	ruz: {
		code: "ruz",
		name: "Ruma",
	},
	rwa: {
		code: "rwa",
		name: "Rawo",
	},
	rwk: {
		code: "rwk",
		name: "Rwa",
	},
	rwl: {
		code: "rwl",
		name: "Ruwila",
	},
	rwm: {
		code: "rwm",
		name: "Amba (Uganda)",
	},
	rwo: {
		code: "rwo",
		name: "Rawa",
	},
	rwr: {
		code: "rwr",
		name: "Marwari (India)",
	},
	rxd: {
		code: "rxd",
		name: "Ngardi",
	},
	rxw: {
		code: "rxw",
		name: "Karuwali",
	},
	ryn: {
		code: "ryn",
		name: "Northern Amami-Oshima",
	},
	rys: {
		code: "rys",
		name: "Yaeyama",
	},
	ryu: {
		code: "ryu",
		name: "Central Okinawan",
	},
	rzh: {
		code: "rzh",
		name: "Rāziḥī",
	},
	saa: {
		code: "saa",
		name: "Saba",
	},
	sab: {
		code: "sab",
		name: "Buglere",
	},
	sac: {
		code: "sac",
		name: "Meskwaki",
	},
	sad: {
		code: "sad",
		name: "Sandawe",
	},
	sae: {
		code: "sae",
		name: "Sabanê",
	},
	saf: {
		code: "saf",
		name: "Safaliba",
	},
	sag: {
		code: "sag",
		name: "Sango",
	},
	sah: {
		code: "sah",
		name: "Yakut",
		nativeName: "саха тыла",
	},
	saj: {
		code: "saj",
		name: "Sahu",
	},
	sak: {
		code: "sak",
		name: "Sake",
	},
	sam: {
		code: "sam",
		name: "Samaritan Aramaic",
	},
	san: {
		code: "san",
		name: "Sanskrit",
	},
	sao: {
		code: "sao",
		name: "Sause",
	},
	saq: {
		code: "saq",
		name: "Samburu",
	},
	sar: {
		code: "sar",
		name: "Saraveca",
	},
	sas: {
		code: "sas",
		name: "Sasak",
	},
	sat: {
		code: "sat",
		name: "Santali",
	},
	sau: {
		code: "sau",
		name: "Saleman",
	},
	sav: {
		code: "sav",
		name: "Saafi-Saafi",
	},
	saw: {
		code: "saw",
		name: "Sawi",
	},
	sax: {
		code: "sax",
		name: "Sa",
	},
	say: {
		code: "say",
		name: "Saya",
	},
	saz: {
		code: "saz",
		name: "Saurashtra",
	},
	sba: {
		code: "sba",
		name: "Ngambay",
	},
	sbb: {
		code: "sbb",
		name: "Simbo",
	},
	sbc: {
		code: "sbc",
		name: "Kele (Papua New Guinea)",
	},
	sbd: {
		code: "sbd",
		name: "Southern Samo",
	},
	sbe: {
		code: "sbe",
		name: "Saliba",
	},
	sbf: {
		code: "sbf",
		name: "Chabu",
	},
	sbg: {
		code: "sbg",
		name: "Seget",
	},
	sbh: {
		code: "sbh",
		name: "Sori-Harengan",
	},
	sbi: {
		code: "sbi",
		name: "Seti",
	},
	sbj: {
		code: "sbj",
		name: "Surbakhal",
	},
	sbk: {
		code: "sbk",
		name: "Safwa",
	},
	sbl: {
		code: "sbl",
		name: "Botolan Sambal",
	},
	sbm: {
		code: "sbm",
		name: "Sagala",
	},
	sbn: {
		code: "sbn",
		name: "Sindhi Bhil",
	},
	sbo: {
		code: "sbo",
		name: "Sabüm",
	},
	sbp: {
		code: "sbp",
		name: "Sangu (Tanzania)",
	},
	sbq: {
		code: "sbq",
		name: "Sileibi",
	},
	sbr: {
		code: "sbr",
		name: "Sembakung Murut",
	},
	sbs: {
		code: "sbs",
		name: "Subiya",
	},
	sbt: {
		code: "sbt",
		name: "Kimki",
	},
	sbu: {
		code: "sbu",
		name: "Stod Bhoti",
	},
	sbv: {
		code: "sbv",
		name: "Sabine",
	},
	sbw: {
		code: "sbw",
		name: "Simba",
	},
	sbx: {
		code: "sbx",
		name: "Seberuang",
	},
	sby: {
		code: "sby",
		name: "Soli",
	},
	sbz: {
		code: "sbz",
		name: "Sara Kaba",
	},
	scb: {
		code: "scb",
		name: "Chut",
	},
	sce: {
		code: "sce",
		name: "Dongxiang",
	},
	scf: {
		code: "scf",
		name: "San Miguel Creole French",
	},
	scg: {
		code: "scg",
		name: "Sanggau",
	},
	sch: {
		code: "sch",
		name: "Sakachep",
	},
	sci: {
		code: "sci",
		name: "Sri Lankan Creole Malay",
	},
	sck: {
		code: "sck",
		name: "Sadri",
	},
	scl: {
		code: "scl",
		name: "Shina",
	},
	scn: {
		code: "scn",
		name: "Sicilian",
	},
	sco: {
		code: "sco",
		name: "Scots",
	},
	scp: {
		code: "scp",
		name: "Hyolmo",
	},
	scq: {
		code: "scq",
		name: "Sa'och",
	},
	scs: {
		code: "scs",
		name: "North Slavey",
	},
	sct: {
		code: "sct",
		name: "Southern Katang",
	},
	scu: {
		code: "scu",
		name: "Shumcho",
	},
	scv: {
		code: "scv",
		name: "Sheni",
	},
	scw: {
		code: "scw",
		name: "Sha",
	},
	scx: {
		code: "scx",
		name: "Sicel",
	},
	sda: {
		code: "sda",
		name: "Toraja-Sa'dan",
	},
	sdb: {
		code: "sdb",
		name: "Shabak",
	},
	sdc: {
		code: "sdc",
		name: "Sassarese Sardinian",
	},
	sde: {
		code: "sde",
		name: "Surubu",
	},
	sdf: {
		code: "sdf",
		name: "Sarli",
	},
	sdg: {
		code: "sdg",
		name: "Savi",
	},
	sdh: {
		code: "sdh",
		name: "Southern Kurdish",
	},
	sdj: {
		code: "sdj",
		name: "Suundi",
	},
	sdk: {
		code: "sdk",
		name: "Sos Kundi",
	},
	sdl: {
		code: "sdl",
		name: "Saudi Arabian Sign Language",
	},
	sdn: {
		code: "sdn",
		name: "Gallurese Sardinian",
	},
	sdo: {
		code: "sdo",
		name: "Bukar-Sadung Bidayuh",
	},
	sdp: {
		code: "sdp",
		name: "Sherdukpen",
	},
	sdq: {
		code: "sdq",
		name: "Semandang",
	},
	sdr: {
		code: "sdr",
		name: "Oraon Sadri",
	},
	sds: {
		code: "sds",
		name: "Sened",
	},
	sdt: {
		code: "sdt",
		name: "Shuadit",
	},
	sdu: {
		code: "sdu",
		name: "Sarudu",
	},
	sdx: {
		code: "sdx",
		name: "Sibu Melanau",
	},
	sdz: {
		code: "sdz",
		name: "Sallands",
	},
	sea: {
		code: "sea",
		name: "Semai",
	},
	seb: {
		code: "seb",
		name: "Shempire Senoufo",
	},
	sec: {
		code: "sec",
		name: "Sechelt",
	},
	sed: {
		code: "sed",
		name: "Sedang",
	},
	see: {
		code: "see",
		name: "Seneca",
	},
	sef: {
		code: "sef",
		name: "Cebaara Senoufo",
	},
	seg: {
		code: "seg",
		name: "Segeju",
	},
	seh: {
		code: "seh",
		name: "Sena",
	},
	sei: {
		code: "sei",
		name: "Seri",
	},
	sej: {
		code: "sej",
		name: "Sene",
	},
	sek: {
		code: "sek",
		name: "Sekani",
	},
	sel: {
		code: "sel",
		name: "Selkup",
	},
	sen: {
		code: "sen",
		name: "Nanerigé Sénoufo",
	},
	seo: {
		code: "seo",
		name: "Suarmin",
	},
	sep: {
		code: "sep",
		name: "Sìcìté Sénoufo",
	},
	seq: {
		code: "seq",
		name: "Senara Sénoufo",
	},
	ser: {
		code: "ser",
		name: "Serrano",
	},
	ses: {
		code: "ses",
		name: "Koyraboro Senni Songhai",
	},
	set: {
		code: "set",
		name: "Sentani",
	},
	seu: {
		code: "seu",
		name: "Serui-Laut",
	},
	sev: {
		code: "sev",
		name: "Nyarafolo Senoufo",
	},
	sew: {
		code: "sew",
		name: "Sewa Bay",
	},
	sey: {
		code: "sey",
		name: "Secoya",
	},
	sez: {
		code: "sez",
		name: "Senthang Chin",
	},
	sfb: {
		code: "sfb",
		name: "Langue des signes de Belgique Francophone",
	},
	sfe: {
		code: "sfe",
		name: "Eastern Subanen",
	},
	sfm: {
		code: "sfm",
		name: "Small Flowery Miao",
	},
	sfs: {
		code: "sfs",
		name: "South African Sign Language",
	},
	sfw: {
		code: "sfw",
		name: "Sehwi",
	},
	sga: {
		code: "sga",
		name: "Old Irish (to 900)",
	},
	sgb: {
		code: "sgb",
		name: "Mag-antsi Ayta",
	},
	sgc: {
		code: "sgc",
		name: "Kipsigis",
	},
	sgd: {
		code: "sgd",
		name: "Surigaonon",
	},
	sge: {
		code: "sge",
		name: "Segai",
	},
	sgg: {
		code: "sgg",
		name: "Swiss-German Sign Language",
	},
	sgh: {
		code: "sgh",
		name: "Shughni",
	},
	sgi: {
		code: "sgi",
		name: "Suga",
	},
	sgj: {
		code: "sgj",
		name: "Surgujia",
	},
	sgk: {
		code: "sgk",
		name: "Sangkong",
	},
	sgm: {
		code: "sgm",
		name: "Singa",
	},
	sgp: {
		code: "sgp",
		name: "Singpho",
	},
	sgr: {
		code: "sgr",
		name: "Sangisari",
	},
	sgs: {
		code: "sgs",
		name: "Samogitian",
	},
	sgt: {
		code: "sgt",
		name: "Brokpake",
	},
	sgu: {
		code: "sgu",
		name: "Salas",
	},
	sgw: {
		code: "sgw",
		name: "Sebat Bet Gurage",
	},
	sgx: {
		code: "sgx",
		name: "Sierra Leone Sign Language",
	},
	sgy: {
		code: "sgy",
		name: "Sanglechi",
	},
	sgz: {
		code: "sgz",
		name: "Sursurunga",
	},
	sha: {
		code: "sha",
		name: "Shall-Zwall",
	},
	shb: {
		code: "shb",
		name: "Ninam",
	},
	shc: {
		code: "shc",
		name: "Sonde",
	},
	shd: {
		code: "shd",
		name: "Kundal Shahi",
	},
	she: {
		code: "she",
		name: "Sheko",
	},
	shg: {
		code: "shg",
		name: "Shua",
	},
	shh: {
		code: "shh",
		name: "Shoshoni",
	},
	shi: {
		code: "shi",
		name: "Tachelhit",
	},
	shj: {
		code: "shj",
		name: "Shatt",
	},
	shk: {
		code: "shk",
		name: "Shilluk",
	},
	shl: {
		code: "shl",
		name: "Shendu",
	},
	shm: {
		code: "shm",
		name: "Shahrudi",
	},
	shn: {
		code: "shn",
		name: "Shan",
	},
	sho: {
		code: "sho",
		name: "Shanga",
	},
	shp: {
		code: "shp",
		name: "Shipibo-Conibo",
	},
	shq: {
		code: "shq",
		name: "Sala",
	},
	shr: {
		code: "shr",
		name: "Shi",
	},
	shs: {
		code: "shs",
		name: "Shuswap",
	},
	sht: {
		code: "sht",
		name: "Shasta",
	},
	shu: {
		code: "shu",
		name: "Chadian Arabic",
	},
	shv: {
		code: "shv",
		name: "Shehri",
	},
	shw: {
		code: "shw",
		name: "Shwai",
	},
	shx: {
		code: "shx",
		name: "She",
	},
	shy: {
		code: "shy",
		name: "Tachawit",
	},
	shz: {
		code: "shz",
		name: "Syenara Senoufo",
	},
	sia: {
		code: "sia",
		name: "Akkala Sami",
	},
	sib: {
		code: "sib",
		name: "Sebop",
	},
	sid: {
		code: "sid",
		name: "Sidamo",
	},
	sie: {
		code: "sie",
		name: "Simaa",
	},
	sif: {
		code: "sif",
		name: "Siamou",
	},
	sig: {
		code: "sig",
		name: "Paasaal",
	},
	sih: {
		code: "sih",
		name: "Zire",
	},
	sii: {
		code: "sii",
		name: "Shom Peng",
	},
	sij: {
		code: "sij",
		name: "Numbami",
	},
	sik: {
		code: "sik",
		name: "Sikiana",
	},
	sil: {
		code: "sil",
		name: "Tumulung Sisaala",
	},
	sim: {
		code: "sim",
		name: "Mende (Papua New Guinea)",
	},
	sin: {
		code: "sin",
		name: "Sinhala",
	},
	sip: {
		code: "sip",
		name: "Sikkimese",
	},
	siq: {
		code: "siq",
		name: "Sonia",
	},
	sir: {
		code: "sir",
		name: "Siri",
	},
	sis: {
		code: "sis",
		name: "Siuslaw",
	},
	siu: {
		code: "siu",
		name: "Sinagen",
	},
	siv: {
		code: "siv",
		name: "Sumariup",
	},
	siw: {
		code: "siw",
		name: "Siwai",
	},
	six: {
		code: "six",
		name: "Sumau",
	},
	siy: {
		code: "siy",
		name: "Sivandi",
	},
	siz: {
		code: "siz",
		name: "Siwi",
	},
	sja: {
		code: "sja",
		name: "Epena",
	},
	sjb: {
		code: "sjb",
		name: "Sajau Basap",
	},
	sjd: {
		code: "sjd",
		name: "Kildin Sami",
	},
	sje: {
		code: "sje",
		name: "Pite Sami",
	},
	sjg: {
		code: "sjg",
		name: "Assangori",
	},
	sjk: {
		code: "sjk",
		name: "Kemi Sami",
	},
	sjl: {
		code: "sjl",
		name: "Sajalong",
	},
	sjm: {
		code: "sjm",
		name: "Mapun",
	},
	sjn: {
		code: "sjn",
		name: "Sindarin",
	},
	sjo: {
		code: "sjo",
		name: "Xibe",
	},
	sjp: {
		code: "sjp",
		name: "Surjapuri",
	},
	sjr: {
		code: "sjr",
		name: "Siar-Lak",
	},
	sjs: {
		code: "sjs",
		name: "Senhaja De Srair",
	},
	sjt: {
		code: "sjt",
		name: "Ter Sami",
	},
	sju: {
		code: "sju",
		name: "Ume Sami",
	},
	sjw: {
		code: "sjw",
		name: "Shawnee",
	},
	ska: {
		code: "ska",
		name: "Skagit",
	},
	skb: {
		code: "skb",
		name: "Saek",
	},
	skc: {
		code: "skc",
		name: "Ma Manda",
	},
	skd: {
		code: "skd",
		name: "Southern Sierra Miwok",
	},
	ske: {
		code: "ske",
		name: "Seke (Vanuatu)",
	},
	skf: {
		code: "skf",
		name: "Sakirabiá",
	},
	skg: {
		code: "skg",
		name: "Sakalava Malagasy",
	},
	skh: {
		code: "skh",
		name: "Sikule",
	},
	ski: {
		code: "ski",
		name: "Sika",
	},
	skj: {
		code: "skj",
		name: "Seke (Nepal)",
	},
	skm: {
		code: "skm",
		name: "Kutong",
	},
	skn: {
		code: "skn",
		name: "Kolibugan Subanon",
	},
	sko: {
		code: "sko",
		name: "Seko Tengah",
	},
	skp: {
		code: "skp",
		name: "Sekapan",
	},
	skq: {
		code: "skq",
		name: "Sininkere",
	},
	skr: {
		code: "skr",
		name: "Saraiki",
	},
	sks: {
		code: "sks",
		name: "Maia",
	},
	skt: {
		code: "skt",
		name: "Sakata",
	},
	sku: {
		code: "sku",
		name: "Sakao",
	},
	skv: {
		code: "skv",
		name: "Skou",
	},
	skw: {
		code: "skw",
		name: "Skepi Creole Dutch",
	},
	skx: {
		code: "skx",
		name: "Seko Padang",
	},
	sky: {
		code: "sky",
		name: "Sikaiana",
	},
	skz: {
		code: "skz",
		name: "Sekar",
	},
	slc: {
		code: "slc",
		name: "Sáliba",
	},
	sld: {
		code: "sld",
		name: "Sissala",
	},
	sle: {
		code: "sle",
		name: "Sholaga",
	},
	slf: {
		code: "slf",
		name: "Swiss-Italian Sign Language",
	},
	slg: {
		code: "slg",
		name: "Selungai Murut",
	},
	slh: {
		code: "slh",
		name: "Southern Puget Sound Salish",
	},
	sli: {
		code: "sli",
		name: "Lower Silesian",
	},
	slj: {
		code: "slj",
		name: "Salumá",
	},
	slk: {
		code: "slk",
		name: "Slovak",
	},
	sll: {
		code: "sll",
		name: "Salt-Yui",
	},
	slm: {
		code: "slm",
		name: "Pangutaran Sama",
	},
	sln: {
		code: "sln",
		name: "Salinan",
	},
	slp: {
		code: "slp",
		name: "Lamaholot",
	},
	slr: {
		code: "slr",
		name: "Salar",
	},
	sls: {
		code: "sls",
		name: "Singapore Sign Language",
	},
	slt: {
		code: "slt",
		name: "Sila",
	},
	slu: {
		code: "slu",
		name: "Selaru",
	},
	slv: {
		code: "slv",
		name: "Slovenian",
	},
	slw: {
		code: "slw",
		name: "Sialum",
	},
	slx: {
		code: "slx",
		name: "Salampasu",
	},
	sly: {
		code: "sly",
		name: "Selayar",
	},
	slz: {
		code: "slz",
		name: "Ma'ya",
	},
	sma: {
		code: "sma",
		name: "Southern Sami",
	},
	smb: {
		code: "smb",
		name: "Simbari",
	},
	smc: {
		code: "smc",
		name: "Som",
	},
	sme: {
		code: "sme",
		name: "Northern Sami",
	},
	smf: {
		code: "smf",
		name: "Auwe",
	},
	smg: {
		code: "smg",
		name: "Simbali",
	},
	smh: {
		code: "smh",
		name: "Samei",
	},
	smj: {
		code: "smj",
		name: "Lule Sami",
	},
	smk: {
		code: "smk",
		name: "Bolinao",
	},
	sml: {
		code: "sml",
		name: "Central Sama",
	},
	smm: {
		code: "smm",
		name: "Musasa",
	},
	smn: {
		code: "smn",
		name: "Inari Sami",
	},
	smo: {
		code: "smo",
		name: "Samoan",
	},
	smp: {
		code: "smp",
		name: "Samaritan",
	},
	smq: {
		code: "smq",
		name: "Samo",
	},
	smr: {
		code: "smr",
		name: "Simeulue",
	},
	sms: {
		code: "sms",
		name: "Skolt Sami",
	},
	smt: {
		code: "smt",
		name: "Simte",
	},
	smu: {
		code: "smu",
		name: "Somray",
	},
	smv: {
		code: "smv",
		name: "Samvedi",
	},
	smw: {
		code: "smw",
		name: "Sumbawa",
	},
	smx: {
		code: "smx",
		name: "Samba",
	},
	smy: {
		code: "smy",
		name: "Semnani",
	},
	smz: {
		code: "smz",
		name: "Simeku",
	},
	sna: {
		code: "sna",
		name: "Shona",
	},
	snc: {
		code: "snc",
		name: "Sinaugoro",
	},
	snd: {
		code: "snd",
		name: "Sindhi",
	},
	sne: {
		code: "sne",
		name: "Bau Bidayuh",
	},
	snf: {
		code: "snf",
		name: "Noon",
	},
	sng: {
		code: "sng",
		name: "Sanga (Democratic Republic of Congo)",
	},
	sni: {
		code: "sni",
		name: "Sensi",
	},
	snj: {
		code: "snj",
		name: "Riverain Sango",
	},
	snk: {
		code: "snk",
		name: "Soninke",
	},
	snl: {
		code: "snl",
		name: "Sangil",
	},
	snm: {
		code: "snm",
		name: "Southern Ma'di",
	},
	snn: {
		code: "snn",
		name: "Siona",
	},
	sno: {
		code: "sno",
		name: "Snohomish",
	},
	snp: {
		code: "snp",
		name: "Siane",
	},
	snq: {
		code: "snq",
		name: "Sangu (Gabon)",
	},
	snr: {
		code: "snr",
		name: "Sihan",
	},
	sns: {
		code: "sns",
		name: "South West Bay",
	},
	snu: {
		code: "snu",
		name: "Senggi",
	},
	snv: {
		code: "snv",
		name: "Sa'ban",
	},
	snw: {
		code: "snw",
		name: "Selee",
	},
	snx: {
		code: "snx",
		name: "Sam",
	},
	sny: {
		code: "sny",
		name: "Saniyo-Hiyewe",
	},
	snz: {
		code: "snz",
		name: "Kou",
	},
	soa: {
		code: "soa",
		name: "Thai Song",
	},
	sob: {
		code: "sob",
		name: "Sobei",
	},
	soc: {
		code: "soc",
		name: "So (Democratic Republic of Congo)",
	},
	sod: {
		code: "sod",
		name: "Songoora",
	},
	soe: {
		code: "soe",
		name: "Songomeno",
	},
	sog: {
		code: "sog",
		name: "Sogdian",
	},
	soh: {
		code: "soh",
		name: "Aka",
	},
	soi: {
		code: "soi",
		name: "Sonha",
	},
	soj: {
		code: "soj",
		name: "Soi",
	},
	sok: {
		code: "sok",
		name: "Sokoro",
	},
	sol: {
		code: "sol",
		name: "Solos",
	},
	som: {
		code: "som",
		name: "Somali",
	},
	soo: {
		code: "soo",
		name: "Songo",
	},
	sop: {
		code: "sop",
		name: "Songe",
	},
	soq: {
		code: "soq",
		name: "Kanasi",
	},
	sor: {
		code: "sor",
		name: "Somrai",
	},
	sos: {
		code: "sos",
		name: "Seeku",
	},
	sot: {
		code: "sot",
		name: "Southern Sotho",
	},
	sou: {
		code: "sou",
		name: "Southern Thai",
	},
	sov: {
		code: "sov",
		name: "Sonsorol",
	},
	sow: {
		code: "sow",
		name: "Sowanda",
	},
	sox: {
		code: "sox",
		name: "Swo",
	},
	soy: {
		code: "soy",
		name: "Miyobe",
	},
	soz: {
		code: "soz",
		name: "Temi",
	},
	spa: {
		code: "spa",
		name: "Spanish",
	},
	spb: {
		code: "spb",
		name: "Sepa (Indonesia)",
	},
	spc: {
		code: "spc",
		name: "Sapé",
	},
	spd: {
		code: "spd",
		name: "Saep",
	},
	spe: {
		code: "spe",
		name: "Sepa (Papua New Guinea)",
	},
	spg: {
		code: "spg",
		name: "Sian",
	},
	spi: {
		code: "spi",
		name: "Saponi",
	},
	spk: {
		code: "spk",
		name: "Sengo",
	},
	spl: {
		code: "spl",
		name: "Selepet",
	},
	spm: {
		code: "spm",
		name: "Akukem",
	},
	spn: {
		code: "spn",
		name: "Sanapaná",
	},
	spo: {
		code: "spo",
		name: "Spokane",
	},
	spp: {
		code: "spp",
		name: "Supyire Senoufo",
	},
	spq: {
		code: "spq",
		name: "Loreto-Ucayali Spanish",
	},
	spr: {
		code: "spr",
		name: "Saparua",
	},
	sps: {
		code: "sps",
		name: "Saposa",
	},
	spt: {
		code: "spt",
		name: "Spiti Bhoti",
	},
	spu: {
		code: "spu",
		name: "Sapuan",
	},
	spv: {
		code: "spv",
		name: "Sambalpuri",
	},
	spx: {
		code: "spx",
		name: "South Picene",
	},
	spy: {
		code: "spy",
		name: "Sabaot",
	},
	sqa: {
		code: "sqa",
		name: "Shama-Sambuga",
	},
	sqh: {
		code: "sqh",
		name: "Shau",
	},
	sqi: {
		code: "sqi",
		name: "Albanian",
	},
	sqk: {
		code: "sqk",
		name: "Albanian Sign Language",
	},
	sqm: {
		code: "sqm",
		name: "Suma",
	},
	sqn: {
		code: "sqn",
		name: "Susquehannock",
	},
	sqo: {
		code: "sqo",
		name: "Sorkhei",
	},
	sqq: {
		code: "sqq",
		name: "Sou",
	},
	sqr: {
		code: "sqr",
		name: "Siculo Arabic",
	},
	sqs: {
		code: "sqs",
		name: "Sri Lankan Sign Language",
	},
	sqt: {
		code: "sqt",
		name: "Soqotri",
	},
	squ: {
		code: "squ",
		name: "Squamish",
	},
	sqx: {
		code: "sqx",
		name: "Kufr Qassem Sign Language (KQSL)",
	},
	sra: {
		code: "sra",
		name: "Saruga",
	},
	srb: {
		code: "srb",
		name: "Sora",
	},
	src: {
		code: "src",
		name: "Logudorese Sardinian",
	},
	srd: {
		code: "srd",
		name: "Sardinian",
	},
	sre: {
		code: "sre",
		name: "Sara",
	},
	srf: {
		code: "srf",
		name: "Nafi",
	},
	srg: {
		code: "srg",
		name: "Sulod",
	},
	srh: {
		code: "srh",
		name: "Sarikoli",
	},
	sri: {
		code: "sri",
		name: "Siriano",
	},
	srk: {
		code: "srk",
		name: "Serudung Murut",
	},
	srl: {
		code: "srl",
		name: "Isirawa",
	},
	srm: {
		code: "srm",
		name: "Saramaccan",
	},
	srn: {
		code: "srn",
		name: "Sranan Tongo",
	},
	sro: {
		code: "sro",
		name: "Campidanese Sardinian",
	},
	srp: {
		code: "srp",
		name: "Serbian",
	},
	srq: {
		code: "srq",
		name: "Sirionó",
	},
	srr: {
		code: "srr",
		name: "Serer",
	},
	srs: {
		code: "srs",
		name: "Sarsi",
	},
	srt: {
		code: "srt",
		name: "Sauri",
	},
	sru: {
		code: "sru",
		name: "Suruí",
	},
	srv: {
		code: "srv",
		name: "Southern Sorsoganon",
	},
	srw: {
		code: "srw",
		name: "Serua",
	},
	srx: {
		code: "srx",
		name: "Sirmauri",
	},
	sry: {
		code: "sry",
		name: "Sera",
	},
	srz: {
		code: "srz",
		name: "Shahmirzadi",
	},
	ssb: {
		code: "ssb",
		name: "Southern Sama",
	},
	ssc: {
		code: "ssc",
		name: "Suba-Simbiti",
	},
	ssd: {
		code: "ssd",
		name: "Siroi",
	},
	sse: {
		code: "sse",
		name: "Balangingi",
	},
	ssf: {
		code: "ssf",
		name: "Thao",
	},
	ssg: {
		code: "ssg",
		name: "Seimat",
	},
	ssh: {
		code: "ssh",
		name: "Shihhi Arabic",
	},
	ssi: {
		code: "ssi",
		name: "Sansi",
	},
	ssj: {
		code: "ssj",
		name: "Sausi",
	},
	ssk: {
		code: "ssk",
		name: "Sunam",
	},
	ssl: {
		code: "ssl",
		name: "Western Sisaala",
	},
	ssm: {
		code: "ssm",
		name: "Semnam",
	},
	ssn: {
		code: "ssn",
		name: "Waata",
	},
	sso: {
		code: "sso",
		name: "Sissano",
	},
	ssp: {
		code: "ssp",
		name: "Spanish Sign Language",
	},
	ssq: {
		code: "ssq",
		name: "So'a",
	},
	ssr: {
		code: "ssr",
		name: "Swiss-French Sign Language",
	},
	sss: {
		code: "sss",
		name: "Sô",
	},
	sst: {
		code: "sst",
		name: "Sinasina",
	},
	ssu: {
		code: "ssu",
		name: "Susuami",
	},
	ssv: {
		code: "ssv",
		name: "Shark Bay",
	},
	ssw: {
		code: "ssw",
		name: "Swati",
	},
	ssx: {
		code: "ssx",
		name: "Samberigi",
	},
	ssy: {
		code: "ssy",
		name: "Saho",
	},
	ssz: {
		code: "ssz",
		name: "Sengseng",
	},
	sta: {
		code: "sta",
		name: "Settla",
	},
	stb: {
		code: "stb",
		name: "Northern Subanen",
	},
	std: {
		code: "std",
		name: "Sentinel",
	},
	ste: {
		code: "ste",
		name: "Liana-Seti",
	},
	stf: {
		code: "stf",
		name: "Seta",
	},
	stg: {
		code: "stg",
		name: "Trieng",
	},
	sth: {
		code: "sth",
		name: "Shelta",
	},
	sti: {
		code: "sti",
		name: "Bulo Stieng",
	},
	stj: {
		code: "stj",
		name: "Matya Samo",
	},
	stk: {
		code: "stk",
		name: "Arammba",
	},
	stl: {
		code: "stl",
		name: "Stellingwerfs",
	},
	stm: {
		code: "stm",
		name: "Setaman",
	},
	stn: {
		code: "stn",
		name: "Owa",
	},
	sto: {
		code: "sto",
		name: "Stoney",
	},
	stp: {
		code: "stp",
		name: "Southeastern Tepehuan",
	},
	stq: {
		code: "stq",
		name: "Saterfriesisch",
	},
	str: {
		code: "str",
		name: "Straits Salish",
	},
	sts: {
		code: "sts",
		name: "Shumashti",
	},
	stt: {
		code: "stt",
		name: "Budeh Stieng",
	},
	stu: {
		code: "stu",
		name: "Samtao",
	},
	stv: {
		code: "stv",
		name: "Silt'e",
	},
	stw: {
		code: "stw",
		name: "Satawalese",
	},
	sty: {
		code: "sty",
		name: "Siberian Tatar",
	},
	sua: {
		code: "sua",
		name: "Sulka",
	},
	sub: {
		code: "sub",
		name: "Suku",
	},
	suc: {
		code: "suc",
		name: "Western Subanon",
	},
	sue: {
		code: "sue",
		name: "Suena",
	},
	sug: {
		code: "sug",
		name: "Suganga",
	},
	sui: {
		code: "sui",
		name: "Suki",
	},
	suj: {
		code: "suj",
		name: "Shubi",
	},
	suk: {
		code: "suk",
		name: "Sukuma",
	},
	sun: {
		code: "sun",
		name: "Sundanese",
	},
	suo: {
		code: "suo",
		name: "Bouni",
	},
	suq: {
		code: "suq",
		name: "Tirmaga-Chai Suri",
	},
	sur: {
		code: "sur",
		name: "Mwaghavul",
	},
	sus: {
		code: "sus",
		name: "Susu",
	},
	sut: {
		code: "sut",
		name: "Subtiaba",
	},
	suv: {
		code: "suv",
		name: "Puroik",
	},
	suw: {
		code: "suw",
		name: "Sumbwa",
	},
	sux: {
		code: "sux",
		name: "Sumerian",
	},
	suy: {
		code: "suy",
		name: "Suyá",
	},
	suz: {
		code: "suz",
		name: "Sunwar",
	},
	sva: {
		code: "sva",
		name: "Svan",
	},
	svb: {
		code: "svb",
		name: "Ulau-Suain",
	},
	svc: {
		code: "svc",
		name: "Vincentian Creole English",
	},
	sve: {
		code: "sve",
		name: "Serili",
	},
	svk: {
		code: "svk",
		name: "Slovakian Sign Language",
	},
	svm: {
		code: "svm",
		name: "Slavomolisano",
	},
	svs: {
		code: "svs",
		name: "Savosavo",
	},
	svx: {
		code: "svx",
		name: "Skalvian",
	},
	swa: {
		code: "swa",
		name: "Swahili (macrolanguage)",
	},
	swb: {
		code: "swb",
		name: "Maore Comorian",
	},
	swc: {
		code: "swc",
		name: "Congo Swahili",
	},
	swe: {
		code: "swe",
		name: "Swedish",
	},
	swf: {
		code: "swf",
		name: "Sere",
	},
	swg: {
		code: "swg",
		name: "Swabian",
	},
	swh: {
		code: "swh",
		name: "Swahili (individual language)",
	},
	swi: {
		code: "swi",
		name: "Sui",
	},
	swj: {
		code: "swj",
		name: "Sira",
	},
	swk: {
		code: "swk",
		name: "Malawi Sena",
	},
	swl: {
		code: "swl",
		name: "Swedish Sign Language",
	},
	swm: {
		code: "swm",
		name: "Samosa",
	},
	swn: {
		code: "swn",
		name: "Sawknah",
	},
	swo: {
		code: "swo",
		name: "Shanenawa",
	},
	swp: {
		code: "swp",
		name: "Suau",
	},
	swq: {
		code: "swq",
		name: "Sharwa",
	},
	swr: {
		code: "swr",
		name: "Saweru",
	},
	sws: {
		code: "sws",
		name: "Seluwasan",
	},
	swt: {
		code: "swt",
		name: "Sawila",
	},
	swu: {
		code: "swu",
		name: "Suwawa",
	},
	swv: {
		code: "swv",
		name: "Shekhawati",
	},
	sww: {
		code: "sww",
		name: "Sowa",
	},
	swx: {
		code: "swx",
		name: "Suruahá",
	},
	swy: {
		code: "swy",
		name: "Sarua",
	},
	sxb: {
		code: "sxb",
		name: "Suba",
	},
	sxc: {
		code: "sxc",
		name: "Sicanian",
	},
	sxe: {
		code: "sxe",
		name: "Sighu",
	},
	sxg: {
		code: "sxg",
		name: "Shuhi",
	},
	sxk: {
		code: "sxk",
		name: "Southern Kalapuya",
	},
	sxl: {
		code: "sxl",
		name: "Selian",
	},
	sxm: {
		code: "sxm",
		name: "Samre",
	},
	sxn: {
		code: "sxn",
		name: "Sangir",
	},
	sxo: {
		code: "sxo",
		name: "Sorothaptic",
	},
	sxr: {
		code: "sxr",
		name: "Saaroa",
	},
	sxs: {
		code: "sxs",
		name: "Sasaru",
	},
	sxu: {
		code: "sxu",
		name: "Upper Saxon",
	},
	sxw: {
		code: "sxw",
		name: "Saxwe Gbe",
	},
	sya: {
		code: "sya",
		name: "Siang",
	},
	syb: {
		code: "syb",
		name: "Central Subanen",
	},
	syc: {
		code: "syc",
		name: "Classical Syriac",
	},
	syi: {
		code: "syi",
		name: "Seki",
	},
	syk: {
		code: "syk",
		name: "Sukur",
	},
	syl: {
		code: "syl",
		name: "Sylheti",
	},
	sym: {
		code: "sym",
		name: "Maya Samo",
	},
	syn: {
		code: "syn",
		name: "Senaya",
	},
	syo: {
		code: "syo",
		name: "Suoy",
	},
	syr: {
		code: "syr",
		name: "Syriac",
	},
	sys: {
		code: "sys",
		name: "Sinyar",
	},
	syw: {
		code: "syw",
		name: "Kagate",
	},
	syx: {
		code: "syx",
		name: "Samay",
	},
	syy: {
		code: "syy",
		name: "Al-Sayyid Bedouin Sign Language",
	},
	sza: {
		code: "sza",
		name: "Semelai",
	},
	szb: {
		code: "szb",
		name: "Ngalum",
	},
	szc: {
		code: "szc",
		name: "Semaq Beri",
	},
	sze: {
		code: "sze",
		name: "Seze",
	},
	szg: {
		code: "szg",
		name: "Sengele",
	},
	szl: {
		code: "szl",
		name: "Silesian",
	},
	szn: {
		code: "szn",
		name: "Sula",
	},
	szp: {
		code: "szp",
		name: "Suabo",
	},
	szs: {
		code: "szs",
		name: "Solomon Islands Sign Language",
	},
	szv: {
		code: "szv",
		name: "Isu (Fako Division)",
	},
	szw: {
		code: "szw",
		name: "Sawai",
	},
	szy: {
		code: "szy",
		name: "Sakizaya",
	},
	taa: {
		code: "taa",
		name: "Lower Tanana",
	},
	tab: {
		code: "tab",
		name: "Tabassaran",
	},
	tac: {
		code: "tac",
		name: "Lowland Tarahumara",
	},
	tad: {
		code: "tad",
		name: "Tause",
	},
	tae: {
		code: "tae",
		name: "Tariana",
	},
	taf: {
		code: "taf",
		name: "Tapirapé",
	},
	tag: {
		code: "tag",
		name: "Tagoi",
	},
	tah: {
		code: "tah",
		name: "Tahitian",
	},
	taj: {
		code: "taj",
		name: "Eastern Tamang",
	},
	tak: {
		code: "tak",
		name: "Tala",
	},
	tal: {
		code: "tal",
		name: "Tal",
	},
	tam: {
		code: "tam",
		name: "Tamil",
	},
	tan: {
		code: "tan",
		name: "Tangale",
	},
	tao: {
		code: "tao",
		name: "Yami",
	},
	tap: {
		code: "tap",
		name: "Taabwa",
	},
	taq: {
		code: "taq",
		name: "Tamasheq",
	},
	tar: {
		code: "tar",
		name: "Central Tarahumara",
	},
	tas: {
		code: "tas",
		name: "Tay Boi",
	},
	tat: {
		code: "tat",
		name: "Tatar",
	},
	tau: {
		code: "tau",
		name: "Upper Tanana",
	},
	tav: {
		code: "tav",
		name: "Tatuyo",
	},
	taw: {
		code: "taw",
		name: "Tai",
	},
	tax: {
		code: "tax",
		name: "Tamki",
	},
	tay: {
		code: "tay",
		name: "Atayal",
	},
	taz: {
		code: "taz",
		name: "Tocho",
	},
	tba: {
		code: "tba",
		name: "Aikanã",
	},
	tbc: {
		code: "tbc",
		name: "Takia",
	},
	tbd: {
		code: "tbd",
		name: "Kaki Ae",
	},
	tbe: {
		code: "tbe",
		name: "Tanimbili",
	},
	tbf: {
		code: "tbf",
		name: "Mandara",
	},
	tbg: {
		code: "tbg",
		name: "North Tairora",
	},
	tbh: {
		code: "tbh",
		name: "Dharawal",
	},
	tbi: {
		code: "tbi",
		name: "Gaam",
	},
	tbj: {
		code: "tbj",
		name: "Tiang",
	},
	tbk: {
		code: "tbk",
		name: "Calamian Tagbanwa",
	},
	tbl: {
		code: "tbl",
		name: "Tboli",
	},
	tbm: {
		code: "tbm",
		name: "Tagbu",
	},
	tbn: {
		code: "tbn",
		name: "Barro Negro Tunebo",
	},
	tbo: {
		code: "tbo",
		name: "Tawala",
	},
	tbp: {
		code: "tbp",
		name: "Taworta",
	},
	tbr: {
		code: "tbr",
		name: "Tumtum",
	},
	tbs: {
		code: "tbs",
		name: "Tanguat",
	},
	tbt: {
		code: "tbt",
		name: "Tembo (Kitembo)",
	},
	tbu: {
		code: "tbu",
		name: "Tubar",
	},
	tbv: {
		code: "tbv",
		name: "Tobo",
	},
	tbw: {
		code: "tbw",
		name: "Tagbanwa",
	},
	tbx: {
		code: "tbx",
		name: "Kapin",
	},
	tby: {
		code: "tby",
		name: "Tabaru",
	},
	tbz: {
		code: "tbz",
		name: "Ditammari",
	},
	tca: {
		code: "tca",
		name: "Ticuna",
	},
	tcb: {
		code: "tcb",
		name: "Tanacross",
	},
	tcc: {
		code: "tcc",
		name: "Datooga",
	},
	tcd: {
		code: "tcd",
		name: "Tafi",
	},
	tce: {
		code: "tce",
		name: "Southern Tutchone",
	},
	tcf: {
		code: "tcf",
		name: "Malinaltepec Me'phaa",
	},
	tcg: {
		code: "tcg",
		name: "Tamagario",
	},
	tch: {
		code: "tch",
		name: "Turks And Caicos Creole English",
	},
	tci: {
		code: "tci",
		name: "Wára",
	},
	tck: {
		code: "tck",
		name: "Tchitchege",
	},
	tcl: {
		code: "tcl",
		name: "Taman (Myanmar)",
	},
	tcm: {
		code: "tcm",
		name: "Tanahmerah",
	},
	tcn: {
		code: "tcn",
		name: "Tichurong",
	},
	tco: {
		code: "tco",
		name: "Taungyo",
	},
	tcp: {
		code: "tcp",
		name: "Tawr Chin",
	},
	tcq: {
		code: "tcq",
		name: "Kaiy",
	},
	tcs: {
		code: "tcs",
		name: "Torres Strait Creole",
	},
	tct: {
		code: "tct",
		name: "T'en",
	},
	tcu: {
		code: "tcu",
		name: "Southeastern Tarahumara",
	},
	tcw: {
		code: "tcw",
		name: "Tecpatlán Totonac",
	},
	tcx: {
		code: "tcx",
		name: "Toda",
	},
	tcy: {
		code: "tcy",
		name: "Tulu",
	},
	tcz: {
		code: "tcz",
		name: "Thado Chin",
	},
	tda: {
		code: "tda",
		name: "Tagdal",
	},
	tdb: {
		code: "tdb",
		name: "Panchpargania",
	},
	tdc: {
		code: "tdc",
		name: "Emberá-Tadó",
	},
	tdd: {
		code: "tdd",
		name: "Tai Nüa",
	},
	tde: {
		code: "tde",
		name: "Tiranige Diga Dogon",
	},
	tdf: {
		code: "tdf",
		name: "Talieng",
	},
	tdg: {
		code: "tdg",
		name: "Western Tamang",
	},
	tdh: {
		code: "tdh",
		name: "Thulung",
	},
	tdi: {
		code: "tdi",
		name: "Tomadino",
	},
	tdj: {
		code: "tdj",
		name: "Tajio",
	},
	tdk: {
		code: "tdk",
		name: "Tambas",
	},
	tdl: {
		code: "tdl",
		name: "Sur",
	},
	tdm: {
		code: "tdm",
		name: "Taruma",
	},
	tdn: {
		code: "tdn",
		name: "Tondano",
	},
	tdo: {
		code: "tdo",
		name: "Teme",
	},
	tdq: {
		code: "tdq",
		name: "Tita",
	},
	tdr: {
		code: "tdr",
		name: "Todrah",
	},
	tds: {
		code: "tds",
		name: "Doutai",
	},
	tdt: {
		code: "tdt",
		name: "Tetun Dili",
	},
	tdv: {
		code: "tdv",
		name: "Toro",
	},
	tdx: {
		code: "tdx",
		name: "Tandroy-Mahafaly Malagasy",
	},
	tdy: {
		code: "tdy",
		name: "Tadyawan",
	},
	tea: {
		code: "tea",
		name: "Temiar",
	},
	teb: {
		code: "teb",
		name: "Tetete",
	},
	tec: {
		code: "tec",
		name: "Terik",
	},
	ted: {
		code: "ted",
		name: "Tepo Krumen",
	},
	tee: {
		code: "tee",
		name: "Huehuetla Tepehua",
	},
	tef: {
		code: "tef",
		name: "Teressa",
	},
	teg: {
		code: "teg",
		name: "Teke-Tege",
	},
	teh: {
		code: "teh",
		name: "Tehuelche",
	},
	tei: {
		code: "tei",
		name: "Torricelli",
	},
	tek: {
		code: "tek",
		name: "Ibali Teke",
	},
	tel: {
		code: "tel",
		name: "Telugu",
	},
	tem: {
		code: "tem",
		name: "Timne",
	},
	ten: {
		code: "ten",
		name: "Tama (Colombia)",
	},
	teo: {
		code: "teo",
		name: "Teso",
	},
	tep: {
		code: "tep",
		name: "Tepecano",
	},
	teq: {
		code: "teq",
		name: "Temein",
	},
	ter: {
		code: "ter",
		name: "Tereno",
	},
	tes: {
		code: "tes",
		name: "Tengger",
	},
	tet: {
		code: "tet",
		name: "Tetum",
	},
	teu: {
		code: "teu",
		name: "Soo",
	},
	tev: {
		code: "tev",
		name: "Teor",
	},
	tew: {
		code: "tew",
		name: "Tewa (USA)",
	},
	tex: {
		code: "tex",
		name: "Tennet",
	},
	tey: {
		code: "tey",
		name: "Tulishi",
	},
	tez: {
		code: "tez",
		name: "Tetserret",
	},
	tfi: {
		code: "tfi",
		name: "Tofin Gbe",
	},
	tfn: {
		code: "tfn",
		name: "Tanaina",
	},
	tfo: {
		code: "tfo",
		name: "Tefaro",
	},
	tfr: {
		code: "tfr",
		name: "Teribe",
	},
	tft: {
		code: "tft",
		name: "Ternate",
	},
	tga: {
		code: "tga",
		name: "Sagalla",
	},
	tgb: {
		code: "tgb",
		name: "Tobilung",
	},
	tgc: {
		code: "tgc",
		name: "Tigak",
	},
	tgd: {
		code: "tgd",
		name: "Ciwogai",
	},
	tge: {
		code: "tge",
		name: "Eastern Gorkha Tamang",
	},
	tgf: {
		code: "tgf",
		name: "Chalikha",
	},
	tgh: {
		code: "tgh",
		name: "Tobagonian Creole English",
	},
	tgi: {
		code: "tgi",
		name: "Lawunuia",
	},
	tgj: {
		code: "tgj",
		name: "Tagin",
	},
	tgk: {
		code: "tgk",
		name: "Tajik",
	},
	tgl: {
		code: "tgl",
		name: "Tagalog",
	},
	tgn: {
		code: "tgn",
		name: "Tandaganon",
	},
	tgo: {
		code: "tgo",
		name: "Sudest",
	},
	tgp: {
		code: "tgp",
		name: "Tangoa",
	},
	tgq: {
		code: "tgq",
		name: "Tring",
	},
	tgr: {
		code: "tgr",
		name: "Tareng",
	},
	tgs: {
		code: "tgs",
		name: "Nume",
	},
	tgt: {
		code: "tgt",
		name: "Central Tagbanwa",
	},
	tgu: {
		code: "tgu",
		name: "Tanggu",
	},
	tgv: {
		code: "tgv",
		name: "Tingui-Boto",
	},
	tgw: {
		code: "tgw",
		name: "Tagwana Senoufo",
	},
	tgx: {
		code: "tgx",
		name: "Tagish",
	},
	tgy: {
		code: "tgy",
		name: "Togoyo",
	},
	tgz: {
		code: "tgz",
		name: "Tagalaka",
	},
	tha: {
		code: "tha",
		name: "Thai",
	},
	thd: {
		code: "thd",
		name: "Kuuk Thaayorre",
	},
	the: {
		code: "the",
		name: "Chitwania Tharu",
	},
	thf: {
		code: "thf",
		name: "Thangmi",
	},
	thh: {
		code: "thh",
		name: "Northern Tarahumara",
	},
	thi: {
		code: "thi",
		name: "Tai Long",
	},
	thk: {
		code: "thk",
		name: "Tharaka",
	},
	thl: {
		code: "thl",
		name: "Dangaura Tharu",
	},
	thm: {
		code: "thm",
		name: "Aheu",
	},
	thn: {
		code: "thn",
		name: "Thachanadan",
	},
	thp: {
		code: "thp",
		name: "Thompson",
	},
	thq: {
		code: "thq",
		name: "Kochila Tharu",
	},
	thr: {
		code: "thr",
		name: "Rana Tharu",
	},
	ths: {
		code: "ths",
		name: "Thakali",
	},
	tht: {
		code: "tht",
		name: "Tahltan",
	},
	thu: {
		code: "thu",
		name: "Thuri",
	},
	thv: {
		code: "thv",
		name: "Tahaggart Tamahaq",
	},
	thy: {
		code: "thy",
		name: "Tha",
	},
	thz: {
		code: "thz",
		name: "Tayart Tamajeq",
	},
	tia: {
		code: "tia",
		name: "Tidikelt Tamazight",
	},
	tic: {
		code: "tic",
		name: "Tira",
	},
	tif: {
		code: "tif",
		name: "Tifal",
	},
	tig: {
		code: "tig",
		name: "Tigre",
	},
	tih: {
		code: "tih",
		name: "Timugon Murut",
	},
	tii: {
		code: "tii",
		name: "Tiene",
	},
	tij: {
		code: "tij",
		name: "Tilung",
	},
	tik: {
		code: "tik",
		name: "Tikar",
	},
	til: {
		code: "til",
		name: "Tillamook",
	},
	tim: {
		code: "tim",
		name: "Timbe",
	},
	tin: {
		code: "tin",
		name: "Tindi",
	},
	tio: {
		code: "tio",
		name: "Teop",
	},
	tip: {
		code: "tip",
		name: "Trimuris",
	},
	tiq: {
		code: "tiq",
		name: "Tiéfo",
	},
	tir: {
		code: "tir",
		name: "Tigrinya",
	},
	tis: {
		code: "tis",
		name: "Masadiit Itneg",
	},
	tit: {
		code: "tit",
		name: "Tinigua",
	},
	tiu: {
		code: "tiu",
		name: "Adasen",
	},
	tiv: {
		code: "tiv",
		name: "Tiv",
	},
	tiw: {
		code: "tiw",
		name: "Tiwi",
	},
	tix: {
		code: "tix",
		name: "Southern Tiwa",
	},
	tiy: {
		code: "tiy",
		name: "Tiruray",
	},
	tiz: {
		code: "tiz",
		name: "Tai Hongjin",
	},
	tja: {
		code: "tja",
		name: "Tajuasohn",
	},
	tjg: {
		code: "tjg",
		name: "Tunjung",
	},
	tji: {
		code: "tji",
		name: "Northern Tujia",
	},
	tjj: {
		code: "tjj",
		name: "Tjungundji",
	},
	tjl: {
		code: "tjl",
		name: "Tai Laing",
	},
	tjm: {
		code: "tjm",
		name: "Timucua",
	},
	tjn: {
		code: "tjn",
		name: "Tonjon",
	},
	tjo: {
		code: "tjo",
		name: "Temacine Tamazight",
	},
	tjp: {
		code: "tjp",
		name: "Tjupany",
	},
	tjs: {
		code: "tjs",
		name: "Southern Tujia",
	},
	tju: {
		code: "tju",
		name: "Tjurruru",
	},
	tjw: {
		code: "tjw",
		name: "Djabwurrung",
	},
	tka: {
		code: "tka",
		name: "Truká",
	},
	tkb: {
		code: "tkb",
		name: "Buksa",
	},
	tkd: {
		code: "tkd",
		name: "Tukudede",
	},
	tke: {
		code: "tke",
		name: "Takwane",
	},
	tkf: {
		code: "tkf",
		name: "Tukumanféd",
	},
	tkg: {
		code: "tkg",
		name: "Tesaka Malagasy",
	},
	tkl: {
		code: "tkl",
		name: "Tokelau",
	},
	tkm: {
		code: "tkm",
		name: "Takelma",
	},
	tkn: {
		code: "tkn",
		name: "Toku-No-Shima",
	},
	tkp: {
		code: "tkp",
		name: "Tikopia",
	},
	tkq: {
		code: "tkq",
		name: "Tee",
	},
	tkr: {
		code: "tkr",
		name: "Tsakhur",
	},
	tks: {
		code: "tks",
		name: "Takestani",
	},
	tkt: {
		code: "tkt",
		name: "Kathoriya Tharu",
	},
	tku: {
		code: "tku",
		name: "Upper Necaxa Totonac",
	},
	tkv: {
		code: "tkv",
		name: "Mur Pano",
	},
	tkw: {
		code: "tkw",
		name: "Teanu",
	},
	tkx: {
		code: "tkx",
		name: "Tangko",
	},
	tkz: {
		code: "tkz",
		name: "Takua",
	},
	tla: {
		code: "tla",
		name: "Southwestern Tepehuan",
	},
	tlb: {
		code: "tlb",
		name: "Tobelo",
	},
	tlc: {
		code: "tlc",
		name: "Yecuatla Totonac",
	},
	tld: {
		code: "tld",
		name: "Talaud",
	},
	tlf: {
		code: "tlf",
		name: "Telefol",
	},
	tlg: {
		code: "tlg",
		name: "Tofanma",
	},
	tlh: {
		code: "tlh",
		name: "Klingon",
	},
	tli: {
		code: "tli",
		name: "Tlingit",
	},
	tlj: {
		code: "tlj",
		name: "Talinga-Bwisi",
	},
	tlk: {
		code: "tlk",
		name: "Taloki",
	},
	tll: {
		code: "tll",
		name: "Tetela",
	},
	tlm: {
		code: "tlm",
		name: "Tolomako",
	},
	tln: {
		code: "tln",
		name: "Talondo'",
	},
	tlo: {
		code: "tlo",
		name: "Talodi",
	},
	tlp: {
		code: "tlp",
		name: "Filomena Mata-Coahuitlán Totonac",
	},
	tlq: {
		code: "tlq",
		name: "Tai Loi",
	},
	tlr: {
		code: "tlr",
		name: "Talise",
	},
	tls: {
		code: "tls",
		name: "Tambotalo",
	},
	tlt: {
		code: "tlt",
		name: "Sou Nama",
	},
	tlu: {
		code: "tlu",
		name: "Tulehu",
	},
	tlv: {
		code: "tlv",
		name: "Taliabu",
	},
	tlx: {
		code: "tlx",
		name: "Khehek",
	},
	tly: {
		code: "tly",
		name: "Talysh",
	},
	tma: {
		code: "tma",
		name: "Tama (Chad)",
	},
	tmb: {
		code: "tmb",
		name: "Katbol",
	},
	tmc: {
		code: "tmc",
		name: "Tumak",
	},
	tmd: {
		code: "tmd",
		name: "Haruai",
	},
	tme: {
		code: "tme",
		name: "Tremembé",
	},
	tmf: {
		code: "tmf",
		name: "Toba-Maskoy",
	},
	tmg: {
		code: "tmg",
		name: "Ternateño",
	},
	tmh: {
		code: "tmh",
		name: "Tamashek",
	},
	tmi: {
		code: "tmi",
		name: "Tutuba",
	},
	tmj: {
		code: "tmj",
		name: "Samarokena",
	},
	tml: {
		code: "tml",
		name: "Tamnim Citak",
	},
	tmm: {
		code: "tmm",
		name: "Tai Thanh",
	},
	tmn: {
		code: "tmn",
		name: "Taman (Indonesia)",
	},
	tmo: {
		code: "tmo",
		name: "Temoq",
	},
	tmq: {
		code: "tmq",
		name: "Tumleo",
	},
	tmr: {
		code: "tmr",
		name: "Jewish Babylonian Aramaic (ca. 200-1200 CE)",
	},
	tms: {
		code: "tms",
		name: "Tima",
	},
	tmt: {
		code: "tmt",
		name: "Tasmate",
	},
	tmu: {
		code: "tmu",
		name: "Iau",
	},
	tmv: {
		code: "tmv",
		name: "Tembo (Motembo)",
	},
	tmw: {
		code: "tmw",
		name: "Temuan",
	},
	tmy: {
		code: "tmy",
		name: "Tami",
	},
	tmz: {
		code: "tmz",
		name: "Tamanaku",
	},
	tna: {
		code: "tna",
		name: "Tacana",
	},
	tnb: {
		code: "tnb",
		name: "Western Tunebo",
	},
	tnc: {
		code: "tnc",
		name: "Tanimuca-Retuarã",
	},
	tnd: {
		code: "tnd",
		name: "Angosturas Tunebo",
	},
	tng: {
		code: "tng",
		name: "Tobanga",
	},
	tnh: {
		code: "tnh",
		name: "Maiani",
	},
	tni: {
		code: "tni",
		name: "Tandia",
	},
	tnk: {
		code: "tnk",
		name: "Kwamera",
	},
	tnl: {
		code: "tnl",
		name: "Lenakel",
	},
	tnm: {
		code: "tnm",
		name: "Tabla",
	},
	tnn: {
		code: "tnn",
		name: "North Tanna",
	},
	tno: {
		code: "tno",
		name: "Toromono",
	},
	tnp: {
		code: "tnp",
		name: "Whitesands",
	},
	tnq: {
		code: "tnq",
		name: "Taino",
	},
	tnr: {
		code: "tnr",
		name: "Ménik",
	},
	tns: {
		code: "tns",
		name: "Tenis",
	},
	tnt: {
		code: "tnt",
		name: "Tontemboan",
	},
	tnu: {
		code: "tnu",
		name: "Tay Khang",
	},
	tnv: {
		code: "tnv",
		name: "Tangchangya",
	},
	tnw: {
		code: "tnw",
		name: "Tonsawang",
	},
	tnx: {
		code: "tnx",
		name: "Tanema",
	},
	tny: {
		code: "tny",
		name: "Tongwe",
	},
	tnz: {
		code: "tnz",
		name: "Ten'edn",
	},
	tob: {
		code: "tob",
		name: "Toba",
	},
	toc: {
		code: "toc",
		name: "Coyutla Totonac",
	},
	tod: {
		code: "tod",
		name: "Toma",
	},
	tof: {
		code: "tof",
		name: "Gizrra",
	},
	tog: {
		code: "tog",
		name: "Tonga (Nyasa)",
	},
	toh: {
		code: "toh",
		name: "Gitonga",
	},
	toi: {
		code: "toi",
		name: "Tonga (Zambia)",
	},
	toj: {
		code: "toj",
		name: "Tojolabal",
	},
	tok: {
		code: "tok",
		name: "Toki Pona",
	},
	tol: {
		code: "tol",
		name: "Tolowa",
	},
	tom: {
		code: "tom",
		name: "Tombulu",
	},
	ton: {
		code: "ton",
		name: "Tonga (Tonga Islands)",
	},
	too: {
		code: "too",
		name: "Xicotepec De Juárez Totonac",
	},
	top: {
		code: "top",
		name: "Papantla Totonac",
	},
	toq: {
		code: "toq",
		name: "Toposa",
	},
	tor: {
		code: "tor",
		name: "Togbo-Vara Banda",
	},
	tos: {
		code: "tos",
		name: "Highland Totonac",
	},
	tou: {
		code: "tou",
		name: "Tho",
	},
	tov: {
		code: "tov",
		name: "Upper Taromi",
	},
	tow: {
		code: "tow",
		name: "Jemez",
	},
	tox: {
		code: "tox",
		name: "Tobian",
	},
	toy: {
		code: "toy",
		name: "Topoiyo",
	},
	toz: {
		code: "toz",
		name: "To",
	},
	tpa: {
		code: "tpa",
		name: "Taupota",
	},
	tpc: {
		code: "tpc",
		name: "Azoyú Me'phaa",
	},
	tpe: {
		code: "tpe",
		name: "Tippera",
	},
	tpf: {
		code: "tpf",
		name: "Tarpia",
	},
	tpg: {
		code: "tpg",
		name: "Kula",
	},
	tpi: {
		code: "tpi",
		name: "Tok Pisin",
	},
	tpj: {
		code: "tpj",
		name: "Tapieté",
	},
	tpk: {
		code: "tpk",
		name: "Tupinikin",
	},
	tpl: {
		code: "tpl",
		name: "Tlacoapa Me'phaa",
	},
	tpm: {
		code: "tpm",
		name: "Tampulma",
	},
	tpn: {
		code: "tpn",
		name: "Tupinambá",
	},
	tpo: {
		code: "tpo",
		name: "Tai Pao",
	},
	tpp: {
		code: "tpp",
		name: "Pisaflores Tepehua",
	},
	tpq: {
		code: "tpq",
		name: "Tukpa",
	},
	tpr: {
		code: "tpr",
		name: "Tuparí",
	},
	tpt: {
		code: "tpt",
		name: "Tlachichilco Tepehua",
	},
	tpu: {
		code: "tpu",
		name: "Tampuan",
	},
	tpv: {
		code: "tpv",
		name: "Tanapag",
	},
	tpx: {
		code: "tpx",
		name: "Acatepec Me'phaa",
	},
	tpy: {
		code: "tpy",
		name: "Trumai",
	},
	tpz: {
		code: "tpz",
		name: "Tinputz",
	},
	tqb: {
		code: "tqb",
		name: "Tembé",
	},
	tql: {
		code: "tql",
		name: "Lehali",
	},
	tqm: {
		code: "tqm",
		name: "Turumsa",
	},
	tqn: {
		code: "tqn",
		name: "Tenino",
	},
	tqo: {
		code: "tqo",
		name: "Toaripi",
	},
	tqp: {
		code: "tqp",
		name: "Tomoip",
	},
	tqq: {
		code: "tqq",
		name: "Tunni",
	},
	tqr: {
		code: "tqr",
		name: "Torona",
	},
	tqt: {
		code: "tqt",
		name: "Western Totonac",
	},
	tqu: {
		code: "tqu",
		name: "Touo",
	},
	tqw: {
		code: "tqw",
		name: "Tonkawa",
	},
	tra: {
		code: "tra",
		name: "Tirahi",
	},
	trb: {
		code: "trb",
		name: "Terebu",
	},
	trc: {
		code: "trc",
		name: "Copala Triqui",
	},
	trd: {
		code: "trd",
		name: "Turi",
	},
	tre: {
		code: "tre",
		name: "East Tarangan",
	},
	trf: {
		code: "trf",
		name: "Trinidadian Creole English",
	},
	trg: {
		code: "trg",
		name: "Lishán Didán",
	},
	trh: {
		code: "trh",
		name: "Turaka",
	},
	tri: {
		code: "tri",
		name: "Trió",
	},
	trj: {
		code: "trj",
		name: "Toram",
	},
	trl: {
		code: "trl",
		name: "Traveller Scottish",
	},
	trm: {
		code: "trm",
		name: "Tregami",
	},
	trn: {
		code: "trn",
		name: "Trinitario",
	},
	tro: {
		code: "tro",
		name: "Tarao Naga",
	},
	trp: {
		code: "trp",
		name: "Kok Borok",
	},
	trq: {
		code: "trq",
		name: "San Martín Itunyoso Triqui",
	},
	trr: {
		code: "trr",
		name: "Taushiro",
	},
	trs: {
		code: "trs",
		name: "Chicahuaxtla Triqui",
	},
	trt: {
		code: "trt",
		name: "Tunggare",
	},
	tru: {
		code: "tru",
		name: "Turoyo",
	},
	trv: {
		code: "trv",
		name: "Sediq",
	},
	trw: {
		code: "trw",
		name: "Torwali",
	},
	trx: {
		code: "trx",
		name: "Tringgus-Sembaan Bidayuh",
	},
	try: {
		code: "try",
		name: "Turung",
	},
	trz: {
		code: "trz",
		name: "Torá",
	},
	tsa: {
		code: "tsa",
		name: "Tsaangi",
	},
	tsb: {
		code: "tsb",
		name: "Tsamai",
	},
	tsc: {
		code: "tsc",
		name: "Tswa",
	},
	tsd: {
		code: "tsd",
		name: "Tsakonian",
	},
	tse: {
		code: "tse",
		name: "Tunisian Sign Language",
	},
	tsg: {
		code: "tsg",
		name: "Tausug",
	},
	tsh: {
		code: "tsh",
		name: "Tsuvan",
	},
	tsi: {
		code: "tsi",
		name: "Tsimshian",
	},
	tsj: {
		code: "tsj",
		name: "Tshangla",
	},
	tsk: {
		code: "tsk",
		name: "Tseku",
	},
	tsl: {
		code: "tsl",
		name: "Ts'ün-Lao",
	},
	tsm: {
		code: "tsm",
		name: "Turkish Sign Language",
	},
	tsn: {
		code: "tsn",
		name: "Tswana",
	},
	tso: {
		code: "tso",
		name: "Tsonga",
	},
	tsp: {
		code: "tsp",
		name: "Northern Toussian",
	},
	tsq: {
		code: "tsq",
		name: "Thai Sign Language",
	},
	tsr: {
		code: "tsr",
		name: "Akei",
	},
	tss: {
		code: "tss",
		name: "Taiwan Sign Language",
	},
	tst: {
		code: "tst",
		name: "Tondi Songway Kiini",
	},
	tsu: {
		code: "tsu",
		name: "Tsou",
	},
	tsv: {
		code: "tsv",
		name: "Tsogo",
	},
	tsw: {
		code: "tsw",
		name: "Tsishingini",
	},
	tsx: {
		code: "tsx",
		name: "Mubami",
	},
	tsy: {
		code: "tsy",
		name: "Tebul Sign Language",
	},
	tsz: {
		code: "tsz",
		name: "Purepecha",
	},
	tta: {
		code: "tta",
		name: "Tutelo",
	},
	ttb: {
		code: "ttb",
		name: "Gaa",
	},
	ttc: {
		code: "ttc",
		name: "Tektiteko",
	},
	ttd: {
		code: "ttd",
		name: "Tauade",
	},
	tte: {
		code: "tte",
		name: "Bwanabwana",
	},
	ttf: {
		code: "ttf",
		name: "Tuotomb",
	},
	ttg: {
		code: "ttg",
		name: "Tutong",
	},
	tth: {
		code: "tth",
		name: "Upper Ta'oih",
	},
	tti: {
		code: "tti",
		name: "Tobati",
	},
	ttj: {
		code: "ttj",
		name: "Tooro",
	},
	ttk: {
		code: "ttk",
		name: "Totoro",
	},
	ttl: {
		code: "ttl",
		name: "Totela",
	},
	ttm: {
		code: "ttm",
		name: "Northern Tutchone",
	},
	ttn: {
		code: "ttn",
		name: "Towei",
	},
	tto: {
		code: "tto",
		name: "Lower Ta'oih",
	},
	ttp: {
		code: "ttp",
		name: "Tombelala",
	},
	ttq: {
		code: "ttq",
		name: "Tawallammat Tamajaq",
	},
	ttr: {
		code: "ttr",
		name: "Tera",
	},
	tts: {
		code: "tts",
		name: "Northeastern Thai",
	},
	ttt: {
		code: "ttt",
		name: "Muslim Tat",
	},
	ttu: {
		code: "ttu",
		name: "Torau",
	},
	ttv: {
		code: "ttv",
		name: "Titan",
	},
	ttw: {
		code: "ttw",
		name: "Long Wat",
	},
	tty: {
		code: "tty",
		name: "Sikaritai",
	},
	ttz: {
		code: "ttz",
		name: "Tsum",
	},
	tua: {
		code: "tua",
		name: "Wiarumus",
	},
	tub: {
		code: "tub",
		name: "Tübatulabal",
	},
	tuc: {
		code: "tuc",
		name: "Mutu",
	},
	tud: {
		code: "tud",
		name: "Tuxá",
	},
	tue: {
		code: "tue",
		name: "Tuyuca",
	},
	tuf: {
		code: "tuf",
		name: "Central Tunebo",
	},
	tug: {
		code: "tug",
		name: "Tunia",
	},
	tuh: {
		code: "tuh",
		name: "Taulil",
	},
	tui: {
		code: "tui",
		name: "Tupuri",
	},
	tuj: {
		code: "tuj",
		name: "Tugutil",
	},
	tuk: {
		code: "tuk",
		name: "Turkmen",
	},
	tul: {
		code: "tul",
		name: "Tula",
	},
	tum: {
		code: "tum",
		name: "Tumbuka",
	},
	tun: {
		code: "tun",
		name: "Tunica",
	},
	tuo: {
		code: "tuo",
		name: "Tucano",
	},
	tuq: {
		code: "tuq",
		name: "Tedaga",
	},
	tur: {
		code: "tur",
		name: "Turkish",
	},
	tus: {
		code: "tus",
		name: "Tuscarora",
	},
	tuu: {
		code: "tuu",
		name: "Tututni",
	},
	tuv: {
		code: "tuv",
		name: "Turkana",
	},
	tux: {
		code: "tux",
		name: "Tuxináwa",
	},
	tuy: {
		code: "tuy",
		name: "Tugen",
	},
	tuz: {
		code: "tuz",
		name: "Turka",
	},
	tva: {
		code: "tva",
		name: "Vaghua",
	},
	tvd: {
		code: "tvd",
		name: "Tsuvadi",
	},
	tve: {
		code: "tve",
		name: "Te'un",
	},
	tvi: {
		code: "tvi",
		name: "Tulai",
	},
	tvk: {
		code: "tvk",
		name: "Southeast Ambrym",
	},
	tvl: {
		code: "tvl",
		name: "Tuvalu",
	},
	tvm: {
		code: "tvm",
		name: "Tela-Masbuar",
	},
	tvn: {
		code: "tvn",
		name: "Tavoyan",
	},
	tvo: {
		code: "tvo",
		name: "Tidore",
	},
	tvs: {
		code: "tvs",
		name: "Taveta",
	},
	tvt: {
		code: "tvt",
		name: "Tutsa Naga",
	},
	tvu: {
		code: "tvu",
		name: "Tunen",
	},
	tvw: {
		code: "tvw",
		name: "Sedoa",
	},
	tvx: {
		code: "tvx",
		name: "Taivoan",
	},
	tvy: {
		code: "tvy",
		name: "Timor Pidgin",
	},
	twa: {
		code: "twa",
		name: "Twana",
	},
	twb: {
		code: "twb",
		name: "Western Tawbuid",
	},
	twc: {
		code: "twc",
		name: "Teshenawa",
	},
	twd: {
		code: "twd",
		name: "Twents",
	},
	twe: {
		code: "twe",
		name: "Tewa (Indonesia)",
	},
	twf: {
		code: "twf",
		name: "Northern Tiwa",
	},
	twg: {
		code: "twg",
		name: "Tereweng",
	},
	twh: {
		code: "twh",
		name: "Tai Dón",
	},
	twi: {
		code: "twi",
		name: "Twi",
	},
	twl: {
		code: "twl",
		name: "Tawara",
	},
	twm: {
		code: "twm",
		name: "Tawang Monpa",
	},
	twn: {
		code: "twn",
		name: "Twendi",
	},
	two: {
		code: "two",
		name: "Tswapong",
	},
	twp: {
		code: "twp",
		name: "Ere",
	},
	twq: {
		code: "twq",
		name: "Tasawaq",
	},
	twr: {
		code: "twr",
		name: "Southwestern Tarahumara",
	},
	twt: {
		code: "twt",
		name: "Turiwára",
	},
	twu: {
		code: "twu",
		name: "Termanu",
	},
	tww: {
		code: "tww",
		name: "Tuwari",
	},
	twx: {
		code: "twx",
		name: "Tewe",
	},
	twy: {
		code: "twy",
		name: "Tawoyan",
	},
	txa: {
		code: "txa",
		name: "Tombonuo",
	},
	txb: {
		code: "txb",
		name: "Tokharian B",
	},
	txc: {
		code: "txc",
		name: "Tsetsaut",
	},
	txe: {
		code: "txe",
		name: "Totoli",
	},
	txg: {
		code: "txg",
		name: "Tangut",
	},
	txh: {
		code: "txh",
		name: "Thracian",
	},
	txi: {
		code: "txi",
		name: "Ikpeng",
	},
	txj: {
		code: "txj",
		name: "Tarjumo",
	},
	txm: {
		code: "txm",
		name: "Tomini",
	},
	txn: {
		code: "txn",
		name: "West Tarangan",
	},
	txo: {
		code: "txo",
		name: "Toto",
	},
	txq: {
		code: "txq",
		name: "Tii",
	},
	txr: {
		code: "txr",
		name: "Tartessian",
	},
	txs: {
		code: "txs",
		name: "Tonsea",
	},
	txt: {
		code: "txt",
		name: "Citak",
	},
	txu: {
		code: "txu",
		name: "Kayapó",
	},
	txx: {
		code: "txx",
		name: "Tatana",
	},
	txy: {
		code: "txy",
		name: "Tanosy Malagasy",
	},
	tya: {
		code: "tya",
		name: "Tauya",
	},
	tye: {
		code: "tye",
		name: "Kyanga",
	},
	tyh: {
		code: "tyh",
		name: "O'du",
	},
	tyi: {
		code: "tyi",
		name: "Teke-Tsaayi",
	},
	tyj: {
		code: "tyj",
		name: "Tai Do",
	},
	tyl: {
		code: "tyl",
		name: "Thu Lao",
	},
	tyn: {
		code: "tyn",
		name: "Kombai",
	},
	typ: {
		code: "typ",
		name: "Thaypan",
	},
	tyr: {
		code: "tyr",
		name: "Tai Daeng",
	},
	tys: {
		code: "tys",
		name: "Tày Sa Pa",
	},
	tyt: {
		code: "tyt",
		name: "Tày Tac",
	},
	tyu: {
		code: "tyu",
		name: "Kua",
	},
	tyv: {
		code: "tyv",
		name: "Tuvinian",
	},
	tyx: {
		code: "tyx",
		name: "Teke-Tyee",
	},
	tyy: {
		code: "tyy",
		name: "Tiyaa",
	},
	tyz: {
		code: "tyz",
		name: "Tày",
	},
	tza: {
		code: "tza",
		name: "Tanzanian Sign Language",
	},
	tzh: {
		code: "tzh",
		name: "Tzeltal",
	},
	tzj: {
		code: "tzj",
		name: "Tz'utujil",
	},
	tzl: {
		code: "tzl",
		name: "Talossan",
	},
	tzm: {
		code: "tzm",
		name: "Central Atlas Tamazight",
	},
	tzn: {
		code: "tzn",
		name: "Tugun",
	},
	tzo: {
		code: "tzo",
		name: "Tzotzil",
	},
	tzx: {
		code: "tzx",
		name: "Tabriak",
	},
	uam: {
		code: "uam",
		name: "Uamué",
	},
	uan: {
		code: "uan",
		name: "Kuan",
	},
	uar: {
		code: "uar",
		name: "Tairuma",
	},
	uba: {
		code: "uba",
		name: "Ubang",
	},
	ubi: {
		code: "ubi",
		name: "Ubi",
	},
	ubl: {
		code: "ubl",
		name: "Buhi'non Bikol",
	},
	ubr: {
		code: "ubr",
		name: "Ubir",
	},
	ubu: {
		code: "ubu",
		name: "Umbu-Ungu",
	},
	uby: {
		code: "uby",
		name: "Ubykh",
	},
	uda: {
		code: "uda",
		name: "Uda",
	},
	ude: {
		code: "ude",
		name: "Udihe",
	},
	udg: {
		code: "udg",
		name: "Muduga",
	},
	udi: {
		code: "udi",
		name: "Udi",
	},
	udj: {
		code: "udj",
		name: "Ujir",
	},
	udl: {
		code: "udl",
		name: "Wuzlam",
	},
	udm: {
		code: "udm",
		name: "Udmurt",
		nativeName: "удмурт кыл",
	},
	udu: {
		code: "udu",
		name: "Uduk",
	},
	ues: {
		code: "ues",
		name: "Kioko",
	},
	ufi: {
		code: "ufi",
		name: "Ufim",
	},
	uga: {
		code: "uga",
		name: "Ugaritic",
	},
	ugb: {
		code: "ugb",
		name: "Kuku-Ugbanh",
	},
	uge: {
		code: "uge",
		name: "Ughele",
	},
	ugh: {
		code: "ugh",
		name: "Kubachi",
	},
	ugn: {
		code: "ugn",
		name: "Ugandan Sign Language",
	},
	ugo: {
		code: "ugo",
		name: "Ugong",
	},
	ugy: {
		code: "ugy",
		name: "Uruguayan Sign Language",
	},
	uha: {
		code: "uha",
		name: "Uhami",
	},
	uhn: {
		code: "uhn",
		name: "Damal",
	},
	uig: {
		code: "uig",
		name: "Uighur",
	},
	uis: {
		code: "uis",
		name: "Uisai",
	},
	uiv: {
		code: "uiv",
		name: "Iyive",
	},
	uji: {
		code: "uji",
		name: "Tanjijili",
	},
	uka: {
		code: "uka",
		name: "Kaburi",
	},
	ukg: {
		code: "ukg",
		name: "Ukuriguma",
	},
	ukh: {
		code: "ukh",
		name: "Ukhwejo",
	},
	uki: {
		code: "uki",
		name: "Kui (India)",
	},
	ukk: {
		code: "ukk",
		name: "Muak Sa-aak",
	},
	ukl: {
		code: "ukl",
		name: "Ukrainian Sign Language",
	},
	ukp: {
		code: "ukp",
		name: "Ukpe-Bayobiri",
	},
	ukq: {
		code: "ukq",
		name: "Ukwa",
	},
	ukr: {
		code: "ukr",
		name: "Ukrainian",
	},
	uks: {
		code: "uks",
		name: "Urubú-Kaapor Sign Language",
	},
	uku: {
		code: "uku",
		name: "Ukue",
	},
	ukv: {
		code: "ukv",
		name: "Kuku",
	},
	ukw: {
		code: "ukw",
		name: "Ukwuani-Aboh-Ndoni",
	},
	uky: {
		code: "uky",
		name: "Kuuk-Yak",
	},
	ula: {
		code: "ula",
		name: "Fungwa",
	},
	ulb: {
		code: "ulb",
		name: "Ulukwumi",
	},
	ulc: {
		code: "ulc",
		name: "Ulch",
	},
	ule: {
		code: "ule",
		name: "Lule",
	},
	ulf: {
		code: "ulf",
		name: "Usku",
	},
	uli: {
		code: "uli",
		name: "Ulithian",
	},
	ulk: {
		code: "ulk",
		name: "Meriam Mir",
	},
	ull: {
		code: "ull",
		name: "Ullatan",
	},
	ulm: {
		code: "ulm",
		name: "Ulumanda'",
	},
	uln: {
		code: "uln",
		name: "Unserdeutsch",
	},
	ulu: {
		code: "ulu",
		name: "Uma' Lung",
	},
	ulw: {
		code: "ulw",
		name: "Ulwa",
	},
	uly: {
		code: "uly",
		name: "Buli",
	},
	uma: {
		code: "uma",
		name: "Umatilla",
	},
	umb: {
		code: "umb",
		name: "Umbundu",
	},
	umc: {
		code: "umc",
		name: "Marrucinian",
	},
	umd: {
		code: "umd",
		name: "Umbindhamu",
	},
	umg: {
		code: "umg",
		name: "Morrobalama",
	},
	umi: {
		code: "umi",
		name: "Ukit",
	},
	umm: {
		code: "umm",
		name: "Umon",
	},
	umn: {
		code: "umn",
		name: "Makyan Naga",
	},
	umo: {
		code: "umo",
		name: "Umotína",
	},
	ump: {
		code: "ump",
		name: "Umpila",
	},
	umr: {
		code: "umr",
		name: "Umbugarla",
	},
	ums: {
		code: "ums",
		name: "Pendau",
	},
	umu: {
		code: "umu",
		name: "Munsee",
	},
	una: {
		code: "una",
		name: "North Watut",
	},
	und: {
		code: "und",
		name: "Undetermined",
	},
	une: {
		code: "une",
		name: "Uneme",
	},
	ung: {
		code: "ung",
		name: "Ngarinyin",
	},
	uni: {
		code: "uni",
		name: "Uni",
	},
	unk: {
		code: "unk",
		name: "Enawené-Nawé",
	},
	unm: {
		code: "unm",
		name: "Unami",
	},
	unn: {
		code: "unn",
		name: "Kurnai",
	},
	unr: {
		code: "unr",
		name: "Mundari",
	},
	unu: {
		code: "unu",
		name: "Unubahe",
	},
	unx: {
		code: "unx",
		name: "Munda",
	},
	unz: {
		code: "unz",
		name: "Unde Kaili",
	},
	uon: {
		code: "uon",
		name: "Kulon",
	},
	upi: {
		code: "upi",
		name: "Umeda",
	},
	upv: {
		code: "upv",
		name: "Uripiv-Wala-Rano-Atchin",
	},
	ura: {
		code: "ura",
		name: "Urarina",
	},
	urb: {
		code: "urb",
		name: "Urubú-Kaapor",
	},
	urc: {
		code: "urc",
		name: "Urningangg",
	},
	urd: {
		code: "urd",
		name: "Urdu",
	},
	ure: {
		code: "ure",
		name: "Uru",
	},
	urf: {
		code: "urf",
		name: "Uradhi",
	},
	urg: {
		code: "urg",
		name: "Urigina",
	},
	urh: {
		code: "urh",
		name: "Urhobo",
	},
	uri: {
		code: "uri",
		name: "Urim",
	},
	urk: {
		code: "urk",
		name: "Urak Lawoi'",
	},
	url: {
		code: "url",
		name: "Urali",
	},
	urm: {
		code: "urm",
		name: "Urapmin",
	},
	urn: {
		code: "urn",
		name: "Uruangnirin",
	},
	uro: {
		code: "uro",
		name: "Ura (Papua New Guinea)",
	},
	urp: {
		code: "urp",
		name: "Uru-Pa-In",
	},
	urr: {
		code: "urr",
		name: "Lehalurup",
	},
	urt: {
		code: "urt",
		name: "Urat",
	},
	uru: {
		code: "uru",
		name: "Urumi",
	},
	urv: {
		code: "urv",
		name: "Uruava",
	},
	urw: {
		code: "urw",
		name: "Sop",
	},
	urx: {
		code: "urx",
		name: "Urimo",
	},
	ury: {
		code: "ury",
		name: "Orya",
	},
	urz: {
		code: "urz",
		name: "Uru-Eu-Wau-Wau",
	},
	usa: {
		code: "usa",
		name: "Usarufa",
	},
	ush: {
		code: "ush",
		name: "Ushojo",
	},
	usi: {
		code: "usi",
		name: "Usui",
	},
	usk: {
		code: "usk",
		name: "Usaghade",
	},
	usp: {
		code: "usp",
		name: "Uspanteco",
	},
	uss: {
		code: "uss",
		name: "us-Saare",
	},
	usu: {
		code: "usu",
		name: "Uya",
	},
	uta: {
		code: "uta",
		name: "Otank",
	},
	ute: {
		code: "ute",
		name: "Ute-Southern Paiute",
	},
	uth: {
		code: "uth",
		name: "ut-Hun",
	},
	utp: {
		code: "utp",
		name: "Amba (Solomon Islands)",
	},
	utr: {
		code: "utr",
		name: "Etulo",
	},
	utu: {
		code: "utu",
		name: "Utu",
	},
	uum: {
		code: "uum",
		name: "Urum",
	},
	uur: {
		code: "uur",
		name: "Ura (Vanuatu)",
	},
	uuu: {
		code: "uuu",
		name: "U",
	},
	uve: {
		code: "uve",
		name: "West Uvean",
	},
	uvh: {
		code: "uvh",
		name: "Uri",
	},
	uvl: {
		code: "uvl",
		name: "Lote",
	},
	uwa: {
		code: "uwa",
		name: "Kuku-Uwanh",
	},
	uya: {
		code: "uya",
		name: "Doko-Uyanga",
	},
	uzb: {
		code: "uzb",
		name: "Uzbek",
	},
	uzn: {
		code: "uzn",
		name: "Northern Uzbek",
	},
	uzs: {
		code: "uzs",
		name: "Southern Uzbek",
	},
	vaa: {
		code: "vaa",
		name: "Vaagri Booli",
	},
	vae: {
		code: "vae",
		name: "Vale",
	},
	vaf: {
		code: "vaf",
		name: "Vafsi",
	},
	vag: {
		code: "vag",
		name: "Vagla",
	},
	vah: {
		code: "vah",
		name: "Varhadi-Nagpuri",
	},
	vai: {
		code: "vai",
		name: "Vai",
	},
	vaj: {
		code: "vaj",
		name: "Sekele",
	},
	val: {
		code: "val",
		name: "Vehes",
	},
	vam: {
		code: "vam",
		name: "Vanimo",
	},
	van: {
		code: "van",
		name: "Valman",
	},
	vao: {
		code: "vao",
		name: "Vao",
	},
	vap: {
		code: "vap",
		name: "Vaiphei",
	},
	var: {
		code: "var",
		name: "Huarijio",
	},
	vas: {
		code: "vas",
		name: "Vasavi",
	},
	vau: {
		code: "vau",
		name: "Vanuma",
	},
	vav: {
		code: "vav",
		name: "Varli",
	},
	vay: {
		code: "vay",
		name: "Wayu",
	},
	vbb: {
		code: "vbb",
		name: "Southeast Babar",
	},
	vbk: {
		code: "vbk",
		name: "Southwestern Bontok",
	},
	vec: {
		code: "vec",
		name: "Venetian",
	},
	ved: {
		code: "ved",
		name: "Veddah",
	},
	vel: {
		code: "vel",
		name: "Veluws",
	},
	vem: {
		code: "vem",
		name: "Vemgo-Mabas",
	},
	ven: {
		code: "ven",
		name: "Venda",
	},
	veo: {
		code: "veo",
		name: "Ventureño",
	},
	vep: {
		code: "vep",
		name: "Veps",
	},
	ver: {
		code: "ver",
		name: "Mom Jango",
	},
	vgr: {
		code: "vgr",
		name: "Vaghri",
	},
	vgt: {
		code: "vgt",
		name: "Vlaamse Gebarentaal",
	},
	vic: {
		code: "vic",
		name: "Virgin Islands Creole English",
	},
	vid: {
		code: "vid",
		name: "Vidunda",
	},
	vie: {
		code: "vie",
		name: "Vietnamese",
	},
	vif: {
		code: "vif",
		name: "Vili",
	},
	vig: {
		code: "vig",
		name: "Viemo",
	},
	vil: {
		code: "vil",
		name: "Vilela",
	},
	vin: {
		code: "vin",
		name: "Vinza",
	},
	vis: {
		code: "vis",
		name: "Vishavan",
	},
	vit: {
		code: "vit",
		name: "Viti",
	},
	viv: {
		code: "viv",
		name: "Iduna",
	},
	vjk: {
		code: "vjk",
		name: "Bajjika",
	},
	vka: {
		code: "vka",
		name: "Kariyarra",
	},
	vkj: {
		code: "vkj",
		name: "Kujarge",
	},
	vkk: {
		code: "vkk",
		name: "Kaur",
	},
	vkl: {
		code: "vkl",
		name: "Kulisusu",
	},
	vkm: {
		code: "vkm",
		name: "Kamakan",
	},
	vkn: {
		code: "vkn",
		name: "Koro Nulu",
	},
	vko: {
		code: "vko",
		name: "Kodeoha",
	},
	vkp: {
		code: "vkp",
		name: "Korlai Creole Portuguese",
	},
	vkt: {
		code: "vkt",
		name: "Tenggarong Kutai Malay",
	},
	vku: {
		code: "vku",
		name: "Kurrama",
	},
	vkz: {
		code: "vkz",
		name: "Koro Zuba",
	},
	vlp: {
		code: "vlp",
		name: "Valpei",
	},
	vls: {
		code: "vls",
		name: "Vlaams",
	},
	vma: {
		code: "vma",
		name: "Martuyhunira",
	},
	vmb: {
		code: "vmb",
		name: "Barbaram",
	},
	vmc: {
		code: "vmc",
		name: "Juxtlahuaca Mixtec",
	},
	vmd: {
		code: "vmd",
		name: "Mudu Koraga",
	},
	vme: {
		code: "vme",
		name: "East Masela",
	},
	vmf: {
		code: "vmf",
		name: "Mainfränkisch",
	},
	vmg: {
		code: "vmg",
		name: "Lungalunga",
	},
	vmh: {
		code: "vmh",
		name: "Maraghei",
	},
	vmi: {
		code: "vmi",
		name: "Miwa",
	},
	vmj: {
		code: "vmj",
		name: "Ixtayutla Mixtec",
	},
	vmk: {
		code: "vmk",
		name: "Makhuwa-Shirima",
	},
	vml: {
		code: "vml",
		name: "Malgana",
	},
	vmm: {
		code: "vmm",
		name: "Mitlatongo Mixtec",
	},
	vmp: {
		code: "vmp",
		name: "Soyaltepec Mazatec",
	},
	vmq: {
		code: "vmq",
		name: "Soyaltepec Mixtec",
	},
	vmr: {
		code: "vmr",
		name: "Marenje",
	},
	vms: {
		code: "vms",
		name: "Moksela",
	},
	vmu: {
		code: "vmu",
		name: "Muluridyi",
	},
	vmv: {
		code: "vmv",
		name: "Valley Maidu",
	},
	vmw: {
		code: "vmw",
		name: "Makhuwa",
	},
	vmx: {
		code: "vmx",
		name: "Tamazola Mixtec",
	},
	vmy: {
		code: "vmy",
		name: "Ayautla Mazatec",
	},
	vmz: {
		code: "vmz",
		name: "Mazatlán Mazatec",
	},
	vnk: {
		code: "vnk",
		name: "Vano",
	},
	vnm: {
		code: "vnm",
		name: "Vinmavis",
	},
	vnp: {
		code: "vnp",
		name: "Vunapu",
	},
	vol: {
		code: "vol",
		name: "Volapük",
	},
	vor: {
		code: "vor",
		name: "Voro",
	},
	vot: {
		code: "vot",
		name: "Votic",
	},
	vra: {
		code: "vra",
		name: "Vera'a",
	},
	vro: {
		code: "vro",
		name: "Võro",
	},
	vrs: {
		code: "vrs",
		name: "Varisi",
	},
	vrt: {
		code: "vrt",
		name: "Burmbar",
	},
	vsi: {
		code: "vsi",
		name: "Moldova Sign Language",
	},
	vsl: {
		code: "vsl",
		name: "Venezuelan Sign Language",
	},
	vsv: {
		code: "vsv",
		name: "Valencian Sign Language",
	},
	vto: {
		code: "vto",
		name: "Vitou",
	},
	vum: {
		code: "vum",
		name: "Vumbu",
	},
	vun: {
		code: "vun",
		name: "Vunjo",
	},
	vut: {
		code: "vut",
		name: "Vute",
	},
	vwa: {
		code: "vwa",
		name: "Awa (China)",
	},
	waa: {
		code: "waa",
		name: "Walla Walla",
	},
	wab: {
		code: "wab",
		name: "Wab",
	},
	wac: {
		code: "wac",
		name: "Wasco-Wishram",
	},
	wad: {
		code: "wad",
		name: "Wamesa",
	},
	wae: {
		code: "wae",
		name: "Walser",
	},
	waf: {
		code: "waf",
		name: "Wakoná",
	},
	wag: {
		code: "wag",
		name: "Wa'ema",
	},
	wah: {
		code: "wah",
		name: "Watubela",
	},
	wai: {
		code: "wai",
		name: "Wares",
	},
	waj: {
		code: "waj",
		name: "Waffa",
	},
	wal: {
		code: "wal",
		name: "Wolaytta",
	},
	wam: {
		code: "wam",
		name: "Wampanoag",
	},
	wan: {
		code: "wan",
		name: "Wan",
	},
	wao: {
		code: "wao",
		name: "Wappo",
	},
	wap: {
		code: "wap",
		name: "Wapishana",
	},
	waq: {
		code: "waq",
		name: "Wagiman",
	},
	war: {
		code: "war",
		name: "Waray (Philippines)",
	},
	was: {
		code: "was",
		name: "Washo",
	},
	wat: {
		code: "wat",
		name: "Kaninuwa",
	},
	wau: {
		code: "wau",
		name: "Waurá",
	},
	wav: {
		code: "wav",
		name: "Waka",
	},
	waw: {
		code: "waw",
		name: "Waiwai",
	},
	wax: {
		code: "wax",
		name: "Watam",
	},
	way: {
		code: "way",
		name: "Wayana",
	},
	waz: {
		code: "waz",
		name: "Wampur",
	},
	wba: {
		code: "wba",
		name: "Warao",
	},
	wbb: {
		code: "wbb",
		name: "Wabo",
	},
	wbe: {
		code: "wbe",
		name: "Waritai",
	},
	wbf: {
		code: "wbf",
		name: "Wara",
	},
	wbh: {
		code: "wbh",
		name: "Wanda",
	},
	wbi: {
		code: "wbi",
		name: "Vwanji",
	},
	wbj: {
		code: "wbj",
		name: "Alagwa",
	},
	wbk: {
		code: "wbk",
		name: "Waigali",
	},
	wbl: {
		code: "wbl",
		name: "Wakhi",
	},
	wbm: {
		code: "wbm",
		name: "Wa",
	},
	wbp: {
		code: "wbp",
		name: "Warlpiri",
	},
	wbq: {
		code: "wbq",
		name: "Waddar",
	},
	wbr: {
		code: "wbr",
		name: "Wagdi",
	},
	wbs: {
		code: "wbs",
		name: "West Bengal Sign Language",
	},
	wbt: {
		code: "wbt",
		name: "Warnman",
	},
	wbv: {
		code: "wbv",
		name: "Wajarri",
	},
	wbw: {
		code: "wbw",
		name: "Woi",
	},
	wca: {
		code: "wca",
		name: "Yanomámi",
	},
	wci: {
		code: "wci",
		name: "Waci Gbe",
	},
	wdd: {
		code: "wdd",
		name: "Wandji",
	},
	wdg: {
		code: "wdg",
		name: "Wadaginam",
	},
	wdj: {
		code: "wdj",
		name: "Wadjiginy",
	},
	wdk: {
		code: "wdk",
		name: "Wadikali",
	},
	wdt: {
		code: "wdt",
		name: "Wendat",
	},
	wdu: {
		code: "wdu",
		name: "Wadjigu",
	},
	wdy: {
		code: "wdy",
		name: "Wadjabangayi",
	},
	wea: {
		code: "wea",
		name: "Wewaw",
	},
	wec: {
		code: "wec",
		name: "Wè Western",
	},
	wed: {
		code: "wed",
		name: "Wedau",
	},
	weg: {
		code: "weg",
		name: "Wergaia",
	},
	weh: {
		code: "weh",
		name: "Weh",
	},
	wei: {
		code: "wei",
		name: "Kiunum",
	},
	wem: {
		code: "wem",
		name: "Weme Gbe",
	},
	weo: {
		code: "weo",
		name: "Wemale",
	},
	wep: {
		code: "wep",
		name: "Westphalien",
	},
	wer: {
		code: "wer",
		name: "Weri",
	},
	wes: {
		code: "wes",
		name: "Cameroon Pidgin",
	},
	wet: {
		code: "wet",
		name: "Perai",
	},
	weu: {
		code: "weu",
		name: "Rawngtu Chin",
	},
	wew: {
		code: "wew",
		name: "Wejewa",
	},
	wfg: {
		code: "wfg",
		name: "Yafi",
	},
	wga: {
		code: "wga",
		name: "Wagaya",
	},
	wgb: {
		code: "wgb",
		name: "Wagawaga",
	},
	wgg: {
		code: "wgg",
		name: "Wangkangurru",
	},
	wgi: {
		code: "wgi",
		name: "Wahgi",
	},
	wgo: {
		code: "wgo",
		name: "Waigeo",
	},
	wgu: {
		code: "wgu",
		name: "Wirangu",
	},
	wgy: {
		code: "wgy",
		name: "Warrgamay",
	},
	wha: {
		code: "wha",
		name: "Sou Upaa",
	},
	whg: {
		code: "whg",
		name: "North Wahgi",
	},
	whk: {
		code: "whk",
		name: "Wahau Kenyah",
	},
	whu: {
		code: "whu",
		name: "Wahau Kayan",
	},
	wib: {
		code: "wib",
		name: "Southern Toussian",
	},
	wic: {
		code: "wic",
		name: "Wichita",
	},
	wie: {
		code: "wie",
		name: "Wik-Epa",
	},
	wif: {
		code: "wif",
		name: "Wik-Keyangan",
	},
	wig: {
		code: "wig",
		name: "Wik Ngathan",
	},
	wih: {
		code: "wih",
		name: "Wik-Me'anha",
	},
	wii: {
		code: "wii",
		name: "Minidien",
	},
	wij: {
		code: "wij",
		name: "Wik-Iiyanh",
	},
	wik: {
		code: "wik",
		name: "Wikalkan",
	},
	wil: {
		code: "wil",
		name: "Wilawila",
	},
	wim: {
		code: "wim",
		name: "Wik-Mungkan",
	},
	win: {
		code: "win",
		name: "Ho-Chunk",
	},
	wir: {
		code: "wir",
		name: "Wiraféd",
	},
	wiu: {
		code: "wiu",
		name: "Wiru",
	},
	wiv: {
		code: "wiv",
		name: "Vitu",
	},
	wiy: {
		code: "wiy",
		name: "Wiyot",
	},
	wja: {
		code: "wja",
		name: "Waja",
	},
	wji: {
		code: "wji",
		name: "Warji",
	},
	wka: {
		code: "wka",
		name: "Kw'adza",
	},
	wkb: {
		code: "wkb",
		name: "Kumbaran",
	},
	wkd: {
		code: "wkd",
		name: "Wakde",
	},
	wkl: {
		code: "wkl",
		name: "Kalanadi",
	},
	wkr: {
		code: "wkr",
		name: "Keerray-Woorroong",
	},
	wku: {
		code: "wku",
		name: "Kunduvadi",
	},
	wkw: {
		code: "wkw",
		name: "Wakawaka",
	},
	wky: {
		code: "wky",
		name: "Wangkayutyuru",
	},
	wla: {
		code: "wla",
		name: "Walio",
	},
	wlc: {
		code: "wlc",
		name: "Mwali Comorian",
	},
	wle: {
		code: "wle",
		name: "Wolane",
	},
	wlg: {
		code: "wlg",
		name: "Kunbarlang",
	},
	wlh: {
		code: "wlh",
		name: "Welaun",
	},
	wli: {
		code: "wli",
		name: "Waioli",
	},
	wlk: {
		code: "wlk",
		name: "Wailaki",
	},
	wll: {
		code: "wll",
		name: "Wali (Sudan)",
	},
	wlm: {
		code: "wlm",
		name: "Middle Welsh",
	},
	wln: {
		code: "wln",
		name: "Walloon",
	},
	wlo: {
		code: "wlo",
		name: "Wolio",
	},
	wlr: {
		code: "wlr",
		name: "Wailapa",
	},
	wls: {
		code: "wls",
		name: "Wallisian",
	},
	wlu: {
		code: "wlu",
		name: "Wuliwuli",
	},
	wlv: {
		code: "wlv",
		name: "Wichí Lhamtés Vejoz",
	},
	wlw: {
		code: "wlw",
		name: "Walak",
	},
	wlx: {
		code: "wlx",
		name: "Wali (Ghana)",
	},
	wly: {
		code: "wly",
		name: "Waling",
	},
	wma: {
		code: "wma",
		name: "Mawa (Nigeria)",
	},
	wmb: {
		code: "wmb",
		name: "Wambaya",
	},
	wmc: {
		code: "wmc",
		name: "Wamas",
	},
	wmd: {
		code: "wmd",
		name: "Mamaindé",
	},
	wme: {
		code: "wme",
		name: "Wambule",
	},
	wmg: {
		code: "wmg",
		name: "Western Minyag",
	},
	wmh: {
		code: "wmh",
		name: "Waima'a",
	},
	wmi: {
		code: "wmi",
		name: "Wamin",
	},
	wmm: {
		code: "wmm",
		name: "Maiwa (Indonesia)",
	},
	wmn: {
		code: "wmn",
		name: "Waamwang",
	},
	wmo: {
		code: "wmo",
		name: "Wom (Papua New Guinea)",
	},
	wms: {
		code: "wms",
		name: "Wambon",
	},
	wmt: {
		code: "wmt",
		name: "Walmajarri",
	},
	wmw: {
		code: "wmw",
		name: "Mwani",
	},
	wmx: {
		code: "wmx",
		name: "Womo",
	},
	wnb: {
		code: "wnb",
		name: "Mokati",
	},
	wnc: {
		code: "wnc",
		name: "Wantoat",
	},
	wnd: {
		code: "wnd",
		name: "Wandarang",
	},
	wne: {
		code: "wne",
		name: "Waneci",
	},
	wng: {
		code: "wng",
		name: "Wanggom",
	},
	wni: {
		code: "wni",
		name: "Ndzwani Comorian",
	},
	wnk: {
		code: "wnk",
		name: "Wanukaka",
	},
	wnm: {
		code: "wnm",
		name: "Wanggamala",
	},
	wnn: {
		code: "wnn",
		name: "Wunumara",
	},
	wno: {
		code: "wno",
		name: "Wano",
	},
	wnp: {
		code: "wnp",
		name: "Wanap",
	},
	wnu: {
		code: "wnu",
		name: "Usan",
	},
	wnw: {
		code: "wnw",
		name: "Wintu",
	},
	wny: {
		code: "wny",
		name: "Wanyi",
	},
	woa: {
		code: "woa",
		name: "Kuwema",
	},
	wob: {
		code: "wob",
		name: "Wè Northern",
	},
	woc: {
		code: "woc",
		name: "Wogeo",
	},
	wod: {
		code: "wod",
		name: "Wolani",
	},
	woe: {
		code: "woe",
		name: "Woleaian",
	},
	wof: {
		code: "wof",
		name: "Gambian Wolof",
	},
	wog: {
		code: "wog",
		name: "Wogamusin",
	},
	woi: {
		code: "woi",
		name: "Kamang",
	},
	wok: {
		code: "wok",
		name: "Longto",
	},
	wol: {
		code: "wol",
		name: "Wolof",
	},
	wom: {
		code: "wom",
		name: "Wom (Nigeria)",
	},
	won: {
		code: "won",
		name: "Wongo",
	},
	woo: {
		code: "woo",
		name: "Manombai",
	},
	wor: {
		code: "wor",
		name: "Woria",
	},
	wos: {
		code: "wos",
		name: "Hanga Hundi",
	},
	wow: {
		code: "wow",
		name: "Wawonii",
	},
	woy: {
		code: "woy",
		name: "Weyto",
	},
	wpc: {
		code: "wpc",
		name: "Maco",
	},
	wrb: {
		code: "wrb",
		name: "Waluwarra",
	},
	wrg: {
		code: "wrg",
		name: "Warungu",
	},
	wrh: {
		code: "wrh",
		name: "Wiradjuri",
	},
	wri: {
		code: "wri",
		name: "Wariyangga",
	},
	wrk: {
		code: "wrk",
		name: "Garrwa",
	},
	wrl: {
		code: "wrl",
		name: "Warlmanpa",
	},
	wrm: {
		code: "wrm",
		name: "Warumungu",
	},
	wrn: {
		code: "wrn",
		name: "Warnang",
	},
	wro: {
		code: "wro",
		name: "Worrorra",
	},
	wrp: {
		code: "wrp",
		name: "Waropen",
	},
	wrr: {
		code: "wrr",
		name: "Wardaman",
	},
	wrs: {
		code: "wrs",
		name: "Waris",
	},
	wru: {
		code: "wru",
		name: "Waru",
	},
	wrv: {
		code: "wrv",
		name: "Waruna",
	},
	wrw: {
		code: "wrw",
		name: "Gugu Warra",
	},
	wrx: {
		code: "wrx",
		name: "Wae Rana",
	},
	wry: {
		code: "wry",
		name: "Merwari",
	},
	wrz: {
		code: "wrz",
		name: "Waray (Australia)",
	},
	wsa: {
		code: "wsa",
		name: "Warembori",
	},
	wsg: {
		code: "wsg",
		name: "Adilabad Gondi",
	},
	wsi: {
		code: "wsi",
		name: "Wusi",
	},
	wsk: {
		code: "wsk",
		name: "Waskia",
	},
	wsr: {
		code: "wsr",
		name: "Owenia",
	},
	wss: {
		code: "wss",
		name: "Wasa",
	},
	wsu: {
		code: "wsu",
		name: "Wasu",
	},
	wsv: {
		code: "wsv",
		name: "Wotapuri-Katarqalai",
	},
	wtb: {
		code: "wtb",
		name: "Matambwe",
	},
	wtf: {
		code: "wtf",
		name: "Watiwa",
	},
	wth: {
		code: "wth",
		name: "Wathawurrung",
	},
	wti: {
		code: "wti",
		name: "Berta",
	},
	wtk: {
		code: "wtk",
		name: "Watakataui",
	},
	wtm: {
		code: "wtm",
		name: "Mewati",
	},
	wtw: {
		code: "wtw",
		name: "Wotu",
	},
	wua: {
		code: "wua",
		name: "Wikngenchera",
	},
	wub: {
		code: "wub",
		name: "Wunambal",
	},
	wud: {
		code: "wud",
		name: "Wudu",
	},
	wuh: {
		code: "wuh",
		name: "Wutunhua",
	},
	wul: {
		code: "wul",
		name: "Silimo",
	},
	wum: {
		code: "wum",
		name: "Wumbvu",
	},
	wun: {
		code: "wun",
		name: "Bungu",
	},
	wur: {
		code: "wur",
		name: "Wurrugu",
	},
	wut: {
		code: "wut",
		name: "Wutung",
	},
	wuu: {
		code: "wuu",
		name: "Wu Chinese",
	},
	wuv: {
		code: "wuv",
		name: "Wuvulu-Aua",
	},
	wux: {
		code: "wux",
		name: "Wulna",
	},
	wuy: {
		code: "wuy",
		name: "Wauyai",
	},
	wwa: {
		code: "wwa",
		name: "Waama",
	},
	wwb: {
		code: "wwb",
		name: "Wakabunga",
	},
	wwo: {
		code: "wwo",
		name: "Wetamut",
	},
	wwr: {
		code: "wwr",
		name: "Warrwa",
	},
	www: {
		code: "www",
		name: "Wawa",
	},
	wxa: {
		code: "wxa",
		name: "Waxianghua",
	},
	wxw: {
		code: "wxw",
		name: "Wardandi",
	},
	wyb: {
		code: "wyb",
		name: "Wangaaybuwan-Ngiyambaa",
	},
	wyi: {
		code: "wyi",
		name: "Woiwurrung",
	},
	wym: {
		code: "wym",
		name: "Wymysorys",
	},
	wyn: {
		code: "wyn",
		name: "Wyandot",
	},
	wyr: {
		code: "wyr",
		name: "Wayoró",
	},
	wyy: {
		code: "wyy",
		name: "Western Fijian",
	},
	xaa: {
		code: "xaa",
		name: "Andalusian Arabic",
	},
	xab: {
		code: "xab",
		name: "Sambe",
	},
	xac: {
		code: "xac",
		name: "Kachari",
	},
	xad: {
		code: "xad",
		name: "Adai",
	},
	xae: {
		code: "xae",
		name: "Aequian",
	},
	xag: {
		code: "xag",
		name: "Aghwan",
	},
	xai: {
		code: "xai",
		name: "Kaimbé",
	},
	xaj: {
		code: "xaj",
		name: "Ararandewára",
	},
	xak: {
		code: "xak",
		name: "Máku",
	},
	xal: {
		code: "xal",
		name: "Kalmyk",
	},
	xam: {
		code: "xam",
		name: "ǀXam",
	},
	xan: {
		code: "xan",
		name: "Xamtanga",
	},
	xao: {
		code: "xao",
		name: "Khao",
	},
	xap: {
		code: "xap",
		name: "Apalachee",
	},
	xaq: {
		code: "xaq",
		name: "Aquitanian",
	},
	xar: {
		code: "xar",
		name: "Karami",
	},
	xas: {
		code: "xas",
		name: "Kamas",
	},
	xat: {
		code: "xat",
		name: "Katawixi",
	},
	xau: {
		code: "xau",
		name: "Kauwera",
	},
	xav: {
		code: "xav",
		name: "Xavánte",
	},
	xaw: {
		code: "xaw",
		name: "Kawaiisu",
	},
	xay: {
		code: "xay",
		name: "Kayan Mahakam",
	},
	xbb: {
		code: "xbb",
		name: "Lower Burdekin",
	},
	xbc: {
		code: "xbc",
		name: "Bactrian",
	},
	xbd: {
		code: "xbd",
		name: "Bindal",
	},
	xbe: {
		code: "xbe",
		name: "Bigambal",
	},
	xbg: {
		code: "xbg",
		name: "Bunganditj",
	},
	xbi: {
		code: "xbi",
		name: "Kombio",
	},
	xbj: {
		code: "xbj",
		name: "Birrpayi",
	},
	xbm: {
		code: "xbm",
		name: "Middle Breton",
	},
	xbn: {
		code: "xbn",
		name: "Kenaboi",
	},
	xbo: {
		code: "xbo",
		name: "Bolgarian",
	},
	xbp: {
		code: "xbp",
		name: "Bibbulman",
	},
	xbr: {
		code: "xbr",
		name: "Kambera",
	},
	xbw: {
		code: "xbw",
		name: "Kambiwá",
	},
	xby: {
		code: "xby",
		name: "Batjala",
	},
	xcb: {
		code: "xcb",
		name: "Cumbric",
	},
	xcc: {
		code: "xcc",
		name: "Camunic",
	},
	xce: {
		code: "xce",
		name: "Celtiberian",
	},
	xcg: {
		code: "xcg",
		name: "Cisalpine Gaulish",
	},
	xch: {
		code: "xch",
		name: "Chemakum",
	},
	xcl: {
		code: "xcl",
		name: "Classical Armenian",
	},
	xcm: {
		code: "xcm",
		name: "Comecrudo",
	},
	xcn: {
		code: "xcn",
		name: "Cotoname",
	},
	xco: {
		code: "xco",
		name: "Chorasmian",
	},
	xcr: {
		code: "xcr",
		name: "Carian",
	},
	xct: {
		code: "xct",
		name: "Classical Tibetan",
	},
	xcu: {
		code: "xcu",
		name: "Curonian",
	},
	xcv: {
		code: "xcv",
		name: "Chuvantsy",
	},
	xcw: {
		code: "xcw",
		name: "Coahuilteco",
	},
	xcy: {
		code: "xcy",
		name: "Cayuse",
	},
	xda: {
		code: "xda",
		name: "Darkinyung",
	},
	xdc: {
		code: "xdc",
		name: "Dacian",
	},
	xdk: {
		code: "xdk",
		name: "Dharuk",
	},
	xdm: {
		code: "xdm",
		name: "Edomite",
	},
	xdo: {
		code: "xdo",
		name: "Kwandu",
	},
	xdq: {
		code: "xdq",
		name: "Kaitag",
	},
	xdy: {
		code: "xdy",
		name: "Malayic Dayak",
	},
	xeb: {
		code: "xeb",
		name: "Eblan",
	},
	xed: {
		code: "xed",
		name: "Hdi",
	},
	xeg: {
		code: "xeg",
		name: "ǁXegwi",
	},
	xel: {
		code: "xel",
		name: "Kelo",
	},
	xem: {
		code: "xem",
		name: "Kembayan",
	},
	xep: {
		code: "xep",
		name: "Epi-Olmec",
	},
	xer: {
		code: "xer",
		name: "Xerénte",
	},
	xes: {
		code: "xes",
		name: "Kesawai",
	},
	xet: {
		code: "xet",
		name: "Xetá",
	},
	xeu: {
		code: "xeu",
		name: "Keoru-Ahia",
	},
	xfa: {
		code: "xfa",
		name: "Faliscan",
	},
	xga: {
		code: "xga",
		name: "Galatian",
	},
	xgb: {
		code: "xgb",
		name: "Gbin",
	},
	xgd: {
		code: "xgd",
		name: "Gudang",
	},
	xgf: {
		code: "xgf",
		name: "Gabrielino-Fernandeño",
	},
	xgg: {
		code: "xgg",
		name: "Goreng",
	},
	xgi: {
		code: "xgi",
		name: "Garingbal",
	},
	xgl: {
		code: "xgl",
		name: "Galindan",
	},
	xgm: {
		code: "xgm",
		name: "Dharumbal",
	},
	xgr: {
		code: "xgr",
		name: "Garza",
	},
	xgu: {
		code: "xgu",
		name: "Unggumi",
	},
	xgw: {
		code: "xgw",
		name: "Guwa",
	},
	xha: {
		code: "xha",
		name: "Harami",
	},
	xhc: {
		code: "xhc",
		name: "Hunnic",
	},
	xhd: {
		code: "xhd",
		name: "Hadrami",
	},
	xhe: {
		code: "xhe",
		name: "Khetrani",
	},
	xhm: {
		code: "xhm",
		name: "Middle Khmer (1400 to 1850 CE)",
	},
	xho: {
		code: "xho",
		name: "Xhosa",
	},
	xhr: {
		code: "xhr",
		name: "Hernican",
	},
	xht: {
		code: "xht",
		name: "Hattic",
	},
	xhu: {
		code: "xhu",
		name: "Hurrian",
	},
	xhv: {
		code: "xhv",
		name: "Khua",
	},
	xib: {
		code: "xib",
		name: "Iberian",
	},
	xii: {
		code: "xii",
		name: "Xiri",
	},
	xil: {
		code: "xil",
		name: "Illyrian",
	},
	xin: {
		code: "xin",
		name: "Xinca",
	},
	xir: {
		code: "xir",
		name: "Xiriâna",
	},
	xis: {
		code: "xis",
		name: "Kisan",
	},
	xiv: {
		code: "xiv",
		name: "Indus Valley Language",
	},
	xiy: {
		code: "xiy",
		name: "Xipaya",
	},
	xjb: {
		code: "xjb",
		name: "Minjungbal",
	},
	xjt: {
		code: "xjt",
		name: "Jaitmatang",
	},
	xka: {
		code: "xka",
		name: "Kalkoti",
	},
	xkb: {
		code: "xkb",
		name: "Northern Nago",
	},
	xkc: {
		code: "xkc",
		name: "Kho'ini",
	},
	xkd: {
		code: "xkd",
		name: "Mendalam Kayan",
	},
	xke: {
		code: "xke",
		name: "Kereho",
	},
	xkf: {
		code: "xkf",
		name: "Khengkha",
	},
	xkg: {
		code: "xkg",
		name: "Kagoro",
	},
	xki: {
		code: "xki",
		name: "Kenyan Sign Language",
	},
	xkj: {
		code: "xkj",
		name: "Kajali",
	},
	xkk: {
		code: "xkk",
		name: "Kachok",
	},
	xkl: {
		code: "xkl",
		name: "Mainstream Kenyah",
	},
	xkn: {
		code: "xkn",
		name: "Kayan River Kayan",
	},
	xko: {
		code: "xko",
		name: "Kiorr",
	},
	xkp: {
		code: "xkp",
		name: "Kabatei",
	},
	xkq: {
		code: "xkq",
		name: "Koroni",
	},
	xkr: {
		code: "xkr",
		name: "Xakriabá",
	},
	xks: {
		code: "xks",
		name: "Kumbewaha",
	},
	xkt: {
		code: "xkt",
		name: "Kantosi",
	},
	xku: {
		code: "xku",
		name: "Kaamba",
	},
	xkv: {
		code: "xkv",
		name: "Kgalagadi",
	},
	xkw: {
		code: "xkw",
		name: "Kembra",
	},
	xkx: {
		code: "xkx",
		name: "Karore",
	},
	xky: {
		code: "xky",
		name: "Uma' Lasan",
	},
	xkz: {
		code: "xkz",
		name: "Kurtokha",
	},
	xla: {
		code: "xla",
		name: "Kamula",
	},
	xlb: {
		code: "xlb",
		name: "Loup B",
	},
	xlc: {
		code: "xlc",
		name: "Lycian",
	},
	xld: {
		code: "xld",
		name: "Lydian",
	},
	xle: {
		code: "xle",
		name: "Lemnian",
	},
	xlg: {
		code: "xlg",
		name: "Ligurian (Ancient)",
	},
	xli: {
		code: "xli",
		name: "Liburnian",
	},
	xln: {
		code: "xln",
		name: "Alanic",
	},
	xlo: {
		code: "xlo",
		name: "Loup A",
	},
	xlp: {
		code: "xlp",
		name: "Lepontic",
	},
	xls: {
		code: "xls",
		name: "Lusitanian",
	},
	xlu: {
		code: "xlu",
		name: "Cuneiform Luwian",
	},
	xly: {
		code: "xly",
		name: "Elymian",
	},
	xma: {
		code: "xma",
		name: "Mushungulu",
	},
	xmb: {
		code: "xmb",
		name: "Mbonga",
	},
	xmc: {
		code: "xmc",
		name: "Makhuwa-Marrevone",
	},
	xmd: {
		code: "xmd",
		name: "Mbudum",
	},
	xme: {
		code: "xme",
		name: "Median",
	},
	xmf: {
		code: "xmf",
		name: "Mingrelian",
	},
	xmg: {
		code: "xmg",
		name: "Mengaka",
	},
	xmh: {
		code: "xmh",
		name: "Kugu-Muminh",
	},
	xmj: {
		code: "xmj",
		name: "Majera",
	},
	xmk: {
		code: "xmk",
		name: "Ancient Macedonian",
	},
	xml: {
		code: "xml",
		name: "Malaysian Sign Language",
	},
	xmm: {
		code: "xmm",
		name: "Manado Malay",
	},
	xmn: {
		code: "xmn",
		name: "Manichaean Middle Persian",
	},
	xmo: {
		code: "xmo",
		name: "Morerebi",
	},
	xmp: {
		code: "xmp",
		name: "Kuku-Mu'inh",
	},
	xmq: {
		code: "xmq",
		name: "Kuku-Mangk",
	},
	xmr: {
		code: "xmr",
		name: "Meroitic",
	},
	xms: {
		code: "xms",
		name: "Moroccan Sign Language",
	},
	xmt: {
		code: "xmt",
		name: "Matbat",
	},
	xmu: {
		code: "xmu",
		name: "Kamu",
	},
	xmv: {
		code: "xmv",
		name: "Antankarana Malagasy",
	},
	xmw: {
		code: "xmw",
		name: "Tsimihety Malagasy",
	},
	xmx: {
		code: "xmx",
		name: "Salawati",
	},
	xmy: {
		code: "xmy",
		name: "Mayaguduna",
	},
	xmz: {
		code: "xmz",
		name: "Mori Bawah",
	},
	xna: {
		code: "xna",
		name: "Ancient North Arabian",
	},
	xnb: {
		code: "xnb",
		name: "Kanakanabu",
	},
	xng: {
		code: "xng",
		name: "Middle Mongolian",
	},
	xnh: {
		code: "xnh",
		name: "Kuanhua",
	},
	xni: {
		code: "xni",
		name: "Ngarigu",
	},
	xnj: {
		code: "xnj",
		name: "Ngoni (Tanzania)",
	},
	xnk: {
		code: "xnk",
		name: "Nganakarti",
	},
	xnm: {
		code: "xnm",
		name: "Ngumbarl",
	},
	xnn: {
		code: "xnn",
		name: "Northern Kankanay",
	},
	xno: {
		code: "xno",
		name: "Anglo-Norman",
	},
	xnq: {
		code: "xnq",
		name: "Ngoni (Mozambique)",
	},
	xnr: {
		code: "xnr",
		name: "Kangri",
	},
	xns: {
		code: "xns",
		name: "Kanashi",
	},
	xnt: {
		code: "xnt",
		name: "Narragansett",
	},
	xnu: {
		code: "xnu",
		name: "Nukunul",
	},
	xny: {
		code: "xny",
		name: "Nyiyaparli",
	},
	xnz: {
		code: "xnz",
		name: "Kenzi",
	},
	xoc: {
		code: "xoc",
		name: "O'chi'chi'",
	},
	xod: {
		code: "xod",
		name: "Kokoda",
	},
	xog: {
		code: "xog",
		name: "Soga",
	},
	xoi: {
		code: "xoi",
		name: "Kominimung",
	},
	xok: {
		code: "xok",
		name: "Xokleng",
	},
	xom: {
		code: "xom",
		name: "Komo (Sudan)",
	},
	xon: {
		code: "xon",
		name: "Konkomba",
	},
	xoo: {
		code: "xoo",
		name: "Xukurú",
	},
	xop: {
		code: "xop",
		name: "Kopar",
	},
	xor: {
		code: "xor",
		name: "Korubo",
	},
	xow: {
		code: "xow",
		name: "Kowaki",
	},
	xpa: {
		code: "xpa",
		name: "Pirriya",
	},
	xpb: {
		code: "xpb",
		name: "Northeastern Tasmanian",
	},
	xpc: {
		code: "xpc",
		name: "Pecheneg",
	},
	xpd: {
		code: "xpd",
		name: "Oyster Bay Tasmanian",
	},
	xpe: {
		code: "xpe",
		name: "Liberia Kpelle",
	},
	xpf: {
		code: "xpf",
		name: "Southeast Tasmanian",
	},
	xpg: {
		code: "xpg",
		name: "Phrygian",
	},
	xph: {
		code: "xph",
		name: "North Midlands Tasmanian",
	},
	xpi: {
		code: "xpi",
		name: "Pictish",
	},
	xpj: {
		code: "xpj",
		name: "Mpalitjanh",
	},
	xpk: {
		code: "xpk",
		name: "Kulina Pano",
	},
	xpl: {
		code: "xpl",
		name: "Port Sorell Tasmanian",
	},
	xpm: {
		code: "xpm",
		name: "Pumpokol",
	},
	xpn: {
		code: "xpn",
		name: "Kapinawá",
	},
	xpo: {
		code: "xpo",
		name: "Pochutec",
	},
	xpp: {
		code: "xpp",
		name: "Puyo-Paekche",
	},
	xpq: {
		code: "xpq",
		name: "Mohegan-Pequot",
	},
	xpr: {
		code: "xpr",
		name: "Parthian",
	},
	xps: {
		code: "xps",
		name: "Pisidian",
	},
	xpt: {
		code: "xpt",
		name: "Punthamara",
	},
	xpu: {
		code: "xpu",
		name: "Punic",
	},
	xpv: {
		code: "xpv",
		name: "Northern Tasmanian",
	},
	xpw: {
		code: "xpw",
		name: "Northwestern Tasmanian",
	},
	xpx: {
		code: "xpx",
		name: "Southwestern Tasmanian",
	},
	xpy: {
		code: "xpy",
		name: "Puyo",
	},
	xpz: {
		code: "xpz",
		name: "Bruny Island Tasmanian",
	},
	xqa: {
		code: "xqa",
		name: "Karakhanid",
	},
	xqt: {
		code: "xqt",
		name: "Qatabanian",
	},
	xra: {
		code: "xra",
		name: "Krahô",
	},
	xrb: {
		code: "xrb",
		name: "Eastern Karaboro",
	},
	xrd: {
		code: "xrd",
		name: "Gundungurra",
	},
	xre: {
		code: "xre",
		name: "Kreye",
	},
	xrg: {
		code: "xrg",
		name: "Minang",
	},
	xri: {
		code: "xri",
		name: "Krikati-Timbira",
	},
	xrm: {
		code: "xrm",
		name: "Armazic",
	},
	xrn: {
		code: "xrn",
		name: "Arin",
	},
	xrr: {
		code: "xrr",
		name: "Raetic",
	},
	xrt: {
		code: "xrt",
		name: "Aranama-Tamique",
	},
	xru: {
		code: "xru",
		name: "Marriammu",
	},
	xrw: {
		code: "xrw",
		name: "Karawa",
	},
	xsa: {
		code: "xsa",
		name: "Sabaean",
	},
	xsb: {
		code: "xsb",
		name: "Sambal",
	},
	xsc: {
		code: "xsc",
		name: "Scythian",
	},
	xsd: {
		code: "xsd",
		name: "Sidetic",
	},
	xse: {
		code: "xse",
		name: "Sempan",
	},
	xsh: {
		code: "xsh",
		name: "Shamang",
	},
	xsi: {
		code: "xsi",
		name: "Sio",
	},
	xsj: {
		code: "xsj",
		name: "Subi",
	},
	xsl: {
		code: "xsl",
		name: "South Slavey",
	},
	xsm: {
		code: "xsm",
		name: "Kasem",
	},
	xsn: {
		code: "xsn",
		name: "Sanga (Nigeria)",
	},
	xso: {
		code: "xso",
		name: "Solano",
	},
	xsp: {
		code: "xsp",
		name: "Silopi",
	},
	xsq: {
		code: "xsq",
		name: "Makhuwa-Saka",
	},
	xsr: {
		code: "xsr",
		name: "Sherpa",
	},
	xsu: {
		code: "xsu",
		name: "Sanumá",
	},
	xsv: {
		code: "xsv",
		name: "Sudovian",
	},
	xsy: {
		code: "xsy",
		name: "Saisiyat",
	},
	xta: {
		code: "xta",
		name: "Alcozauca Mixtec",
	},
	xtb: {
		code: "xtb",
		name: "Chazumba Mixtec",
	},
	xtc: {
		code: "xtc",
		name: "Katcha-Kadugli-Miri",
	},
	xtd: {
		code: "xtd",
		name: "Diuxi-Tilantongo Mixtec",
	},
	xte: {
		code: "xte",
		name: "Ketengban",
	},
	xtg: {
		code: "xtg",
		name: "Transalpine Gaulish",
	},
	xth: {
		code: "xth",
		name: "Yitha Yitha",
	},
	xti: {
		code: "xti",
		name: "Sinicahua Mixtec",
	},
	xtj: {
		code: "xtj",
		name: "San Juan Teita Mixtec",
	},
	xtl: {
		code: "xtl",
		name: "Tijaltepec Mixtec",
	},
	xtm: {
		code: "xtm",
		name: "Magdalena Peñasco Mixtec",
	},
	xtn: {
		code: "xtn",
		name: "Northern Tlaxiaco Mixtec",
	},
	xto: {
		code: "xto",
		name: "Tokharian A",
	},
	xtp: {
		code: "xtp",
		name: "San Miguel Piedras Mixtec",
	},
	xtq: {
		code: "xtq",
		name: "Tumshuqese",
	},
	xtr: {
		code: "xtr",
		name: "Early Tripuri",
	},
	xts: {
		code: "xts",
		name: "Sindihui Mixtec",
	},
	xtt: {
		code: "xtt",
		name: "Tacahua Mixtec",
	},
	xtu: {
		code: "xtu",
		name: "Cuyamecalco Mixtec",
	},
	xtv: {
		code: "xtv",
		name: "Thawa",
	},
	xtw: {
		code: "xtw",
		name: "Tawandê",
	},
	xty: {
		code: "xty",
		name: "Yoloxochitl Mixtec",
	},
	xua: {
		code: "xua",
		name: "Alu Kurumba",
	},
	xub: {
		code: "xub",
		name: "Betta Kurumba",
	},
	xud: {
		code: "xud",
		name: "Umiida",
	},
	xug: {
		code: "xug",
		name: "Kunigami",
	},
	xuj: {
		code: "xuj",
		name: "Jennu Kurumba",
	},
	xul: {
		code: "xul",
		name: "Ngunawal",
	},
	xum: {
		code: "xum",
		name: "Umbrian",
	},
	xun: {
		code: "xun",
		name: "Unggaranggu",
	},
	xuo: {
		code: "xuo",
		name: "Kuo",
	},
	xup: {
		code: "xup",
		name: "Upper Umpqua",
	},
	xur: {
		code: "xur",
		name: "Urartian",
	},
	xut: {
		code: "xut",
		name: "Kuthant",
	},
	xuu: {
		code: "xuu",
		name: "Kxoe",
	},
	xve: {
		code: "xve",
		name: "Venetic",
	},
	xvi: {
		code: "xvi",
		name: "Kamviri",
	},
	xvn: {
		code: "xvn",
		name: "Vandalic",
	},
	xvo: {
		code: "xvo",
		name: "Volscian",
	},
	xvs: {
		code: "xvs",
		name: "Vestinian",
	},
	xwa: {
		code: "xwa",
		name: "Kwaza",
	},
	xwc: {
		code: "xwc",
		name: "Woccon",
	},
	xwd: {
		code: "xwd",
		name: "Wadi Wadi",
	},
	xwe: {
		code: "xwe",
		name: "Xwela Gbe",
	},
	xwg: {
		code: "xwg",
		name: "Kwegu",
	},
	xwj: {
		code: "xwj",
		name: "Wajuk",
	},
	xwk: {
		code: "xwk",
		name: "Wangkumara",
	},
	xwl: {
		code: "xwl",
		name: "Western Xwla Gbe",
	},
	xwo: {
		code: "xwo",
		name: "Written Oirat",
	},
	xwr: {
		code: "xwr",
		name: "Kwerba Mamberamo",
	},
	xwt: {
		code: "xwt",
		name: "Wotjobaluk",
	},
	xww: {
		code: "xww",
		name: "Wemba Wemba",
	},
	xxb: {
		code: "xxb",
		name: "Boro (Ghana)",
	},
	xxk: {
		code: "xxk",
		name: "Ke'o",
	},
	xxm: {
		code: "xxm",
		name: "Minkin",
	},
	xxr: {
		code: "xxr",
		name: "Koropó",
	},
	xxt: {
		code: "xxt",
		name: "Tambora",
	},
	xya: {
		code: "xya",
		name: "Yaygir",
	},
	xyb: {
		code: "xyb",
		name: "Yandjibara",
	},
	xyj: {
		code: "xyj",
		name: "Mayi-Yapi",
	},
	xyk: {
		code: "xyk",
		name: "Mayi-Kulan",
	},
	xyl: {
		code: "xyl",
		name: "Yalakalore",
	},
	xyt: {
		code: "xyt",
		name: "Mayi-Thakurti",
	},
	xyy: {
		code: "xyy",
		name: "Yorta Yorta",
	},
	xzh: {
		code: "xzh",
		name: "Zhang-Zhung",
	},
	xzm: {
		code: "xzm",
		name: "Zemgalian",
	},
	xzp: {
		code: "xzp",
		name: "Ancient Zapotec",
	},
	yaa: {
		code: "yaa",
		name: "Yaminahua",
	},
	yab: {
		code: "yab",
		name: "Yuhup",
	},
	yac: {
		code: "yac",
		name: "Pass Valley Yali",
	},
	yad: {
		code: "yad",
		name: "Yagua",
	},
	yae: {
		code: "yae",
		name: "Pumé",
	},
	yaf: {
		code: "yaf",
		name: "Yaka (Democratic Republic of Congo)",
	},
	yag: {
		code: "yag",
		name: "Yámana",
	},
	yah: {
		code: "yah",
		name: "Yazgulyam",
	},
	yai: {
		code: "yai",
		name: "Yagnobi",
	},
	yaj: {
		code: "yaj",
		name: "Banda-Yangere",
	},
	yak: {
		code: "yak",
		name: "Yakama",
	},
	yal: {
		code: "yal",
		name: "Yalunka",
	},
	yam: {
		code: "yam",
		name: "Yamba",
	},
	yan: {
		code: "yan",
		name: "Mayangna",
	},
	yao: {
		code: "yao",
		name: "Yao",
	},
	yap: {
		code: "yap",
		name: "Yapese",
	},
	yaq: {
		code: "yaq",
		name: "Yaqui",
	},
	yar: {
		code: "yar",
		name: "Yabarana",
	},
	yas: {
		code: "yas",
		name: "Nugunu (Cameroon)",
	},
	yat: {
		code: "yat",
		name: "Yambeta",
	},
	yau: {
		code: "yau",
		name: "Yuwana",
	},
	yav: {
		code: "yav",
		name: "Yangben",
	},
	yaw: {
		code: "yaw",
		name: "Yawalapití",
	},
	yax: {
		code: "yax",
		name: "Yauma",
	},
	yay: {
		code: "yay",
		name: "Agwagwune",
	},
	yaz: {
		code: "yaz",
		name: "Lokaa",
	},
	yba: {
		code: "yba",
		name: "Yala",
	},
	ybb: {
		code: "ybb",
		name: "Yemba",
	},
	ybe: {
		code: "ybe",
		name: "West Yugur",
	},
	ybh: {
		code: "ybh",
		name: "Yakha",
	},
	ybi: {
		code: "ybi",
		name: "Yamphu",
	},
	ybj: {
		code: "ybj",
		name: "Hasha",
	},
	ybk: {
		code: "ybk",
		name: "Bokha",
	},
	ybl: {
		code: "ybl",
		name: "Yukuben",
	},
	ybm: {
		code: "ybm",
		name: "Yaben",
	},
	ybn: {
		code: "ybn",
		name: "Yabaâna",
	},
	ybo: {
		code: "ybo",
		name: "Yabong",
	},
	ybx: {
		code: "ybx",
		name: "Yawiyo",
	},
	yby: {
		code: "yby",
		name: "Yaweyuha",
	},
	ych: {
		code: "ych",
		name: "Chesu",
	},
	ycl: {
		code: "ycl",
		name: "Lolopo",
	},
	ycn: {
		code: "ycn",
		name: "Yucuna",
	},
	ycp: {
		code: "ycp",
		name: "Chepya",
	},
	ycr: {
		code: "ycr",
		name: "Yilan Creole",
	},
	yda: {
		code: "yda",
		name: "Yanda",
	},
	ydd: {
		code: "ydd",
		name: "Eastern Yiddish",
	},
	yde: {
		code: "yde",
		name: "Yangum Dey",
	},
	ydg: {
		code: "ydg",
		name: "Yidgha",
	},
	ydk: {
		code: "ydk",
		name: "Yoidik",
	},
	yea: {
		code: "yea",
		name: "Ravula",
	},
	yec: {
		code: "yec",
		name: "Yeniche",
	},
	yee: {
		code: "yee",
		name: "Yimas",
	},
	yei: {
		code: "yei",
		name: "Yeni",
	},
	yej: {
		code: "yej",
		name: "Yevanic",
	},
	yel: {
		code: "yel",
		name: "Yela",
	},
	yer: {
		code: "yer",
		name: "Tarok",
	},
	yes: {
		code: "yes",
		name: "Nyankpa",
	},
	yet: {
		code: "yet",
		name: "Yetfa",
	},
	yeu: {
		code: "yeu",
		name: "Yerukula",
	},
	yev: {
		code: "yev",
		name: "Yapunda",
	},
	yey: {
		code: "yey",
		name: "Yeyi",
	},
	yga: {
		code: "yga",
		name: "Malyangapa",
	},
	ygi: {
		code: "ygi",
		name: "Yiningayi",
	},
	ygl: {
		code: "ygl",
		name: "Yangum Gel",
	},
	ygm: {
		code: "ygm",
		name: "Yagomi",
	},
	ygp: {
		code: "ygp",
		name: "Gepo",
	},
	ygr: {
		code: "ygr",
		name: "Yagaria",
	},
	ygs: {
		code: "ygs",
		name: "Yolŋu Sign Language",
	},
	ygu: {
		code: "ygu",
		name: "Yugul",
	},
	ygw: {
		code: "ygw",
		name: "Yagwoia",
	},
	yha: {
		code: "yha",
		name: "Baha Buyang",
	},
	yhd: {
		code: "yhd",
		name: "Judeo-Iraqi Arabic",
	},
	yhl: {
		code: "yhl",
		name: "Hlepho Phowa",
	},
	yhs: {
		code: "yhs",
		name: "Yan-nhaŋu Sign Language",
	},
	yia: {
		code: "yia",
		name: "Yinggarda",
	},
	yid: {
		code: "yid",
		name: "Yiddish",
	},
	yif: {
		code: "yif",
		name: "Ache",
	},
	yig: {
		code: "yig",
		name: "Wusa Nasu",
	},
	yih: {
		code: "yih",
		name: "Western Yiddish",
	},
	yii: {
		code: "yii",
		name: "Yidiny",
	},
	yij: {
		code: "yij",
		name: "Yindjibarndi",
	},
	yik: {
		code: "yik",
		name: "Dongshanba Lalo",
	},
	yil: {
		code: "yil",
		name: "Yindjilandji",
	},
	yim: {
		code: "yim",
		name: "Yimchungru Naga",
	},
	yin: {
		code: "yin",
		name: "Riang Lai",
	},
	yip: {
		code: "yip",
		name: "Pholo",
	},
	yiq: {
		code: "yiq",
		name: "Miqie",
	},
	yir: {
		code: "yir",
		name: "North Awyu",
	},
	yis: {
		code: "yis",
		name: "Yis",
	},
	yit: {
		code: "yit",
		name: "Eastern Lalu",
	},
	yiu: {
		code: "yiu",
		name: "Awu",
	},
	yiv: {
		code: "yiv",
		name: "Northern Nisu",
	},
	yix: {
		code: "yix",
		name: "Axi Yi",
	},
	yiz: {
		code: "yiz",
		name: "Azhe",
	},
	yka: {
		code: "yka",
		name: "Yakan",
	},
	ykg: {
		code: "ykg",
		name: "Northern Yukaghir",
	},
	ykh: {
		code: "ykh",
		name: "Khamnigan Mongol",
	},
	yki: {
		code: "yki",
		name: "Yoke",
	},
	ykk: {
		code: "ykk",
		name: "Yakaikeke",
	},
	ykl: {
		code: "ykl",
		name: "Khlula",
	},
	ykm: {
		code: "ykm",
		name: "Kap",
	},
	ykn: {
		code: "ykn",
		name: "Kua-nsi",
	},
	yko: {
		code: "yko",
		name: "Yasa",
	},
	ykr: {
		code: "ykr",
		name: "Yekora",
	},
	ykt: {
		code: "ykt",
		name: "Kathu",
	},
	yku: {
		code: "yku",
		name: "Kuamasi",
	},
	yky: {
		code: "yky",
		name: "Yakoma",
	},
	yla: {
		code: "yla",
		name: "Yaul",
	},
	ylb: {
		code: "ylb",
		name: "Yaleba",
	},
	yle: {
		code: "yle",
		name: "Yele",
	},
	ylg: {
		code: "ylg",
		name: "Yelogu",
	},
	yli: {
		code: "yli",
		name: "Angguruk Yali",
	},
	yll: {
		code: "yll",
		name: "Yil",
	},
	ylm: {
		code: "ylm",
		name: "Limi",
	},
	yln: {
		code: "yln",
		name: "Langnian Buyang",
	},
	ylo: {
		code: "ylo",
		name: "Naluo Yi",
	},
	ylr: {
		code: "ylr",
		name: "Yalarnnga",
	},
	ylu: {
		code: "ylu",
		name: "Aribwaung",
	},
	yly: {
		code: "yly",
		name: "Nyâlayu",
	},
	ymb: {
		code: "ymb",
		name: "Yambes",
	},
	ymc: {
		code: "ymc",
		name: "Southern Muji",
	},
	ymd: {
		code: "ymd",
		name: "Muda",
	},
	yme: {
		code: "yme",
		name: "Yameo",
	},
	ymg: {
		code: "ymg",
		name: "Yamongeri",
	},
	ymh: {
		code: "ymh",
		name: "Mili",
	},
	ymi: {
		code: "ymi",
		name: "Moji",
	},
	ymk: {
		code: "ymk",
		name: "Makwe",
	},
	yml: {
		code: "yml",
		name: "Iamalele",
	},
	ymm: {
		code: "ymm",
		name: "Maay",
	},
	ymn: {
		code: "ymn",
		name: "Yamna",
	},
	ymo: {
		code: "ymo",
		name: "Yangum Mon",
	},
	ymp: {
		code: "ymp",
		name: "Yamap",
	},
	ymq: {
		code: "ymq",
		name: "Qila Muji",
	},
	ymr: {
		code: "ymr",
		name: "Malasar",
	},
	yms: {
		code: "yms",
		name: "Mysian",
	},
	ymx: {
		code: "ymx",
		name: "Northern Muji",
	},
	ymz: {
		code: "ymz",
		name: "Muzi",
	},
	yna: {
		code: "yna",
		name: "Aluo",
	},
	ynd: {
		code: "ynd",
		name: "Yandruwandha",
	},
	yne: {
		code: "yne",
		name: "Lang'e",
	},
	yng: {
		code: "yng",
		name: "Yango",
	},
	ynk: {
		code: "ynk",
		name: "Naukan Yupik",
	},
	ynl: {
		code: "ynl",
		name: "Yangulam",
	},
	ynn: {
		code: "ynn",
		name: "Yana",
	},
	yno: {
		code: "yno",
		name: "Yong",
	},
	ynq: {
		code: "ynq",
		name: "Yendang",
	},
	yns: {
		code: "yns",
		name: "Yansi",
	},
	ynu: {
		code: "ynu",
		name: "Yahuna",
	},
	yob: {
		code: "yob",
		name: "Yoba",
	},
	yog: {
		code: "yog",
		name: "Yogad",
	},
	yoi: {
		code: "yoi",
		name: "Yonaguni",
	},
	yok: {
		code: "yok",
		name: "Yokuts",
	},
	yol: {
		code: "yol",
		name: "Yola",
	},
	yom: {
		code: "yom",
		name: "Yombe",
	},
	yon: {
		code: "yon",
		name: "Yongkom",
	},
	yor: {
		code: "yor",
		name: "Yoruba",
	},
	yot: {
		code: "yot",
		name: "Yotti",
	},
	yox: {
		code: "yox",
		name: "Yoron",
	},
	yoy: {
		code: "yoy",
		name: "Yoy",
	},
	ypa: {
		code: "ypa",
		name: "Phala",
	},
	ypb: {
		code: "ypb",
		name: "Labo Phowa",
	},
	ypg: {
		code: "ypg",
		name: "Phola",
	},
	yph: {
		code: "yph",
		name: "Phupha",
	},
	ypm: {
		code: "ypm",
		name: "Phuma",
	},
	ypn: {
		code: "ypn",
		name: "Ani Phowa",
	},
	ypo: {
		code: "ypo",
		name: "Alo Phola",
	},
	ypp: {
		code: "ypp",
		name: "Phupa",
	},
	ypz: {
		code: "ypz",
		name: "Phuza",
	},
	yra: {
		code: "yra",
		name: "Yerakai",
	},
	yrb: {
		code: "yrb",
		name: "Yareba",
	},
	yre: {
		code: "yre",
		name: "Yaouré",
	},
	yrk: {
		code: "yrk",
		name: "Nenets",
	},
	yrl: {
		code: "yrl",
		name: "Nhengatu",
	},
	yrm: {
		code: "yrm",
		name: "Yirrk-Mel",
	},
	yrn: {
		code: "yrn",
		name: "Yerong",
	},
	yro: {
		code: "yro",
		name: "Yaroamë",
	},
	yrs: {
		code: "yrs",
		name: "Yarsun",
	},
	yrw: {
		code: "yrw",
		name: "Yarawata",
	},
	yry: {
		code: "yry",
		name: "Yarluyandi",
	},
	ysc: {
		code: "ysc",
		name: "Yassic",
	},
	ysd: {
		code: "ysd",
		name: "Samatao",
	},
	ysg: {
		code: "ysg",
		name: "Sonaga",
	},
	ysl: {
		code: "ysl",
		name: "Yugoslavian Sign Language",
	},
	ysm: {
		code: "ysm",
		name: "Myanmar Sign Language",
	},
	ysn: {
		code: "ysn",
		name: "Sani",
	},
	yso: {
		code: "yso",
		name: "Nisi (China)",
	},
	ysp: {
		code: "ysp",
		name: "Southern Lolopo",
	},
	ysr: {
		code: "ysr",
		name: "Sirenik Yupik",
	},
	yss: {
		code: "yss",
		name: "Yessan-Mayo",
	},
	ysy: {
		code: "ysy",
		name: "Sanie",
	},
	yta: {
		code: "yta",
		name: "Talu",
	},
	ytl: {
		code: "ytl",
		name: "Tanglang",
	},
	ytp: {
		code: "ytp",
		name: "Thopho",
	},
	ytw: {
		code: "ytw",
		name: "Yout Wam",
	},
	yty: {
		code: "yty",
		name: "Yatay",
	},
	yua: {
		code: "yua",
		name: "Yucateco",
	},
	yub: {
		code: "yub",
		name: "Yugambal",
	},
	yuc: {
		code: "yuc",
		name: "Yuchi",
	},
	yud: {
		code: "yud",
		name: "Judeo-Tripolitanian Arabic",
	},
	yue: {
		code: "yue",
		name: "Yue Chinese",
	},
	yuf: {
		code: "yuf",
		name: "Havasupai-Walapai-Yavapai",
	},
	yug: {
		code: "yug",
		name: "Yug",
	},
	yui: {
		code: "yui",
		name: "Yurutí",
	},
	yuj: {
		code: "yuj",
		name: "Karkar-Yuri",
	},
	yuk: {
		code: "yuk",
		name: "Yuki",
	},
	yul: {
		code: "yul",
		name: "Yulu",
	},
	yum: {
		code: "yum",
		name: "Quechan",
	},
	yun: {
		code: "yun",
		name: "Bena (Nigeria)",
	},
	yup: {
		code: "yup",
		name: "Yukpa",
	},
	yuq: {
		code: "yuq",
		name: "Yuqui",
	},
	yur: {
		code: "yur",
		name: "Yurok",
	},
	yut: {
		code: "yut",
		name: "Yopno",
	},
	yuw: {
		code: "yuw",
		name: "Yau (Morobe Province)",
	},
	yux: {
		code: "yux",
		name: "Southern Yukaghir",
	},
	yuy: {
		code: "yuy",
		name: "East Yugur",
	},
	yuz: {
		code: "yuz",
		name: "Yuracare",
	},
	yva: {
		code: "yva",
		name: "Yawa",
	},
	yvt: {
		code: "yvt",
		name: "Yavitero",
	},
	ywa: {
		code: "ywa",
		name: "Kalou",
	},
	ywg: {
		code: "ywg",
		name: "Yinhawangka",
	},
	ywl: {
		code: "ywl",
		name: "Western Lalu",
	},
	ywn: {
		code: "ywn",
		name: "Yawanawa",
	},
	ywq: {
		code: "ywq",
		name: "Wuding-Luquan Yi",
	},
	ywr: {
		code: "ywr",
		name: "Yawuru",
	},
	ywt: {
		code: "ywt",
		name: "Xishanba Lalo",
	},
	ywu: {
		code: "ywu",
		name: "Wumeng Nasu",
	},
	yww: {
		code: "yww",
		name: "Yawarawarga",
	},
	yxa: {
		code: "yxa",
		name: "Mayawali",
	},
	yxg: {
		code: "yxg",
		name: "Yagara",
	},
	yxl: {
		code: "yxl",
		name: "Yardliyawarra",
	},
	yxm: {
		code: "yxm",
		name: "Yinwum",
	},
	yxu: {
		code: "yxu",
		name: "Yuyu",
	},
	yxy: {
		code: "yxy",
		name: "Yabula Yabula",
	},
	yyr: {
		code: "yyr",
		name: "Yir Yoront",
	},
	yyu: {
		code: "yyu",
		name: "Yau (Sandaun Province)",
	},
	yyz: {
		code: "yyz",
		name: "Ayizi",
	},
	yzg: {
		code: "yzg",
		name: "E'ma Buyang",
	},
	yzk: {
		code: "yzk",
		name: "Zokhuo",
	},
	zaa: {
		code: "zaa",
		name: "Sierra de Juárez Zapotec",
	},
	zab: {
		code: "zab",
		name: "Western Tlacolula Valley Zapotec",
	},
	zac: {
		code: "zac",
		name: "Ocotlán Zapotec",
	},
	zad: {
		code: "zad",
		name: "Cajonos Zapotec",
	},
	zae: {
		code: "zae",
		name: "Yareni Zapotec",
	},
	zaf: {
		code: "zaf",
		name: "Ayoquesco Zapotec",
	},
	zag: {
		code: "zag",
		name: "Zaghawa",
	},
	zah: {
		code: "zah",
		name: "Zangwal",
	},
	zai: {
		code: "zai",
		name: "Isthmus Zapotec",
	},
	zaj: {
		code: "zaj",
		name: "Zaramo",
	},
	zak: {
		code: "zak",
		name: "Zanaki",
	},
	zal: {
		code: "zal",
		name: "Zauzou",
	},
	zam: {
		code: "zam",
		name: "Miahuatlán Zapotec",
	},
	zao: {
		code: "zao",
		name: "Ozolotepec Zapotec",
	},
	zap: {
		code: "zap",
		name: "Zapotec",
	},
	zaq: {
		code: "zaq",
		name: "Aloápam Zapotec",
	},
	zar: {
		code: "zar",
		name: "Rincón Zapotec",
	},
	zas: {
		code: "zas",
		name: "Santo Domingo Albarradas Zapotec",
	},
	zat: {
		code: "zat",
		name: "Tabaa Zapotec",
	},
	zau: {
		code: "zau",
		name: "Zangskari",
	},
	zav: {
		code: "zav",
		name: "Yatzachi Zapotec",
	},
	zaw: {
		code: "zaw",
		name: "Mitla Zapotec",
	},
	zax: {
		code: "zax",
		name: "Xadani Zapotec",
	},
	zay: {
		code: "zay",
		name: "Zayse-Zergulla",
	},
	zaz: {
		code: "zaz",
		name: "Zari",
	},
	zba: {
		code: "zba",
		name: "Balaibalan",
	},
	zbc: {
		code: "zbc",
		name: "Central Berawan",
	},
	zbe: {
		code: "zbe",
		name: "East Berawan",
	},
	zbl: {
		code: "zbl",
		name: "Blissymbols",
	},
	zbt: {
		code: "zbt",
		name: "Batui",
	},
	zbu: {
		code: "zbu",
		name: "Bu (Bauchi State)",
	},
	zbw: {
		code: "zbw",
		name: "West Berawan",
	},
	zca: {
		code: "zca",
		name: "Coatecas Altas Zapotec",
	},
	zcd: {
		code: "zcd",
		name: "Las Delicias Zapotec",
	},
	zch: {
		code: "zch",
		name: "Central Hongshuihe Zhuang",
	},
	zdj: {
		code: "zdj",
		name: "Ngazidja Comorian",
	},
	zea: {
		code: "zea",
		name: "Zeeuws",
	},
	zeg: {
		code: "zeg",
		name: "Zenag",
	},
	zeh: {
		code: "zeh",
		name: "Eastern Hongshuihe Zhuang",
	},
	zem: {
		code: "zem",
		name: "Zeem",
	},
	zen: {
		code: "zen",
		name: "Zenaga",
	},
	zga: {
		code: "zga",
		name: "Kinga",
	},
	zgb: {
		code: "zgb",
		name: "Guibei Zhuang",
	},
	zgh: {
		code: "zgh",
		name: "Standard Moroccan Tamazight",
	},
	zgm: {
		code: "zgm",
		name: "Minz Zhuang",
	},
	zgn: {
		code: "zgn",
		name: "Guibian Zhuang",
	},
	zgr: {
		code: "zgr",
		name: "Magori",
	},
	zha: {
		code: "zha",
		name: "Zhuang",
	},
	zhb: {
		code: "zhb",
		name: "Zhaba",
	},
	zhd: {
		code: "zhd",
		name: "Dai Zhuang",
	},
	zhi: {
		code: "zhi",
		name: "Zhire",
	},
	zhn: {
		code: "zhn",
		name: "Nong Zhuang",
	},
	zho: {
		code: "zho",
		name: "Chinese",
	},
	zhw: {
		code: "zhw",
		name: "Zhoa",
	},
	zia: {
		code: "zia",
		name: "Zia",
	},
	zib: {
		code: "zib",
		name: "Zimbabwe Sign Language",
	},
	zik: {
		code: "zik",
		name: "Zimakani",
	},
	zil: {
		code: "zil",
		name: "Zialo",
	},
	zim: {
		code: "zim",
		name: "Mesme",
	},
	zin: {
		code: "zin",
		name: "Zinza",
	},
	ziw: {
		code: "ziw",
		name: "Zigula",
	},
	ziz: {
		code: "ziz",
		name: "Zizilivakan",
	},
	zka: {
		code: "zka",
		name: "Kaimbulawa",
	},
	zkd: {
		code: "zkd",
		name: "Kadu",
	},
	zkg: {
		code: "zkg",
		name: "Koguryo",
	},
	zkh: {
		code: "zkh",
		name: "Khorezmian",
	},
	zkk: {
		code: "zkk",
		name: "Karankawa",
	},
	zkn: {
		code: "zkn",
		name: "Kanan",
	},
	zko: {
		code: "zko",
		name: "Kott",
	},
	zkp: {
		code: "zkp",
		name: "São Paulo Kaingáng",
	},
	zkr: {
		code: "zkr",
		name: "Zakhring",
	},
	zkt: {
		code: "zkt",
		name: "Kitan",
	},
	zku: {
		code: "zku",
		name: "Kaurna",
	},
	zkv: {
		code: "zkv",
		name: "Krevinian",
	},
	zkz: {
		code: "zkz",
		name: "Khazar",
	},
	zla: {
		code: "zla",
		name: "Zula",
	},
	zlj: {
		code: "zlj",
		name: "Liujiang Zhuang",
	},
	zlm: {
		code: "zlm",
		name: "Malay (individual language)",
	},
	zln: {
		code: "zln",
		name: "Lianshan Zhuang",
	},
	zlq: {
		code: "zlq",
		name: "Liuqian Zhuang",
	},
	zlu: {
		code: "zlu",
		name: "Zul",
	},
	zma: {
		code: "zma",
		name: "Manda (Australia)",
	},
	zmb: {
		code: "zmb",
		name: "Zimba",
	},
	zmc: {
		code: "zmc",
		name: "Margany",
	},
	zmd: {
		code: "zmd",
		name: "Maridan",
	},
	zme: {
		code: "zme",
		name: "Mangerr",
	},
	zmf: {
		code: "zmf",
		name: "Mfinu",
	},
	zmg: {
		code: "zmg",
		name: "Marti Ke",
	},
	zmh: {
		code: "zmh",
		name: "Makolkol",
	},
	zmi: {
		code: "zmi",
		name: "Negeri Sembilan Malay",
	},
	zmj: {
		code: "zmj",
		name: "Maridjabin",
	},
	zmk: {
		code: "zmk",
		name: "Mandandanyi",
	},
	zml: {
		code: "zml",
		name: "Matngala",
	},
	zmm: {
		code: "zmm",
		name: "Marimanindji",
	},
	zmn: {
		code: "zmn",
		name: "Mbangwe",
	},
	zmo: {
		code: "zmo",
		name: "Molo",
	},
	zmp: {
		code: "zmp",
		name: "Mpuono",
	},
	zmq: {
		code: "zmq",
		name: "Mituku",
	},
	zmr: {
		code: "zmr",
		name: "Maranunggu",
	},
	zms: {
		code: "zms",
		name: "Mbesa",
	},
	zmt: {
		code: "zmt",
		name: "Maringarr",
	},
	zmu: {
		code: "zmu",
		name: "Muruwari",
	},
	zmv: {
		code: "zmv",
		name: "Mbariman-Gudhinma",
	},
	zmw: {
		code: "zmw",
		name: "Mbo (Democratic Republic of Congo)",
	},
	zmx: {
		code: "zmx",
		name: "Bomitaba",
	},
	zmy: {
		code: "zmy",
		name: "Mariyedi",
	},
	zmz: {
		code: "zmz",
		name: "Mbandja",
	},
	zna: {
		code: "zna",
		name: "Zan Gula",
	},
	zne: {
		code: "zne",
		name: "Zande (individual language)",
	},
	zng: {
		code: "zng",
		name: "Mang",
	},
	znk: {
		code: "znk",
		name: "Manangkari",
	},
	zns: {
		code: "zns",
		name: "Mangas",
	},
	zoc: {
		code: "zoc",
		name: "Copainalá Zoque",
	},
	zoh: {
		code: "zoh",
		name: "Chimalapa Zoque",
	},
	zom: {
		code: "zom",
		name: "Zou",
	},
	zoo: {
		code: "zoo",
		name: "Asunción Mixtepec Zapotec",
	},
	zoq: {
		code: "zoq",
		name: "Tabasco Zoque",
	},
	zor: {
		code: "zor",
		name: "Rayón Zoque",
	},
	zos: {
		code: "zos",
		name: "Francisco León Zoque",
	},
	zpa: {
		code: "zpa",
		name: "Lachiguiri Zapotec",
	},
	zpb: {
		code: "zpb",
		name: "Yautepec Zapotec",
	},
	zpc: {
		code: "zpc",
		name: "Choapan Zapotec",
	},
	zpd: {
		code: "zpd",
		name: "Southeastern Ixtlán Zapotec",
	},
	zpe: {
		code: "zpe",
		name: "Petapa Zapotec",
	},
	zpf: {
		code: "zpf",
		name: "San Pedro Quiatoni Zapotec",
	},
	zpg: {
		code: "zpg",
		name: "Guevea De Humboldt Zapotec",
	},
	zph: {
		code: "zph",
		name: "Totomachapan Zapotec",
	},
	zpi: {
		code: "zpi",
		name: "Santa María Quiegolani Zapotec",
	},
	zpj: {
		code: "zpj",
		name: "Quiavicuzas Zapotec",
	},
	zpk: {
		code: "zpk",
		name: "Tlacolulita Zapotec",
	},
	zpl: {
		code: "zpl",
		name: "Lachixío Zapotec",
	},
	zpm: {
		code: "zpm",
		name: "Mixtepec Zapotec",
	},
	zpn: {
		code: "zpn",
		name: "Santa Inés Yatzechi Zapotec",
	},
	zpo: {
		code: "zpo",
		name: "Amatlán Zapotec",
	},
	zpp: {
		code: "zpp",
		name: "El Alto Zapotec",
	},
	zpq: {
		code: "zpq",
		name: "Zoogocho Zapotec",
	},
	zpr: {
		code: "zpr",
		name: "Santiago Xanica Zapotec",
	},
	zps: {
		code: "zps",
		name: "Coatlán Zapotec",
	},
	zpt: {
		code: "zpt",
		name: "San Vicente Coatlán Zapotec",
	},
	zpu: {
		code: "zpu",
		name: "Yalálag Zapotec",
	},
	zpv: {
		code: "zpv",
		name: "Chichicapan Zapotec",
	},
	zpw: {
		code: "zpw",
		name: "Zaniza Zapotec",
	},
	zpx: {
		code: "zpx",
		name: "San Baltazar Loxicha Zapotec",
	},
	zpy: {
		code: "zpy",
		name: "Mazaltepec Zapotec",
	},
	zpz: {
		code: "zpz",
		name: "Texmelucan Zapotec",
	},
	zqe: {
		code: "zqe",
		name: "Qiubei Zhuang",
	},
	zra: {
		code: "zra",
		name: "Kara (Korea)",
	},
	zrg: {
		code: "zrg",
		name: "Mirgan",
	},
	zrn: {
		code: "zrn",
		name: "Zerenkel",
	},
	zro: {
		code: "zro",
		name: "Záparo",
	},
	zrp: {
		code: "zrp",
		name: "Zarphatic",
	},
	zrs: {
		code: "zrs",
		name: "Mairasi",
	},
	zsa: {
		code: "zsa",
		name: "Sarasira",
	},
	zsk: {
		code: "zsk",
		name: "Kaskean",
	},
	zsl: {
		code: "zsl",
		name: "Zambian Sign Language",
	},
	zsm: {
		code: "zsm",
		name: "Standard Malay",
	},
	zsr: {
		code: "zsr",
		name: "Southern Rincon Zapotec",
	},
	zsu: {
		code: "zsu",
		name: "Sukurum",
	},
	zte: {
		code: "zte",
		name: "Elotepec Zapotec",
	},
	ztg: {
		code: "ztg",
		name: "Xanaguía Zapotec",
	},
	ztl: {
		code: "ztl",
		name: "Lapaguía-Guivini Zapotec",
	},
	ztm: {
		code: "ztm",
		name: "San Agustín Mixtepec Zapotec",
	},
	ztn: {
		code: "ztn",
		name: "Santa Catarina Albarradas Zapotec",
	},
	ztp: {
		code: "ztp",
		name: "Loxicha Zapotec",
	},
	ztq: {
		code: "ztq",
		name: "Quioquitani-Quierí Zapotec",
	},
	zts: {
		code: "zts",
		name: "Tilquiapan Zapotec",
	},
	ztt: {
		code: "ztt",
		name: "Tejalapan Zapotec",
	},

	ztu: {
		code: "ztu",
		name: "Güilá Zapotec",
	},
	ztx: {
		code: "ztx",
		name: "Zaachila Zapotec",
	},
	zty: {
		code: "zty",
		name: "Yatee Zapotec",
	},
	zuh: {
		code: "zuh",
		name: "Tokano",
	},
	zul: {
		code: "zul",
		name: "Zulu",
	},
	zum: {
		code: "zum",
		name: "Kumzari",
	},
	zun: {
		code: "zun",
		name: "Zuni",
	},
	zuy: {
		code: "zuy",
		name: "Zumaya",
	},
	zwa: {
		code: "zwa",
		name: "Zay",
	},
	zxx: {
		code: "zxx",
		name: "No linguistic content",
	},
	zyb: {
		code: "zyb",
		name: "Yongbei Zhuang",
	},
	zyg: {
		code: "zyg",
		name: "Yang Zhuang",
	},
	zyj: {
		code: "zyj",
		name: "Youjiang Zhuang",
	},
	zyn: {
		code: "zyn",
		name: "Yongnan Zhuang",
	},
	zyp: {
		code: "zyp",
		name: "Zyphe Chin",
	},
	zza: {
		code: "zza",
		name: "Zaza",
	},
	zzj: {
		code: "zzj",
		name: "Zuojiang Zhuang",
	},
} satisfies Record<string, Language>;
