/**
 * Tests for BibleService
 */

import { assertEquals, assertExists, assertRejects } from "jsr:@std/assert";
import { BibleService } from "../src/services/bible.ts";

Deno.test("BibleService - parseReference - single verse", () => {
  const service = new BibleService();
  const result = service.parseReference("John 3:16");

  assertEquals(result, {
    book: "John",
    chapter: 3,
    verseStart: 16,
    verseEnd: undefined,
  });
});

Deno.test("BibleService - parseReference - verse range", () => {
  const service = new BibleService();
  const result = service.parseReference("Psalm 23:1-6");

  assertEquals(result, {
    book: "psalms",
    chapter: 23,
    verseStart: 1,
    verseEnd: 6,
  });
});

Deno.test("BibleService - parseReference - book with number", () => {
  const service = new BibleService();
  const result = service.parseReference("1 John 1:9");

  assertExists(result);
  assertEquals(result.book.toLowerCase(), "1 john");
  assertEquals(result.chapter, 1);
  assertEquals(result.verseStart, 9);
});

Deno.test("BibleService - parseReference - multi-word book", () => {
  const service = new BibleService();
  const result = service.parseReference("Song of Solomon 2:10");

  assertExists(result);
  assertEquals(result.book.toLowerCase(), "song of solomon");
  assertEquals(result.chapter, 2);
  assertEquals(result.verseStart, 10);
});

Deno.test("BibleService - parseReference - invalid reference", () => {
  const service = new BibleService();
  const result = service.parseReference("Invalid Book 99:999");

  assertEquals(result, null);
});

Deno.test("BibleService - parseReference - empty string", () => {
  const service = new BibleService();
  const result = service.parseReference("");

  assertEquals(result, null);
});

Deno.test("BibleService - getVerses - valid reference", async () => {
  const service = new BibleService("KJV");
  const verses = await service.getVerses("john", 3, 16);

  assertEquals(verses.length, 1);
  assertEquals(verses[0].chapter, 3);
  assertEquals(verses[0].verse, 16);
  assertEquals(verses[0].version, "KJV");
  assertEquals(typeof verses[0].text, "string");
});

Deno.test("BibleService - getVerses - verse range", async () => {
  const service = new BibleService("KJV");
  const verses = await service.getVerses("psalms", 23, 1, 4);

  assertEquals(verses.length, 4);
  assertEquals(verses[0].verse, 1);
  assertEquals(verses[3].verse, 4);
});

Deno.test("BibleService - getVerses - different version", async () => {
  const service = new BibleService("ESV");
  const verses = await service.getVerses("john", 3, 16, undefined, "KJV");

  assertEquals(verses[0].version, "KJV");
});

Deno.test("BibleService - getVerses - invalid book", async () => {
  const service = new BibleService();

  // Invalid books get sent to API which returns "Verse not found"
  await assertRejects(
    async () => await service.getVerses("invalidbook", 1, 1),
    Error,
    "Verse not found",
  );
});

Deno.test("BibleService - getVerses - invalid chapter", async () => {
  const service = new BibleService();

  await assertRejects(
    async () => await service.getVerses("john", 999, 1),
    Error,
    "Verse not found",
  );
});

Deno.test("BibleService - getVerseOfTheDay - returns valid verse", async () => {
  const service = new BibleService("KJV");
  const verse = await service.getVerseOfTheDay();

  assertEquals(typeof verse.chapter, "number");
  assertEquals(typeof verse.verse, "number");
  assertEquals(typeof verse.text, "string");
  assertEquals(verse.version, "KJV");
});

Deno.test("BibleService - formatVerses - single verse", () => {
  const service = new BibleService();
  const verses = [{
    book: "John",
    chapter: 3,
    verse: 16,
    text: "For God so loved the world",
    version: "KJV",
    reference: "John 3:16",
  }];

  const result = service.formatVerses(verses);

  assertEquals(result.includes("For God so loved the world"), true);
  assertEquals(result.includes("John 3:16"), true);
  assertEquals(result.includes("KJV"), true);
});

Deno.test("BibleService - formatVerses - multiple verses", () => {
  const service = new BibleService();
  const verses = [
    {
      book: "John",
      chapter: 3,
      verse: 16,
      text: "For God so loved the world",
      version: "KJV",
      reference: "John 3:16",
    },
    {
      book: "John",
      chapter: 3,
      verse: 17,
      text: "For God sent not his Son",
      version: "KJV",
      reference: "John 3:17",
    },
  ];

  const result = service.formatVerses(verses);

  assertEquals(result.includes("For God so loved the world"), true);
  assertEquals(result.includes("For God sent not his Son"), true);
  assertEquals(result.includes("John 3:16-17"), true);
  assertEquals(result.includes("KJV"), true);
});

