// ----------------------------------------------------------------------------
// Markdown-to-HTML renderer (no external deps)
// ----------------------------------------------------------------------------

/**
 * Strips any <script> tags (and their contents) from the output to prevent
 * script injection.
 */
function stripScripts(html: string): string {
	return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

/**
 * Renders inline markdown tokens: bold, italic, inline code.
 * Applied after block-level rules so we don't mangle block tags.
 */
function renderInline(text: string): string {
	// Inline code — must come before bold/italic so backticks aren't processed
	let out = text.replace(/`([^`]+)`/g, "<code>$1</code>");

	// Bold: **text**
	out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

	// Italic: *text* (single asterisk, not already consumed by bold)
	out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");

	return out;
}

/**
 * Converts a plain-text markdown string to a sanitized HTML string.
 *
 * Supported syntax:
 *   ## heading (h1–h6)
 *   **bold**, *italic*, `code`
 *   - unordered list item
 *   1. ordered list item
 *   > blockquote
 *   ---  horizontal rule
 *   Empty line → paragraph break
 */
export function renderMarkdown(input: string): string {
	if (input.length === 0) {
		return "";
	}

	const lines = input.split("\n");
	const parts: string[] = [];

	let ulBuffer: string[] = [];
	let olBuffer: string[] = [];
	let paraBuffer: string[] = [];

	const flushUl = () => {
		if (ulBuffer.length > 0) {
			parts.push(`<ul>${ulBuffer.join("")}</ul>`);
			ulBuffer = [];
		}
	};

	const flushOl = () => {
		if (olBuffer.length > 0) {
			parts.push(`<ol>${olBuffer.join("")}</ol>`);
			olBuffer = [];
		}
	};

	const flushPara = () => {
		if (paraBuffer.length > 0) {
			const text = paraBuffer.join(" ").trim();
			if (text.length > 0) {
				parts.push(`<p>${renderInline(text)}</p>`);
			}
			paraBuffer = [];
		}
	};

	const flushAll = () => {
		flushUl();
		flushOl();
		flushPara();
	};

	for (const rawLine of lines) {
		const line = rawLine;

		// Horizontal rule
		if (/^---+$/.test(line.trim())) {
			flushAll();
			parts.push("<hr />");
			continue;
		}

		// Headings: up to 6 levels
		const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
		if (headingMatch) {
			flushAll();
			const hashes = headingMatch[1] ?? '';
			const level = hashes.length;
			const text = renderInline(headingMatch[2] ?? '');
			parts.push(`<h${level}>${text}</h${level}>`);
			continue;
		}

		// Blockquote
		if (line.startsWith("> ")) {
			flushAll();
			const text = renderInline(line.slice(2));
			parts.push(`<blockquote>${text}</blockquote>`);
			continue;
		}

		// Unordered list item
		const ulMatch = line.match(/^[-*]\s+(.*)/);
		if (ulMatch) {
			flushOl();
			flushPara();
			ulBuffer.push(`<li>${renderInline(ulMatch[1] ?? '')}</li>`);
			continue;
		}

		// Ordered list item
		const olMatch = line.match(/^\d+\.\s+(.*)/);
		if (olMatch) {
			flushUl();
			flushPara();
			olBuffer.push(`<li>${renderInline(olMatch[1] ?? '')}</li>`);
			continue;
		}

		// Empty line → flush paragraph
		if (line.trim() === "") {
			flushAll();
			continue;
		}

		// Plain text → accumulate into paragraph
		flushUl();
		flushOl();
		paraBuffer.push(line);
	}

	// Flush anything remaining
	flushAll();

	const html = parts.join("\n");
	return stripScripts(html);
}
