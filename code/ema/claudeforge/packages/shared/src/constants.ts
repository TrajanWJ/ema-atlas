export const APP_NAME = "ClaudeForge";
export const DEFAULT_SERVER_PORT = 3001;
export const DEFAULT_WEB_PORT = 3000;
export const DEFAULT_WS_PATH = "/ws";
export const DATABASE_DIR = ".claudeforge";
export const DATABASE_FILE = "claudeforge.db";
export const SESSION_PREFIX = "claudeforge-";
export const LOG_CHANNEL_NAME = "project-logs";
export const DEFAULT_SESSION_NAME = "main";
export const MAX_CONCURRENT_SESSIONS = 8;
export const HEALTH_INTERVAL_MS = 15_000;
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

// ─── Design Tokens ──────────────────────────────────────────

export const COLORS = {
  // Backgrounds
  void: "#0F0F14",
  surface: "#1A1A2E",
  surfaceElevated: "#1E1E36",
  sidebar: "#13131F",
  input: "#111119",

  // Borders
  border: "#2E2E4A",
  borderSubtle: "#252540",
  focusRing: "#7B61FF40",

  // Accent
  primary: "#7B61FF",
  primaryHover: "#6B51EF",
  primaryMuted: "#7B61FF15",
  secondary: "#4F8EF7",
  accentWarm: "#E8A838",

  // Status
  success: "#4ADE80",
  successMuted: "#4ADE8020",
  warning: "#FCD34D",
  warningMuted: "#FCD34D20",
  error: "#FB7185",
  errorMuted: "#FB718520",
  info: "#38BDF8",

  // Text
  textPrimary: "#E8E8F0",
  textSecondary: "#8892B0",
  textMuted: "#4A5568",

  // Agent identity
  claude: "#E8A838",
  codex: "#4ADE80",
  hermes: "#7B61FF",
  researcher: "#38BDF8",
  devil: "#FB7185",
} as const;

// ─── Discord Embed Colors ───────────────────────────────────

export const EMBED_COLORS = {
  info: 0x38bdf8,
  success: 0x4ade80,
  warning: 0xfcd34d,
  error: 0xfb7185,
  primary: 0x7b61ff,
  claude: 0xe8a838,
  codex: 0x4ade80,
  hermes: 0x7b61ff,
} as const;

// ─── Tool Call Styling ──────────────────────────────────────

export const TOOL_ICONS: Record<string, { emoji: string; color: string }> = {
  read: { emoji: "📖", color: COLORS.info },
  edit: { emoji: "✏️", color: COLORS.warning },
  write: { emoji: "📝", color: COLORS.primary },
  bash: { emoji: "⚡", color: COLORS.success },
  search: { emoji: "🔍", color: COLORS.secondary },
  done: { emoji: "✅", color: COLORS.success },
  error: { emoji: "❌", color: COLORS.error },
  thinking: { emoji: "✨", color: COLORS.textMuted },
  generic: { emoji: "⚙️", color: COLORS.textSecondary },
};
