// Codegen: read packages/contracts/events/*.md and emit TypeScript types.
//
// Inputs:
//   - packages/contracts/events/*.md (one file per family)
//   - packages/contracts/events/catalog.v0.md (canonical kind list)
//   - packages/contracts/types/ids.md (registered ULID prefixes)
//
// Output:
//   - packages/contracts-ts/src/generated/index.ts
//
// Format conventions in the source markdown:
//   - Each family file lives at events/<family>.md.
//   - Each event kind is introduced by an `### family.verb` (or
//     `### family.verb.subverb`) header.
//   - The payload shape follows in either:
//       a) a fenced code block whose first non-empty line starts with
//          `payload {`, OR
//       b) a free-form paragraph that starts with `payload {` (some
//          older family files don't use the fence).
//   - Inside the payload braces, each line is `name: type`, `name?: type`
//     (optional), or just `name` (bare; type inferred from earlier
//     occurrences in the same payload, falling back to `string`).
//   - Types may include `<ulid>` references like `project:<ulid>`,
//     unions (`"a" | "b" | "c"`), arrays (`string[]`), and nullables
//     (`string | null`).
//   - Some payloads contain inline object/discriminated-union types
//     spanning multiple lines; we model those as a structured shape if
//     possible, otherwise fall back to `unknown` with a TODO comment.
//
// Strategy: a tiny state-machine parser, no external deps. We do *not*
// pull in marked / remark; the format is too constrained for that to be
// worth it.

import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const HERE = path.dirname(fileURLToPath(import.meta.url));
// HERE = packages/contracts-ts/src
const PKG_ROOT = path.resolve(HERE, "..");
const REPO_ROOT = path.resolve(PKG_ROOT, "..", "..");
const EVENTS_DIR = path.join(REPO_ROOT, "packages", "contracts", "events");
const IDS_DOC = path.join(REPO_ROOT, "packages", "contracts", "types", "ids.md");
const CATALOG_FILE = path.join(EVENTS_DIR, "catalog.v0.md");
const OUT_DIR = path.join(PKG_ROOT, "src", "generated");
const OUT_FILE = path.join(OUT_DIR, "index.ts");

// Files we deliberately skip when iterating events/*.md.
const SKIP_FILES = new Set(["README.md", "catalog.v0.md"]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PayloadField {
  readonly name: string;
  readonly optional: boolean;
  readonly rawType: string;
  readonly tsType: string;
  readonly comment: string | null;
}

interface ParsedKind {
  readonly kind: string; // e.g. "client.added"
  readonly family: string; // e.g. "client"
  readonly verb: string; // e.g. "added" or "section.added"
  readonly fields: readonly PayloadField[];
  readonly parseError: string | null; // non-null if we couldn't fully parse
  readonly rawPayload: string; // for debug / passthrough comments
}

interface FamilyParse {
  readonly family: string;
  readonly file: string;
  readonly kinds: readonly ParsedKind[];
  readonly malformations: readonly string[];
}

interface CodegenReport {
  readonly families: readonly string[];
  readonly familiesWithoutFile: readonly string[];
  readonly catalogKinds: readonly string[];
  readonly parsedKinds: readonly string[];
  readonly missingFromMarkdown: readonly string[]; // catalog kinds with no payload
  readonly extraInMarkdown: readonly string[]; // payload kinds not in catalog
  readonly malformations: ReadonlyArray<{ family: string; note: string }>;
  readonly outFile: string;
  readonly outLineCount: number;
}

// ---------------------------------------------------------------------------
// ULID prefix registry — read from types/ids.md
// ---------------------------------------------------------------------------

async function readRegisteredPrefixes(): Promise<Set<string>> {
  const md = await readFile(IDS_DOC, "utf8");
  const prefixes = new Set<string>();
  // Lines like: `| `project`         | project inside a space ...`
  const re = /^\|\s*`([a-z_]+)`\s*\|/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    if (m[1]) prefixes.add(m[1]);
  }
  return prefixes;
}

// ---------------------------------------------------------------------------
// Catalog parser
// ---------------------------------------------------------------------------

async function readCatalog(): Promise<{
  kinds: string[];
  families: string[];
}> {
  const md = await readFile(CATALOG_FILE, "utf8");
  const kinds: string[] = [];
  const families = new Set<string>();
  // Section headers: `## family`
  // Kind bullets: `- `family.verb`` (possibly with trailing ` (notes)`)
  const lines = md.split("\n");
  let currentFamily: string | null = null;
  for (const raw of lines) {
    const headerMatch = /^##\s+([a-z_]+)\s*$/.exec(raw);
    if (headerMatch && headerMatch[1]) {
      currentFamily = headerMatch[1];
      families.add(currentFamily);
      continue;
    }
    const bulletMatch = /^-\s+`([a-z_]+\.[a-z_]+(?:\.[a-z_]+)?)`/.exec(raw);
    if (bulletMatch && bulletMatch[1]) {
      kinds.push(bulletMatch[1]);
    }
  }
  return { kinds, families: [...families] };
}

// ---------------------------------------------------------------------------
// Family-file parser
// ---------------------------------------------------------------------------

/**
 * Find all `### kind` headers and their payload bodies. Returns one entry
 * per `### kind` that has *any* payload-shaped block following it (whether
 * inside a fence or not).
 */
