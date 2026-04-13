/**
 * Bible API Service
 * Supports both bible-api.com and bolls.life APIs
 */

import { EmbedBuilder } from "discord.js";

const BIBLE_API_BASE = "https://bible-api.com";
const BOLLS_API_BASE = "https://bolls.life";

// Book name to 3-letter code mapping for bolls.life
const bookToCode: Record<string, string> = {
  "genesis": "GEN",
  "exodus": "EXO",
  "leviticus": "LEV",
  "numbers": "NUM",
  "deuteronomy": "DEU",
  "joshua": "JOS",
  "judges": "JDG",
  "ruth": "RUT",
  "1 samuel": "1SA",
  "2 samuel": "2SA",
  "1 kings": "1KI",
  "2 kings": "2KI",
  "1 chronicles": "1CH",
  "2 chronicles": "2CH",
  "ezra": "EZR",
  "nehemiah": "NEH",
  "esther": "EST",
  "job": "JOB",
  "psalms": "PSA",
  "proverbs": "PRO",
  "ecclesiastes": "ECC",
  "song of solomon": "SOL",
  "isaiah": "ISA",
  "jeremiah": "JER",
  "lamentations": "LAM",
  "ezekiel": "EZK",
  "daniel": "DAN",
  "hosea": "HOS",
  "joel": "JOL",
  "amos": "AMO",
  "obadiah": "OBA",
  "jonah": "JON",
  "micah": "MIC",
  "nahum": "NAM",
  "habakkuk": "HAB",
  "zephaniah": "ZEP",
  "haggai": "HAG",
  "zechariah": "ZEC",
  "malachi": "MAL",
  "matthew": "MAT",
  "mark": "MRK",
  "luke": "LUK",
  "john": "JHN",
  "acts": "ACT",
  "romans": "ROM",
  "1 corinthians": "1CO",
  "2 corinthians": "2CO",
  "galatians": "GAL",
  "ephesians": "EPH",
  "philippians": "PHP",
  "colossians": "COL",
  "1 thessalonians": "1TH",
  "2 thessalonians": "2TH",
  "1 timothy": "1TI",
  "2 timothy": "2TI",
  "titus": "TIT",
  "philemon": "PHM",
  "hebrews": "HEB",
  "james": "JAS",
  "1 peter": "1PE",
  "2 peter": "2PE",
  "1 john": "1JN",
  "2 john": "2JN",
  "3 john": "3JN",
  "jude": "JUD",
  "revelation": "REV",

  // Deuterocanonical books
  "tobit": "TOB",
  "judith": "JDT",
  "wisdom": "WIS",
  "sirach": "SIR",
  "baruch": "BAR",
  "1 maccabees": "1MA",
  "2 maccabees": "2MA",
};

// 3-letter code to book ID mapping for bolls.life
const codeToId: Record<string, number> = {
  "GEN": 1,
  "EXO": 2,
  "LEV": 3,
  "NUM": 4,
  "DEU": 5,
  "JOS": 6,
  "JDG": 7,
  "RUT": 8,
  "1SA": 9,
  "2SA": 10,
  "1KI": 11,
  "2KI": 12,
  "1CH": 13,
  "2CH": 14,
  "EZR": 15,
  "NEH": 16,
  "EST": 17,
  "JOB": 18,
  "PSA": 19,
  "PRO": 20,
  "ECC": 21,
  "SOL": 22,
  "ISA": 23,
  "JER": 24,
  "LAM": 25,
  "EZK": 26,
  "DAN": 27,
  "HOS": 28,
  "JOL": 29,
  "AMO": 30,
  "OBA": 31,
  "JON": 32,
  "MIC": 33,
  "NAM": 34,
  "HAB": 35,
  "ZEP": 36,
  "HAG": 37,
  "ZEC": 38,
  "MAL": 39,
  "MAT": 40,
  "MRK": 41,
  "LUK": 42,
  "JHN": 43,
  "ACT": 44,
  "ROM": 45,
  "1CO": 46,
  "2CO": 47,
  "GAL": 48,
  "EPH": 49,
  "PHP": 50,
  "COL": 51,
  "1TH": 52,
  "2TH": 53,
  "1TI": 54,
  "2TI": 55,
  "TIT": 56,
  "PHM": 57,
  "HEB": 58,
  "JAS": 59,
  "1PE": 60,
  "2PE": 61,
  "1JN": 62,
  "2JN": 63,
  "3JN": 64,
  "JUD": 65,
  "REV": 66,

  // Deuterocanonical books
  "TOB": 68,
  "JDT": 69,
  "WIS": 70,
  "SIR": 71,
  "BAR": 73,
  "1MA": 74,
  "2MA": 75,
};

// bolls.life ONLY versions (not in bible-api.com)
const BOLLS_ONLY_VERSIONS = ["VULG", "WLC", "LXX", "SBLGNT", "BYZ", "MT", "TR"];

// Spanish versions (bolls.life only)
const SPANISH_VERSIONS = ["RV1960", "NVI", "NTV", "LBLA", "BTX3", "RV2004", "PDT"];

// Deuterocanonical book codes (only available on bolls.life with certain versions)
const DEUTEROCANONICAL_CODES = new Set(["TOB", "JDT", "WIS", "SIR", "BAR", "1MA", "2MA"]);

// Versions on bolls.life that include deuterocanonical books
const DEUTEROCANONICAL_VERSIONS = ["NRSVCE", "RSV2CE", "NABRE", "NJB1985", "CEVD", "CEB", "VULG", "LXX"];

