import type { ProjectTag } from "@/lib/types";

const PROJECT_KEYWORDS: Record<Exclude<ProjectTag, "misc">, string[]> = {
  frontend: ["frontend", "ui", "component", "nextjs", "place.org", "css", "react", "tailwind", "ema", "dashboard"],
  research: ["research", "vault", "paper", "arxiv", "search", "found", "study", "analysis"],
  ops: ["deploy", "cron", "script", "server", "systemd", "docker", "infra", "ops", "nginx"],
  strategy: ["goal", "strategy", "planning", "roadmap", "vision", "initiative", "quarterly"],
  code: ["build", "compile", "debug", "error", "fix", "pr", "commit", "git", "function", "class"],
};

export function autoTagMessage(content: string): ProjectTag {
  const lower = content.toLowerCase();
  for (const [tag, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return tag as ProjectTag;
    }
  }
  return "misc";
}
