import { ClaudeForgeBot } from "./bot.js";

// This is imported as a module by the main entry point.
// The server's index.ts creates the bot with shared instances.
export { ClaudeForgeBot } from "./bot.js";
export type { BotConfig } from "./bot.js";
export { commands } from "./commands.js";
export { OutputHandler } from "./output-handler.js";
export { MessageHandler } from "./message-handler.js";
