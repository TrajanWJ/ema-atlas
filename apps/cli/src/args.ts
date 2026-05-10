// Minimal argv parser — long flags only: --name value, --name=value, --flag.
// Positional args are collected in order. Good enough for wave-1 grammar.

export interface ParsedArgs {
	positional: string[];
	flags: Record<string, string | boolean | string[]>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (!tok.startsWith("--")) {
      positional.push(tok);
      continue;
    }
    const body = tok.slice(2);
    const eq = body.indexOf("=");
    if (eq !== -1) {
			setFlag(flags, body.slice(0, eq), body.slice(eq + 1));
			continue;
		}
		const next = argv[i + 1];
		if (next !== undefined && !next.startsWith("--")) {
			setFlag(flags, body, next);
			i += 1;
		} else {
			setFlag(flags, body, true);
		}
	}
	return { positional, flags };
}

export function flagString(args: ParsedArgs, name: string): string | undefined {
	const v = args.flags[name];
	if (Array.isArray(v)) return v.at(-1);
	return typeof v === "string" ? v : undefined;
}

export function flagBool(args: ParsedArgs, name: string): boolean {
	return args.flags[name] === true || args.flags[name] === "true";
}

export function flagStrings(args: ParsedArgs, name: string): string[] {
	const v = args.flags[name];
	if (Array.isArray(v)) return v;
	if (typeof v === "string") return [v];
	return [];
}

function setFlag(
	flags: Record<string, string | boolean | string[]>,
	name: string,
	value: string | boolean,
): void {
	const current = flags[name];
	if (current === undefined) {
		flags[name] = value;
		return;
	}
	const currentValues = Array.isArray(current)
		? current
		: typeof current === "string"
			? [current]
			: [];
	if (typeof value === "string") flags[name] = [...currentValues, value];
	else flags[name] = value;
}
