type CommandHandler = (args: readonly string[]) => string | string[];

let bootTime = Date.now();

export function setBootTime(ts: number): void {
	bootTime = ts;
}

function formatUptime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const parts: string[] = [];
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	parts.push(`${seconds}s`);
	return parts.join(" ");
}

function cowsay(text: string): string[] {
	const maxWidth = 40;
	const words = text.split(" ");
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		if (current.length + word.length + 1 > maxWidth) {
			if (current) lines.push(current);
			current = word;
		} else {
			current = current ? `${current} ${word}` : word;
		}
	}
	if (current) lines.push(current);

	if (lines.length === 0) lines.push(" ");

	const width = Math.max(...lines.map((l) => l.length));
	const top = ` ${"_".repeat(width + 2)}`;
	const bottom = ` ${"-".repeat(width + 2)}`;
	const boxLines = lines.map((line, i) => {
		const padded = line.padEnd(width);
		if (lines.length === 1) return `< ${padded} >`;
		if (i === 0) return `/ ${padded} \\`;
		if (i === lines.length - 1) return `\\ ${padded} /`;
		return `| ${padded} |`;
	});

	return [
		top,
		...boxLines,
		bottom,
		"        \\   ^__^",
		"         \\  (oo)\\_______",
		"            (__)\\       )\\/\\",
		"                ||----w |",
		"                ||     ||",
	];
}

// Commands that don't need async — pure functions
export const COMMANDS: Record<string, CommandHandler> = {
	help() {
		return [
			"Available commands:",
			"  help           — show this list",
			"  clear          — clear the terminal",
			"  echo <text>    — print text",
			"  date           — current date and time",
			"  whoami         — current user",
			"  uptime         — session uptime",
			"  cowsay <text>  — ASCII cow",
			"  /dump <text>   — add to Brain Dump inbox",
			"  /focus [min]   — start focus timer (default 25m)",
			"  /journal       — open journal",
		];
	},

	echo(args) {
		return args.join(" ") || "";
	},

	date() {
		return new Date().toLocaleString();
	},

	whoami() {
		return "trajan@ema.local";
	},

	uptime() {
		return `up ${formatUptime(Date.now() - bootTime)}`;
	},

	cowsay(args) {
		const text = args.join(" ") || "moo";
		return cowsay(text);
	},
};

// Async commands that need store access — handled separately in TerminalApp
export const ASYNC_COMMAND_NAMES = ["/dump", "/focus", "/journal", "clear"] as const;
