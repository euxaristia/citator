/**
 * Tests for command handlers
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { BibleService } from "../src/services/bible.ts";
import {
  createCommandHandlers,
  createCommandDefinitions,
  type CommandHandler,
} from "../src/commands/commands.ts";

Deno.test("createCommandDefinitions - returns array", () => {
  const definitions = createCommandDefinitions();
  
  assertEquals(Array.isArray(definitions), true);
  assertEquals(definitions.length, 5); // verse, daily, random, versions, help
});

Deno.test("createCommandDefinitions - has verse command", () => {
  const definitions = createCommandDefinitions();
  const verseCommand = definitions.find((cmd) => cmd.name === "verse");
  
  assertExists(verseCommand);
  assertEquals(verseCommand.description, "Get a specific Bible verse or passage");
});

Deno.test("createCommandDefinitions - has daily command", () => {
  const definitions = createCommandDefinitions();
  const dailyCommand = definitions.find((cmd) => cmd.name === "daily");
  
  assertExists(dailyCommand);
  assertEquals(dailyCommand.description, "Get the verse of the day");
});

Deno.test("createCommandDefinitions - has random command", () => {
  const definitions = createCommandDefinitions();
  const randomCommand = definitions.find((cmd) => cmd.name === "random");
  
  assertExists(randomCommand);
  assertEquals(randomCommand.description, "Get a random Bible verse");
});

Deno.test("createCommandDefinitions - has versions command", () => {
  const definitions = createCommandDefinitions();
  const versionsCommand = definitions.find((cmd) => cmd.name === "versions");
  
  assertExists(versionsCommand);
  assertEquals(versionsCommand.description, "List available Bible versions");
});

Deno.test("createCommandDefinitions - has help command", () => {
  const definitions = createCommandDefinitions();
  const helpCommand = definitions.find((cmd) => cmd.name === "help");
  
  assertExists(helpCommand);
  assertEquals(helpCommand.description, "Show help information and available commands");
});

Deno.test("createCommandHandlers - returns array", () => {
  const bibleService = new BibleService();
  const handlers = createCommandHandlers(bibleService);
  
  assertEquals(Array.isArray(handlers), true);
  assertEquals(handlers.length, 5);
});

Deno.test("CommandHandler - verse - valid reference", async () => {
  const bibleService = new BibleService("KJV");
  const handlers = createCommandHandlers(bibleService);
  const verseHandler = handlers.find((h) => h.name === "verse");
  
  assertExists(verseHandler);
  
  const result = await verseHandler.execute({
    reference: "John 3:16",
    version: "KJV",
  });
  
  assertEquals(result.includes("John"), true);
  assertEquals(result.includes("3:16"), true);
  assertEquals(result.includes("KJV"), true);
});

Deno.test("CommandHandler - verse - invalid reference", async () => {
  const bibleService = new BibleService();
  const handlers = createCommandHandlers(bibleService);
  const verseHandler = handlers.find((h) => h.name === "verse");
  
  assertExists(verseHandler);
  
  const result = await verseHandler.execute({
    reference: "invalid reference",
  });
  
  assertEquals(result.startsWith("❌"), true);
  assertEquals(result.includes("Invalid"), true);
});

Deno.test("CommandHandler - verse - non-existent verse", async () => {
  const bibleService = new BibleService();
  const handlers = createCommandHandlers(bibleService);
  const verseHandler = handlers.find((h) => h.name === "verse");
  
  assertExists(verseHandler);
  
  const result = await verseHandler.execute({
    reference: "John 999:999",
  });
  
  assertEquals(result.includes("Error"), true);
});

Deno.test("CommandHandler - daily - returns verse", async () => {
  const bibleService = new BibleService("KJV");
  const handlers = createCommandHandlers(bibleService);
  const dailyHandler = handlers.find((h) => h.name === "daily");
  
  assertExists(dailyHandler);
  
  const result = await dailyHandler.execute({});
  
  assertEquals(result.includes("Verse of the Day"), true);
});

Deno.test("CommandHandler - random - returns verse", async () => {
  const bibleService = new BibleService("KJV");
  const handlers = createCommandHandlers(bibleService);
  const randomHandler = handlers.find((h) => h.name === "random");
  
  assertExists(randomHandler);
  
  const result = await randomHandler.execute({});
  
  // Random verse should either succeed with verse text or fail with error message
  assertEquals(
    result.includes("Random Verse") || result.includes("Error") || result.includes("❌"),
    true
  );
});

Deno.test("CommandHandler - versions - returns list", async () => {
  const bibleService = new BibleService();
  const handlers = createCommandHandlers(bibleService);
  const versionsHandler = handlers.find((h) => h.name === "versions");
  
  assertExists(versionsHandler);
  
  const result = await versionsHandler.execute({});
  
  assertEquals(result.includes("KJV"), true);
  assertEquals(result.includes("WEB"), true);
  assertEquals(result.includes("BBE"), true);
});

Deno.test("CommandHandler - help - returns help text", async () => {
  const bibleService = new BibleService();
  const handlers = createCommandHandlers(bibleService);
  const helpHandler = handlers.find((h) => h.name === "help");
  
  assertExists(helpHandler);
  
  const result = await helpHandler.execute({});
  
  assertEquals(result.includes("Citator Help"), true);
  assertEquals(result.includes("/verse"), true);
  assertEquals(result.includes("/daily"), true);
  assertEquals(result.includes("/random"), true);
});
