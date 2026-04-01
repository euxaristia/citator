/**
 * Deploy Slash Commands
 * Register the bot's slash commands with Discord
 */

import { load } from "std/dotenv/mod.ts";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { createCommandDefinitions } from "./commands/commands.ts";

// Load environment variables
const env = await load({ export: true });

const DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN");
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID");
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID");

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error("❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment");
  Deno.exit(1);
}

// Create REST client
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

// Get commands
const commands = createCommandDefinitions();

try {
  console.log("📝 Started refreshing application (/) commands.");

  if (DISCORD_GUILD_ID) {
    // Guild-specific commands (faster for testing)
    const responseData = await rest.put(
      Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
      { body: commands }
    );
    console.log(
      `✅ Successfully registered ${
        (responseData as any[]).length
      } guild commands for guild ${DISCORD_GUILD_ID}`
    );
  } else {
    // Global commands
    const responseData = await rest.put(
      Routes.applicationCommands(DISCORD_CLIENT_ID),
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