function extractKindBlocks(
  family: string,
  md: string,
): Array<{ kind: string; payloadBody: string }> {
  const lines = md.split("\n");
  const out: Array<{ kind: string; payloadBody: string }> = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    // Match `### `family.verb`` or `### family.verb` (with or without backticks).
    const headerMatch = /^###\s+`?([a-z_]+\.[a-z_]+(?:\.[a-z_]+)?)`?\s*$/.exec(
      line,
    );
    if (!headerMatch || !headerMatch[1]) {
      i++;
      continue;
    }
    const kind = headerMatch[1];
    if (!kind.startsWith(family + ".")) {
      // header refers to a different family; skip
      i++;
      continue;
    }
    // Scan forward looking for `payload {` either inside a fence or raw.
    // Stop if we hit the next `### ` header.
    let j = i + 1;
    let payloadBody: string | null = null;
    while (j < lines.length) {
      const ln = lines[j] ?? "";
      if (/^###\s+/.test(ln)) break;
      // Fenced code block
      if (/^```/.test(ln)) {
        const start = j + 1;
        let k = start;
        while (k < lines.length && !/^```/.test(lines[k] ?? "")) k++;
        // Block content: lines[start..k-1]
        const block = lines.slice(start, k).join("\n");
        // Check if this block contains a `payload {` declaration.
        if (/payload\s*\{/.test(block)) {
          payloadBody = block;
          j = k + 1;
          break;
        }
        j = k + 1;
        continue;
      }
      // Raw `payload {` (no fence)
      if (/^\s*payload\s*\{/.test(ln)) {
        // Walk forward collecting until matching close brace at column 0
        // or until next ### or empty-line followed by next header.
        const collected: string[] = [];
        let depth = 0;
        let started = false;
        let k = j;
        while (k < lines.length) {
          const ll = lines[k] ?? "";
          if (k > j && /^###\s+/.test(ll)) break;
          collected.push(ll);
          for (const ch of ll) {
            if (ch === "{") {
              depth++;
              started = true;
            } else if (ch === "}") {
              depth--;
            }
          }
          k++;
          if (started && depth === 0) break;
        }
        payloadBody = collected.join("\n");
        j = k;
        break;
      }
      j++;
    }
    if (payloadBody !== null) {
      out.push({ kind, payloadBody });
    }
    i = Math.max(i + 1, j);
  }
  return out;
}

/**
 * Strip trailing line comments (`// ...`). Preserves comment text for
 * propagation into the generated output.
 */
function splitLineComment(line: string): { code: string; comment: string | null } {
  // Find the first `//` that isn't inside a string. Lines here are
  // payload-spec lines, not real TS, so we don't worry about regex/strings.
  const idx = line.indexOf("//");
  if (idx === -1) return { code: line, comment: null };
  return {
    code: line.slice(0, idx).trimEnd(),
    comment: line.slice(idx + 2).trim(),
  };
}

/**
 * Map a single rawType string to a TypeScript type string.
 *
 * Recognized atoms (matched as whole tokens, case-sensitive except where noted):
 *   string, int, number, bool, boolean, hex, ISO-8601 UTC, secret_ref,
 *   <ulid>, <json>, <component>, <resource-pattern>, <tool-pattern>
 *
 * Recognized references:
 *   <prefix>:<ulid>     -> branded ULID type
 *   "literal"           -> literal type
 *   T | U               -> union (recursed)
 *   T[]                 -> readonly T[]
 *   { ... }             -> Readonly<{...}> if simple, else Record<string, unknown>
 *
 * Things we can't model become `unknown` with a parseError note.
 */
function mapType(
  raw: string,
  ctx: { kind: string; field: string; registeredPrefixes: Set<string> },
): { tsType: string; warning: string | null } {
  let s = raw.trim();
  if (s.length === 0) return { tsType: "unknown", warning: "empty type" };

  // Strip a leading `|` (some sum types start with one).
  if (s.startsWith("|")) s = s.slice(1).trim();

  // Trailing comma (rare in payload sigs but defensive).
  if (s.endsWith(",")) s = s.slice(0, -1).trim();

  // Unions split at top-level `|`. Need to be careful about `|` inside
  // braces, brackets, and strings.
  const unionParts = splitTopLevel(s, "|");
  if (unionParts.length > 1) {
    const mapped = unionParts.map((p) => mapType(p, ctx));
    const warnings = mapped.flatMap((m) => (m.warning ? [m.warning] : []));
    return {
      tsType: mapped.map((m) => m.tsType).join(" | "),
      warning: warnings.length ? warnings.join("; ") : null,
    };
  }

  // Array suffix: T[]
  if (/\]$/.test(s) && /\[\s*\]$/.test(s)) {
    const inner = s.replace(/\[\s*\]$/, "");
    const mapped = mapType(inner, ctx);
    return {
      tsType: `readonly ${mapped.tsType}[]`,
      warning: mapped.warning,
    };
  }

  // Tuple-ish bracket form: `[ <resource-pattern> ]` etc.
  if (s.startsWith("[") && s.endsWith("]")) {
    const inner = s.slice(1, -1).trim();
    const mapped = mapType(inner, ctx);
    return {
      tsType: `readonly ${mapped.tsType}[]`,
      warning: mapped.warning,
    };
  }

  // Object literal `{ ... }`
  if (s.startsWith("{") && s.endsWith("}")) {
    return mapInlineObject(s, ctx);
  }

  // Quoted literal
  if (/^"[^"]*"$/.test(s)) return { tsType: s, warning: null };

  // Bare scalars
  switch (s) {
    case "string":
      return { tsType: "string", warning: null };
    case "boolean":
    case "bool":
      return { tsType: "boolean", warning: null };
    case "number":
      return { tsType: "number", warning: null };
    case "int":
      return { tsType: "number", warning: null };
    case "hex":
      return { tsType: "string", warning: null };
    case "null":
      return { tsType: "null", warning: null };
    case "true":
      return { tsType: "true", warning: null };
    case "false":
      return { tsType: "false", warning: null };
    case "ISO-8601":
    case "ISO-8601 UTC":
      return { tsType: "string", warning: null };
    case "secret_ref":
      return { tsType: "string", warning: null };
    case "<json>":
      return { tsType: "unknown", warning: null };
    case "<component>":
    case "<resource-pattern>":
    case "<tool-pattern>":
      return { tsType: "string", warning: null };
    case "<SourceRef>":
      return {
        tsType: "Readonly<Record<string, unknown>>",
        warning: "external SourceRef type not yet modeled",
      };
  }

  // ULID reference: <prefix>:<ulid>
  const ulidRef = /^([a-z_]+):<ulid>$/.exec(s);
  if (ulidRef && ulidRef[1]) {
    const prefix = ulidRef[1];
    const branded = ulidBrandedName(prefix);
    return { tsType: branded, warning: null };
  }

  // system:<component> -> branded SystemActor template literal
  if (s === "system:<component>") {
    return { tsType: "`system:${string}`", warning: null };
  }

  // Concrete system component reference, e.g. `system:ema_collab`. Treat
  // as a literal type, branded to SystemActor.
  if (/^system:[a-z_][a-z0-9_]*$/.test(s)) {
    return { tsType: `"${s}"`, warning: null };
  }

  // Hermes secret_ref form: secret_ref:<...>:<...>:<...>
  if (/^secret_ref:</.test(s)) {
    return { tsType: "string", warning: null };
  }

  // Bare identifier referencing a previously-defined field name (e.g.
  // `payload { proposal_id, submitted_by: user:<ulid> }`).
  if (/^[a-z_][a-z0-9_]*\??$/.test(s)) {
    return {
      tsType: "string",
      warning: `bare-identifier type "${s}" — falling back to string`,
    };
  }

  // Numeric or other unmappable tokens — emit unknown so we don't lose
  // type-checking entirely.
  return {
    tsType: "unknown",
    warning: `unrecognized type "${s}" in ${ctx.kind}.${ctx.field}`,
  };
}