// Latin book names for auto-detecting language from raw input
// Excludes books that have the same name in English (genesis, exodus, leviticus, ruth,
// esther, ecclesiastes, daniel, amos, nahum, baruch) — those default to English.
const LATIN_BOOK_NAMES = new Set([
  "numeri", "deuteronomium", "iosue", "iudicum",
  "i regum", "ii regum", "iii regum", "iv regum",
  "i paralipomenon", "ii paralipomenon", "esdrae", "nehemiae",
  "iob", "psalmi", "psalmus", "proverbia",
  "canticum canticorum", "isaias", "ieremias", "threni", "ezechiel",
  "osee", "ioel", "abdias", "ionas", "michaeas",
  "habacuc", "sophonias", "aggaeus", "zacharias", "malachias",
  "matthaeus", "marcus", "lucas", "ioannes", "joannes", "actus apostolorum",
  "ad romanos", "ad corinthios i", "ad corinthios ii",
  "ad galatas", "ad ephesios", "ad philippenses", "ad colossenses",
  "ad thessalonicenses i", "ad thessalonicenses ii",
  "ad timotheum i", "ad timotheum ii", "ad titum", "ad philemonem",
  "ad hebraeos", "iacobi", "petri i", "petri ii",
  "ioannis i", "ioannis ii", "ioannis iii", "iudae", "apocalypsis",
  "tobias", "iudith", "sapientia", "ecclesiasticus",
  "i machabaeorum", "ii machabaeorum",
]);

// Default Latin version when Latin book names are detected
const DEFAULT_LATIN_VERSION = "VULG";

// Default English version for deuterocanonical books when requested version lacks them
const DEFAULT_DEUTEROCANONICAL_VERSION = "NRSVCE";

// Default Spanish version when Spanish book names are detected
const DEFAULT_SPANISH_VERSION = "RV1960";

// Spanish book names for auto-detecting language from raw input
const SPANISH_BOOK_NAMES = new Set([
  "génesis", "éxodo", "exodo", "levítico", "levitico", "números", "numeros",
  "deuteronomio", "josué", "josue", "jueces", "1 reyes", "2 reyes",
  "1 crónicas", "1 cronicas", "2 crónicas", "2 cronicas", "esdras",
  "nehemías", "nehemias", "salmos", "salmo", "proverbios",
  "eclesiastés", "eclesiastes", "cantares", "cantar de los cantares",
  "isaías", "isaias", "jeremías", "jeremias", "lamentaciones", "ezequiel",
  "oseas", "abdías", "abdias", "jonás", "jonas", "miqueas", "nahúm",
  "habacuc", "sofonías", "sofonias", "hageo", "zacarías", "zacarias",
  "malaquías", "malaquias", "mateo", "marcos", "lucas", "juan", "hechos",
  "romanos", "1 corintios", "2 corintios", "gálatas", "galatas", "efesios",
  "filipenses", "colosenses", "1 tesalonicenses", "2 tesalonicenses",
  "1 timoteo", "2 timoteo", "filemón", "filemon", "hebreos", "santiago",
  "1 pedro", "2 pedro", "1 juan", "2 juan", "3 juan", "apocalipsis",
  "tobías", "judit", "sabiduría", "sabiduria", "eclesiástico", "eclesiastico",
  "1 macabeos", "2 macabeos",
]);

// Reverse mapping: English book name → Latin Vulgate display name
const ENGLISH_TO_LATIN_BOOK: Record<string, string> = {
  "genesis": "Genesis",
  "exodus": "Exodus",
  "leviticus": "Leviticus",
  "numbers": "Numeri",
  "deuteronomy": "Deuteronomium",
  "joshua": "Iosue",
  "judges": "Iudicum",
  "ruth": "Ruth",
  "1 samuel": "I Regum",
  "2 samuel": "II Regum",
  "1 kings": "III Regum",
  "2 kings": "IV Regum",
  "1 chronicles": "I Paralipomenon",
  "2 chronicles": "II Paralipomenon",
  "ezra": "Esdrae",
  "nehemiah": "Nehemiae",
  "esther": "Esther",
  "job": "Iob",
  "psalms": "Psalmi",
  "proverbs": "Proverbia",
  "ecclesiastes": "Ecclesiastes",
  "song of solomon": "Canticum Canticorum",
  "isaiah": "Isaias",
  "jeremiah": "Ieremias",
  "lamentations": "Threni",
  "ezekiel": "Ezechiel",
  "daniel": "Daniel",
  "hosea": "Osee",
  "joel": "Ioel",
  "amos": "Amos",
  "obadiah": "Abdias",
  "jonah": "Ionas",
  "micah": "Michaeas",
  "nahum": "Nahum",
  "habakkuk": "Habacuc",
  "zephaniah": "Sophonias",
  "haggai": "Aggaeus",
  "zechariah": "Zacharias",
  "malachi": "Malachias",
  "matthew": "Matthaeus",
  "mark": "Marcus",
  "luke": "Lucas",
  "john": "Ioannes",
  "acts": "Actus Apostolorum",
  "romans": "Ad Romanos",
  "1 corinthians": "Ad Corinthios I",
  "2 corinthians": "Ad Corinthios II",
  "galatians": "Ad Galatas",
  "ephesians": "Ad Ephesios",
  "philippians": "Ad Philippenses",
  "colossians": "Ad Colossenses",
  "1 thessalonians": "Ad Thessalonicenses I",
  "2 thessalonians": "Ad Thessalonicenses II",
  "1 timothy": "Ad Timotheum I",
  "2 timothy": "Ad Timotheum II",
  "titus": "Ad Titum",
  "philemon": "Ad Philemonem",
  "hebrews": "Ad Hebraeos",
  "james": "Iacobi",
  "1 peter": "Petri I",
  "2 peter": "Petri II",
  "1 john": "Ioannis I",
  "2 john": "Ioannis II",
  "3 john": "Ioannis III",
  "jude": "Iudae",
  "revelation": "Apocalypsis",
  "tobit": "Tobias",
  "judith": "Iudith",
  "wisdom": "Sapientia",
  "sirach": "Ecclesiasticus",
  "baruch": "Baruch",
  "1 maccabees": "I Machabaeorum",
  "2 maccabees": "II Machabaeorum",
};

