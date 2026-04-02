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

export interface DetectedReference {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  originalMatch: string;
}

export class MessageHandler {
  private bibleService: BibleService;
  private defaultVersion: string;

  constructor(bibleService: BibleService, defaultVersion: string = "KJV") {
    this.bibleService = bibleService;
    this.defaultVersion = defaultVersion;
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
      "psalm",
      "song of songs",
      "1 sam",
      "2 sam",
      "1 ki",
      "2 ki",
      "1 ch",
      "2 ch",
      "1 cor",
      "2 cor",
      "1 thes",
      "2 thes",
      "1 tim",
      "2 tim",
      "1 pet",
      "2 pet",
      "1 jn",
      "2 jn",
      "3 jn",
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

    // For now, only respond to the first reference to avoid spam
    const ref = references[0];

    try {
      const verses = await this.bibleService.getVerses(
        ref.book,
        ref.chapter,
        ref.verseStart,
        ref.verseEnd,
        this.defaultVersion,
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
