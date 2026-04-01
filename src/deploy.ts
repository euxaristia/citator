/**
 * Deploy Slash Commands
 * Register the bot's slash commands with Discord
 */

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { createCommandDefinitions } from "./commands/commands.ts";

const CITATOR_DISCORD_TOKEN = Deno.env.get("CITATOR_DISCORD_TOKEN");
const CITATOR_CLIENT_ID = Deno.env.get("CITATOR_CLIENT_ID");
const CITATOR_GUILD_ID = Deno.env.get("CITATOR_GUILD_ID");

if (!CITATOR_DISCORD_TOKEN || !CITATOR_CLIENT_ID) {
  console.error("❌ Missing CITATOR_DISCORD_TOKEN or CITATOR_CLIENT_ID in environment");
  Deno.exit(1);
}

// Create REST client
const rest = new REST({ version: "10" }).setToken(CITATOR_DISCORD_TOKEN);

// Get commands
const commands = createCommandDefinitions();

try {
  console.log("📝 Started refreshing application (/) commands.");

  if (CITATOR_GUILD_ID) {
    // Guild-specific commands (faster for testing)
    const responseData = await rest.put(
      Routes.applicationGuildCommands(CITATOR_CLIENT_ID, CITATOR_GUILD_ID),
      { body: commands }
    );
    console.log(
      `✅ Successfully registered ${
        (responseData as any[]).length
      } guild commands for guild ${CITATOR_GUILD_ID}`
    );
  } else {
    // Global commands
    const responseData = await rest.put(
      Routes.applicationCommands(CITATOR_CLIENT_ID),
      { body: commands }
    );
    console.log(
      `✅ Successfully registered ${
        (responseData as any[]).length
      } global commands`
    );
    console.log(
      "⏳ Note: Global commands may take up to an hour to appear in all servers"
    );
  }
} catch (error) {
  console.error("❌ Error registering commands:", error);
  Deno.exit(1);
}
