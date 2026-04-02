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

  // Result should have embeds
  assertExists(result.embeds);
  assertEquals(result.embeds.length, 1);
  const embedJson = result.embeds[0].toJSON();
  assertEquals(embedJson.footer?.text.includes("3:16"), true);
  assertEquals(embedJson.footer?.text.includes("King James Version"), true);
});

Deno.test("CommandHandler - verse - invalid reference", async () => {
  const bibleService = new BibleService();
  const handlers = createCommandHandlers(bibleService);
  const verseHandler = handlers.find((h) => h.name === "verse");

  assertExists(verseHandler);

  const result = await verseHandler.execute({
    reference: "invalid reference",
  });

  assertEquals(result.content?.startsWith("❌"), true);
  assertEquals(result.content?.includes("Invalid"), true);
});

Deno.test("CommandHandler - verse - non-existent verse", async () => {
  const bibleService = new BibleService();
  const handlers = createCommandHandlers(bibleService);
  const verseHandler = handlers.find((h) => h.name === "verse");

  assertExists(verseHandler);

  const result = await verseHandler.execute({
    reference: "John 999:999",
  });

  assertEquals(result.content?.includes("Error"), true);
});

Deno.test("CommandHandler - daily - returns verse", async () => {
  const bibleService = new BibleService("KJV");
  const handlers = createCommandHandlers(bibleService);
  const dailyHandler = handlers.find((h) => h.name === "daily");

  assertExists(dailyHandler);

  const result = await dailyHandler.execute({});

  // Result should have embeds with "Daily Verse" title
  assertExists(result.embeds);
  assertEquals(result.embeds.length, 1);
  const embedJson = result.embeds[0].toJSON();
  assertEquals(embedJson.title, "Verse of the Day");
});

Deno.test("CommandHandler - random - returns verse", async () => {
  const bibleService = new BibleService("KJV");
  const handlers = createCommandHandlers(bibleService);
  const randomHandler = handlers.find((h) => h.name === "random");

  assertExists(randomHandler);

  const result = await randomHandler.execute({});

  // Random verse should either succeed with embeds or fail with error content
  if (result.embeds) {
    assertEquals(result.embeds.length, 1);
    const embedJson = result.embeds[0].toJSON();
    assertEquals(embedJson.title, "Random Verse");
  } else {
    assertEquals(
      result.content?.includes("Random Verse") || 
      result.content?.includes("Error") || 
      result.content?.includes("❌"),
      true
    );
  }
});

Deno.test("CommandHandler - versions - returns embed", async () => {
  const bibleService = new BibleService();
  const handlers = createCommandHandlers(bibleService);
  const versionsHandler = handlers.find((h) => h.name === "versions");

  assertExists(versionsHandler);

  const result = await versionsHandler.execute({});

  // Result should have embeds
  assertExists(result.embeds);
  assertEquals(result.embeds.length, 1);
  const embedJson = result.embeds[0].toJSON();
  assertEquals(embedJson.title, "📚 Available Bible Versions");
  // Check fields contain version info
  const fields = embedJson.fields || [];
  const hasKJV = fields.some((f: any) => f.value?.includes("KJV"));
  const hasVULG = fields.some((f: any) => f.value?.includes("VULG"));
  assertEquals(hasKJV, true);
  assertEquals(hasVULG, true);
});

Deno.test("CommandHandler - help - returns embed", async () => {
  const bibleService = new BibleService();
  const handlers = createCommandHandlers(bibleService);
  const helpHandler = handlers.find((h) => h.name === "help");

  assertExists(helpHandler);

  const result = await helpHandler.execute({});

  // Result should have embeds
  assertExists(result.embeds);
  assertEquals(result.embeds.length, 1);
  const embedJson = result.embeds[0].toJSON();
  assertEquals(embedJson.title, "📖 Citator Help");
  // Check fields contain command info
  const fields = embedJson.fields || [];
  const hasCommands = fields.some((f: any) => 
    f.value?.includes("/verse") || f.name?.includes("/verse")
  );
  assertEquals(hasCommands, true);
});