Deno.test("BibleService - formatVerses - empty array", () => {
  const service = new BibleService();
  const result = service.formatVerses([]);

  assertEquals(result, "");
});

Deno.test("BibleService - formatVerses - truncates long passages", () => {
  const service = new BibleService();
  // Create a very long passage that exceeds 2000 characters
  const longText = "This is a very long verse. ".repeat(100);
  const verses = [{
    book: "John",
    chapter: 3,
    verse: 16,
    text: longText,
    version: "VULG",
    reference: "John 3:16",
  }];

  const result = service.formatVerses(verses);

  // Should be truncated to under 2000 characters
  assertEquals(result.length <= 2000, true);
  // Should include truncation notice
  assertEquals(result.includes("truncated"), true);
  // Should still have the reference
  assertEquals(result.includes("John 3:16"), true);
  // Should still have the version
  assertEquals(result.includes("VULG"), true);
});

Deno.test("BibleService - formatVerses - custom max length", () => {
  const service = new BibleService();
  const longText = "This is a long verse. ".repeat(50);
  const verses = [{
    book: "Romans",
    chapter: 8,
    verse: 28,
    text: longText,
    version: "KJV",
    reference: "Romans 8:28",
  }];

  const result = service.formatVerses(verses, 500);

  // Should be truncated to under 500 characters
  assertEquals(result.length <= 500, true);
  // Should include truncation notice
  assertEquals(result.includes("truncated"), true);
});

Deno.test("BibleService - formatVerses - does not truncate short passages", () => {
  const service = new BibleService();
  const shortText = "For God so loved the world.";
  const verses = [{
    book: "John",
    chapter: 3,
    verse: 16,
    text: shortText,
    version: "KJV",
    reference: "John 3:16",
  }];

  const result = service.formatVerses(verses);

  // Should not include truncation notice
  assertEquals(result.includes("truncated"), false);
  // Should have the full text
  assertEquals(result.includes(shortText), true);
});

Deno.test("BibleService - createVerseEmbed - single verse", () => {
  const service = new BibleService();
  const verses = [{
    book: "John",
    chapter: 3,
    verse: 16,
    text: "For God so loved the world",
    version: "KJV",
    reference: "John 3:16",
  }];

  const embed = service.createVerseEmbed(verses);
  const json = embed.toJSON();

  assertEquals(json.title, "John 3:16");
  assertEquals(json.description, "For God so loved the world");
  assertEquals(json.footer?.text, "John 3:16 - King James Version");
  assertEquals(json.color, 0x5865F2);
});

Deno.test("BibleService - createVerseEmbed - with custom title", () => {
  const service = new BibleService();
  const verses = [{
    book: "John",
    chapter: 3,
    verse: 16,
    text: "For God so loved the world",
    version: "WEB",
    reference: "John 3:16",
  }];

  const embed = service.createVerseEmbed(verses, "Daily Verse");
  const json = embed.toJSON();

  assertEquals(json.title, "Daily Verse");
  assertEquals(json.footer?.text, "John 3:16 - World English Bible");
});

Deno.test("BibleService - createVerseEmbed - empty array", () => {
  const service = new BibleService();
  const embed = service.createVerseEmbed([]);
  const json = embed.toJSON();

  assertEquals(json.description, "No verses found.");
  assertEquals(json.color, 0x5865F2);
});

Deno.test("BibleService - createVerseEmbed - Latin Vulgate version", () => {
  const service = new BibleService();
  const verses = [{
    book: "John",
    chapter: 3,
    verse: 16,
    text: "Sic enim Deus dilexit mundum",
    version: "VULG",
    reference: "John 3:16",
  }];

  const embed = service.createVerseEmbed(verses);
  const json = embed.toJSON();

  assertEquals(json.footer?.text, "John 3:16 - Latin Vulgate");
});

Deno.test("BibleService - createVerseEmbed - Greek version", () => {
  const service = new BibleService();
  const verses = [{
    book: "John",
    chapter: 3,
    verse: 16,
    text: "Οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον",
    version: "SBLGNT",
    reference: "John 3:16",
  }];

  const embed = service.createVerseEmbed(verses);
  const json = embed.toJSON();

  assertEquals(json.footer?.text, "John 3:16 - SBL Greek New Testament");
});

