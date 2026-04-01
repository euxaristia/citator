/**
 * Tests for BibleService
 */

import { assertEquals, assertRejects, assertExists } from "jsr:@std/assert";
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
    book: "Psalm",
    chapter: 23,
    verseStart: 1,
    verseEnd: 6,
  });
});

Deno.test("BibleService - parseReference - book with number", () => {
  const service = new BibleService();
  const result = service.parseReference("1 John 1:9");
  
  assertExists(result);
  assertEquals(result.book, "1 John");
  assertEquals(result.chapter, 1);
  assertEquals(result.verseStart, 9);
});

Deno.test("BibleService - parseReference - multi-word book", () => {
  const service = new BibleService();
  const result = service.parseReference("Song of Solomon 2:10");
  
  assertExists(result);
  assertEquals(result.book, "Song of Solomon");
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
    "Verse not found"
  );
});

Deno.test("BibleService - getVerses - invalid chapter", async () => {
  const service = new BibleService();
  
  await assertRejects(
    async () => await service.getVerses("john", 999, 1),
    Error,
    "Verse not found"
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

Deno.test("BibleService - getVersions - returns array", async () => {
  const service = new BibleService();
  const versions = await service.getVersions();
  
  assertEquals(Array.isArray(versions), true);
  assertEquals(versions.includes("KJV"), true);
  assertEquals(versions.includes("WEB"), true);
  assertEquals(versions.includes("BBE"), true);
});

Deno.test("BibleService - search - throws error", async () => {
  const service = new BibleService();
  
  await assertRejects(
    async () => await service.search("love"),
    Error,
    "Text search is not available"
  );
});
