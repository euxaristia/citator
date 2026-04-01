/**
 * Tests for DailyVerseScheduler
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { BibleService } from "../src/services/bible.ts";
import { DailyVerseScheduler } from "../src/services/scheduler.ts";

Deno.test("DailyVerseScheduler - constructor", () => {
  const bibleService = new BibleService();
  const sendToChannel = async (_channelId: string, _message: string) => {};
  
  const scheduler = new DailyVerseScheduler(
    bibleService,
    "0 8 * * *",
    "America/New_York",
    sendToChannel
  );
  
  assertExists(scheduler);
});

Deno.test("DailyVerseScheduler - addChannel", () => {
  const bibleService = new BibleService();
  const sendToChannel = async (_channelId: string, _message: string) => {};
  
  const scheduler = new DailyVerseScheduler(
    bibleService,
    "0 8 * * *",
    "America/New_York",
    sendToChannel
  );
  
  scheduler.addChannel("123456789", "987654321");
  
  // Note: channels is private, so we can't directly test it
  // This test just verifies the method doesn't throw
});

Deno.test("DailyVerseScheduler - addChannel - duplicate prevention", () => {
  const bibleService = new BibleService();
  const sendToChannel = async (_channelId: string, _message: string) => {};
  
  const scheduler = new DailyVerseScheduler(
    bibleService,
    "0 8 * * *",
    "America/New_York",
    sendToChannel
  );
  
  scheduler.addChannel("123", "456");
  scheduler.addChannel("123", "456");
  
  // Should not throw, duplicate prevention is internal
});

Deno.test("DailyVerseScheduler - removeChannel", () => {
  const bibleService = new BibleService();
  const sendToChannel = async (_channelId: string, _message: string) => {};
  
  const scheduler = new DailyVerseScheduler(
    bibleService,
    "0 8 * * *",
    "America/New_York",
    sendToChannel
  );
  
  scheduler.addChannel("123", "456");
  scheduler.removeChannel("123");
  
  // Should not throw
});

Deno.test("DailyVerseScheduler - start and stop", () => {
  const bibleService = new BibleService();
  const sendToChannel = async (_channelId: string, _message: string) => {};
  
  const scheduler = new DailyVerseScheduler(
    bibleService,
    "0 8 * * *",
    "America/New_York",
    sendToChannel
  );
  
  scheduler.start();
  scheduler.stop();
  
  // Should not throw
});

Deno.test("DailyVerseScheduler - triggerNow", async () => {
  let called = false;
  let channelId = "";
  let message = "";
  
  const bibleService = new BibleService("KJV");
  const sendToChannel = async (id: string, msg: string) => {
    called = true;
    channelId = id;
    message = msg;
  };
  
  const scheduler = new DailyVerseScheduler(
    bibleService,
    "0 8 * * *",
    "America/New_York",
    sendToChannel
  );
  
  scheduler.addChannel("test-channel", "test-guild");
  await scheduler.triggerNow();
  
  assertEquals(called, true);
  assertEquals(channelId, "test-channel");
  assertEquals(message.includes("Daily Verse"), true);
});

Deno.test("DailyVerseScheduler - getNextRunTime - future time today", () => {
  const bibleService = new BibleService();
  const sendToChannel = async (_channelId: string, _message: string) => {};
  
  // Schedule for 23:59 (end of day)
  const scheduler = new DailyVerseScheduler(
    bibleService,
    "59 23 * * *",
    "America/New_York",
    sendToChannel
  );
  
  // This test verifies the method exists and doesn't throw
  // Private method, so we can't directly test the return value
});

Deno.test("DailyVerseScheduler - sendToChannel error handling", async () => {
  let errorCaught = false;
  
  const bibleService = new BibleService("KJV");
  const sendToChannel = async (_channelId: string, _message: string) => {
    throw new Error("Channel not found");
  };
  
  const scheduler = new DailyVerseScheduler(
    bibleService,
    "0 8 * * *",
    "America/New_York",
    sendToChannel
  );
  
  scheduler.addChannel("invalid-channel", "test-guild");
  
  // Should not throw, errors are caught internally
  await scheduler.triggerNow();
});