/**
 * Split a string at the top-level occurrences of a single-character
 * separator. Skips chars inside `{}`, `[]`, `<>`, and quoted strings.
 */
function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let depthCurly = 0;
  let depthSquare = 0;
  let depthAngle = 0;
  let inString = false;
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    if (inString) {
      buf += ch;
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      buf += ch;
      continue;
    }
    if (ch === "{") depthCurly++;
    else if (ch === "}") depthCurly--;
    else if (ch === "[") depthSquare++;
    else if (ch === "]") depthSquare--;
    else if (ch === "<") depthAngle++;
    else if (ch === ">") depthAngle--;

    if (
      ch === sep &&
      depthCurly === 0 &&
      depthSquare === 0 &&
      depthAngle === 0
    ) {
      out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim().length > 0) out.push(buf.trim());
  return out;
}

/**
 * Map an inline object literal like `{ kind: "blueprint_section", id: blueprint_sec:<ulid> }`
 * to a TS type. If the body has comma/newline-separated `name: type` fields,
 * emit a Readonly<{...}>; otherwise fall back to a generic record type.
 */
function mapInlineObject(
  s: string,
  ctx: { kind: string; field: string; registeredPrefixes: Set<string> },
): { tsType: string; warning: string | null } {
  const inner = s.slice(1, -1).trim();
  if (inner.length === 0) {
    return { tsType: "Readonly<Record<string, never>>", warning: null };
  }

  // The body might be:
  //   - bare identifiers ("org_id, space_id?, project_id?") referencing
  //     outer-scope fields
  //   - a record type ("[key: string]: string | int | ...")
  //   - a normal struct ("kind: 'foo', id: bar:<ulid>")
  //   - a discriminator value ("<key>: <value>")

  // Record type: starts with [ ... ]:
  if (/^\[[^\]]+\]\s*:/.test(inner)) {
    const recMatch = /^\[([^\]]+)\]\s*:\s*(.+)$/s.exec(inner);
    if (recMatch && recMatch[1] && recMatch[2]) {
      const valMapped = mapType(recMatch[2].trim(), ctx);
      return {
        tsType: `Readonly<Record<string, ${valMapped.tsType}>>`,
        warning: valMapped.warning,
      };
    }
  }

  // Generic <key>: <value> placeholder = open-shape map.
  if (/^<key>\s*:\s*<value>\s*$/.test(inner)) {
    return {
      tsType: "Readonly<Record<string, unknown>>",
      warning: null,
    };
  }

  // Try to split on top-level commas AND newlines (some inline objects
  // are written one-per-line without commas).
  const parts = splitFieldEntries(inner);
  const fieldEntries: string[] = [];
  const warnings: string[] = [];
  let allFieldsOk = true;
  for (const partRaw of parts) {
    const part = partRaw.trim();
    if (part.length === 0) continue;
    const colonIdx = findTopLevelColon(part);
    if (colonIdx === -1) {
      // Bare identifier reference
      if (/^[a-z_][a-z0-9_]*\??$/.test(part)) {
        const optional = part.endsWith("?");
        const name = optional ? part.slice(0, -1) : part;
        // Bare references in inline objects = unknown (we don't have outer
        // scope). Falls back to string for typed-id-ish names.
        const ts = guessBareTypeFromName(name) ?? "string";
        fieldEntries.push(
          `readonly ${name}${optional ? "?" : ""}: ${ts};`,
        );
        warnings.push(
          `inline object had bare-name field "${part}" in ${ctx.kind}.${ctx.field}`,
        );
        continue;
      }
      allFieldsOk = false;
      break;
    }
    const namePart = part.slice(0, colonIdx).trim();
    const typePart = part.slice(colonIdx + 1).trim();
    const optional = namePart.endsWith("?");
    const name = optional ? namePart.slice(0, -1) : namePart;
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
      allFieldsOk = false;
      break;
    }
    const mapped = mapType(typePart, { ...ctx, field: `${ctx.field}.${name}` });
    if (mapped.warning) warnings.push(mapped.warning);
    fieldEntries.push(`readonly ${name}${optional ? "?" : ""}: ${mapped.tsType};`);
  }
  if (allFieldsOk && fieldEntries.length > 0) {
    return {
      tsType: `Readonly<{ ${fieldEntries.join(" ")} }>`,
      warning: warnings.length ? warnings.join("; ") : null,
    };
  }

  return {
    tsType: "Readonly<Record<string, unknown>>",
    warning: `could not parse inline object in ${ctx.kind}.${ctx.field}: ${s.slice(0, 60)}...`,
  };
}

