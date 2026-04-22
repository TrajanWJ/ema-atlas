import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Build-time markdown loader. Reads a project-relative file and returns its
 * raw contents as a string. Intended for React Server Components.
 */
export async function loadMarkdown(rel: string): Promise<string> {
  return fs.readFile(path.join(process.cwd(), rel), "utf8");
}