// Reverse mapping: English book name → Spanish display name
const ENGLISH_TO_SPANISH_BOOK: Record<string, string> = {
  "genesis": "Génesis",
  "exodus": "Éxodo",
  "leviticus": "Levítico",
  "numbers": "Números",
  "deuteronomy": "Deuteronomio",
  "joshua": "Josué",
  "judges": "Jueces",
  "ruth": "Rut",
  "1 samuel": "1 Samuel",
  "2 samuel": "2 Samuel",
  "1 kings": "1 Reyes",
  "2 kings": "2 Reyes",
  "1 chronicles": "1 Crónicas",
  "2 chronicles": "2 Crónicas",
  "ezra": "Esdras",
  "nehemiah": "Nehemías",
  "esther": "Ester",
  "job": "Job",
  "psalms": "Salmos",
  "proverbs": "Proverbios",
  "ecclesiastes": "Eclesiastés",
  "song of solomon": "Cantares",
  "isaiah": "Isaías",
  "jeremiah": "Jeremías",
  "lamentations": "Lamentaciones",
  "ezekiel": "Ezequiel",
  "daniel": "Daniel",
  "hosea": "Oseas",
  "joel": "Joel",
  "amos": "Amós",
  "obadiah": "Abdías",
  "jonah": "Jonás",
  "micah": "Miqueas",
  "nahum": "Nahúm",
  "habakkuk": "Habacuc",
  "zephaniah": "Sofonías",
  "haggai": "Hageo",
  "zechariah": "Zacarías",
  "malachi": "Malaquías",
  "matthew": "Mateo",
  "mark": "Marcos",
  "luke": "Lucas",
  "john": "Juan",
  "acts": "Hechos",
  "romans": "Romanos",
  "1 corinthians": "1 Corintios",
  "2 corinthians": "2 Corintios",
  "galatians": "Gálatas",
  "ephesians": "Efesios",
  "philippians": "Filipenses",
  "colossians": "Colosenses",
  "1 thessalonians": "1 Tesalonicenses",
  "2 thessalonians": "2 Tesalonicenses",
  "1 timothy": "1 Timoteo",
  "2 timothy": "2 Timoteo",
  "titus": "Tito",
  "philemon": "Filemón",
  "hebrews": "Hebreos",
  "james": "Santiago",
  "1 peter": "1 Pedro",
  "2 peter": "2 Pedro",
  "1 john": "1 Juan",
  "2 john": "2 Juan",
  "3 john": "3 Juan",
  "jude": "Judas",
  "revelation": "Apocalipsis",
  "tobit": "Tobías",
  "judith": "Judit",
  "wisdom": "Sabiduría",
  "sirach": "Eclesiástico",
  "baruch": "Baruc",
  "1 maccabees": "1 Macabeos",
  "2 maccabees": "2 Macabeos",
};

// bible-api.com versions
const BIBLE_API_VERSIONS = ["KJV", "WEB", "BBE", "DRB", "WMB", "WMBBE"];

