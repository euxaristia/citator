/**
 * Bible API Service
 * Interfaces with bible-api.com to fetch scripture
 */

const BIBLE_API_BASE = "https://bible-api.com";

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

  constructor(defaultVersion: string = "ESV") {
    this.defaultVersion = defaultVersion;
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
    const verseRange = verseEnd ? `${verseStart}-${verseEnd}` : `${verseStart}`;
    const reference = `${book} ${chapter}:${verseRange}`;
    
    const url = `${BIBLE_API_BASE}/${encodeURIComponent(reference)}?translation=${encodeURIComponent(v)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      // Consume response body to avoid resource leak
      await response.body?.cancel();
      if (response.status === 404) {
        throw new Error(`Verse not found: ${reference} (${v})`);
      }
      throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const apiVersion = data.translation_id?.toUpperCase() || v;

    return data.verses.map((verse: any) => ({
      book: verse.book_name,
      chapter: verse.chapter,
      verse: verse.verse,
      text: verse.text.trim(),
      version: apiVersion,
      reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`
    }));
  }

  /**
   * Get verse of the day (using a simple algorithm based on date)
   */
  async getVerseOfTheDay(): Promise<BibleVerse> {
    const today = new Date();
    const dayOfYear = this.getDayOfYear(today);
    
    // Use a predefined list of encouraging verses
    const verses = [
      "John 3:16",
      "Psalm 23:1",
      "Philippians 4:13",
      "Jeremiah 29:11",
      "Isaiah 40:31",
      "Psalm 46:1",
      "Matthew 11:28",
      "Romans 8:28",
      "Joshua 1:9",
      "Psalm 119:105",
      "1 Corinthians 16:14",
      "Proverbs 3:5-6",
      "Galatians 5:22-23",
      "Ephesians 2:8-9",
      "Psalm 34:8",
      "2 Corinthians 5:17",
      "1 Peter 5:7",
      "Hebrews 11:1",
      "James 1:5",
      "1 John 4:19",
      "Psalm 19:14",
      "Colossians 3:23",
      "1 Thessalonians 5:16-18",
      "Titus 3:5",
      "1 John 1:9",
      "Psalm 27:1",
      "Isaiah 41:10",
      "Matthew 6:33",
      "Luke 1:37",
      "Romans 12:2"
    ];

    // Select verse based on day of year (rotates through the list)
    const selectedVerse = verses[dayOfYear % verses.length];
    
    // Parse the reference
    const match = selectedVerse.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!match) {
      throw new Error("Invalid verse reference");
    }

    const [, book, chapter, verseStart, verseEnd] = match;
    const verses_result = await this.getVerses(
      book,
      parseInt(chapter),
      parseInt(verseStart),
      verseEnd ? parseInt(verseEnd) : undefined
    );

    return verses_result[0];
  }

  /**
   * Search for verses containing specific text
   * Note: bible-api.com doesn't support text search, so this is a placeholder
   * for future integration with a search-capable API
   */
  async search(text: string, version?: string): Promise<BibleVerse[]> {
    // For now, return a message that search is not available
    throw new Error(
      "Text search is not available with the current Bible API. " +
      "Please use specific verse references instead."
    );
  }

  /**
   * Get list of all Bible books
   */
  async getBooks(): Promise<BibleBook[]> {
    const response = await fetch(`${BIBLE_API_BASE}/books`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get available Bible versions
   * Note: bible-api.com doesn't have a /translations endpoint, so we return known versions
   */
  async getVersions(): Promise<string[]> {
    // Return known versions supported by bible-api.com
    return ["KJV", "WEB", "BBE", "DRB", "WMB", "WMBBE"];
  }

  /**
   * Format verses into a display string
   */
  formatVerses(verses: BibleVerse[]): string {
    if (verses.length === 0) return "";
    
    const version = verses[0].version;
    const text = verses.map(v => v.text).join(" ");
    const reference = this.formatReference(verses);
    
    return `${text}\n\n*${reference} (${version})*`;
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
   * Parse a verse reference string (e.g., "John 3:16" or "John 3:16-18")
   */
  parseReference(ref: string): {
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
  } | null {
    // Handle various reference formats
    const patterns = [
      /^([123]?\s?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/,  // 1 John 3:16, Song of Solomon 2:10, John 3:16
      /^([123]?\s?[A-Za-z]+)\s+(\d+)\s+(\d+)(?:-(\d+))?$/,  // John 3 16 (alternative format)
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
