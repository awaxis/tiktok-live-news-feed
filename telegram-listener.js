require("dotenv").config();
const { Telegraf } = require("telegraf");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
// Get the first available API key from our environment
const apiKey = (process.env.API_KEYS || "").split(",")[0].trim();
const serverUrl = process.env.SERVER_URL || "http://localhost:3080";
const appendApi = process.env.APPEND_API || "/append";

if (!botToken) {
    console.error("❌ ERROR: Please add TELEGRAM_BOT_TOKEN to your .env file.");
    process.exit(1);
}

if (!apiKey) {
    console.warn("⚠️ WARNING: No API_KEYS found in .env. The server might reject the request if it requires an API key.");
}

const bot = new Telegraf(botToken);

bot.on('channel_post', async (ctx) => {
    const post = ctx.channelPost;

    // 1. Exclude posts with images/videos/documents
    if (post.photo || post.video || post.document || post.animation) {
        console.log("🚫 Ignored message because it contains media.");
        return;
    }

    // 2. Extract text (channel posts usually use .text)
    const text = post.text || post.caption;
    if (!text) {
        return;
    }

    // 3. Extract the first non-empty line
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    const firstLine = lines[0];
    console.log(`📨 Received new post. Sending line to server: "${firstLine}"`);

    // 4. Push to the server
    try {
        const response = await fetch(serverUrl + appendApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({ text: firstLine })
        });

        if (response.ok) {
            console.log("✅ Successfully appended to ticker!");
        } else {
            const data = await response.json();
            console.error("❌ Failed to append:", data);
        }
    } catch (e) {
        console.error("❌ Error communicating with ticker server:", e.message);
    }
});

bot.launch().then(() => {
    console.log("🤖 Telegram listener bot is running! Waiting for channel posts...");
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