// Abbreviation to full book name mapping for parseReference
const ABBREVIATION_MAP: Record<string, string> = {
  // Pentateuch
  "genesis": "genesis",
  "gen": "genesis",
  "exodus": "exodus",
  "exod": "exodus",
  "ex": "exodus",
  "leviticus": "leviticus",
  "lev": "leviticus",
  "numbers": "numbers",
  "num": "numbers",
  "nu": "numbers",
  "deuteronomy": "deuteronomy",
  "deut": "deuteronomy",

  // Historical books
  "joshua": "joshua",
  "josh": "joshua",
  "judges": "judges",
  "judg": "judges",
  "ruth": "ruth",
  "1 samuel": "1 samuel",
  "1 sam": "1 samuel",
  "2 samuel": "2 samuel",
  "2 sam": "2 samuel",
  "1 kings": "1 kings",
  "1 ki": "1 kings",
  "1 king": "1 kings",
  "2 kings": "2 kings",
  "2 ki": "2 kings",
  "2 king": "2 kings",
  "1 chronicles": "1 chronicles",
  "1 ch": "1 chronicles",
  "1 chron": "1 chronicles",
  "2 chronicles": "2 chronicles",
  "2 ch": "2 chronicles",
  "2 chron": "2 chronicles",
  "ezra": "ezra",
  "nehemiah": "nehemiah",
  "neh": "nehemiah",
  "esther": "esther",
  "est": "esther",

  // Wisdom/Poetry
  "job": "job",
  "psalms": "psalms",
  "psalm": "psalms",
  "ps": "psalms",
  "proverbs": "proverbs",
  "prov": "proverbs",
  "ecclesiastes": "ecclesiastes",
  "eccl": "ecclesiastes",
  "ecc": "ecclesiastes",
  "song of solomon": "song of solomon",
  "song of songs": "song of solomon",

  // Major Prophets
  "isaiah": "isaiah",
  "isa": "isaiah",
  "jeremiah": "jeremiah",
  "jer": "jeremiah",
  "lamentations": "lamentations",
  "lam": "lamentations",
  "ezekiel": "ezekiel",
  "ezek": "ezekiel",
  "daniel": "daniel",
  "dan": "daniel",

  // Minor Prophets
  "hosea": "hosea",
  "hos": "hosea",
  "joel": "joel",
  "amos": "amos",
  "obadiah": "obadiah",
  "obad": "obadiah",
  "jonah": "jonah",
  "jon": "jonah",
  "micah": "micah",
  "mic": "micah",
  "nahum": "nahum",
  "nah": "nahum",
  "habakkuk": "habakkuk",
  "hab": "habakkuk",
  "zephaniah": "zephaniah",
  "zeph": "zephaniah",
  "haggai": "haggai",
  "hag": "haggai",
  "zechariah": "zechariah",
  "zech": "zechariah",
  "malachi": "malachi",
  "mal": "malachi",

  // Gospels
  "matthew": "matthew",
  "matt": "matthew",
  "mark": "mark",
  "luke": "luke",
  "john": "john",
  "ioannes": "john",
  "joannes": "john",

  // Latin Vulgate book names
  "numeri": "numbers",
  "deuteronomium": "deuteronomy",
  "iosue": "joshua",
  "iudicum": "judges",
  "i regum": "1 samuel",
  "ii regum": "2 samuel",
  "iii regum": "1 kings",
  "iv regum": "2 kings",
  "i paralipomenon": "1 chronicles",
  "ii paralipomenon": "2 chronicles",
  "esdrae": "ezra",
  "nehemiae": "nehemiah",
  "iob": "job",
  "psalmi": "psalms",
  "psalmus": "psalms",
  "psalmos": "psalms",
  "proverbia": "proverbs",
  "canticum canticorum": "song of solomon",
  "ieremias": "jeremiah",
  "threni": "lamentations",
  "ezechiel": "ezekiel",
  "osee": "hosea",
  "ioel": "joel",
  "ionas": "jonah",
  "michaeas": "micah",
  "sophonias": "zephaniah",
  "aggaeus": "haggai",
  "zacharias": "zechariah",
  "malachias": "malachi",
  "matthaeus": "matthew",
  "marcus": "mark",
  "actus apostolorum": "acts",
  "ad romanos": "romans",
  "ad corinthios i": "1 corinthians",
  "ad corinthios ii": "2 corinthians",
  "ad galatas": "galatians",
  "ad ephesios": "ephesians",
  "ad philippenses": "philippians",
  "ad colossenses": "colossians",
  "ad thessalonicenses i": "1 thessalonians",
  "ad thessalonicenses ii": "2 thessalonians",
  "ad timotheum i": "1 timothy",
  "ad timotheum ii": "2 timothy",
  "ad titum": "titus",
  "ad philemonem": "philemon",
  "ad hebraeos": "hebrews",
  "iacobi": "james",
  "petri i": "1 peter",
  "petri ii": "2 peter",
  "ioannis i": "1 john",
  "ioannis ii": "2 john",
  "ioannis iii": "3 john",
  "iudae": "jude",
  "apocalypsis": "revelation",
  "iudith": "judith",
  "sapientia": "wisdom",
  "i machabaeorum": "1 maccabees",
  "ii machabaeorum": "2 maccabees",

  // Church History
  "acts": "acts",
  "act": "acts",

  // Pauline Epistles
  "romans": "romans",
  "rom": "romans",
  "1 corinthians": "1 corinthians",
  "1 corinth": "1 corinthians",
  "1 cor": "1 corinthians",
  "2 corinthians": "2 corinthians",
  "2 corinth": "2 corinthians",
  "2 cor": "2 corinthians",
  "galatians": "galatians",
  "gal": "galatians",
  "ephesians": "ephesians",
  "eph": "ephesians",
  "philippians": "philippians",
  "phil": "philippians",
  "colossians": "colossians",
  "col": "colossians",
  "1 thessalonians": "1 thessalonians",
  "1 thes": "1 thessalonians",
  "2 thessalonians": "2 thessalonians",
  "2 thes": "2 thessalonians",
  "1 timothy": "1 timothy",
  "1 tim": "1 timothy",
  "2 timothy": "2 timothy",
  "2 tim": "2 timothy",
  "titus": "titus",
  "philemon": "philemon",
  "phlm": "philemon",

  // General Epistles
  "hebrews": "hebrews",
  "heb": "hebrews",
  "james": "james",
  "jas": "james",
  "1 peter": "1 peter",
  "1 pet": "1 peter",
  "2 peter": "2 peter",
  "2 pet": "2 peter",
  "1 john": "1 john",
  "1 jn": "1 john",
  "2 john": "2 john",
  "2 jn": "2 john",
  "3 john": "3 john",
  "3 jn": "3 john",
  "jude": "jude",

  // Prophecy
  "revelation": "revelation",
  "rev": "revelation",

  // Deuterocanonical books
  "tobit": "tobit",
  "tob": "tobit",
  "tobias": "tobit",
  "judith": "judith",
  "jdt": "judith",
  "wisdom": "wisdom",
  "wisdom of solomon": "wisdom",
  "wis": "wisdom",
  "sirach": "sirach",
  "ecclesiasticus": "sirach",
  "sir": "sirach",
  "baruch": "baruch",
  "bar": "baruch",
  "1 maccabees": "1 maccabees",
  "1 macc": "1 maccabees",
  "1 mac": "1 maccabees",
  "2 maccabees": "2 maccabees",
  "2 macc": "2 maccabees",
  "2 mac": "2 maccabees",

  // Spanish book names (excluding duplicates with English entries above)
  "génesis": "genesis",
  "éxodo": "exodus",
  "exodo": "exodus",
  "levítico": "leviticus",
  "levitico": "leviticus",
  "números": "numbers",
  "numeros": "numbers",
  "deuteronomio": "deuteronomy",
  "josué": "joshua",
  "josue": "joshua",
  "jueces": "judges",
  "1 reyes": "1 kings",
  "2 reyes": "2 kings",
  "1 crónicas": "1 chronicles",
  "1 cronicas": "1 chronicles",
  "2 crónicas": "2 chronicles",
  "2 cronicas": "2 chronicles",
  "esdras": "ezra",
  "nehemías": "nehemiah",
  "nehemias": "nehemiah",
  "ester": "esther",
  "salmos": "psalms",
  "salmo": "psalms",
  "sal": "psalms",
  "proverbios": "proverbs",
  "eclesiastés": "ecclesiastes",
  "eclesiastes": "ecclesiastes",
  "cantares": "song of solomon",
  "cantar de los cantares": "song of solomon",
  "isaías": "isaiah",
  "isaias": "isaiah",
  "jeremías": "jeremiah",
  "jeremias": "jeremiah",
  "lamentaciones": "lamentations",
  "ezequiel": "ezekiel",
  "oseas": "hosea",
  "abdías": "obadiah",
  "abdias": "obadiah",
  "jonás": "jonah",
  "jonas": "jonah",
  "miqueas": "micah",
  "nahúm": "nahum",
  "habacuc": "habakkuk",
  "sofonías": "zephaniah",
  "sofonias": "zephaniah",
  "hageo": "haggai",
  "zacarías": "zechariah",
  "zacarias": "zechariah",
  "malaquías": "malachi",
  "malaquias": "malachi",
  "mateo": "matthew",
  "marcos": "mark",
  "lucas": "luke",
  "juan": "john",
  "hechos": "acts",
  "romanos": "romans",
  "1 corintios": "1 corinthians",
  "2 corintios": "2 corinthians",
  "gálatas": "galatians",
  "galatas": "galatians",
  "efesios": "ephesians",
  "filipenses": "philippians",
  "colosenses": "colossians",
  "1 tesalonicenses": "1 thessalonians",
  "2 tesalonicenses": "2 thessalonians",
  "1 timoteo": "1 timothy",
  "2 timoteo": "2 timothy",
  "tito": "titus",
  "filemón": "philemon",
  "filemon": "philemon",
  "hebreos": "hebrews",
  "santiago": "james",
  "1 pedro": "1 peter",
  "2 pedro": "2 peter",
  "1 juan": "1 john",
  "2 juan": "2 john",
  "3 juan": "3 john",
  "judas": "jude",
  "apocalipsis": "revelation",

  // Spanish deuterocanonical
  "tobías": "tobit",
  "judit": "judith",
  "sabiduría": "wisdom",
  "sabiduria": "wisdom",
  "eclesiástico": "sirach",
  "eclesiastico": "sirach",
  "1 macabeos": "1 maccabees",
  "2 macabeos": "2 maccabees",
};

