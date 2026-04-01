/**
 * BibleBot for Discord
 * A Deno-based Discord bot for delivering scripture
 * 
 * Scripture from your Discord client to your heart ❤️
 */

import { load } from "std/dotenv/mod.ts";
import { Client } from "@discordjs/core";
import { BibleService } from "./services/bible.ts";
import { DailyVerseScheduler } from "./services/scheduler.ts";
import { createCommandHandlers } from "./commands/commands.ts";

// Load environment variables
const env = await load({ export: true });

const DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN");
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID");
const DAILY_VERSE_SCHEDULE = Deno.env.get("DAILY_VERSE_SCHEDULE") || "0 8 * * *";
const DEFAULT_VERSION = Deno.env.get("DEFAULT_VERSION") || "ESV";
const TIMEZONE = Deno.env.get("TIMEZONE") || "America/New_York";

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error("❌ Missing required environment variables:");
  console.error("   - DISCORD_TOKEN");
  console.error("   - DISCORD_CLIENT_ID");
  console.error("\nPlease copy .env.example to .env and fill in your values.");
  Deno.exit(1);
}

// Initialize services
const bibleService = new BibleService(DEFAULT_VERSION);
const commandHandlers = createCommandHandlers(bibleService);

// Create Discord client
const client = new Client({
  token: DISCORD_TOKEN,
});

// Track channels for daily verses (in production, you'd want to persist this)
const dailyVerseChannels = new Set<string>();

/**
 * Send a message to a channel
 */
async function sendToChannel(channelId: string, message: string): Promise<void> {
  try {
    await client.api.channels[channelId].messages.post({
      body: { content: message },
    });
  } catch (error) {
    console.error(`Failed to send to channel ${channelId}:`, error);
    throw error;
  }
}

// Initialize scheduler
const scheduler = new DailyVerseScheduler(
  bibleService,
  DAILY_VERSE_SCHEDULE,
  TIMEZONE,
  sendToChannel
);

console.log("📖 Citator starting up...");
console.log(`   Default Version: ${DEFAULT_VERSION}`);
console.log(`   Daily Verse Schedule: ${DAILY_VERSE_SCHEDULE} (${TIMEZONE})`);

// Event: Ready
client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user?.username}#${client.user?.discriminator}`);
  console.log(`   ID: ${client.user?.id}`);
  console.log(`   Servers: ${client.guilds.cache.size}`);
  console.log("\n📝 Remember to run: deno task deploy");
  console.log("   to register slash commands with Discord.\n");
  
  // Start daily verse scheduler
  scheduler.start();
});

// Event: Interaction (slash commands)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;
  const handler = commandHandlers.find((h) => h.name === commandName);

  if (!handler) {
    await interaction.reply({
      content: "❌ Unknown command",
      ephemeral: true,
    });
    return;
  }

  // Defer reply to give us time to process
  await interaction.deferReply();

  try {
    // Extract command arguments
    const args: any = {};
    
    if (commandName === "verse") {
      args.reference = interaction.options.getString("reference", true);
      args.version = interaction.options.getString("version") || undefined;
    } else if (commandName === "random") {
      args.version = interaction.options.getString("version") || undefined;
    }

    // Execute command
    const response = await handler.execute(args);

    await interaction.editReply({ content: response });
  } catch (error) {
    console.error(`Error executing ${commandName}:`, error);
    await interaction.editReply({
      content: "❌ An error occurred while processing your request.",
    });
  }
});

// Event: Guild member add (welcome message with bot info)
client.on("guildMemberAdd", async (member) => {
  // You could send a welcome DM here with bot info
  console.log(`New member joined: ${member.user.username} in guild ${member.guild.id}`);
});

// Event: Ready for daily verse channel management commands
// (You could add admin commands to subscribe/unsubscribe channels)

// Connect to Discord
try {
  await client.connect();
  console.log("✅ Connected to Discord");
} catch (error) {
  console.error("❌ Failed to connect to Discord:", error);
  Deno.exit(1);
}

// Graceful shutdown
const shutdown = async () => {
  console.log("\n👋 Shutting down...");
  scheduler.stop();
  client.destroy();
  Deno.exit(0);
};

Deno.addSignalListener("SIGINT", shutdown);
Deno.addSignalListener("SIGTERM", shutdown);
