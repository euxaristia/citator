/**
 * Bible API Service
 * Supports both bible-api.com and bolls.life APIs
 */

import { EmbedBuilder } from "discord.js";

const BIBLE_API_BASE = "https://bible-api.com";
const BOLLS_API_BASE = "https://bolls.life";

// Book name to 3-letter code mapping for bolls.life
const bookToCode: Record<string, string> = {
  "genesis": "GEN", "exodus": "EXO", "leviticus": "LEV", "numbers": "NUM",
  "deuteronomy": "DEU", "joshua": "JOS", "judges": "JDG", "ruth": "RUT",
  "1 samuel": "1SA", "2 samuel": "2SA", "1 kings": "1KI", "2 kings": "2KI",
  "1 chronicles": "1CH", "2 chronicles": "2CH", "ezra": "EZR", "nehemiah": "NEH",
  "esther": "EST", "job": "JOB", "psalms": "PSA", "proverbs": "PRO",
  "ecclesiastes": "ECC", "song of solomon": "SOL", "isaiah": "ISA",
  "jeremiah": "JER", "lamentations": "LAM", "ezekiel": "EZK", "daniel": "DAN",
  "hosea": "HOS", "joel": "JOL", "amos": "AMO", "obadiah": "OBA",
  "jonah": "JON", "micah": "MIC", "nahum": "NAM", "habakkuk": "HAB",
  "zephaniah": "ZEP", "haggai": "HAG", "zechariah": "ZEC", "malachi": "MAL",
  "matthew": "MAT", "mark": "MRK", "luke": "LUK", "john": "JHN",
  "acts": "ACT", "romans": "ROM", "1 corinthians": "1CO", "2 corinthians": "2CO",
  "galatians": "GAL", "ephesians": "EPH", "philippians": "PHP", "colossians": "COL",
  "1 thessalonians": "1TH", "2 thessalonians": "2TH", "1 timothy": "1TI",
  "2 timothy": "2TI", "titus": "TIT", "philemon": "PHM", "hebrews": "HEB",
  "james": "JAS", "1 peter": "1PE", "2 peter": "2PE", "1 john": "1JN",
  "2 john": "2JN", "3 john": "3JN", "jude": "JUD", "revelation": "REV",
};

// 3-letter code to book ID mapping for bolls.life
const codeToId: Record<string, number> = {
  "GEN": 1, "EXO": 2, "LEV": 3, "NUM": 4, "DEU": 5, "JOS": 6, "JDG": 7,
  "RUT": 8, "1SA": 9, "2SA": 10, "1KI": 11, "2KI": 12, "1CH": 13, "2CH": 14,
  "EZR": 15, "NEH": 16, "EST": 17, "JOB": 18, "PSA": 19, "PRO": 20, "ECC": 21,
  "SOL": 22, "ISA": 23, "JER": 24, "LAM": 25, "EZK": 26, "DAN": 27, "HOS": 28,
  "JOL": 29, "AMO": 30, "OBA": 31, "JON": 32, "MIC": 33, "NAM": 34, "HAB": 35,
  "ZEP": 36, "HAG": 37, "ZEC": 38, "MAL": 39, "MAT": 40, "MRK": 41, "LUK": 42,
  "JHN": 43, "ACT": 44, "ROM": 45, "1CO": 46, "2CO": 47, "GAL": 48, "EPH": 49,
  "PHP": 50, "COL": 51, "1TH": 52, "2TH": 53, "1TI": 54, "2TI": 55, "TIT": 56,
  "PHM": 57, "HEB": 58, "JAS": 59, "1PE": 60, "2PE": 61, "1JN": 62, "2JN": 63,
  "3JN": 64, "JUD": 65, "REV": 66,
};

// bolls.life ONLY versions (not in bible-api.com)
const BOLLS_ONLY_VERSIONS = ["VULG", "WLC", "LXX", "SBLGNT", "BYZ", "MT", "TR"];

