/**
 * Tests for BibleService
 */

import { assertEquals, assertExists, assertRejects } from "jsr:@std/assert";
import { BibleService } from "../src/services/bible.ts";

Deno.test("BibleService - parseReference - single verse", () => {
  const service = new BibleService();
  const result = service.parseReference("John 3:16");

  assertEquals(result, {
    book: "john",
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
    reference: "Ioannes 3:16",
  }];

  const result = service.formatVerses(verses);

  // Should be truncated to under 2000 characters
  assertEquals(result.length <= 2000, true);
  // Should include truncation notice
  assertEquals(result.includes("truncated"), true);
  // Should still have the reference (Latin book name for VULG)
  assertEquals(result.includes("Ioannes 3:16"), true);
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
    reference: "Ioannes 3:16",
  }];

  const embed = service.createVerseEmbed(verses);
  const json = embed.toJSON();

  assertEquals(json.footer?.text, "Ioannes 3:16 - Latin Vulgate");
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

Deno.test("BibleService - parseReference - abbreviated Matt", () => {
  const service = new BibleService();
  const result = service.parseReference("Matt 5:44");

  assertExists(result);
  assertEquals(result.book, "matthew");
  assertEquals(result.chapter, 5);
  assertEquals(result.verseStart, 44);
});

Deno.test("BibleService - parseReference - abbreviated Gen", () => {
  const service = new BibleService();
  const result = service.parseReference("Gen 1:1");

  assertExists(result);
  assertEquals(result.book, "genesis");
  assertEquals(result.chapter, 1);
  assertEquals(result.verseStart, 1);
});

Deno.test("BibleService - parseReference - abbreviated Rom", () => {
  const service = new BibleService();
  const result = service.parseReference("Rom 8:28");

  assertExists(result);
  assertEquals(result.book, "romans");
  assertEquals(result.chapter, 8);
  assertEquals(result.verseStart, 28);
});

Deno.test("BibleService - parseReference - abbreviated Rev", () => {
  const service = new BibleService();
  const result = service.parseReference("Rev 22:21");

  assertExists(result);
  assertEquals(result.book, "revelation");
  assertEquals(result.chapter, 22);
  assertEquals(result.verseStart, 21);
});

Deno.test("BibleService - parseReference - abbreviated Ps", () => {
  const service = new BibleService();
  const result = service.parseReference("Ps 23:1");

  assertExists(result);
  assertEquals(result.book, "psalms");
  assertEquals(result.chapter, 23);
  assertEquals(result.verseStart, 1);
});

Deno.test("BibleService - parseReference - abbreviated Phil", () => {
  const service = new BibleService();
  const result = service.parseReference("Phil 4:13");

  assertExists(result);
  assertEquals(result.book, "philippians");
  assertEquals(result.chapter, 4);
  assertEquals(result.verseStart, 13);
});

Deno.test("BibleService - parseReference - abbreviated Heb", () => {
  const service = new BibleService();
  const result = service.parseReference("Heb 11:1");

  assertExists(result);
  assertEquals(result.book, "hebrews");
  assertEquals(result.chapter, 11);
  assertEquals(result.verseStart, 1);
});

Deno.test("BibleService - parseReference - abbreviated Isa", () => {
  const service = new BibleService();
  const result = service.parseReference("Isa 53:5");

  assertExists(result);
  assertEquals(result.book, "isaiah");
  assertEquals(result.chapter, 53);
  assertEquals(result.verseStart, 5);
});

Deno.test("BibleService - parseReference - Wisdom", () => {
  const service = new BibleService();
  const result = service.parseReference("Wisdom 1:1");

  assertExists(result);
  assertEquals(result.book, "wisdom");
  assertEquals(result.chapter, 1);
  assertEquals(result.verseStart, 1);
});

Deno.test("BibleService - parseReference - Sirach", () => {
  const service = new BibleService();
  const result = service.parseReference("Sirach 1:1");

  assertExists(result);
  assertEquals(result.book, "sirach");
  assertEquals(result.chapter, 1);
  assertEquals(result.verseStart, 1);
});

Deno.test("BibleService - getVerses - Wisdom 1:1 (deuterocanonical)", async () => {
  const service = new BibleService("KJV");
  const verses = await service.getVerses("wisdom", 1, 1);

  assertEquals(verses.length, 1);
  assertEquals(verses[0].verse, 1);
  assertEquals(verses[0].version, "KJV"); // bible-api.com KJV includes apocrypha
});

Deno.test("BibleService - getVerses - Wisdom 1:1 with VULG", async () => {
  const service = new BibleService("KJV");
  const verses = await service.getVerses("wisdom", 1, 1, undefined, "VULG");

  assertEquals(verses.length, 1);
  assertEquals(verses[0].verse, 1);
  assertEquals(verses[0].version, "VULG");
});