/** Find the first `:` not inside brackets/braces/angle/string. */
function findTopLevelColon(s: string): number {
  let depthCurly = 0;
  let depthSquare = 0;
  let depthAngle = 0;
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    if (inString) {
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depthCurly++;
    else if (ch === "}") depthCurly--;
    else if (ch === "[") depthSquare++;
    else if (ch === "]") depthSquare--;
    else if (ch === "<") depthAngle++;
    else if (ch === ">") depthAngle--;
    if (
      ch === ":" &&
      depthCurly === 0 &&
      depthSquare === 0 &&
      depthAngle === 0
    ) {
      return i;
    }
  }
  return -1;
}

function guessBareTypeFromName(name: string): string | null {
  // Heuristic: "_id" or "_at" suffix / "ulid" suffix => string.
  if (name.endsWith("_id")) return "string";
  if (name.endsWith("_at")) return "string";
  return null;
}

// ---------------------------------------------------------------------------
// Payload body parser
// ---------------------------------------------------------------------------

/**
 * Parse the body of a `payload { ... }` block into fields. The body may
 * span multiple lines and may contain inline object/union types that
 * span multiple lines.
 */
function parsePayloadBody(
  kind: string,
  body: string,
  registeredPrefixes: Set<string>,
): { fields: PayloadField[]; warnings: string[] } {
  // Trim outer `payload { ... }` shell.
  let s = body.trim();
  // Strip leading `payload`
  s = s.replace(/^payload\s*/, "");
  if (!s.startsWith("{")) {
    return {
      fields: [],
      warnings: [`payload body for ${kind} did not start with "{"`],
    };
  }
  // Strip outer braces using bracket matching.
  let depth = 0;
  let start = -1;
  let end = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (start === -1 || end === -1) {
    return {
      fields: [],
      warnings: [`payload body for ${kind} had unbalanced braces`],
    };
  }
  let inner = s.slice(start + 1, end);

  // Strip line comments per source line, capturing them so we can re-attach
  // to the corresponding field. This must happen BEFORE we split entries:
  // a comment like `// e.g. "x", "y"` contains commas that look like field
  // separators, but they aren't.
  const lineCommentMap = new Map<number, string>(); // entry index -> comment
  const innerLinesRaw = inner.split("\n");
  const innerLinesStripped: string[] = [];
  const innerLineComments: string[] = [];
  for (const ln of innerLinesRaw) {
    const split = splitLineComment(ln);
    innerLinesStripped.push(split.code);
    innerLineComments.push(split.comment ?? "");
  }
  inner = innerLinesStripped.join("\n").trim();

  // Split fields. The terse form `payload { id, by: x }` uses commas;
  // the multi-line form uses newlines; many use both. We split on
  // top-level commas AND on newlines that aren't inside braces.
  const fieldEntries = splitFieldEntries(inner);

  // Best-effort comment recovery: walk lineCommentMap by matching field
  // names back to source lines.
  const commentByName = new Map<string, string>();
  for (let li = 0; li < innerLinesRaw.length; li++) {
    const comment = innerLineComments[li];
    if (!comment) continue;
    const stripped = innerLinesStripped[li] ?? "";
    const nameMatch = /^\s*([a-z_][a-z0-9_]*)\??\s*:/.exec(stripped);
    if (nameMatch && nameMatch[1]) {
      commentByName.set(nameMatch[1], comment);
    }
  }
  // (lineCommentMap is intentionally unused but the Map import would be wasted; keep
  // the per-entry attachment via commentByName).
  void lineCommentMap;

  const fields: PayloadField[] = [];
  const warnings: string[] = [];
  for (const entryRaw of fieldEntries) {
    const code = entryRaw.trim();
    if (code.length === 0) continue;
    const colonIdx = findTopLevelColon(code);
    if (colonIdx === -1) {
      // Bare identifier (no type). Try to infer from earlier siblings or
      // fall back to string.
      const bareName = code.replace(/[?,]$/g, "").trim();
      if (!/^[a-z_][a-z0-9_]*\??$/.test(bareName)) {
        warnings.push(
          `payload field for ${kind} could not be parsed: "${code}"`,
        );
        continue;
      }
      const optional = bareName.endsWith("?");
      const name = optional ? bareName.slice(0, -1) : bareName;
      // Look up earlier field with same name within the same payload
      // (cross-kind lookup is handled by the union-builder if needed).
      const earlier = fields.find((f) => f.name === name);
      const tsType = earlier?.tsType ?? guessBareTypeFromName(name) ?? "string";
      const comment = commentByName.get(name) ?? null;
      fields.push({
        name,
        optional,
        rawType: earlier?.rawType ?? "(bare reference)",
        tsType,
        comment,
      });
      if (!earlier && !guessBareTypeFromName(name)) {
        warnings.push(
          `${kind} bare field "${name}" had no prior type; assumed string`,
        );
      }
      continue;
    }
    const namePart = code.slice(0, colonIdx).trim();
    const typePart = code.slice(colonIdx + 1).trim().replace(/,$/, "");
    const optional = namePart.endsWith("?");
    const name = optional ? namePart.slice(0, -1) : namePart;
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
      warnings.push(`${kind} payload had unparseable field name "${namePart}"`);
      continue;
    }
    const mapped = mapType(typePart, {
      kind,
      field: name,
      registeredPrefixes,
    });
    if (mapped.warning) warnings.push(`${kind}.${name}: ${mapped.warning}`);
    const comment = commentByName.get(name) ?? null;
    fields.push({
      name,
      optional,
      rawType: typePart,
      tsType: mapped.tsType,
      comment,
    });
  }
  return { fields, warnings };
}

