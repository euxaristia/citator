/**
 * Message Handler for Automatic Verse Detection
 * Detects and responds to Bible verse references in chat messages
 */

import { Message } from "npm:discord.js";
import { BibleService, BibleVerse } from "./bible.ts";

// Regex patterns for Bible references
// Matches formats like: John 3:16, Psalm 23:1-6, 1 John 3:16, 2 Corinthians 5:17, Song of Solomon 2:3, John 3
const VERSE_PATTERNS = [
  // With verse: Book Chapter:Verse[-End]
  /(?:^|[\s\n\(\[])((?:1|2|3)\s+)?([\p{L}]+(?:\s+(?:of|de\s+los)\s+[\p{L}]+)?)(\s+)(\d+)[:;](\d+)(?:-(\d+))?([\s\n\)\],\.]|$)/giu,
];

// Chapter-only pattern: Book Chapter (no colon/verse)
const CHAPTER_PATTERN =
  /(?:^|[\s\n\(\[])((?:1|2|3)\s+)?([\p{L}]+(?:\s+(?:of|de\s+los)\s+[\p{L}]+)?)(\s+)(\d+)([\s\n\)\],\.]|$)/giu;

// Books that contain "of" in their name
const BOOKS_WITH_OF = ["song of solomon", "song of songs", "wisdom of solomon"];

// Spanish book names for auto-detecting language
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

const DEFAULT_LATIN_VERSION = "VULG";

const DEFAULT_SPANISH_VERSION = "RV1960";

// Abbreviation to full book name mapping
// This handles common abbreviations and partial matches
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
  "tobias": "tobias",
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

  // Spanish book names
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
  "rut": "ruth",
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
 * Returns the normalized name or the original if no mapping exists
 */