/**
 * Normalize a book name from abbreviations or partial names to the full canonical name
 */
function normalizeBookName(bookName: string): string {
  const normalized = bookName.toLowerCase().trim();
  
  if (ABBREVIATION_MAP[normalized]) {
    return ABBREVIATION_MAP[normalized];
  }
  
  // Try prefix matching for partial book names
  const candidates = Object.entries(ABBREVIATION_MAP)
    .filter(([abbrev, full]) => full.startsWith(normalized) || abbrev.startsWith(normalized))
    .map(([_, full]) => full);
  
  if (candidates.length === 1) {
    return candidates[0];
  }
  
  if (candidates.length > 1) {
    const sortedCandidates = candidates.sort((a, b) => {
      const aMinAbbrev = Math.min(...Object.entries(ABBREVIATION_MAP)
        .filter(([_, full]) => full === a)
        .map(([abbrev, _]) => abbrev.length));
      const bMinAbbrev = Math.min(...Object.entries(ABBREVIATION_MAP)
        .filter(([_, full]) => full === b)
        .map(([abbrev, _]) => abbrev.length));
      return aMinAbbrev - bMinAbbrev;
    });
    return sortedCandidates[0];
  }
  
  // No match found, return the original with proper casing
  // Use title case for consistency
  return bookName.trim().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  reference: string;
}

export interface BibleBook {
  name: string;
  testaments: "Old Testament" | "New Testament";
  chapters: number;
}

export class BibleService {
  private defaultVersion: string;

  constructor(defaultVersion: string = "KJV") {
    this.defaultVersion = defaultVersion;
  }

  /**
   * Detect if a raw reference string uses a Spanish book name.
   * Returns the default Spanish version if so, otherwise undefined.
   */
  detectSpanishDefault(reference: string): string | undefined {
    // Strip chapter:verse from the end to get just the book name
    const bookPart = reference.replace(/\s+\d+.*$/, "").toLowerCase().trim();
    if (SPANISH_BOOK_NAMES.has(bookPart)) {
      return DEFAULT_SPANISH_VERSION;
    }
    return undefined;
  }

