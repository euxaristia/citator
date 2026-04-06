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
  /(?:^|[\s\n\(\[])((?:1|2|3)\s+)?([A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)(\s+)(\d+):(\d+)(?:-(\d+))?([\s\n\)\],\.]|$)/gi,
];

// Chapter-only pattern: Book Chapter (no colon/verse)
const CHAPTER_PATTERN =
  /(?:^|[\s\n\(\[])((?:1|2|3)\s+)?([A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)(\s+)(\d+)([\s\n\)\],\.]|$)/gi;

// Books that contain "of" in their name
const BOOKS_WITH_OF = ["song of solomon", "song of songs"];

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
};

// Versions that are copyrighted and not available via free APIs
const UNAVAILABLE_VERSIONS = ["NIV", "ESV", "NASB", "CSB"];

// Pattern to detect version keywords after a reference
// Matches: "Greek NT", "KJV", "Latin", etc. at the end or after whitespace
// Uses word boundaries to avoid partial matches
const VERSION_PATTERN = /(?:^|[\s\n,;])(greek\s+nt|greek\s+new\s+testament|sblgnt|sbl|byzantine\s+textform|byzantine|textus\s+receptus|old\s+testament\s+hebrew|hebrew\s+ot|masoretic\s+text|new\s+international\s+version|new\s+international|new\s+american\s+standard|christian\s+standard\s+bible|christian\s+standard|english\s+standard\s+version|english\s+standard|world\s+english|king\s+james\s+version|bible\s+in\s+basic\s+english|douay\s+rheims|wmb\s+british\s+edition|septuagint|latin\s+vulgate|vulgate|vulg|westminster|basic\s+english|world\s+english|king\s+james|new\s+international|hebrew|latin|greek|byz|tr|mt|wlc|lxx|kjv|niv|esv|nasb|csb|web|bbe|drb|wmb|wmbbe)(?=[\s\n\)\],\.]|$)/i;

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

    // For now, only respond to the first reference to avoid spam
    const ref = references[0];

    try {
      const verses = await this.bibleService.getVerses(
        ref.book,
        ref.chapter,
        ref.verseStart,
        ref.verseEnd,
        detectedVersion || this.defaultVersion,
      );

      if (verses.length === 0) {
        return false;
      }

      const embed = this.bibleService.createVerseEmbed(verses);
      await message.reply({ embeds: [embed] });
      return true;
    } catch (error) {
      console.error(
        `[MessageHandler] Error fetching verse:`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  }
}
