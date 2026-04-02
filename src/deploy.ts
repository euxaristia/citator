/**
 * Deploy Slash Commands
 * Register the bot's slash commands with Discord
 */

import { REST, Routes } from "npm:discord.js";
import { createCommandDefinitions } from "./commands/commands.ts";

const PRIMASCRIPTURA_DISCORD_TOKEN = Deno.env.get("PRIMASCRIPTURA_DISCORD_TOKEN");
const PRIMASCRIPTURA_CLIENT_ID = Deno.env.get("PRIMASCRIPTURA_CLIENT_ID");
const PRIMASCRIPTURA_GUILD_ID = Deno.env.get("PRIMASCRIPTURA_GUILD_ID");

if (!PRIMASCRIPTURA_DISCORD_TOKEN) {
  console.error("❌ Missing required environment variable: PRIMASCRIPTURA_DISCORD_TOKEN");
  Deno.exit(1);
}

// Create REST client
const rest = new REST({ version: "10" }).setToken(PRIMASCRIPTURA_DISCORD_TOKEN);

// Get client ID from env or fetch from API
let clientId = PRIMASCRIPTURA_CLIENT_ID;
if (!clientId) {
  console.log("⏳ No PRIMASCRIPTURA_CLIENT_ID provided, fetching from Discord API...");
  try {
    const response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bot ${PRIMASCRIPTURA_DISCORD_TOKEN}`,
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
    console.error("   Please set PRIMASCRIPTURA_CLIENT_ID environment variable");
    Deno.exit(1);
  }
}

// Get commands
const commands = createCommandDefinitions();

try {
  console.log("📝 Started refreshing application (/) commands.");

  if (PRIMASCRIPTURA_GUILD_ID) {
    // Guild-specific commands (faster for testing)
    const responseData = await rest.put(
      Routes.applicationGuildCommands(clientId, PRIMASCRIPTURA_GUILD_ID),
      { body: commands }
    );
    console.log(
      `✅ Successfully registered ${
        (responseData as any[]).length
      } guild commands for guild ${PRIMASCRIPTURA_GUILD_ID}`
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