/**
 * Split a payload-body inner string into per-field entries. Splits on
 * top-level commas and on newlines. Treats commas/newlines inside
 * `{}`/`[]`/`<>`/quotes as part of the entry.
 *
 * We allow either form:
 *   `id: project:<ulid>\n  name: string`
 *   `id: project:<ulid>, name: string`
 */
function splitFieldEntries(inner: string): string[] {
  const out: string[] = [];
  let depthCurly = 0;
  let depthSquare = 0;
  let depthAngle = 0;
  let inString = false;
  let buf = "";
  let prevWasNewline = false;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner.charAt(i);
    if (inString) {
      buf += ch;
      if (ch === '"') inString = false;
      prevWasNewline = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      buf += ch;
      prevWasNewline = false;
      continue;
    }
    if (ch === "{") depthCurly++;
    else if (ch === "}") depthCurly--;
    else if (ch === "[") depthSquare++;
    else if (ch === "]") depthSquare--;
    else if (ch === "<") depthAngle++;
    else if (ch === ">") depthAngle--;

    const atTopLevel =
      depthCurly === 0 && depthSquare === 0 && depthAngle === 0;
    if (atTopLevel && ch === ",") {
      if (buf.trim().length > 0) out.push(buf);
      buf = "";
      prevWasNewline = false;
      continue;
    }
    if (atTopLevel && ch === "\n") {
      // A newline-separated entry boundary, but only if the buffer ends
      // in a "complete-looking" token (we handle continuation lines
      // — like the `attachment.created` source_ref — by detecting that
      // the *next* non-whitespace char is `|`).
      const rest = inner.slice(i + 1);
      const trimmedRest = rest.replace(/^[\t ]+/, "");
      if (trimmedRest.startsWith("|")) {
        // Continuation of a union type — keep accumulating.
        buf += " ";
        prevWasNewline = false;
        continue;
      }
      // Also treat trailing comma as already handled; otherwise commit.
      if (buf.trim().length > 0) {
        out.push(buf);
        buf = "";
      }
      prevWasNewline = true;
      continue;
    }
    if (prevWasNewline && /\s/.test(ch)) {
      // Skip leading whitespace on a fresh line.
      continue;
    }
    prevWasNewline = false;
    buf += ch;
  }
  if (buf.trim().length > 0) out.push(buf);
  return out;
}

// ---------------------------------------------------------------------------
// Naming utilities
// ---------------------------------------------------------------------------

function pascalCase(input: string): string {
  return input
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => (p.length === 0 ? "" : p[0]!.toUpperCase() + p.slice(1)))
    .join("");
}

function ulidBrandedName(prefix: string): string {
  // e.g. "blueprint_sec" -> "BlueprintSecId"
  return pascalCase(prefix) + "Id";
}

