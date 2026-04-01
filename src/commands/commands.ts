/**
 * Discord Slash Commands
 */

import {
  APIApplicationCommandOptionChoice,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord-api-types/v10";
import { BibleService, BibleVerse } from "../services/bible.ts";

export interface CommandHandler {
  name: string;
  description: string;
  execute: (args: any) => Promise<string>;
}

/**
 * Create slash command definitions for Discord
 */
export function createCommandDefinitions(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
  const versions: APIApplicationCommandOptionChoice<string>[] = [
    { name: "ESV (English Standard Version)", value: "ESV" },
    { name: "KJV (King James Version)", value: "KJV" },
    { name: "NIV (New International Version)", value: "NIV" },
    { name: "NASB (New American Standard Bible)", value: "NASB" },
    { name: "WEB (World English Bible)", value: "WEB" },
    { name: "DRB (Douay-Rheims Bible)", value: "DRB" },
    { name: "WMB (World Messianic Bible)", value: "WMB" },
    { name: "WMBBE (World Messianic Bible British Edition)", value: "WMBBE" },
    { name: "BBE (Bible in Basic English)", value: "BBE" },
  ];

  return [
    {
      name: "verse",
      description: "Get a specific Bible verse or passage",
      options: [
        {
          name: "reference",
          description: "Bible reference (e.g., John 3:16 or Psalm 23:1-6)",
          type: 3, // STRING
          required: true,
        },
        {
          name: "version",
          description: "Bible version",
          type: 3, // STRING
          required: false,
          choices: versions,
        },
      ],
    },
    {
      name: "daily",
      description: "Get the verse of the day",
      options: [],
    },
    {
      name: "random",
      description: "Get a random Bible verse",
      options: [
        {
          name: "version",
          description: "Bible version",
          type: 3, // STRING
          required: false,
          choices: versions,
        },
      ],
    },
    {
      name: "versions",
      description: "List available Bible versions",
      options: [],
    },
    {
      name: "help",
      description: "Show help information and available commands",
      options: [],
    },
  ];
}

/**
 * Create command handlers
 */
export function createCommandHandlers(bibleService: BibleService): CommandHandler[] {
  return [
    {
      name: "verse",
      description: "Get a specific Bible verse or passage",
      execute: async (args: { reference: string; version?: string }) => {
        const parsed = bibleService.parseReference(args.reference);
        
        if (!parsed) {
          return "❌ Invalid Bible reference. Please use format: `Book Chapter:Verse` (e.g., `John 3:16` or `Psalm 23:1-6`)";
        }

        try {
          const verses = await bibleService.getVerses(
            parsed.book,
            parsed.chapter,
            parsed.verseStart,
            parsed.verseEnd,
            args.version
          );

          if (verses.length === 0) {
            return "❌ No verses found for that reference.";
          }

          const formatted = bibleService.formatVerses(verses);
          return `📖 ${formatted}`;
        } catch (error) {
          return `❌ Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
        }
      },
    },
    {
      name: "daily",
      description: "Get the verse of the day",
      execute: async () => {
        try {
          const verse = await bibleService.getVerseOfTheDay();
          return `🌟 **Verse of the Day**\n\n${verse.text}\n\n*${verse.reference} (${verse.version})*`;
        } catch (error) {
          return `❌ Error fetching verse of the day: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      },
    },
    {
      name: "random",
      description: "Get a random Bible verse",
      execute: async (args: { version?: string }) => {
        try {
          // Get a random verse by selecting random book/chapter/verse
          const books = [
            { name: "Genesis", chapters: 50 },
            { name: "Exodus", chapters: 40 },
            { name: "Leviticus", chapters: 27 },
            { name: "Numbers", chapters: 36 },
            { name: "Deuteronomy", chapters: 34 },
            { name: "Joshua", chapters: 24 },
            { name: "Judges", chapters: 21 },
            { name: "Ruth", chapters: 4 },
            { name: "1 Samuel", chapters: 31 },
            { name: "2 Samuel", chapters: 24 },
            { name: "1 Kings", chapters: 22 },
            { name: "2 Kings", chapters: 25 },
            { name: "1 Chronicles", chapters: 29 },
            { name: "2 Chronicles", chapters: 36 },
            { name: "Ezra", chapters: 10 },
            { name: "Nehemiah", chapters: 13 },
            { name: "Esther", chapters: 10 },
            { name: "Job", chapters: 42 },
            { name: "Psalms", chapters: 150 },
            { name: "Proverbs", chapters: 31 },
            { name: "Ecclesiastes", chapters: 12 },
            { name: "Song of Solomon", chapters: 8 },
            { name: "Isaiah", chapters: 66 },
            { name: "Jeremiah", chapters: 52 },
            { name: "Lamentations", chapters: 5 },
            { name: "Ezekiel", chapters: 48 },
            { name: "Daniel", chapters: 12 },
            { name: "Hosea", chapters: 14 },
            { name: "Joel", chapters: 3 },
            { name: "Amos", chapters: 9 },
            { name: "Obadiah", chapters: 1 },
            { name: "Jonah", chapters: 4 },
            { name: "Micah", chapters: 7 },
            { name: "Nahum", chapters: 3 },
            { name: "Habakkuk", chapters: 3 },
            { name: "Zephaniah", chapters: 3 },
            { name: "Haggai", chapters: 2 },
            { name: "Zechariah", chapters: 14 },
            { name: "Malachi", chapters: 4 },
            { name: "Matthew", chapters: 28 },
            { name: "Mark", chapters: 16 },
            { name: "Luke", chapters: 24 },
            { name: "John", chapters: 21 },
            { name: "Acts", chapters: 28 },
            { name: "Romans", chapters: 16 },
            { name: "1 Corinthians", chapters: 16 },
            { name: "2 Corinthians", chapters: 13 },
            { name: "Galatians", chapters: 6 },
            { name: "Ephesians", chapters: 6 },
            { name: "Philippians", chapters: 4 },
            { name: "Colossians", chapters: 4 },
            { name: "1 Thessalonians", chapters: 5 },
            { name: "2 Thessalonians", chapters: 3 },
            { name: "1 Timothy", chapters: 6 },
            { name: "2 Timothy", chapters: 4 },
            { name: "Titus", chapters: 3 },
            { name: "Philemon", chapters: 1 },
            { name: "Hebrews", chapters: 13 },
            { name: "James", chapters: 5 },
            { name: "1 Peter", chapters: 5 },
            { name: "2 Peter", chapters: 3 },
            { name: "1 John", chapters: 5 },
            { name: "2 John", chapters: 1 },
            { name: "3 John", chapters: 1 },
            { name: "Jude", chapters: 1 },
            { name: "Revelation", chapters: 22 },
          ];

          // Try up to 5 times to get a valid verse
          for (let i = 0; i < 5; i++) {
            const randomBook = books[Math.floor(Math.random() * books.length)];
            const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
            const randomVerse = Math.floor(Math.random() * 30) + 1; // Assume max 30 verses per chapter

            try {
              const verses = await bibleService.getVerses(
                randomBook.name,
                randomChapter,
                randomVerse,
                undefined,
                args.version
              );

              if (verses.length > 0) {
                const verse = verses[0];
                return `🎲 **Random Verse**\n\n${verse.text}\n\n*${verse.reference} (${verse.version})*`;
              }
            } catch {
              // Try again if this reference doesn't work
              continue;
            }
          }

          return "❌ Could not generate a random verse. Please try again.";
        } catch (error) {
          return `❌ Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
        }
      },
    },
    {
      name: "versions",
      description: "List available Bible versions",
      execute: async () => {
        const versions = [
          "**📚 Available Bible Versions:**\n",
          "• **ESV** - English Standard Version",
          "• **KJV** - King James Version",
          "• **NIV** - New International Version",
          "• **NASB** - New American Standard Bible",
          "• **WEB** - World English Bible",
          "• **DRB** - Douay-Rheims Bible",
          "• **WMB** - World Messianic Bible",
          "• **WMBBE** - World Messianic Bible (British Edition)",
          "• **BBE** - Bible in Basic English",
          "\n*Use `/verse` with the version parameter to specify a translation.*",
        ].join("\n");

        return versions;
      },
    },
    {
      name: "help",
      description: "Show help information and available commands",
      execute: async () => {
        const helpText = [
          "**📖 BibleBot Help**",
          "",
          "**Available Commands:**",
          "• `/verse <reference> [version]` - Get a specific Bible verse",
          "  Example: `/verse John 3:16 ESV`",
          "  Example: `/verse Psalm 23:1-6 KJV`",
          "",
          "• `/daily` - Get the verse of the day",
          "",
          "• `/random [version]` - Get a random Bible verse",
          "",
          "• `/versions` - List all available Bible versions",
          "",
          "• `/help` - Show this help message",
          "",
          "**Supported Versions:** ESV, KJV, NIV, NASB, WEB, DRB, WMB, WMBBE, BBE",
          "",
          "*Scripture from your Discord client to your heart* ❤️",
        ].join("\n");

        return helpText;
      },
    },
  ];
}
