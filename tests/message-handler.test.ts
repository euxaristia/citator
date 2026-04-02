/**
 * Tests for MessageHandler - Automatic Verse Detection
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { BibleService } from "../src/services/bible.ts";
import { MessageHandler, DetectedReference } from "../src/services/message-handler.ts";

Deno.test("MessageHandler - detectVerseReferences - John 3:16", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("Check out John 3:16 for inspiration!");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
  assertEquals(refs[0].verseEnd, undefined);
});

Deno.test("MessageHandler - detectVerseReferences - Psalm 23:1-6", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("Psalm 23:1-6 is my favorite passage.");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "psalm");
  assertEquals(refs[0].chapter, 23);
  assertEquals(refs[0].verseStart, 1);
  assertEquals(refs[0].verseEnd, 6);
});

Deno.test("MessageHandler - detectVerseReferences - 1 John 3:16", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("Read 1 John 3:16 today.");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
});

Deno.test("MessageHandler - detectVerseReferences - 2 Corinthians 5:17", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("2 Corinthians 5:17 says we are new creations.");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "2 corinthians");
  assertEquals(refs[0].chapter, 5);
  assertEquals(refs[0].verseStart, 17);
});

Deno.test("MessageHandler - detectVerseReferences - Song of Solomon 2:3", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("Song of Solomon 2:3 is beautiful.");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "song of solomon");
  assertEquals(refs[0].chapter, 2);
  assertEquals(refs[0].verseStart, 3);
});

Deno.test("MessageHandler - detectVerseReferences - multiple references", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("John 3:16 and Romans 8:28 are great verses.");
  
  assertEquals(refs.length, 2);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
  assertEquals(refs[1].book.toLowerCase(), "romans");
  assertEquals(refs[1].chapter, 8);
  assertEquals(refs[1].verseStart, 28);
});

Deno.test("MessageHandler - detectVerseReferences - reference in parentheses", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("God loves you (John 3:16)");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
});

Deno.test("MessageHandler - detectVerseReferences - reference at start of line", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("John 3:16 is the gospel in a nutshell.");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
});

Deno.test("MessageHandler - detectVerseReferences - reference at end of line", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("The most famous verse is John 3:16");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
});

Deno.test("MessageHandler - detectVerseReferences - no reference in message", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("Hello, how are you today?");
  
  assertEquals(refs.length, 0);
});

Deno.test("MessageHandler - detectVerseReferences - invalid book name", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("Fakebook 3:16 is not real.");
  
  assertEquals(refs.length, 0);
});

Deno.test("MessageHandler - detectVerseReferences - ignores bot-like patterns", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  // This should not match as it's not a valid book
  const refs = handler.detectVerseReferences("Check out this ratio 3:16 in the recipe.");
  
  assertEquals(refs.length, 0);
});

Deno.test("MessageHandler - detectVerseReferences - Genesis 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("In the beginning Genesis 1:1");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "genesis");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - Revelation 22:21", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("Revelation 22:21 ends the Bible.");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "revelation");
  assertEquals(refs[0].chapter, 22);
  assertEquals(refs[0].verseStart, 21);
});

Deno.test("MessageHandler - detectVerseReferences - with newline separation", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const message = "Good morning!\nJohn 3:16\nHave a blessed day!";
  const refs = handler.detectVerseReferences(message);
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
});

Deno.test("MessageHandler - detectVerseReferences - 1 Samuel 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("1 Samuel 1:1 starts the story.");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 samuel");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - 3 John 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");
  
  const refs = handler.detectVerseReferences("3 John 1:1 is a short book.");
  
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "3 john");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});