// bible-api.com versions
const BIBLE_API_VERSIONS = ["KJV", "WEB", "BBE", "DRB", "WMB", "WMBBE"];

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
   * Determine which API to use based on version
   * bolls.life ONLY for original languages and Latin
   * bible-api.com for English translations
   */
  private getApiForVersion(version: string): "bible-api" | "bolls" {
    if (BOLLS_ONLY_VERSIONS.includes(version)) {
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
    verseStart: number,
    verseEnd?: number,
    version?: string
  ): Promise<BibleVerse[]> {
    const v = version || this.defaultVersion;
    const api = this.getApiForVersion(v);

    if (api === "bolls") {
      return this.getVersesFromBolls(book, chapter, verseStart, verseEnd, v);
    }
    return this.getVersesFromBibleApi(book, chapter, verseStart, verseEnd, v);
  }

  /**
   * Fetch from bible-api.com
   */
  private async getVersesFromBibleApi(
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd?: number,
    version?: string
  ): Promise<BibleVerse[]> {
    const v = version || this.defaultVersion;
    const verseRange = verseEnd ? `${verseStart}-${verseEnd}` : `${verseStart}`;
    const reference = `${book} ${chapter}:${verseRange}`;

    const url = `${BIBLE_API_BASE}/${encodeURIComponent(reference)}?translation=${encodeURIComponent(v)}`;

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
    console.log(`[BibleAPI] Response:`, JSON.stringify(data).slice(0, 200));

    if (data.error) {
      console.error(`[BibleAPI] API error:`, data.error);
      throw new Error(data.error);
    }

    const apiVersion = data.translation_id?.toUpperCase() || v;

    return data.verses.map((verse: any) => ({
      book: verse.book_name,
      chapter: verse.chapter,
      verse: verse.verse,
      text: this.cleanText(verse.text),
      version: apiVersion,
      reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`
    }));
  }

  /**
   * Fetch from bolls.life
   */
  private async getVersesFromBolls(
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd?: number,
    version?: string
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

    // bolls.life returns a flat array of verses
    const filteredVerses = data.filter(
      (verse: any) => verse.verse >= verseStart && (verseEnd === undefined ? verse.verse === verseStart : verse.verse <= verseEnd)
    );

    if (filteredVerses.length === 0) {
      console.error(`[BollsAPI] No verses found for ${book} ${chapter}:${verseStart}${verseEnd ? `-${verseEnd}` : ""}`);
      throw new Error(`No verses found for ${book} ${chapter}:${verseStart}${verseEnd ? `-${verseEnd}` : ""}`);
    }

    // Get book name from first verse
    const bookName = filteredVerses[0].book_name || book;

    return filteredVerses.map((verse: any) => ({
      book: bookName,
      chapter: chapter,
      verse: verse.verse,
      text: this.cleanText(verse.text),
      version: v,
      reference: `${bookName} ${chapter}:${verse.verse}`
    }));
  }

  /**
   * Clean HTML tags and normalize whitespace from verse text
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, "")  // Remove HTML tags
      .replace(/[\n\r]+/g, " ")  // Replace newlines with spaces
      .replace(/\s+/g, " ")      // Normalize multiple spaces to single
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
      selectedVerse.verse
    );

    return verses_result[0];
  }

  /**
   * Search for verses (not supported by either API)
   */
  async search(text: string, version?: string): Promise<BibleVerse[]> {
    throw new Error(
      "Text search is not available. Please use specific verse references instead."
    );
  }

  /**
   * Get all available Bible versions from both APIs
   */
  async getVersions(): Promise<string[]> {
    return [...BIBLE_API_VERSIONS, ...BOLLS_ONLY_VERSIONS].filter((v, i, a) => a.indexOf(v) === i);
  }

  /**
   * Format verses into a display string
   * Discord has a 2000 character limit, so we truncate if needed
   */
  formatVerses(verses: BibleVerse[], maxCharacters: number = 2000): string {
    if (verses.length === 0) return "";

    const version = verses[0].version;
    const reference = this.formatReference(verses);
    const fullText = verses.map(v => v.text).join(" ");
    
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
  createVerseEmbed(verses: BibleVerse[], title?: string): EmbedBuilder {
    if (verses.length === 0) {
      return new EmbedBuilder().setColor(0x5865F2).setDescription("No verses found.");
    }

    const version = verses[0].version;
    const reference = this.formatReference(verses);
    const fullText = verses.map(v => v.text).join(" ");
    
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
    };

    const versionDisplayName = versionNames[version] || version;
    const embedTitle = title ? `${title}` : `${reference}`;
    
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(embedTitle)
      .setDescription(fullText)
      .setFooter({ text: `${reference} - ${versionDisplayName}` });

    // Add truncation notice if needed
    const fullMessage = fullText.length + reference.length + versionDisplayName.length + 50;
    if (fullMessage > 2000) {
      const truncatedText = fullText.slice(0, 1900).trim() + "...";
      embed.setDescription(truncatedText);
      embed.setFooter({ text: `${reference} - ${versionDisplayName} (Passage truncated due to Discord's limit)` });
    }

    return embed;
  }

  /**
   * Format a reference string from verses
   */
  private formatReference(verses: BibleVerse[]): string {
    if (verses.length === 0) return "";
    if (verses.length === 1) {
      return `${verses[0].book} ${verses[0].chapter}:${verses[0].verse}`;
    }

    const first = verses[0];
    const last = verses[verses.length - 1];

    if (first.book === last.book && first.chapter === last.chapter) {
      return `${first.book} ${first.chapter}:${first.verse}-${last.verse}`;
    }

    return `${first.book} ${first.chapter}:${first.verse} - ${last.book} ${last.chapter}:${last.verse}`;
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
    verseStart: number;
    verseEnd?: number;
  } | null {
    const patterns = [
      /^([123]?\s?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/,
      /^([123]?\s?[A-Za-z]+)\s+(\d+)\s+(\d+)(?:-(\d+))?$/,
    ];

    for (const pattern of patterns) {
      const match = ref.match(pattern);
      if (match) {
        const [, book, chapter, verseStart, verseEnd] = match;
        return {
          book: book.trim(),
          chapter: parseInt(chapter),
          verseStart: parseInt(verseStart),
          verseEnd: verseEnd ? parseInt(verseEnd) : undefined
        };
      }
    }

    return null;
  }
}