  /**
   * Detect if a raw reference string uses a Latin book name.
   * Returns the default Latin version if so, otherwise undefined.
   * Books with the same name in English and Latin default to English.
   */
  detectLatinDefault(reference: string): string | undefined {
    // Strip chapter:verse from the end to get just the book name
    const bookPart = reference.replace(/\s+\d+.*$/, "").toLowerCase().trim();
    if (LATIN_BOOK_NAMES.has(bookPart)) {
      return DEFAULT_LATIN_VERSION;
    }
    return undefined;
  }

  /**
   * Determine which API to use based on version
   * bolls.life ONLY for original languages and Latin
   * bible-api.com for English translations
   */
  private getApiForVersion(version: string): "bible-api" | "bolls" {
    if (BOLLS_ONLY_VERSIONS.includes(version) || SPANISH_VERSIONS.includes(version)) {
      return "bolls";
    }
    return "bible-api";
  }

  /**
   * Get a specific verse or range of verses
   */
  async getVerses(
    book: string,
    chapter: number,
    verseStart?: number,
    verseEnd?: number,
    version?: string,
  ): Promise<BibleVerse[]> {
    let v = version || this.defaultVersion;

    const api = this.getApiForVersion(v);

    // For bolls-only versions, check if deuterocanonical book is supported
    if (api === "bolls") {
      const bookCode = bookToCode[book.toLowerCase()];
      if (bookCode && DEUTEROCANONICAL_CODES.has(bookCode) && !DEUTEROCANONICAL_VERSIONS.includes(v)) {
        // Spanish versions don't have deuterocanonical books on bolls.life
        // Fall back to Latin Vulgate (closer to Spanish than English, actual Catholic source)
        if (SPANISH_VERSIONS.includes(v)) {
          v = "VULG";
        } else {
          // Other non-deuterocanonical versions fall back to English NRSVCE
          v = DEFAULT_DEUTEROCANONICAL_VERSION;
        }
      }
      return this.getVersesFromBolls(book, chapter, verseStart, verseEnd, v);
    }
    // bible-api.com versions (KJV, etc.) already include deuterocanonical books
    return this.getVersesFromBibleApi(book, chapter, verseStart, verseEnd, v);
  }

  /**
   * Fetch from bible-api.com
   */
  private async getVersesFromBibleApi(
    book: string,
    chapter: number,
    verseStart?: number,
    verseEnd?: number,
    version?: string,
  ): Promise<BibleVerse[]> {
    const v = version || this.defaultVersion;
    let reference: string;
    if (verseStart === undefined) {
      reference = `${book} ${chapter}`;
    } else {
      const verseRange = verseEnd ? `${verseStart}-${verseEnd}` : `${verseStart}`;
      reference = `${book} ${chapter}:${verseRange}`;
    }

    const url = `${BIBLE_API_BASE}/${encodeURIComponent(reference)}?translation=${
      encodeURIComponent(v)
    }`;

    console.log(`[BibleAPI] Fetching: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      await response.body?.cancel();
      console.error(`[BibleAPI] HTTP error: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        throw new Error(`Verse not found: ${reference} (${v})`);
      }
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    console.log(`[BibleAPI] Response:`, JSON.stringify(data).slice(0, 500));

    if (data.error) {
      console.error(`[BibleAPI] API error:`, data.error);
      throw new Error(data.error);
    }

    if (data.errors && data.errors.length > 0) {
      console.error(`[BibleAPI] API errors:`, data.errors);
      throw new Error(data.errors.join(", "));
    }

    if (!data.verses || !Array.isArray(data.verses)) {
      console.error(`[BibleAPI] Invalid response structure:`, data);
      throw new Error("Invalid API response: verses array missing");
    }

    const apiVersion = data.translation_id?.toUpperCase() || v;

    try {
      return data.verses.map((verse: any) => ({
        book: verse.book_name,
        chapter: verse.chapter,
        verse: verse.verse,
        text: this.cleanText(verse.text),
        version: apiVersion,
        reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
      }));
    } catch (error) {
      console.error(
        `[BibleAPI] Error processing verses:`,
        error instanceof Error ? error.message : error,
      );
      console.error(`[BibleAPI] Problematic data:`, JSON.stringify(data).slice(0, 1000));
      throw error;
    }
  }

  /**
   * Fetch from bolls.life
   */
  private async getVersesFromBolls(
    book: string,
    chapter: number,
    verseStart?: number,
    verseEnd?: number,
    version?: string,
  ): Promise<BibleVerse[]> {
    const v = version || this.defaultVersion;
    const bookCode = bookToCode[book.toLowerCase()];

    if (!bookCode) {
      throw new Error(`Unknown book: ${book}`);
    }

    const bookId = codeToId[bookCode];
    if (!bookId) {
      throw new Error(`Unknown book code: ${bookCode}`);
    }

    const url = `${BOLLS_API_BASE}/get-chapter/${v}/${bookId}/${chapter}/`;

    console.log(`[BollsAPI] Fetching: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      credentials: "omit",
    });

    if (!response.ok) {
      await response.body?.cancel();
      console.error(`[BollsAPI] HTTP error: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        throw new Error(`Chapter not found: ${book} ${chapter} (${v})`);
      }
      throw new Error(`Bolls API error: ${response.status} ${response.statusText}`);
    }