Deno.test("BibleService - getVerses - Spanish deuterocanonical falls back to Latin Vulgate", async () => {
  const service = new BibleService();
  // "Sabiduría" (Wisdom) with RV1960 should fall back to VULG (Latin Vulgate)
  // since bolls.life has no Spanish Catholic translations with deuterocanonical books
  // VULG is closer to Spanish than English and is the actual Catholic source text
  const verses = await service.getVerses("wisdom", 1, 1, undefined, "RV1960");

  assertEquals(verses.length, 1);
  assertEquals(verses[0].verse, 1);
  assertEquals(verses[0].version, "VULG");
});

Deno.test("BibleService - getVerses - non-Spanish deuterocanonical still falls back to NRSVCE", async () => {
  const service = new BibleService();
  // SBLGNT (Greek NT) goes through bolls but doesn't have deuterocanonical books,
  // so it should fall back to NRSVCE for Wisdom
  const verses = await service.getVerses("wisdom", 1, 1, undefined, "SBLGNT");

  assertEquals(verses.length, 1);
  assertEquals(verses[0].verse, 1);
  // Should have fallen back to NRSVCE since SBLGNT doesn't have deuterocanonical on bolls
  assertEquals(verses[0].version, "NRSVCE");
});

Deno.test("BibleService - createVerseEmbed - Latin Vulgate uses Latin book name", () => {
  const service = new BibleService();
  // When the version is VULG, the embed title/footer should use Latin book names
  const verses = [{
    book: "wisdom",
    chapter: 1,
    verse: 1,
    text: "Diligite justitiam, qui judicatis terram.",
    version: "VULG",
    reference: "Sapientia 1:1",
  }];

  const embed = service.createVerseEmbed(verses);
  const json = embed.toJSON();

  // Title should be "Sapientia 1:1" not "Wisdom 1:1"
  assertEquals(json.title, "Sapientia 1:1");
  assertEquals(json.footer?.text, "Sapientia 1:1 - Latin Vulgate");
});

Deno.test("BibleService - createVerseEmbed - Spanish version uses Spanish book name", () => {
  const service = new BibleService();
  // When the version is RV1960, the embed title/footer should use Spanish book names
  const verses = [{
    book: "psalms",
    chapter: 58,
    verse: 1,
    text: "Oh congregación, ¿pronunciáis en verdad justicia?",
    version: "RV1960",
    reference: "Salmos 58:1",
  }];

  const embed = service.createVerseEmbed(verses);
  const json = embed.toJSON();

  // Title should be "Salmos 58:1" not "Psalms 58:1"
  assertEquals(json.title, "Salmos 58:1");
  // Footer should use Spanish book name
  assertEquals(json.footer?.text, "Salmos 58:1 - Reina-Valera 1960");
});

Deno.test("BibleService - createVerseEmbed - English version uses English book name", () => {
  const service = new BibleService();
  const verses = [{
    book: "psalms",
    chapter: 23,
    verse: 1,
    text: "The Lord is my shepherd",
    version: "KJV",
    reference: "Psalms 23:1",
  }];

  const embed = service.createVerseEmbed(verses);
  const json = embed.toJSON();

  assertEquals(json.title, "Psalms 23:1");
  assertEquals(json.footer?.text, "Psalms 23:1 - King James Version");
});

Deno.test("BibleService - createVerseEmbed - multi-verse Spanish range", () => {
  const service = new BibleService();
  const verses = [
    {
      book: "genesis",
      chapter: 1,
      verse: 1,
      text: "En el principio creó Dios",
      version: "RV1960",
      reference: "Génesis 1:1",
    },
    {
      book: "genesis",
      chapter: 1,
      verse: 2,
      text: "Y la tierra estaba desordenada",
      version: "RV1960",
      reference: "Génesis 1:2",
    },
  ];

  const embed = service.createVerseEmbed(verses);
  const json = embed.toJSON();

  assertEquals(json.title, "Génesis 1:1-2");
  assertEquals(json.footer?.text, "Génesis 1:1-2 - Reina-Valera 1960");
});

Deno.test("BibleService - getVerses - SBLGNT falls back to TR when empty", async () => {
  const service = new BibleService();
  // SBLGNT returns empty data from bolls.life, should fall back to TR
  const verses = await service.getVerses("john", 1, 1, undefined, "SBLGNT");

  assertEquals(verses.length, 1);
  assertEquals(verses[0].verse, 1);
  assertEquals(verses[0].chapter, 1);
  // Version should be TR after fallback
  assertEquals(verses[0].version, "TR");
});
