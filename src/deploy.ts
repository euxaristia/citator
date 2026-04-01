/**
 * Deploy Slash Commands
 * Register the bot's slash commands with Discord
 */

import { REST, Routes } from "npm:discord.js";
import { createCommandDefinitions } from "./commands/commands.ts";

const CITATOR_DISCORD_TOKEN = Deno.env.get("CITATOR_DISCORD_TOKEN");
const CITATOR_CLIENT_ID = Deno.env.get("CITATOR_CLIENT_ID");
const CITATOR_GUILD_ID = Deno.env.get("CITATOR_GUILD_ID");

if (!CITATOR_DISCORD_TOKEN) {
  console.error("❌ Missing required environment variable: CITATOR_DISCORD_TOKEN");
  Deno.exit(1);
}

// Create REST client
const rest = new REST({ version: "10" }).setToken(CITATOR_DISCORD_TOKEN);

// Get client ID from env or fetch from API
let clientId = CITATOR_CLIENT_ID;
if (!clientId) {
  console.log("⏳ No CITATOR_CLIENT_ID provided, fetching from Discord API...");
  try {
    const response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bot ${CITATOR_DISCORD_TOKEN}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch client ID: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    clientId = data.id;
    console.log(`✅ Found client ID: ${clientId}`);
  } catch (error) {
    console.error("❌ Failed to fetch client ID:", error);
    console.error("   Please set CITATOR_CLIENT_ID environment variable");
    Deno.exit(1);
  }
}

// Get commands
const commands = createCommandDefinitions();

try {
  console.log("📝 Started refreshing application (/) commands.");

  if (CITATOR_GUILD_ID) {
    // Guild-specific commands (faster for testing)
    const responseData = await rest.put(
      Routes.applicationGuildCommands(clientId, CITATOR_GUILD_ID),
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
      Routes.applicationCommands(clientId),
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