    const data: any[] = await response.json();
    console.log(`[BollsAPI] Response: ${data.length} verses`);

    // bolls.life returns a flat array of verses — filter if specific verses requested
    let filteredVerses: any[];
    if (verseStart === undefined) {
      filteredVerses = data;
    } else {
      filteredVerses = data.filter(
        (verse: any) =>
          verse.verse >= verseStart &&
          (verseEnd === undefined ? verse.verse === verseStart : verse.verse <= verseEnd),
      );
    }

    if (filteredVerses.length === 0) {
      const verseRef = verseStart !== undefined
        ? `${chapter}:${verseStart}${verseEnd ? `-${verseEnd}` : ""}`
        : `${chapter}`;
      console.error(`[BollsAPI] No verses found for ${book} ${verseRef}`);
      throw new Error(`No verses found for ${book} ${verseRef}`);
    }

    // Get book name from first verse (bolls.life doesn't return book_name, so title-case the input)
    const bookName = filteredVerses[0].book_name ||
      book.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    return filteredVerses.map((verse: any) => ({
      book: bookName,
      chapter: chapter,
      verse: verse.verse,
      text: this.cleanText(verse.text),
      version: v,
      reference: `${bookName} ${chapter}:${verse.verse}`,
    }));
  }

  /**
   * Clean HTML tags and normalize whitespace from verse text
   */
  private cleanText(text: string): string {
    if (!text) return "";
    return text
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/[\n\r]+/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Normalize multiple spaces to single
      .trim();
  }

  /**
   * Get verse of the day
   */
  async getVerseOfTheDay(): Promise<BibleVerse> {
    const today = new Date();
    const dayOfYear = this.getDayOfYear(today);

    const verses = [
      { book: "john", chapter: 3, verse: 16 },
      { book: "psalms", chapter: 23, verse: 1 },
      { book: "philippians", chapter: 4, verse: 13 },
      { book: "jeremiah", chapter: 29, verse: 11 },
      { book: "isaiah", chapter: 40, verse: 31 },
      { book: "psalms", chapter: 46, verse: 1 },
      { book: "matthew", chapter: 11, verse: 28 },
      { book: "romans", chapter: 8, verse: 28 },
      { book: "joshua", chapter: 1, verse: 9 },
      { book: "psalms", chapter: 119, verse: 105 },
      { book: "1 corinthians", chapter: 16, verse: 14 },
      { book: "proverbs", chapter: 3, verse: 5 },
      { book: "galatians", chapter: 5, verse: 22 },
      { book: "ephesians", chapter: 2, verse: 8 },
      { book: "psalms", chapter: 34, verse: 8 },
      { book: "2 corinthians", chapter: 5, verse: 17 },
      { book: "1 peter", chapter: 5, verse: 7 },
      { book: "hebrews", chapter: 11, verse: 1 },
      { book: "james", chapter: 1, verse: 5 },
      { book: "1 john", chapter: 4, verse: 19 },
      { book: "psalms", chapter: 19, verse: 14 },
      { book: "colossians", chapter: 3, verse: 23 },
      { book: "1 thessalonians", chapter: 5, verse: 16 },
      { book: "titus", chapter: 3, verse: 5 },
      { book: "1 john", chapter: 1, verse: 9 },
      { book: "psalms", chapter: 27, verse: 1 },
      { book: "isaiah", chapter: 41, verse: 10 },
      { book: "matthew", chapter: 6, verse: 33 },
      { book: "luke", chapter: 1, verse: 37 },
      { book: "romans", chapter: 12, verse: 2 },
    ];

    const selectedVerse = verses[dayOfYear % verses.length];

    const verses_result = await this.getVerses(
      selectedVerse.book,
      selectedVerse.chapter,
      selectedVerse.verse,
    );

    return verses_result[0];
  }

  /**
   * Search for verses (not supported by either API)
   */
  async search(text: string, version?: string): Promise<BibleVerse[]> {
    throw new Error(
      "Text search is not available. Please use specific verse references instead.",
    );
  }

  /**
   * Get all available Bible versions from both APIs
   */
  async getVersions(): Promise<string[]> {
    return [...BIBLE_API_VERSIONS, ...BOLLS_ONLY_VERSIONS, ...SPANISH_VERSIONS].filter((v, i, a) => a.indexOf(v) === i);
  }

  /**
   * Format verses into a display string
   * Discord has a 2000 character limit, so we truncate if needed
   */
  formatVerses(verses: BibleVerse[], maxCharacters: number = 2000, displayVersion?: string): string {
    if (verses.length === 0) return "";

    const version = verses[0].version;
    const reference = this.formatReference(verses, displayVersion);
    const fullText = verses.map((v) => v.text).join(" ");

    // Build the full message to check length
    const fullMessage = `📖 ${fullText}\n\n*${reference} (${version})*`;

    // If within limit, return as-is
    if (fullMessage.length <= maxCharacters) {
      return fullMessage;
    }

    // Truncate and add ellipsis with note
    const header = `📖 `;
    const footer = `\n\n*${reference} (${version})*`;
    const note = "\n\n*(Passage truncated due to Discord's 2000 character limit)*";
    const reservedLength = header.length + footer.length + note.length + 3; // +3 for "..."

    const maxTextLength = maxCharacters - reservedLength;
    const truncatedText = fullText.slice(0, maxTextLength).trim() + "...";

    return header + truncatedText + footer + note;
  }

  /**
   * Create a Discord embed for verses
   */
  createVerseEmbed(verses: BibleVerse[], title?: string, displayVersion?: string): EmbedBuilder {
    if (verses.length === 0) {
      return new EmbedBuilder().setColor(0x5865F2).setDescription("No verses found.");
    }

    const version = verses[0].version;
    const reference = this.formatReference(verses, displayVersion);
    let fullText = verses.map((v) => v.text).join(" ");

    // Version display names
    const versionNames: Record<string, string> = {
      "KJV": "King James Version",
      "WEB": "World English Bible",
      "BBE": "Bible in Basic English",
      "DRB": "Douay-Rheims Bible",
      "WMB": "World Messianic Bible",
      "WMBBE": "WMB British Edition",
      "VULG": "Latin Vulgate",
      "WLC": "Westminster Leningrad Codex",
      "LXX": "Septuagint",
      "SBLGNT": "SBL Greek New Testament",
      "BYZ": "Byzantine Textform",
      "MT": "Masoretic Text",
      "TR": "Textus Receptus",
      "NRSVCE": "New Revised Standard Version Catholic Edition",
      "RSV2CE": "Revised Standard Version 2nd Catholic Edition",
      "NABRE": "New American Bible Revised Edition",
      "RV1960": "Reina-Valera 1960",
      "NVI": "Nueva Versión Internacional",
      "NTV": "Nueva Traducción Viviente",
      "LBLA": "La Biblia de las Américas",
      "BTX3": "La Biblia Textual 3ra Edición",
      "RV2004": "Reina Valera Gómez 2004",
      "PDT": "Palabra de Dios para Todos",
    };

    const versionDisplayName = (displayVersion && SPANISH_VERSIONS.includes(displayVersion) && version === "VULG")
      ? "Vulgata Latina"
      : (versionNames[version] || version);
    const embedTitle = title ? `${title}` : `${reference}`;

    // Discord embed description limit is 4096 characters
    const MAX_DESCRIPTION_LENGTH = 4096;
    const footerText = `${reference} - ${versionDisplayName}`;
    let wasTruncated = false;

    // Check if we need to truncate
    if (fullText.length > MAX_DESCRIPTION_LENGTH - 100) {
      // Reserve space for footer notice
      fullText = fullText.slice(0, MAX_DESCRIPTION_LENGTH - 100).trim() + "...";
      wasTruncated = true;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(embedTitle)
      .setDescription(fullText)
      .setFooter({
        text: wasTruncated
          ? `${footerText} (Chapter truncated due to Discord's limit)`
          : footerText,
      });

    return embed;
  }

  /**
   * Get the display name for a book, localized to the version's language.
   * If displayVersion is provided, use it instead of the verse version for localization.
   */
  private getBookDisplayName(book: string, version: string, displayVersion?: string): string {
    const effectiveVersion = displayVersion || version;
    if (SPANISH_VERSIONS.includes(effectiveVersion)) {
      return ENGLISH_TO_SPANISH_BOOK[book.toLowerCase()] || book;
    }
    if (effectiveVersion === "VULG") {
      return ENGLISH_TO_LATIN_BOOK[book.toLowerCase()] || book;
    }
    // Title-case for English versions
    return book.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  /**
   * Format a reference string from verses
   */
  private formatReference(verses: BibleVerse[], displayVersion?: string): string {
    if (verses.length === 0) return "";
    const version = verses[0].version;
    const first = verses[0];
    const last = verses[verses.length - 1];
    const firstBook = this.getBookDisplayName(first.book, version, displayVersion);
    const lastBook = first.book === last.book ? firstBook : this.getBookDisplayName(last.book, version, displayVersion);

    if (verses.length === 1) {
      return `${firstBook} ${first.chapter}:${first.verse}`;
    }

    if (first.book === last.book && first.chapter === last.chapter) {
      return `${firstBook} ${first.chapter}:${first.verse}-${last.verse}`;
    }

    return `${firstBook} ${first.chapter}:${first.verse} - ${lastBook} ${last.chapter}:${last.verse}`;
  }

  /**
   * Get day of year (1-366)
   */
  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * Parse a verse reference string
   */
  parseReference(ref: string): {
    book: string;
    chapter: number;
    verseStart?: number;
    verseEnd?: number;
  } | null {
    // Patterns with verse numbers: "John 3:16", "John 3:16-18", "John 3 16-18"
    const versePatterns = [
      /^([123]?\s?[\p{L}]+(?:\s+(?:of|de\s+los)\s+[\p{L}]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/u,
      /^([123]?\s?[\p{L}]+)\s+(\d+)\s+(\d+)(?:-(\d+))?$/u,
    ];

    for (const pattern of versePatterns) {
      const match = ref.match(pattern);
      if (match) {
        const [, book, chapter, verseStart, verseEnd] = match;
        return {
          book: normalizeBookName(book.trim()),
          chapter: parseInt(chapter),
          verseStart: parseInt(verseStart),
          verseEnd: verseEnd ? parseInt(verseEnd) : undefined,
        };
      }
    }

    // Chapter-only pattern: "John 3", "Psalm 23", "1 John 3"
    const chapterPattern = /^([123]?\s?[\p{L}]+(?:\s+(?:of|de\s+los)\s+[\p{L}]+)?)\s+(\d+)$/u;
    const chapterMatch = ref.match(chapterPattern);
    if (chapterMatch) {
      const [, book, chapter] = chapterMatch;
      return {
        book: normalizeBookName(book.trim()),
        chapter: parseInt(chapter),
      };
    }

    return null;
  }
}