Deno.test("BibleService - getVersions - returns array", async () => {
  const service = new BibleService();
  const versions = await service.getVersions();

  assertEquals(Array.isArray(versions), true);
  // bible-api.com versions
  assertEquals(versions.includes("KJV"), true);
  assertEquals(versions.includes("WEB"), true);
  assertEquals(versions.includes("BBE"), true);
  // bolls.life ONLY versions
  assertEquals(versions.includes("VULG"), true);
  assertEquals(versions.includes("WLC"), true);
  assertEquals(versions.includes("LXX"), true);
  assertEquals(versions.includes("SBLGNT"), true);
  assertEquals(versions.includes("BYZ"), true);
  assertEquals(versions.includes("MT"), true);
  assertEquals(versions.includes("TR"), true);
});

Deno.test("BibleService - getVerses - from bolls.life (VULG)", async () => {
  const service = new BibleService();
  // Get Psalm 23:1 specifically
  const verses = await service.getVerses("psalms", 23, 1, 1, "VULG");

  assertEquals(verses.length, 1);
  assertEquals(verses[0].version, "VULG");
  assertEquals(verses[0].verse, 1);
  assertEquals(typeof verses[0].text, "string");
});

Deno.test("BibleService - getVerses - from bolls.life (LXX)", async () => {
  const service = new BibleService();
  // Get Psalm 23:1 specifically
  const verses = await service.getVerses("psalms", 23, 1, 1, "LXX");

  assertEquals(verses.length, 1);
  assertEquals(verses[0].version, "LXX");
  assertEquals(verses[0].verse, 1);
});

Deno.test("BibleService - search - throws error", async () => {
  const service = new BibleService();

  await assertRejects(
    async () => await service.search("love"),
    Error,
    "Text search is not available",
  );
});

// Abbreviated book name tests for parseReference
Deno.test("BibleService - parseReference - abbreviated 1 Cor", () => {
  const service = new BibleService();
  const result = service.parseReference("1 Cor 3:16");

  assertExists(result);
  assertEquals(result.book, "1 corinthians");
  assertEquals(result.chapter, 3);
  assertEquals(result.verseStart, 16);
});

Deno.test("BibleService - parseReference - abbreviated 2 Cor", () => {
  const service = new BibleService();
  const result = service.parseReference("2 Cor 5:17");

  assertExists(result);
  assertEquals(result.book, "2 corinthians");
  assertEquals(result.chapter, 5);
  assertEquals(result.verseStart, 17);
});

Deno.test("BibleService - parseReference - partial 1 Corinth", () => {
  const service = new BibleService();
  const result = service.parseReference("1 Corinth 3:16");

  assertExists(result);
  assertEquals(result.book, "1 corinthians");
  assertEquals(result.chapter, 3);
  assertEquals(result.verseStart, 16);
});

Deno.test("BibleService - parseReference - abbreviated 1 Sam", () => {
  const service = new BibleService();
  const result = service.parseReference("1 Sam 1:1");

  assertExists(result);
  assertEquals(result.book, "1 samuel");
  assertEquals(result.chapter, 1);
  assertEquals(result.verseStart, 1);
});

Deno.test("BibleService - parseReference - abbreviated 2 Ki", () => {
  const service = new BibleService();
  const result = service.parseReference("2 Ki 5:14");

  assertExists(result);
  assertEquals(result.book, "2 kings");
  assertEquals(result.chapter, 5);
  assertEquals(result.verseStart, 14);
});

Deno.test("BibleService - parseReference - abbreviated 1 Pet", () => {
  const service = new BibleService();
  const result = service.parseReference("1 Pet 1:3");

  assertExists(result);
  assertEquals(result.book, "1 peter");
  assertEquals(result.chapter, 1);
  assertEquals(result.verseStart, 3);
});

Deno.test("BibleService - parseReference - abbreviated 1 Jn", () => {
  const service = new BibleService();
  const result = service.parseReference("1 Jn 1:9");

  assertExists(result);
  assertEquals(result.book, "1 john");
  assertEquals(result.chapter, 1);
  assertEquals(result.verseStart, 9);
});

Deno.test("BibleService - parseReference - chapter only abbreviated", () => {
  const service = new BibleService();
  const result = service.parseReference("1 Cor 13");

  assertExists(result);
  assertEquals(result.book, "1 corinthians");
  assertEquals(result.chapter, 13);
  assertEquals(result.verseStart, undefined);
});
