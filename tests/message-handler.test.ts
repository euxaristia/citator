/**
 * Tests for MessageHandler - Automatic Verse Detection
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { BibleService } from "../src/services/bible.ts";
import { DetectedReference, MessageHandler } from "../src/services/message-handler.ts";

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
  assertEquals(refs[0].book.toLowerCase(), "psalms");
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

Deno.test("MessageHandler - detectChapterReferences - John 3", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("Check out John 3 for the whole chapter.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, undefined);
  assertEquals(refs[0].verseEnd, undefined);
});

Deno.test("MessageHandler - detectChapterReferences - Psalm 23", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("Psalm 23 is the shepherd psalm.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "psalms");
  assertEquals(refs[0].chapter, 23);
  assertEquals(refs[0].verseStart, undefined);
});

Deno.test("MessageHandler - detectChapterReferences - 1 Corinthians 13", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("1 Corinthians 13 is the love chapter.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 corinthians");
  assertEquals(refs[0].chapter, 13);
  assertEquals(refs[0].verseStart, undefined);
});

Deno.test("MessageHandler - detectChapterReferences - Romans 8", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("Romans 8 has no condemnation.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "romans");
  assertEquals(refs[0].chapter, 8);
  assertEquals(refs[0].verseStart, undefined);
});

Deno.test("MessageHandler - detectChapterReferences - chapter at start of line", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("John 3 is about being born again.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, undefined);
});

Deno.test("MessageHandler - detectChapterReferences - chapter at end of line", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("Read the whole chapter John 3");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, undefined);
});

Deno.test("MessageHandler - detectChapterReferences - chapter in parentheses", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("The chapter (John 3) discusses Nicodemus.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, undefined);
});

Deno.test("MessageHandler - detectChapterReferences - no chapter reference", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("Hello, how are you today?");

  assertEquals(refs.length, 0);
});

Deno.test("MessageHandler - detectChapterReferences - does not match verse reference", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  // When there's a verse reference, chapter-only detection should not match
  const refs = handler.detectChapterReferences("John 3:16 is the verse.");

  assertEquals(refs.length, 0);
});

Deno.test("MessageHandler - detectChapterReferences - Song of Solomon 2", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("Song of Solomon 2 is romantic.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "song of solomon");
  assertEquals(refs[0].chapter, 2);
  assertEquals(refs[0].verseStart, undefined);
});

Deno.test("MessageHandler - detectChapterReferences - 2 Samuel 7", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("2 Samuel 7 contains God's covenant with David.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "2 samuel");
  assertEquals(refs[0].chapter, 7);
  assertEquals(refs[0].verseStart, undefined);
});

// Version detection tests
Deno.test("MessageHandler - detectVersion - Greek NT", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 1 Greek NT");
  assertEquals(version, "SBLGNT");
});

Deno.test("MessageHandler - detectVersion - Greek", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 3:16 Greek");
  assertEquals(version, "SBLGNT");
});

Deno.test("MessageHandler - detectVersion - Latin", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 1:1 Latin");
  assertEquals(version, "VULG");
});

Deno.test("MessageHandler - detectVersion - KJV", () => {
  const bibleService = new BibleService("WEB");
  const handler = new MessageHandler(bibleService, "WEB");

  const version = handler.detectVersion("John 3:16 KJV");
  assertEquals(version, "KJV");
});

Deno.test("MessageHandler - detectVersion - SBLGNT explicit", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 1 SBLGNT");
  assertEquals(version, "SBLGNT");
});

Deno.test("MessageHandler - detectVersion - Byzantine", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 1 Byzantine");
  assertEquals(version, "BYZ");
});

Deno.test("MessageHandler - detectVersion - Textus Receptus", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 1 Textus Receptus");
  assertEquals(version, "TR");
});

Deno.test("MessageHandler - detectVersion - Hebrew", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("Genesis 1:1 Hebrew");
  assertEquals(version, "MT");
});

Deno.test("MessageHandler - detectVersion - Vulgate", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 1:1 Vulgate");
  assertEquals(version, "VULG");
});

Deno.test("MessageHandler - detectVersion - LXX", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("Genesis 1 LXX");
  assertEquals(version, "LXX");
});

Deno.test("MessageHandler - detectVersion - Septuagint", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("Genesis 1 Septuagint");
  assertEquals(version, "LXX");
});

Deno.test("MessageHandler - detectVersion - no version specified", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 3:16");
  assertEquals(version, undefined);
});

Deno.test("MessageHandler - detectVersion - King James Version", () => {
  const bibleService = new BibleService("WEB");
  const handler = new MessageHandler(bibleService, "WEB");

  const version = handler.detectVersion("John 3:16 King James Version");
  assertEquals(version, "KJV");
});

Deno.test("MessageHandler - detectVersion - WLC", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("Genesis 1:1 WLC");
  assertEquals(version, "WLC");
});

Deno.test("MessageHandler - detectVersion - Masoretic Text", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("Genesis 1:1 Masoretic Text");
  assertEquals(version, "MT");
});

Deno.test("MessageHandler - detectVersion - case insensitive", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 1 greek nt");
  assertEquals(version, "SBLGNT");
});

Deno.test("MessageHandler - detectVersion - with verse reference", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("Check out John 3:16 Greek NT for inspiration");
  assertEquals(version, "SBLGNT");
});

Deno.test("MessageHandler - detectVersion - chapter reference", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("Read John 1 Greek NT");
  assertEquals(version, "SBLGNT");
});

// Abbreviated book name tests
Deno.test("MessageHandler - detectVerseReferences - 1 Cor 3:16", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Read 1 Cor 3:16 today.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 corinthians");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
});

Deno.test("MessageHandler - detectVerseReferences - 2 Cor 5:17", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("2 Cor 5:17 is powerful.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "2 corinthians");
  assertEquals(refs[0].chapter, 5);
  assertEquals(refs[0].verseStart, 17);
});

Deno.test("MessageHandler - detectVerseReferences - 1 Corinth 3:16", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Read 1 Corinth 3:16 today.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 corinthians");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
});

Deno.test("MessageHandler - detectVerseReferences - 2 Corinth 5:17", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("2 Corinth 5:17 is powerful.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "2 corinthians");
  assertEquals(refs[0].chapter, 5);
  assertEquals(refs[0].verseStart, 17);
});

Deno.test("MessageHandler - detectVerseReferences - 1 Sam 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("1 Sam 1:1 starts the story.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 samuel");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - 2 Ki 5:14", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("2 Ki 5:14 tells of Naaman's healing.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "2 kings");
  assertEquals(refs[0].chapter, 5);
  assertEquals(refs[0].verseStart, 14);
});

Deno.test("MessageHandler - detectVerseReferences - 1 Pet 1:3", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("1 Pet 1:3 speaks of living hope.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 peter");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 3);
});

Deno.test("MessageHandler - detectVerseReferences - 1 Jn 1:9", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("1 Jn 1:9 promises forgiveness.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 john");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 9);
});

Deno.test("MessageHandler - detectChapterReferences - 1 Cor 13", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("1 Cor 13 is the love chapter.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 corinthians");
  assertEquals(refs[0].chapter, 13);
  assertEquals(refs[0].verseStart, undefined);
});

Deno.test("MessageHandler - detectChapterReferences - 2 Cor 5", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("2 Cor 5 talks about new creation.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "2 corinthians");
  assertEquals(refs[0].chapter, 5);
  assertEquals(refs[0].verseStart, undefined);
});

Deno.test("MessageHandler - detectVerseReferences - Matt 5:44", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Matt 5:44 says love your enemies.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "matthew");
  assertEquals(refs[0].chapter, 5);
  assertEquals(refs[0].verseStart, 44);
});

Deno.test("MessageHandler - detectVerseReferences - Gen 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Gen 1:1 is the first verse.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "genesis");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - Rom 8:28", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Rom 8:28 is encouraging.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "romans");
  assertEquals(refs[0].chapter, 8);
  assertEquals(refs[0].verseStart, 28);
});

Deno.test("MessageHandler - detectVerseReferences - Rev 22:21", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Rev 22:21 is the last verse.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "revelation");
  assertEquals(refs[0].chapter, 22);
  assertEquals(refs[0].verseStart, 21);
});

Deno.test("MessageHandler - detectVerseReferences - Ps 23:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Ps 23:1 is well known.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "psalms");
  assertEquals(refs[0].chapter, 23);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - Phil 4:13", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Phil 4:13 is popular.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "philippians");
  assertEquals(refs[0].chapter, 4);
  assertEquals(refs[0].verseStart, 13);
});

Deno.test("MessageHandler - detectVerseReferences - Heb 11:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Heb 11:1 defines faith.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "hebrews");
  assertEquals(refs[0].chapter, 11);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVersion - Isa 53:5", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Isa 53:5 prophesies about Jesus.");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "isaiah");
  assertEquals(refs[0].chapter, 53);
  assertEquals(refs[0].verseStart, 5);
});

Deno.test("MessageHandler - detectVersion - NIV", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("Matt 5:44 NIV");
  assertEquals(version, "NIV");
});

Deno.test("MessageHandler - detectVersion - ESV", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 3:16 ESV");
  assertEquals(version, "ESV");
});

Deno.test("MessageHandler - detectVersion - NASB", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("Rom 8:28 NASB");
  assertEquals(version, "NASB");
});

Deno.test("MessageHandler - detectVersion - New International Version", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 3:16 New International Version");
  assertEquals(version, "NIV");
});

Deno.test("MessageHandler - detectVersion - CSB", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 3:16 CSB");
  assertEquals(version, "CSB");
});

Deno.test("MessageHandler - detectVersion - Christian Standard Bible", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const version = handler.detectVersion("John 3:16 Christian Standard Bible");
  assertEquals(version, "CSB");
});

// Deuterocanonical book detection tests
Deno.test("MessageHandler - detectVerseReferences - Wisdom 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Wisdom 1:1 is great");
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "wisdom");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - Sirach 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Sirach 1:1");
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "sirach");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - Tobit 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Tobit 1:1");
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "tobit");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - 1 Maccabees 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("1 Maccabees 1:1");
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "1 maccabees");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - Baruch 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Baruch 1:1");
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "baruch");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectVerseReferences - Judith 1:1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Judith 1:1");
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "judith");
  assertEquals(refs[0].chapter, 1);
  assertEquals(refs[0].verseStart, 1);
});

Deno.test("MessageHandler - detectChapterReferences - Wisdom 1", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("Wisdom 1");
  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "wisdom");
  assertEquals(refs[0].chapter, 1);
});

// Embedded reference tests - should NOT detect references in conversational messages
Deno.test("MessageHandler - detectVerseReferences - ignores embedded reference with text before and after", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("I really like John 3:16 because it shows God's love.");

  assertEquals(refs.length, 0);
});

Deno.test("MessageHandler - detectVerseReferences - ignores embedded reference in longer message", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("The pastor mentioned Romans 8:28 in his sermon today.");

  assertEquals(refs.length, 0);
});

Deno.test("MessageHandler - detectVerseReferences - detects reference with minimal surrounding text", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("Read John 3:16 today");

  assertEquals(refs.length, 1);
  assertEquals(refs[0].book.toLowerCase(), "john");
  assertEquals(refs[0].chapter, 3);
  assertEquals(refs[0].verseStart, 16);
});

Deno.test("MessageHandler - detectVerseReferences - detects reference at start", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("John 3:16 is about God's love");

  assertEquals(refs.length, 1);
});

Deno.test("MessageHandler - detectVerseReferences - detects reference at end", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("My favorite verse is John 3:16");

  assertEquals(refs.length, 1);
});

Deno.test("MessageHandler - detectChapterReferences - ignores embedded chapter reference", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectChapterReferences("The sermon on John 3 was really good today");

  assertEquals(refs.length, 0);
});

Deno.test("MessageHandler - detectVerseReferences - detects standalone reference", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("John 3:16");

  assertEquals(refs.length, 1);
});

Deno.test("MessageHandler - detectVerseReferences - detects reference with short prefix", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("See John 3:16");

  assertEquals(refs.length, 1);
});

Deno.test("MessageHandler - detectVerseReferences - ignores embedded reference with many words before and after", () => {
  const bibleService = new BibleService("KJV");
  const handler = new MessageHandler(bibleService, "KJV");

  const refs = handler.detectVerseReferences("I was reading through the Bible and came across Psalm 23:1 which is beautiful to read");

  assertEquals(refs.length, 0);
});
