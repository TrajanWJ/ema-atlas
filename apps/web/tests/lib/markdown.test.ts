import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../../src/lib/markdown";

describe("renderMarkdown", () => {
	// --- Headings ---
	it("renders h1 heading", () => {
		expect(renderMarkdown("# Title")).toBe("<h1>Title</h1>");
	});

	it("renders h2 heading", () => {
		expect(renderMarkdown("## Section")).toBe("<h2>Section</h2>");
	});

	it("renders h3 through h6 headings", () => {
		expect(renderMarkdown("### Three")).toBe("<h3>Three</h3>");
		expect(renderMarkdown("#### Four")).toBe("<h4>Four</h4>");
		expect(renderMarkdown("##### Five")).toBe("<h5>Five</h5>");
		expect(renderMarkdown("###### Six")).toBe("<h6>Six</h6>");
	});

	// --- Inline formatting ---
	it("renders bold text", () => {
		expect(renderMarkdown("**bold**")).toContain("<strong>bold</strong>");
	});

	it("renders italic text", () => {
		expect(renderMarkdown("*italic*")).toContain("<em>italic</em>");
	});

	it("renders inline code", () => {
		expect(renderMarkdown("`code`")).toContain("<code>code</code>");
	});

	it("renders bold and italic in a heading", () => {
		const result = renderMarkdown("## Hello **world**");
		expect(result).toBe("<h2>Hello <strong>world</strong></h2>");
	});

	// --- Lists ---
	it("renders unordered list with dash", () => {
		const result = renderMarkdown("- one\n- two\n- three");
		expect(result).toContain("<ul>");
		expect(result).toContain("<li>one</li>");
		expect(result).toContain("<li>two</li>");
		expect(result).toContain("<li>three</li>");
		expect(result).toContain("</ul>");
	});

	it("renders ordered list", () => {
		const result = renderMarkdown("1. first\n2. second");
		expect(result).toContain("<ol>");
		expect(result).toContain("<li>first</li>");
		expect(result).toContain("<li>second</li>");
		expect(result).toContain("</ol>");
	});

	// --- Blockquote ---
	it("renders blockquote", () => {
		expect(renderMarkdown("> quoted")).toBe(
			"<blockquote>quoted</blockquote>",
		);
	});

	// --- Horizontal rule ---
	it("renders horizontal rule", () => {
		expect(renderMarkdown("---")).toBe("<hr />");
	});

	it("renders horizontal rule with extra dashes", () => {
		expect(renderMarkdown("------")).toBe("<hr />");
	});

	// --- Paragraphs ---
	it("wraps plain text in a paragraph", () => {
		expect(renderMarkdown("hello world")).toBe("<p>hello world</p>");
	});

	it("creates separate paragraphs for blocks separated by empty lines", () => {
		const result = renderMarkdown("first\n\nsecond");
		expect(result).toContain("<p>first</p>");
		expect(result).toContain("<p>second</p>");
	});

	// --- Security ---
	it("strips script tags", () => {
		const result = renderMarkdown(
			'hello <script>alert("xss")</script> world',
		);
		expect(result).not.toContain("<script>");
		expect(result).not.toContain("alert");
	});

	it("strips multiline script tags", () => {
		const result = renderMarkdown(
			"before\n<script>\nmalicious()\n</script>\nafter",
		);
		expect(result).not.toContain("<script>");
		expect(result).not.toContain("malicious");
	});

	// --- Edge cases ---
	it("returns empty string for empty input", () => {
		expect(renderMarkdown("")).toBe("");
	});

	it("handles input with only whitespace lines", () => {
		const result = renderMarkdown("   \n\n   ");
		expect(result).toBe("");
	});
});