function payloadInterfaceName(kind: string): string {
  // "client.added" -> "ClientAddedPayload"
  // "blueprint.section.added" -> "BlueprintSectionAddedPayload"
  return pascalCase(kind) + "Payload";
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

interface GenerateInput {
  registeredPrefixes: Set<string>;
  catalogKinds: string[];
  catalogFamilies: string[];
  parsedFamilies: FamilyParse[];
  // Kinds discovered while parsing (across all families).
  discoveredKinds: ParsedKind[];
}

function collectUlidPrefixes(input: GenerateInput): Set<string> {
  const prefixes = new Set<string>(input.registeredPrefixes);
  // Always include ulid prefixes referenced by event payloads, even if not
  // yet registered in ids.md — the codegen surfaces a branded type either
  // way so consumers can typecheck.
  for (const k of input.discoveredKinds) {
    for (const f of k.fields) {
      const matches = f.rawType.matchAll(/([a-z_]+):<ulid>/g);
      for (const m of matches) {
        if (m[1]) prefixes.add(m[1]);
      }
    }
  }
  // Also include prefixes used in catalog (for future-proofing).
  return prefixes;
}

function emit(input: GenerateInput): { source: string; lineCount: number } {
  const prefixes = [...collectUlidPrefixes(input)].sort();
  const allKinds = [...input.discoveredKinds].sort((a, b) =>
    a.kind.localeCompare(b.kind),
  );
  // The "effective" kind universe = catalog kinds ∪ markdown-discovered kinds.
  // Catalog is the source of truth, but we surface drift either direction:
  // - missing-in-markdown: catalog kind without a payload section (typed as
  //   Readonly<Record<string, unknown>>).
  // - extra-in-markdown: family file declares a kind the catalog doesn't yet
  //   list. We still emit a payload interface (the user wants type help
  //   immediately) and include the kind in `EventKind`, but the codegen log
  //   surfaces this so the catalog can be brought in sync.
  const catalogSet = new Set(input.catalogKinds);
  const allKindStrings = new Set<string>([...input.catalogKinds]);
  for (const k of allKinds) allKindStrings.add(k.kind);
  const effectiveKinds = [...allKindStrings].sort();
  const headerLines = [
    "// AUTO-GENERATED. DO NOT EDIT BY HAND.",
    "//",
    "// Generated by packages/contracts-ts/src/codegen.ts from",
    "// packages/contracts/events/*.md (the event-family specs) and",
    "// packages/contracts/types/ids.md (the ULID-prefix registry).",
    "//",
    "// To regenerate, run `pnpm --filter @ema/contracts-ts generate` from",
    "// the repo root, or `pnpm generate` from packages/contracts-ts.",
    "//",
    `// Prefixes covered: ${prefixes.length}`,
    `// Event kinds covered: ${allKinds.length}`,
    "",
    "/* eslint-disable @typescript-eslint/no-explicit-any */",
    "",
  ];

  const sections: string[] = [];

  // -- ULID branded types ------------------------------------------------
  sections.push("// ============================================================");
  sections.push("// Branded ULID types");
  sections.push("// ============================================================");
  sections.push(
    "// Each ULID-prefix gets a TypeScript template literal type. Untyped",
    "// strings cannot pass where one of these is expected without an",
    "// explicit cast.",
    "",
  );
  for (const prefix of prefixes) {
    const name = ulidBrandedName(prefix);
    sections.push(
      `/** ULID with prefix \`${prefix}:\`. Format: \`${prefix}:<26-char ULID>\`. */`,
    );
    sections.push(
      `export type ${name} = \`${prefix}:\${string}\`;`,
    );
    sections.push("");
  }

  // -- Common envelope-actor types ---------------------------------------
  sections.push("// ============================================================");
  sections.push("// Envelope and shared actor types");
  sections.push("// ============================================================");
  sections.push("");
  sections.push("/** Branded `system:<component>` actor identifier. */");
  sections.push("export type SystemActor = `system:${string}`;");
  sections.push("");
  sections.push(
    "/** Anyone or anything that can produce an event in the canonical log. */",
  );
  sections.push(
    "export type EnvelopeActor = ActorId | UserId | DeviceId | SystemActor;",
  );
  sections.push("");
  sections.push("/** ISO-8601 UTC timestamp string. */");
  sections.push("export type IsoTimestamp = string;");
  sections.push("");
  sections.push("/** Hex-encoded byte string (lowercase). */");
  sections.push("export type HexString = string;");
  sections.push("");

  // -- Envelope ----------------------------------------------------------
  sections.push("/**");
  sections.push(" * Common fields on every event in the canonical log.");
  sections.push(" *");
  sections.push(" * Source of truth: packages/contracts/events/README.md");
  sections.push(" * (the `event { ... }` block).");
  sections.push(" */");
  sections.push("export interface EnvelopeFields {");
  sections.push("  readonly event_id: EventId;");
  sections.push("  readonly kind: EventKind;");
  sections.push("  readonly ts: IsoTimestamp;");
  sections.push("  readonly actor: EnvelopeActor;");
  sections.push("  readonly org_id: OrgId;");
  sections.push("  readonly space_id?: SpaceId;");
  sections.push("  readonly project_id?: ProjectId;");
  sections.push("  readonly dispatch_id?: DispatchId;");
  sections.push("  readonly execution_id?: ExecutionId;");
  sections.push("  readonly signing_device?: DeviceId;");
  sections.push("  readonly signing_key?: HexString;");
  sections.push("  readonly signature?: HexString;");
  sections.push("}");
  sections.push("");

  // -- All event kinds (literal union) -----------------------------------
  sections.push("// ============================================================");
  sections.push("// Catalog: all event kinds");
  sections.push("// ============================================================");
  sections.push("");
  sections.push("/**");
  sections.push(" * Union of every event-kind literal known to the contract.");
  sections.push(" *");
  sections.push(
    " * Source of truth: packages/contracts/events/catalog.v0.md. Family",
  );
  sections.push(
    " * files (events/<family>.md) MAY declare kinds the catalog has not",
  );
  sections.push(
    " * yet caught up to; in that case the codegen still emits an interface",
  );
  sections.push(
    " * for the kind and includes it here, and the run log warns about the",
  );
  sections.push(" * drift so the catalog can be brought in sync.");
  sections.push(" */");
  sections.push("export type EventKind =");
  for (let i = 0; i < effectiveKinds.length; i++) {
    const k = effectiveKinds[i]!;
    const sep = i === effectiveKinds.length - 1 ? ";" : "";
    sections.push(`  | "${k}"${sep}`);
  }
  sections.push("");

  sections.push("/** Every event-kind literal as a frozen array (matches `EventKind`). */");
  sections.push("export const EVENT_KINDS = [");
  for (const k of effectiveKinds) {
    sections.push(`  "${k}",`);
  }
  sections.push("] as const;");
  sections.push("");

  sections.push(
    "/** Subset of `EVENT_KINDS` listed in catalog.v0.md (the canonical contract). */",
  );
  sections.push("export const CATALOG_EVENT_KINDS = [");
  for (const k of input.catalogKinds) {
    sections.push(`  "${k}",`);
  }
  sections.push("] as const;");
  sections.push("");

  // -- Per-family payload interfaces -------------------------------------
  sections.push("// ============================================================");
  sections.push("// Per-kind payload interfaces");
  sections.push("// ============================================================");
  sections.push("");

  // Group by family for readability.
  const byFamily = new Map<string, ParsedKind[]>();
  for (const k of allKinds) {
    const list = byFamily.get(k.family) ?? [];
    list.push(k);
    byFamily.set(k.family, list);
  }
  const familyKeys = [...byFamily.keys()].sort();
  for (const family of familyKeys) {
    sections.push(`// ---- ${family} ----`);
    sections.push("");
    const kinds = byFamily.get(family)!.slice().sort((a, b) =>
      a.kind.localeCompare(b.kind),
    );
    for (const k of kinds) {
      const ifaceName = payloadInterfaceName(k.kind);
      sections.push(`/** Payload for \`${k.kind}\`. */`);
      sections.push(`export interface ${ifaceName} {`);
      for (const f of k.fields) {
        const opt = f.optional ? "?" : "";
        const comment = f.comment ? `  // ${f.comment}` : "";
        sections.push(`  readonly ${f.name}${opt}: ${f.tsType};${comment}`);
      }
      if (k.fields.length === 0) {
        sections.push("  // (no payload fields parsed)");
      }
      sections.push("}");
      sections.push("");
    }
  }

  // -- Kind -> Payload map -----------------------------------------------
  sections.push("// ============================================================");
  sections.push("// Kind -> payload mapping");
  sections.push("// ============================================================");
  sections.push("");
  sections.push("/**");
  sections.push(" * Maps each `EventKind` literal to its `Payload` interface.");
  sections.push(" *");
  sections.push(
    " * Catalog kinds for which no payload section was found in the family",
  );
  sections.push(
    " * file map to `Readonly<Record<string, unknown>>` until the family file",
  );
  sections.push(" * is filled in.");
  sections.push(" */");
  sections.push("export interface EventPayloadByKind {");
  const parsedKinds = new Set(allKinds.map((k) => k.kind));
  for (const kind of effectiveKinds) {
    if (parsedKinds.has(kind)) {
      const note = catalogSet.has(kind)
        ? ""
        : "  // not yet in catalog.v0.md";
      sections.push(`  "${kind}": ${payloadInterfaceName(kind)};${note}`);
    } else {
      sections.push(
        `  "${kind}": Readonly<Record<string, unknown>>;  // payload section missing in family file`,
      );
    }
  }
  sections.push("}");
  sections.push("");

  // -- Discriminated union ------------------------------------------------
  sections.push("/**");
  sections.push(" * The canonical event union. Pattern:");
  sections.push(" *");
  sections.push(" * ```ts");
  sections.push(" * function handle(ev: Event) {");
  sections.push(" *   if (ev.kind === \"client.added\") {");
  sections.push(" *     // ev.payload is ClientAddedPayload");
  sections.push(" *   }");
  sections.push(" * }");
  sections.push(" * ```");
  sections.push(" */");
  sections.push("export type Event = {");
  sections.push("  [K in EventKind]: EnvelopeFields & {");
  sections.push("    readonly kind: K;");
  sections.push("    readonly payload: EventPayloadByKind[K];");
  sections.push("  };");
  sections.push("}[EventKind];");
  sections.push("");

  sections.push("/** Helper: extract the payload type for a given kind. */");
  sections.push(
    "export type PayloadOf<K extends EventKind> = EventPayloadByKind[K];",
  );
  sections.push("");
  sections.push("/** Helper: extract the event variant for a given kind. */");
  sections.push("export type EventOf<K extends EventKind> = Extract<Event, { kind: K }>;");
  sections.push("");

  // -- Family unions ------------------------------------------------------
  sections.push("// ============================================================");
  sections.push("// Family unions");
  sections.push("// ============================================================");
  sections.push("");
  for (const family of familyKeys) {
    const fkinds = byFamily.get(family)!.map((k) => k.kind).sort();
    if (fkinds.length === 0) continue;
    sections.push(
      `/** Every event kind in the \`${family}\` family. */`,
    );
    sections.push(`export type ${pascalCase(family)}EventKind =`);
    for (let i = 0; i < fkinds.length; i++) {
      const sep = i === fkinds.length - 1 ? ";" : "";
      sections.push(`  | "${fkinds[i]}"${sep}`);
    }
    sections.push("");
    sections.push(
      `/** Every event variant in the \`${family}\` family. */`,
    );
    sections.push(
      `export type ${pascalCase(family)}Event = EventOf<${pascalCase(family)}EventKind>;`,
    );
    sections.push("");
  }

  const allText = headerLines.concat(sections).join("\n");
  return {
    source: allText,
    lineCount: allText.split("\n").length,
  };
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const registeredPrefixes = await readRegisteredPrefixes();
  const catalog = await readCatalog();

  const entries = await readdir(EVENTS_DIR);
  const familyFiles = entries
    .filter(
      (n) =>
        n.endsWith(".md") &&
        !SKIP_FILES.has(n),
    )
    .sort();

  const parsed: FamilyParse[] = [];
  const allKinds: ParsedKind[] = [];
  for (const file of familyFiles) {
    const family = file.replace(/\.md$/, "");
    const md = await readFile(path.join(EVENTS_DIR, file), "utf8");
    const kindBlocks = extractKindBlocks(family, md);
    const kinds: ParsedKind[] = [];
    const malformations: string[] = [];
    for (const block of kindBlocks) {
      const parsedFields = parsePayloadBody(
        block.kind,
        block.payloadBody,
        registeredPrefixes,
      );
      const kindParts = block.kind.split(".");
      const verb = kindParts.slice(1).join(".");
      const parseError =
        parsedFields.warnings.length > 0
          ? parsedFields.warnings.join("; ")
          : null;
      const k: ParsedKind = {
        kind: block.kind,
        family,
        verb,
        fields: parsedFields.fields,
        parseError,
        rawPayload: block.payloadBody,
      };
      kinds.push(k);
      allKinds.push(k);
      if (parseError) {
        malformations.push(`${block.kind}: ${parseError}`);
      }
    }
    parsed.push({ family, file, kinds, malformations });
  }

  // Cross-reference catalog vs parsed.
  const parsedKindSet = new Set(allKinds.map((k) => k.kind));
  const catalogSet = new Set(catalog.kinds);
  const missingFromMarkdown = catalog.kinds.filter(
    (k) => !parsedKindSet.has(k),
  );
  const extraInMarkdown = [...parsedKindSet].filter((k) => !catalogSet.has(k));

  const familiesInMarkdown = new Set(parsed.map((p) => p.family));
  const familiesWithoutFile = catalog.families.filter(
    (f) => !familiesInMarkdown.has(f),
  );

  // Generate.
  const { source, lineCount } = emit({
    registeredPrefixes,
    catalogKinds: catalog.kinds,
    catalogFamilies: catalog.families,
    parsedFamilies: parsed,
    discoveredKinds: allKinds,
  });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, source, "utf8");

  // Build & log report.
  const malformations = parsed.flatMap((p) =>
    p.malformations.map((note) => ({ family: p.family, note })),
  );
  const report: CodegenReport = {
    families: parsed.map((p) => p.family),
    familiesWithoutFile,
    catalogKinds: catalog.kinds,
    parsedKinds: allKinds.map((k) => k.kind),
    missingFromMarkdown,
    extraInMarkdown,
    malformations,
    outFile: path.relative(REPO_ROOT, OUT_FILE),
    outLineCount: lineCount,
  };

  // Emit a concise stdout report (machine-friendly first, human-friendly after).
  const summary = [
    `[contracts-ts:codegen] wrote ${report.outFile} (${lineCount} lines)`,
    `[contracts-ts:codegen] families parsed: ${report.families.length}`,
    `[contracts-ts:codegen] kinds parsed: ${report.parsedKinds.length} of ${report.catalogKinds.length} catalog`,
  ];
  if (report.familiesWithoutFile.length > 0) {
    summary.push(
      `[contracts-ts:codegen] WARNING families in catalog without an .md file: ${report.familiesWithoutFile.join(", ")}`,
    );
  }
  if (report.missingFromMarkdown.length > 0) {
    summary.push(
      `[contracts-ts:codegen] WARNING catalog kinds missing a payload section: ${report.missingFromMarkdown.length}`,
    );
    for (const k of report.missingFromMarkdown) {
      summary.push(`[contracts-ts:codegen]   - ${k}`);
    }
  }
  if (report.extraInMarkdown.length > 0) {
    summary.push(
      `[contracts-ts:codegen] WARNING payload sections not in catalog: ${report.extraInMarkdown.length}`,
    );
    for (const k of report.extraInMarkdown) {
      summary.push(`[contracts-ts:codegen]   - ${k}`);
    }
  }
  if (report.malformations.length > 0) {
    summary.push(
      `[contracts-ts:codegen] NOTE ${report.malformations.length} non-fatal parse notes (best-effort fallbacks emitted):`,
    );
    for (const m of report.malformations.slice(0, 50)) {
      summary.push(`[contracts-ts:codegen]   ${m.family}: ${m.note}`);
    }
    if (report.malformations.length > 50) {
      summary.push(
        `[contracts-ts:codegen]   ... ${report.malformations.length - 50} more`,
      );
    }
  }
  console.log(summary.join("\n"));
}

main().catch((err: unknown) => {
  console.error("[contracts-ts:codegen] FAILED");
  if (err instanceof Error) {
    console.error(err.stack ?? err.message);
  } else {
    console.error(err);
  }
  process.exitCode = 1;
});
