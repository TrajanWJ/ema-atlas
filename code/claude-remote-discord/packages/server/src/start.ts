/**
 * Combined entry point — starts server + bot in a single process.
 * Usage: tsx packages/server/src/start.ts
 *
 * Bot is loaded dynamically at runtime to avoid build-time cross-package issues.
 */

// Keep the process alive on unhandled errors — log and continue
process.on("unhandledRejection", (reason: any, promise) => {
  console.error("[start] Unhandled rejection:", reason?.message ?? reason, "at:", promise);
});
process.on("uncaughtException", (err: any) => {
  console.error("[start] Uncaught exception:", err?.message ?? err, err?.stack);
});
import "./index.js";
import { db, sessions, projects } from "./index.js";
import { classify, executeShell } from "./interpreter.js";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const ALLOWED_USERS = (process.env.ALLOWED_USERS ?? "").split(",").filter(Boolean);
const ALLOW_ALL_USERS = (process.env.ALLOW_ALL_USERS ?? "false").toLowerCase() === "true";
const ALLOW_BOT_MESSAGES = (process.env.ALLOW_BOT_MESSAGES ?? "false").toLowerCase() === "true";
const ALLOWED_BOT_USERS = (process.env.ALLOWED_BOT_USERS ?? "").split(",").filter(Boolean);
const BOT_CHANNEL_PREFIXES = (process.env.BOT_CHANNEL_PREFIXES ?? "bot-,agent-")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

if (DISCORD_TOKEN && DISCORD_CLIENT_ID && DISCORD_GUILD_ID) {
  const botPath = resolve(import.meta.dirname ?? ".", "../../bot/dist/bot.js");
  import(pathToFileURL(botPath).href)
    .then(({ ClaudeForgeBot }: any) => {
      new ClaudeForgeBot(
        {
          token: DISCORD_TOKEN,
          clientId: DISCORD_CLIENT_ID,
          guildId: DISCORD_GUILD_ID,
          allowedUsers: ALLOWED_USERS,
          allowAllUsers: ALLOW_ALL_USERS,
          allowBotMessages: ALLOW_BOT_MESSAGES,
          allowedBotUsers: ALLOWED_BOT_USERS,
          botChannelPrefixes: BOT_CHANNEL_PREFIXES,
        },
        sessions,
        projects,
        db,
        { classify, executeShell } // Inject interpreter functions
      );
      console.log("[start] Discord bot initialized (with interpreter)");
    })
    .catch((err: any) => {
      console.error("[start] Failed to start Discord bot:", err);
    });
} else {
  console.log("[start] Discord bot disabled (missing DISCORD_TOKEN/CLIENT_ID/GUILD_ID)");
}
