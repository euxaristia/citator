/**
 * PrimaScriptura - Discord Bible Bot
 * A Deno-based Discord bot for delivering scripture
 *
 * Scripture from your Discord client to your heart ❤️
 */

import { Client, EmbedBuilder, GatewayIntentBits, Message, REST, Routes } from "npm:discord.js";
import { BibleService } from "./services/bible.ts";
import { DailyVerseScheduler } from "./services/scheduler.ts";
import { createCommandDefinitions, createCommandHandlers } from "./commands/commands.ts";
import { MessageHandler } from "./services/message-handler.ts";

const PRIMASCRIPTURA_DISCORD_TOKEN = Deno.env.get("PRIMASCRIPTURA_DISCORD_TOKEN");
const PRIMASCRIPTURA_CLIENT_ID = Deno.env.get("PRIMASCRIPTURA_CLIENT_ID");
const PRIMASCRIPTURA_GUILD_ID = Deno.env.get("PRIMASCRIPTURA_GUILD_ID");
const DAILY_VERSE_SCHEDULE = Deno.env.get("DAILY_VERSE_SCHEDULE") || "0 8 * * *";
const DEFAULT_VERSION = Deno.env.get("DEFAULT_VERSION") || "KJV";
const TIMEZONE = Deno.env.get("TIMEZONE") || "America/New_York";

if (!PRIMASCRIPTURA_DISCORD_TOKEN) {
  console.error("❌ Missing required environment variable: PRIMASCRIPTURA_DISCORD_TOKEN");
  Deno.exit(1);
}

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

// Initialize services
const bibleService = new BibleService(DEFAULT_VERSION);
const messageHandler = new MessageHandler(bibleService, DEFAULT_VERSION);
const commandHandlers = createCommandHandlers(bibleService);

// Deploy slash commands on startup
console.log("📝 Registering slash commands...");
const rest = new REST({ version: "10" }).setToken(PRIMASCRIPTURA_DISCORD_TOKEN);
const commands = createCommandDefinitions();

try {
  if (PRIMASCRIPTURA_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(clientId, PRIMASCRIPTURA_GUILD_ID),
      { body: commands },
    );
    console.log(`✅ Registered guild commands for server ${PRIMASCRIPTURA_GUILD_ID}`);
  } else {
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );
    console.log(`✅ Registered global commands (may take up to 1 hour to appear)`);
  }
} catch (error) {
  console.error("❌ Failed to register commands:", error);
}

// Create Discord client with WebSocket support
// Note: MessageContent is a privileged intent requiring Discord verification
// Enable it at: https://discord.com/developers/applications/{CLIENT_ID}/bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Track channels for daily verses (in production, you'd want to persist this)
const dailyVerseChannels = new Set<string>();

// Minimum account age in milliseconds (2 days)
const MIN_ACCOUNT_AGE = 2 * 24 * 60 * 60 * 1000;

/**
 * Send a message to a channel
 */
async function sendToChannel(channelId: string, embed: EmbedBuilder): Promise<void> {
  try {
    await client.api.channels[channelId].messages.post({
      body: { embeds: [embed.toJSON()] },
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
  sendToChannel,
);

console.log("📖 PrimaScriptura starting up...");
console.log(`   Default Version: ${DEFAULT_VERSION}`);
console.log(`   Daily Verse Schedule: ${DAILY_VERSE_SCHEDULE} (${TIMEZONE})`);

// Event: Client Ready
client.on("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user?.username}#${client.user?.discriminator}`);
  console.log(`   ID: ${client.user?.id}`);
  console.log(`   Servers: ${client.guilds.cache.size}`);
  console.log("\n✨ Bot is ready! Try using /verse, /daily, /random, or /help");

  // Set bot status
  client.user?.setPresence({
    activities: [{ name: "Property of euxaristia" }],
    status: "online",
  });
  console.log("   Status: Property of euxaristia");

  // Update application description (bot bio)
  try {
    await rest.patch("/applications/@me", {
      body: {
        description:
          "Scripture from your Discord client to your heart.\n\n" +
          "Invite: https://discord.com/oauth2/authorize?client_id=1489033559896358932\n\n" +
          "GitHub: https://github.com/euxaristia/PrimaScriptura",
      },
    });
    console.log("   Updated application description");
  } catch (error) {
    console.error("⚠️ Failed to update application description:", error);
  }

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

    await interaction.editReply(response);
  } catch (error) {
    console.error(`Error executing ${commandName}:`, error);
    await interaction.editReply({
      content: "❌ An error occurred while processing your request.",
    });
  }
});

// Event: Message (auto-detect verse references)
client.on("messageCreate", async (message: Message) => {
  try {
    await messageHandler.processMessage(message);
  } catch (error) {
    console.error(
      `[MessageHandler] Error processing message:`,
      error instanceof Error ? error.message : error,
    );
  }
});

// Event: Guild member add - kick accounts less than 2 days old
client.on("guildMemberAdd", async (member) => {
  // Skip bots and applications - they are trusted accounts
  if (member.user.bot) {
    console.log(`🤖 Bot joined: ${member.user.username} in guild ${member.guild.id}`);
    return;
  }

  const accountCreatedAt = member.user.createdTimestamp;
  const now = Date.now();
  const accountAge = now - accountCreatedAt;

  if (accountAge < MIN_ACCOUNT_AGE) {
    const accountAgeHours = Math.floor(accountAge / 1000 / 60 / 60);

    console.log(
      `🛡️ Auto-kick: ${member.user.username}#${member.user.discriminator} ` +
        `(${member.user.id}) - Account only ${accountAgeHours}h old`,
    );

    try {
      // Try to DM the user first to explain why they were kicked
      await member.user.send(
        `You were automatically kicked from **${member.guild.name}** because your Discord account is less than 2 days old. ` +
          `This is an anti-raid measure. Please try again once your account is older.`,
      ).catch(() => {
        // Ignore if can't DM (user has DMs disabled)
      });

      // Kick the member
      await member.kick("Account less than 2 days old - anti-raid measure");

      // Log to console
      console.log(`✅ Successfully kicked ${member.user.username} from ${member.guild.name}`);
    } catch (error) {
      console.error(
        `❌ Failed to kick ${member.user.username} from ${member.guild.name}:`,
        error instanceof Error ? error.message : error,
      );
    }
  } else {
    console.log(`New member joined: ${member.user.username} in guild ${member.guild.id}`);
  }
});

// Event: Ready for daily verse channel management commands
// (You could add admin commands to subscribe/unsubscribe channels)

// Connect to Discord
try {
  await client.login(PRIMASCRIPTURA_DISCORD_TOKEN);
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
