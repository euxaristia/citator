# 📖 PrimaScriptura

A Discord Bible bot built with **Deno** - delivers scripture directly from your Discord client to your heart. An alternative to [BibleBot](https://github.com/BibleBot/BibleBot).

![Deno](https://img.shields.io/badge/Deno-1.x-black?logo=deno)
![Discord](https://img.shields.io/badge/Discord-Bot-5865F2?logo=discord)

## ✨ Features

- **📖 Verse Lookup** - Get any Bible verse by reference (e.g., `/verse John 3:16`)
- **🌟 Daily Verse** - Automatic daily verse delivery to configured channels
- **🎲 Random Verse** - Get a random Bible verse for inspiration
- **📚 Multiple Versions** - Support for 13 Bible versions (KJV, WEB, VULG, WLC, LXX, SBLGNT, etc.)
- **⏰ Scheduled Posts** - Configurable daily verse schedule with timezone support
- **⚡ Fast & Lightweight** - Built on Deno for modern, secure runtime
- **🛡️ Anti-Raid** - Automatically kicks accounts less than 2 days old

## 🚀 Deployment

### Railway (Recommended)

1. Push your code to GitHub
2. Go to [Railway](https://railway.app/) and create a new project
3. Select **Deploy from GitHub repo**
4. Choose your `primascriptura` repository
5. Add environment variables:
   - `PRIMASCRIPTURA_DISCORD_TOKEN` - Your bot token
   - `PRIMASCRIPTURA_GUILD_ID` (optional) - Your server ID for instant commands
6. Deploy!

Railway will automatically detect the `Dockerfile` and deploy your bot.

### GCP / VPS

```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Clone and run
git clone https://github.com/euxaristia/primascriptura.git
cd primascriptura
export PRIMASCRIPTURA_DISCORD_TOKEN=your_token_here
deno task start
```

For production, use a process manager like `pm2` or create a `systemd` service.

### Prerequisites

- [Deno](https://deno.land/manual/getting_started/installation) installed
- A Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Under "Token", click "Copy" to get your bot token
5. Under "Privileged Gateway Intents", enable:
   - Server Members Intent (optional, for welcome messages)
6. Go to "OAuth2" → "URL Generator"
7. Select scopes: `bot`, `applications.commands`
8. Select permissions: `Send Messages`, `Use Slash Commands`
9. Copy the generated URL and open it in your browser to invite the bot

### 2. Clone and Configure

```bash
cd primascriptura
```

### 3. Set environment variables

**Required:**
```bash
export PRIMASCRIPTURA_DISCORD_TOKEN=your_bot_token_here
```

**Optional:**
```bash
export PRIMASCRIPTURA_CLIENT_ID=your_client_id_here        # Auto-fetched if not provided
export PRIMASCRIPTURA_GUILD_ID=your_guild_id_here          # For faster command testing
export DAILY_VERSE_SCHEDULE="0 8 * * *"             # 8:00 AM daily
export DEFAULT_VERSION=KJV
export TIMEZONE=America/New_York
```

Or run with inline variables:
```bash
PRIMASCRIPTURA_DISCORD_TOKEN=xxx PRIMASCRIPTURA_CLIENT_ID=xxx deno task start
```

### 4. Start the Bot

```bash
deno task start
```

Slash commands are automatically registered on startup.

**Tip:** For instant command registration during development, set `PRIMASCRIPTURA_GUILD_ID` to your test server ID. Without it, global commands can take up to 1 hour to appear.

## 📝 Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/verse <reference> [version]` | Get a specific Bible verse | `/verse John 3:16 ESV` |
| `/daily` | Get the verse of the day | `/daily` |
| `/random [version]` | Get a random Bible verse | `/random KJV` |
| `/versions` | List available Bible versions | `/versions` |
| `/help` | Show help information | `/help` |

### Verse Reference Formats

Supported formats:
- `John 3:16` - Single verse
- `Psalm 23:1-6` - Verse range
- `1 John 1:9` - Books with numbers
- `Song of Solomon 2:10` - Multi-word books

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PRIMASCRIPTURA_DISCORD_TOKEN` | ✅ | - | Your Discord bot token |
| `PRIMASCRIPTURA_CLIENT_ID` | ❌ | Auto-fetched | Your application's client ID |
| `PRIMASCRIPTURA_GUILD_ID` | ❌ | - | Guild ID for testing (commands appear instantly) |
| `DAILY_VERSE_SCHEDULE` | ❌ | `0 8 * * *` | Cron-like schedule for daily verses |
| `DEFAULT_VERSION` | ❌ | `ESV` | Default Bible version |
| `TIMEZONE` | ❌ | `America/New_York` | Timezone for daily verse schedule |

### Bible Versions

**Modern English (bible-api.com):**
- **KJV** - King James Version
- **WEB** - World English Bible
- **BBE** - Bible in Basic English
- **DRB** - Douay-Rheims Bible
- **WMB** - World Messianic Bible
- **WMBBE** - World Messianic Bible (British Edition)

**Original Languages & Latin (bolls.life):**
- **VULG** - Latin Vulgate
- **WLC** - Hebrew (Westminster Leningrad Codex)
- **LXX** - Greek Septuagint (Old Testament)
- **SBLGNT** - Greek New Testament
- **BYZ** - Byzantine Textform (Greek NT)
- **MT** - Masoretic Text (Hebrew)
- **TR** - Textus Receptus (Greek NT)

## 🛠 Development

### Project Structure

```
primascriptura/
├── src/
│   ├── main.ts              # Bot entry point
│   ├── deploy.ts            # Command deployment script
│   ├── commands/
│   │   └── commands.ts      # Slash command definitions
│   ├── services/
│   │   ├── bible.ts         # Bible API service
│   │   └── scheduler.ts     # Daily verse scheduler
│   └── utils/               # Utility functions
├── deno.json                # Deno configuration
├── .env.example             # Environment template
└── README.md
```

### Available Tasks

```bash
deno task start    # Start the bot (auto-deploys commands)
deno task dev      # Start with auto-reload
deno task test     # Run test suite
```

### Adding New Commands

1. Add command definition in `src/commands/commands.ts` → `createCommandDefinitions()`
2. Add command handler in `src/commands/commands.ts` → `createCommandHandlers()`
3. Restart the bot - commands auto-deploy on startup

## 📡 API

This bot uses [bible-api.com](https://bible-api.com/) - a free, no-authentication-required Bible API.

## 🔐 Permissions

The bot requires these Discord permissions:
- Send Messages
- Use Slash Commands
- Embed Links (for better formatting)
- **Kick Members** (for anti-raid protection)

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by [BibleBot](https://github.com/BibleBot/BibleBot)
- Bible texts from [bible-api.com](https://bible-api.com/)
- Built with [Deno](https://deno.land/) and [discord.js](https://discord.js.org/)

## 💡 Tips

- **Testing**: Use `PRIMASCRIPTURA_GUILD_ID` during development for instant command updates
- **Global Commands**: Without `PRIMASCRIPTURA_GUILD_ID`, commands can take up to an hour to appear
- **Daily Verses**: The scheduler uses a rotating list of popular verses
- **Rate Limits**: The bot respects Discord's API rate limits

## 🐛 Troubleshooting

**Commands not appearing?**
- Run `deno task deploy`
- Check bot permissions in your server
- If using global commands, wait up to 1 hour

**Bot not responding?**
- Check console for error messages
- Verify `PRIMASCRIPTURA_DISCORD_TOKEN` is correct
- Ensure bot has permission to send messages in the channel

**Daily verses not sending?**
- Check the schedule format (cron-like: `minute hour * * *`)
- Verify timezone is correct
- Check console logs for scheduler output

---

*Scripture from your Discord client to your heart* ❤️
