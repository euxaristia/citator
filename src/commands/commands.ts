/**
 * Discord Slash Commands
 */

import {
  APIApplicationCommandOptionChoice,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { BibleService, BibleVerse } from "../services/bible.ts";

export interface CommandHandler {
  name: string;
  description: string;
  execute: (args: any) => Promise<{ embeds?: EmbedBuilder[]; content?: string }>;
}

/**
 * Create slash command definitions for Discord
 */
export function createCommandDefinitions(): any[] {
  const versions: APIApplicationCommandOptionChoice<string>[] = [
    { name: "📖 KJV (King James Version)", value: "KJV" },
    { name: "📖 WEB (World English Bible)", value: "WEB" },
    { name: "📖 BBE (Bible in Basic English)", value: "BBE" },
    { name: "📖 DRB (Douay-Rheims Bible)", value: "DRB" },
    { name: "📖 WMB (World Messianic Bible)", value: "WMB" },
    { name: "📖 WMBBE (WMB British Edition)", value: "WMBBE" },
    { name: "📜 VULG (Latin Vulgate)", value: "VULG" },
    { name: "📜 WLC (Hebrew - Westminster Leningrad)", value: "WLC" },
    { name: "📜 LXX (Greek Septuagint)", value: "LXX" },
    { name: "📜 SBLGNT (Greek NT)", value: "SBLGNT" },
    { name: "📜 BYZ (Byzantine Textform)", value: "BYZ" },
    { name: "📜 MT (Masoretic Text)", value: "MT" },
    { name: "📜 TR (Textus Receptus)", value: "TR" },
    { name: "🇪🇸 RV1960 (Reina-Valera 1960)", value: "RV1960" },
    { name: "🇪🇸 NVI (Nueva Versión Internacional)", value: "NVI" },
    { name: "🇪🇸 NTV (Nueva Traducción Viviente)", value: "NTV" },
    { name: "🇪🇸 LBLA (La Biblia de las Américas)", value: "LBLA" },
    { name: "🇪🇸 BTX3 (Biblia Textual 3ra Ed.)", value: "BTX3" },
    { name: "🇪🇸 RV2004 (Reina Valera Gómez)", value: "RV2004" },
    { name: "🇪🇸 PDT (Palabra de Dios para Todos)", value: "PDT" },
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
          return {
            content:
              "❌ Invalid Bible reference. Please use format: `Book Chapter:Verse` (e.g., `John 3:16` or `Psalm 23:1-6`)",
          };
        }

        try {
          console.log(`[Command] /verse ${args.reference} ${args.version || "KJV"}`);
          const verses = await bibleService.getVerses(
            parsed.book,
            parsed.chapter,
            parsed.verseStart,
            parsed.verseEnd,
            args.version,
          );

          if (verses.length === 0) {
            return { content: "❌ No verses found for that reference." };
          }

          const embed = bibleService.createVerseEmbed(verses);
          return { embeds: [embed] };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
          console.error(`[Command] /verse error:`, errorMsg);
          return { content: `❌ Error: ${errorMsg}` };
        }
      },
    },
    {
      name: "daily",
      description: "Get the verse of the day",
      execute: async () => {
        try {
          const verse = await bibleService.getVerseOfTheDay();
          const embed = bibleService.createVerseEmbed([verse], "Verse of the Day");
          return { embeds: [embed] };
        } catch (error) {
          return {
            content: `❌ Error fetching verse of the day: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
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
                args.version,
              );

              if (verses.length > 0) {
                const verse = verses[0];
                const embed = bibleService.createVerseEmbed([verse], "Random Verse");
                return { embeds: [embed] };
              }
            } catch {
              // Try again if this reference doesn't work
              continue;
            }
          }

          return { content: "❌ Could not generate a random verse. Please try again." };
        } catch (error) {
          return {
            content: `❌ Error: ${
              error instanceof Error ? error.message : "Unknown error occurred"
            }`,
          };
        }
      },
    },
    {
      name: "versions",
      description: "List available Bible versions",
      execute: async () => {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle("📚 Available Bible Versions")
          .addFields(
            {
              name: "Modern English (bible-api.com)",
              value: "KJV, WEB, BBE, DRB, WMB, WMBBE",
              inline: false,
            },
            {
              name: "Original Languages & Latin (bolls.life)",
              value: "VULG, WLC, LXX, SBLGNT, BYZ, MT, TR",
              inline: false,
            },
            {
              name: "Español / Spanish (bolls.life)",
              value: "RV1960, NVI, NTV, LBLA, BTX3, RV2004, PDT",
              inline: false,
            },
          )
          .setFooter({ text: "Use /verse with the version parameter to specify a translation" });

        return { embeds: [embed] };
      },
    },
    {
      name: "help",
      description: "Show help information and available commands",
      execute: async () => {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle("📖 PrimaScriptura Help")
          .addFields(
            {
              name: "/verse <reference> [version]",
              value: "Get a specific Bible verse\nExample: `/verse John 3:16 KJV`",
              inline: false,
            },
            {
              name: "/daily",
              value: "Get the verse of the day",
              inline: true,
            },
            {
              name: "/random [version]",
              value: "Get a random Bible verse",
              inline: true,
            },
            {
              name: "/versions",
              value: "List all available Bible versions",
              inline: true,
            },
            {
              name: "Available Versions",
              value: "KJV, WEB, BBE, DRB, WMB, WMBBE, VULG, WLC, LXX, SBLGNT, BYZ, MT, TR\n🇪🇸 RV1960, NVI, NTV, LBLA, BTX3, RV2004, PDT",
              inline: false,
            },
          )
          .setFooter({ text: "Scripture from your Discord client to your heart ❤️" });

        return { embeds: [embed] };
      },
    },
  ];
}