function normalizeBookName(bookName: string): string {
  const normalized = bookName.toLowerCase().trim();
  
  // Direct match in abbreviation map
  if (ABBREVIATION_MAP[normalized]) {
    return ABBREVIATION_MAP[normalized];
  }
  
  // Try prefix matching for partial book names
  // e.g., "1 corinth" should match "1 corinthians"
  const candidates = Object.entries(ABBREVIATION_MAP)
    .filter(([abbrev, full]) => full.startsWith(normalized) || abbrev.startsWith(normalized))
    .map(([abbrev, full]) => full);
  
  // If we have exactly one candidate, use it
  if (candidates.length === 1) {
    return candidates[0];
  }
  
  // If we have multiple candidates, prefer the shortest abbreviation
  if (candidates.length > 1) {
    const sortedCandidates = candidates.sort((a, b) => {
      const aMinAbbrev = Object.entries(ABBREVIATION_MAP)
        .filter(([_, full]) => full === a)[0][0].length;
      const bMinAbbrev = Object.entries(ABBREVIATION_MAP)
        .filter(([_, full]) => full === b)[0][0].length;
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

// Version keyword patterns for detecting Bible version from message
// Maps common user-friendly terms to actual version codes
const VERSION_KEYWORDS: Record<string, string> = {
  // Greek New Testament versions
  "greek nt": "SBLGNT",
  "greek new testament": "SBLGNT",
  "sblgnt": "SBLGNT",
  "sbl": "SBLGNT",
  "byz": "BYZ",
  "byzantine": "BYZ",
  "byzantine textform": "BYZ",
  "textus receptus": "TR",
  "tr": "TR",
  "greek": "SBLGNT", // Default Greek

  // Hebrew/Old Testament versions
  "hebrew": "MT",
  "hebrew ot": "MT",
  "old testament hebrew": "MT",
  "masoretic": "MT",
  "masoretic text": "MT",
  "wlc": "WLC",
  "westminster": "WLC",

  // Latin versions
  "latin": "VULG",
  "vulgate": "VULG",
  "latin vulgate": "VULG",
  "vulg": "VULG",

  // English versions (common ones)
  "kjv": "KJV",
  "king james": "KJV",
  "king james version": "KJV",
  "niv": "NIV",
  "new international": "NIV",
  "new international version": "NIV",
  "esv": "ESV",
  "english standard": "ESV",
  "english standard version": "ESV",
  "nasb": "NASB",
  "new american standard": "NASB",
  "csb": "CSB",
  "christian standard": "CSB",
  "christian standard bible": "CSB",
  "web": "WEB",
  "world english": "WEB",
  "bbe": "BBE",
  "basic english": "BBE",
  "drb": "DRB",
  "douay rheims": "DRB",
  "wmb": "WMB",
  "wmbbe": "WMBBE",

  // Septuagint
  "lxx": "LXX",
  "septuagint": "LXX",

  // Spanish versions
  "rv1960": "RV1960",
  "reina valera": "RV1960",
  "reina-valera": "RV1960",
  "reina valera 1960": "RV1960",
  "nvi": "NVI",
  "nueva versión internacional": "NVI",
  "nueva version internacional": "NVI",
  "ntv": "NTV",
  "nueva traducción viviente": "NTV",
  "nueva traduccion viviente": "NTV",
  "lbla": "LBLA",
  "la biblia de las américas": "LBLA",
  "la biblia de las americas": "LBLA",
  "btx3": "BTX3",
  "biblia textual": "BTX3",
  "rv2004": "RV2004",
  "reina valera gómez": "RV2004",
  "reina valera gomez": "RV2004",
  "pdt": "PDT",
  "palabra de dios": "PDT",
};

// Versions that are copyrighted and not available via free APIs
const UNAVAILABLE_VERSIONS = ["NIV", "ESV", "NASB", "CSB"];

// Pattern to detect version keywords after a reference
// Matches: "Greek NT", "KJV", "Latin", etc. at the end or after whitespace
// Uses word boundaries to avoid partial matches
const VERSION_PATTERN = /(?:^|[\s\n,;])(greek\s+nt|greek\s+new\s+testament|sblgnt|sbl|byzantine\s+textform|byzantine|textus\s+receptus|old\s+testament\s+hebrew|hebrew\s+ot|masoretic\s+text|new\s+international\s+version|new\s+international|new\s+american\s+standard|christian\s+standard\s+bible|christian\s+standard|english\s+standard\s+version|english\s+standard|world\s+english|king\s+james\s+version|bible\s+in\s+basic\s+english|douay\s+rheims|wmb\s+british\s+edition|septuagint|latin\s+vulgate|vulgate|vulg|westminster|basic\s+english|world\s+english|king\s+james|new\s+international|hebrew|latin|greek|reina[\s-]valera\s+1960|reina[\s-]valera\s+g[oó]mez|reina[\s-]valera|nueva\s+versi[oó]n\s+internacional|nueva\s+traducci[oó]n\s+viviente|la\s+biblia\s+de\s+las\s+am[eé]ricas|biblia\s+textual|palabra\s+de\s+dios|rv1960|rv2004|nvi|ntv|lbla|btx3|pdt|byz|tr|mt|wlc|lxx|kjv|niv|esv|nasb|csb|web|bbe|drb|wmb|wmbbe)(?=[\s\n\)\],\.]|$)/iu;

export interface DetectedReference {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  originalMatch: string;
  version?: string; // Detected version from message
}

export class MessageHandler {
  private bibleService: BibleService;
  private defaultVersion: string;

  constructor(bibleService: BibleService, defaultVersion: string = "KJV") {
    this.bibleService = bibleService;
    this.defaultVersion = defaultVersion;
  }

  /**
   * Detect Bible version from message content
   * Returns the version code or undefined if not found
   */
  detectVersion(content: string): string | undefined {
    const lowerContent = content.toLowerCase();
    const versionMatch = lowerContent.match(VERSION_PATTERN);

    if (versionMatch) {
      const keyword = versionMatch[1].trim().toLowerCase();
      return VERSION_KEYWORDS[keyword];
    }

    return undefined;
  }

  /**
   * Check if a message contains Bible verse references
   * Returns detected references or null if none found
   */
  detectVerseReferences(content: string): DetectedReference[] {
    const detected: DetectedReference[] = [];
    const processedContent = content.toLowerCase();

    for (const pattern of VERSE_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex state
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(processedContent)) !== null) {
        const prefix = match[1] || ""; // "1", "2", "3", or ""
        const bookName = match[2];
        const chapter = parseInt(match[4]);
        const verseStart = parseInt(match[5]);
        const verseEnd = match[6] ? parseInt(match[6]) : undefined;
        const fullMatch = match[0].trim();

        // Reconstruct full book name
        let fullBookName = (prefix + bookName).trim();

        // Check if this could be a book with "of" in the name
        if (bookName.toLowerCase() === "of") {
          // Need to look back for the first part
          const beforeMatch = processedContent.substring(0, match.index);
          const wordBefore = beforeMatch.match(/([a-z]+)\s*$/);
          if (wordBefore) {
            fullBookName = (wordBefore[1] + " of " + bookName).trim();
          }
        }

        // Normalize the book name (convert abbreviations to full names)
        fullBookName = normalizeBookName(fullBookName);

        // Validate that this looks like a real Bible book
        if (this.isValidBook(fullBookName)) {
          detected.push({
            book: fullBookName,
            chapter,
            verseStart,
            verseEnd,
            originalMatch: fullMatch,
          });
        }
      }
    }

    // Remove duplicates based on the reference
    const uniqueRefs = detected.filter((ref, index, self) =>
      index === self.findIndex((r) =>
        r.book === ref.book &&
        r.chapter === ref.chapter &&
        r.verseStart === ref.verseStart &&
        r.verseEnd === ref.verseEnd
      )
    );

    return uniqueRefs;
  }

  /**
   * Detect chapter-only references like "John 3"
   * Returns detected references or empty array if none found
   */
  detectChapterReferences(content: string): DetectedReference[] {
    const detected: DetectedReference[] = [];
    const processedContent = content.toLowerCase();

    CHAPTER_PATTERN.lastIndex = 0; // Reset regex state
    let match: RegExpExecArray | null;

    while ((match = CHAPTER_PATTERN.exec(processedContent)) !== null) {
      const prefix = match[1] || ""; // "1", "2", "3", or ""
      const bookName = match[2];
      const chapter = parseInt(match[4]);
      const fullMatch = match[0].trim();

      // Reconstruct full book name
      let fullBookName = (prefix + bookName).trim();

      // Check if this could be a book with "of" in the name
      if (bookName.toLowerCase() === "of") {
        // Need to look back for the first part
        const beforeMatch = processedContent.substring(0, match.index);
        const wordBefore = beforeMatch.match(/([a-z]+)\s*$/);
        if (wordBefore) {
          fullBookName = (wordBefore[1] + " of " + bookName).trim();
        }
      }

      // Normalize the book name (convert abbreviations to full names)
      fullBookName = normalizeBookName(fullBookName);

      // Validate that this looks like a real Bible book
      if (this.isValidBook(fullBookName)) {
        detected.push({
          book: fullBookName,
          chapter,
          verseStart: undefined,
          verseEnd: undefined,
          originalMatch: fullMatch,
        });
      }
    }

    // Remove duplicates based on the reference
    const uniqueRefs = detected.filter((ref, index, self) =>
      index === self.findIndex((r) =>
        r.book === ref.book &&
        r.chapter === ref.chapter &&
        r.verseStart === ref.verseStart &&
        r.verseEnd === ref.verseEnd
      )
    );

    return uniqueRefs;
  }

  /**
   * Check if a book name is valid
   */
  private isValidBook(bookName: string): boolean {
    const validBooks = [
      "genesis",
      "exodus",
      "leviticus",
      "numbers",
      "deuteronomy",
      "joshua",
      "judges",
      "ruth",
      "1 samuel",
      "2 samuel",
      "1 kings",
      "2 kings",
      "1 chronicles",
      "2 chronicles",
      "ezra",
      "nehemiah",
      "esther",
      "job",
      "psalms",
      "proverbs",
      "ecclesiastes",
      "song of solomon",
      "isaiah",
      "jeremiah",
      "lamentations",
      "ezekiel",
      "daniel",
      "hosea",
      "joel",
      "amos",
      "obadiah",
      "jonah",
      "micah",
      "nahum",
      "habakkuk",
      "zephaniah",
      "haggai",
      "zechariah",
      "malachi",
      "matthew",
      "matt",
      "mark",
      "luke",
      "john",
      "ioannes",
      "joannes",
      "acts",
      "romans",
      "1 corinthians",
      "2 corinthians",
      "galatians",
      "ephesians",
      "philippians",
      "colossians",
      "1 thessalonians",
      "2 thessalonians",
      "1 timothy",
      "2 timothy",
      "titus",
      "philemon",
      "hebrews",
      "james",
      "1 peter",
      "2 peter",
      "1 john",
      "2 john",
      "3 john",
      "jude",
      "revelation",
      // Common abbreviations
      "gen",
      "exod",
      "ex",
      "lev",
      "num",
      "nu",
      "deut",
      "josh",
      "judg",
      "neh",
      "est",
      "psalm",
      "ps",
      "prov",
      "eccl",
      "song of songs",
      "isa",
      "jer",
      "lam",
      "ezek",
      "dan",
      "hos",
      "obad",
      "jon",
      "mic",
      "nah",
      "hab",
      "zeph",
      "hag",
      "zech",
      "mal",
      "matt",
      "act",
      "rom",
      "1 corinth",
      "1 cor",
      "2 corinth",
      "2 cor",
      "gal",
      "eph",
      "phil",
      "col",
      "1 thes",
      "2 thes",
      "1 tim",
      "2 tim",
      "phlm",
      "heb",
      "jas",
      "1 pet",
      "2 pet",
      "1 jn",
      "2 jn",
      "3 jn",
      "rev",
      "1 ki",
      "1 king",
      "2 ki",
      "2 king",
      "1 ch",
      "1 chron",
      "2 ch",
      "2 chron",
      // Deuterocanonical books
      "tobit",
      "tob",
      "tobias",
      "judith",
      "jdt",
      "wisdom",
      "wisdom of solomon",
      "wis",
      "sirach",
      "ecclesiasticus",
      "sir",
      "baruch",
      "bar",
      "1 maccabees",
      "1 macc",
      "1 mac",
      "2 maccabees",
      "2 macc",
      "2 mac",
      // Spanish book names
      "génesis",
      "éxodo",
      "exodo",
      "levítico",
      "levitico",
      "números",
      "numeros",
      "deuteronomio",
      "josué",
      "josue",
      "jueces",
      "rut",
      "1 reyes",
      "2 reyes",
      "1 crónicas",
      "1 cronicas",
      "2 crónicas",
      "2 cronicas",
      "esdras",
      "nehemías",
      "nehemias",
      "ester",
      "salmos",
      "salmo",
      "sal",
      "proverbios",
      "eclesiastés",
      "eclesiastes",
      "cantares",
      "cantar de los cantares",
      "isaías",
      "isaias",
      "jeremías",
      "jeremias",
      "lamentaciones",
      "ezequiel",
      "oseas",
      "abdías",
      "abdias",
      "jonás",
      "jonas",
      "miqueas",
      "nahúm",
      "habacuc",
      "sofonías",
      "sofonias",
      "hageo",
      "zacarías",
      "zacarias",
      "malaquías",
      "malaquias",
      "mateo",
      "marcos",
      "lucas",
      "juan",
      "hechos",
      "romanos",
      "1 corintios",
      "2 corintios",
      "gálatas",
      "galatas",
      "efesios",
      "filipenses",
      "colosenses",
      "1 tesalonicenses",
      "2 tesalonicenses",
      "1 timoteo",
      "2 timoteo",
      "tito",
      "filemón",
      "filemon",
      "hebreos",
      "santiago",
      "1 pedro",
      "2 pedro",
      "1 juan",
      "2 juan",
      "3 juan",
      "judas",
      "apocalipsis",
      "tobías",
      "judit",
      "sabiduría",
      "sabiduria",
      "eclesiástico",
      "eclesiastico",
      "1 macabeos",
      "2 macabeos",
      // Latin book names
      "numeri",
      "deuteronomium",
      "iosue",
      "iudicum",
      "i regum",
      "ii regum",
      "iii regum",
      "iv regum",
      "i paralipomenon",
      "ii paralipomenon",
      "esdrae",
      "nehemiae",
      "iob",
      "psalmi",
      "psalmus",
      "proverbia",
      "canticum canticorum",
      "isaias",
      "ieremias",
      "threni",
      "ezechiel",
      "osee",
      "ioel",
      "abdias",
      "ionas",
      "michaeas",
      "habacuc",
      "sophonias",
      "aggaeus",
      "zacharias",
      "malachias",
      "matthaeus",
      "marcus",
      "actus apostolorum",
      "ad romanos",
      "ad corinthios i",
      "ad corinthios ii",
      "ad galatas",
      "ad ephesios",
      "ad philippenses",
      "ad colossenses",
      "ad thessalonicenses i",
      "ad thessalonicenses ii",
      "ad timotheum i",
      "ad timotheum ii",
      "ad titum",
      "ad philemonem",
      "ad hebraeos",
      "iacobi",
      "petri i",
      "petri ii",
      "ioannis i",
      "ioannis ii",
      "ioannis iii",
      "iudae",
      "apocalypsis",
      "tobias",
      "iudith",
      "sapientia",
      "ecclesiasticus",
      "i machabaeorum",
      "ii machabaeorum",
    ];
    return validBooks.includes(bookName.toLowerCase().trim());
  }

  /**
   * Process a message and respond with verse if reference detected
   * Returns true if a verse was sent, false otherwise
   */
  async processMessage(message: Message): Promise<boolean> {
    // Ignore bot messages
    if (message.author.bot) {
      return false;
    }

    // Ignore messages that are replies to this bot
    if (message.reference?.messageId) {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId)
        .catch(() => null);
      if (repliedMessage?.author.id === message.client.user?.id) {
        return false;
      }
    }

    const content = message.content;
    if (!content || content.trim().length === 0) {
      return false;
    }

    // Detect verse references
    let references = this.detectVerseReferences(content);

    // If no verse references found, check for chapter-only references
    if (references.length === 0) {
      references = this.detectChapterReferences(content);
    }

    if (references.length === 0) {
      return false;
    }

    // Detect version from message content
    let detectedVersion = this.detectVersion(content);

    // Check if the requested version is unavailable
    if (detectedVersion && UNAVAILABLE_VERSIONS.includes(detectedVersion)) {
      const availableVersions = "KJV, WEB, BBE, DRB, WMB";
      await message.reply(
        `⚠️ The **${detectedVersion}** translation is copyrighted and not available through free APIs. ` +
        `Available versions: ${availableVersions}. Showing in **${this.defaultVersion}** instead.`,
      );
      detectedVersion = undefined; // Fall back to default
    }

    // Respond to up to 5 references to avoid spam
    const embeds = [];
    for (const ref of references.slice(0, 5)) {
      // If no version explicitly specified, detect language from book name
      let fallbackVersion = this.defaultVersion;
      let displayVersion: string | undefined;
      if (!detectedVersion) {
        const bookPart = ref.originalMatch.replace(/\s+\d+.*$/, "").toLowerCase().trim();
        if (LATIN_BOOK_NAMES.has(bookPart)) {
          fallbackVersion = DEFAULT_LATIN_VERSION;
        } else if (SPANISH_BOOK_NAMES.has(bookPart)) {
          fallbackVersion = DEFAULT_LATIN_VERSION;
          displayVersion = DEFAULT_SPANISH_VERSION;
        }
      }

      try {
        const verses = await this.bibleService.getVerses(
          ref.book,
          ref.chapter,
          ref.verseStart,
          ref.verseEnd,
          detectedVersion || fallbackVersion,
        );

        if (verses.length > 0) {
          embeds.push(this.bibleService.createVerseEmbed(verses, undefined, displayVersion));
        }
      } catch (error) {
        console.error(
          `[MessageHandler] Error fetching verse:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    if (embeds.length === 0) {
      return false;
    }

    await message.reply({ embeds });
    return true;
  }
}
