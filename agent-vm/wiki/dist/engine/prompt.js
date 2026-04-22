"use strict";
// ============================================================
// Wiki Engine — Prompt API
// Natural language page updates, summaries, and link suggestions
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptRouter = void 0;
const express_1 = require("express");
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const store_1 = require("./store");
const CLAUDE_BIN = '/usr/bin/claude';
const DRAFTS_DIR = '/home/trajan/wiki/.drafts';
const PROMPT_LOG = '/home/trajan/wiki/.prompt-log.jsonl';
// ============================================================
// Helpers
// ============================================================
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
function logPromptOp(entry) {
    try {
        ensureDir(path_1.default.dirname(PROMPT_LOG));
        const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
        fs_1.default.appendFileSync(PROMPT_LOG, line + '\n', 'utf8');
    }
    catch (err) {
        console.error('[prompt-log] write error:', err);
    }
}
function callClaude(prompt) {
    const result = (0, child_process_1.execSync)(`${CLAUDE_BIN} --print --permission-mode bypassPermissions ${JSON.stringify(prompt)}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 60_000 });
    return result.trim();
}
function changeRatio(original, updated) {
    const oldLen = original.length;
    const newLen = updated.length;
    if (oldLen === 0)
        return 1;
    const diff = Math.abs(newLen - oldLen);
    // Also compute edit distance approximation via line diff
    const oldLines = new Set(original.split('\n'));
    const newLines = updated.split('\n');
    const changedLines = newLines.filter(l => !oldLines.has(l)).length;
    const totalLines = Math.max(original.split('\n').length, newLines.length) || 1;
    const lineDiffRatio = changedLines / totalLines;
    const lenDiffRatio = diff / oldLen;
    return Math.max(lineDiffRatio, lenDiffRatio);
}
function diffPreview(original, updated, maxLines = 20) {
    const oldLines = original.split('\n');
    const newLines = updated.split('\n');
    const preview = [];
    const maxLen = Math.max(oldLines.length, newLines.length);
    let shown = 0;
    for (let i = 0; i < maxLen && shown < maxLines; i++) {
        const o = oldLines[i] ?? '';
        const n = newLines[i] ?? '';
        if (o !== n) {
            if (o)
                preview.push(`- ${o}`);
            if (n)
                preview.push(`+ ${n}`);
            shown++;
        }
    }
    return preview.join('\n');
}
// ============================================================
// Router
// ============================================================
exports.promptRouter = (0, express_1.Router)();
// ============================================================
// POST /api/wiki/prompt
// Body: { page_id, instruction, author? }
// ============================================================
exports.promptRouter.post('/prompt', (req, res) => {
    const { page_id, instruction, author } = req.body;
    if (!page_id || !instruction) {
        res.status(400).json({ error: 'page_id and instruction are required' });
        return;
    }
    const page = (0, store_1.getPage)(page_id);
    if (!page) {
        res.status(404).json({ error: 'Page not found' });
        return;
    }
    const originalContent = page.content;
    let updatedContent;
    try {
        const prompt = `You are updating a wiki page. Current content:\n\n${originalContent}\n\n` +
            `Instruction: ${instruction}\n\n` +
            `Return ONLY the updated markdown content, no explanation.`;
        updatedContent = callClaude(prompt);
    }
    catch (err) {
        logPromptOp({ op: 'prompt', page_id, instruction, author, status: 'claude_error', error: String(err) });
        console.error('[prompt] Claude CLI error:', err);
        res.status(500).json({ error: 'Claude CLI failed', detail: String(err) });
        return;
    }
    const ratio = changeRatio(originalContent, updatedContent);
    if (ratio < 0.2) {
        // Small change — auto-commit
        const updated = (0, store_1.updatePage)(page_id, {
            frontmatter: author ? { author } : undefined,
            content: updatedContent,
        });
        logPromptOp({ op: 'prompt', page_id, instruction, author, status: 'committed', change_ratio: ratio });
        res.json({ status: 'committed', page: updated });
    }
    else {
        // Large change — save as draft
        ensureDir(DRAFTS_DIR);
        const timestamp = Date.now();
        const draftId = `${page_id}-${timestamp}`;
        const draftPath = path_1.default.join(DRAFTS_DIR, `${draftId}.md`);
        fs_1.default.writeFileSync(draftPath, updatedContent, 'utf8');
        const preview = diffPreview(originalContent, updatedContent);
        logPromptOp({ op: 'prompt', page_id, instruction, author, status: 'draft', draft_id: draftId, change_ratio: ratio });
        res.json({
            status: 'draft',
            draft_id: draftId,
            draft_path: draftPath,
            change_ratio: ratio,
            diff_preview: preview,
        });
    }
});
// ============================================================
// POST /api/wiki/summarize/:page_id
// ============================================================
exports.promptRouter.post('/summarize/:page_id', (req, res) => {
    const { page_id } = req.params;
    const page = (0, store_1.getPage)(page_id);
    if (!page) {
        res.status(404).json({ error: 'Page not found' });
        return;
    }
    let summary;
    try {
        const prompt = `You are summarizing a wiki page. Read the following content and write a 2-3 sentence summary ` +
            `that captures the key information. Return ONLY the summary text, no explanation or labels.\n\n` +
            `Title: ${page.frontmatter.title}\n\n${page.content}`;
        summary = callClaude(prompt);
        // Strip any leading "Summary:" label if Claude includes it
        summary = summary.replace(/^summary:\s*/i, '').trim();
    }
    catch (err) {
        logPromptOp({ op: 'summarize', page_id, status: 'claude_error', error: String(err) });
        console.error('[summarize] Claude CLI error:', err);
        res.status(500).json({ error: 'Claude CLI failed', detail: String(err) });
        return;
    }
    const updated = (0, store_1.updatePage)(page_id, { frontmatter: { summary } });
    logPromptOp({ op: 'summarize', page_id, status: 'ok' });
    res.json({ status: 'ok', summary, page: updated });
});
// ============================================================
// POST /api/wiki/suggest-links/:page_id
// ============================================================
exports.promptRouter.post('/suggest-links/:page_id', (req, res) => {
    const { page_id } = req.params;
    const page = (0, store_1.getPage)(page_id);
    if (!page) {
        res.status(404).json({ error: 'Page not found' });
        return;
    }
    // Extract key terms using Claude
    let keyTerms = [];
    try {
        const prompt = `Extract 5-8 key terms or concepts from this wiki page that could be used to find related pages. ` +
            `Return ONLY a JSON array of strings, e.g. ["term1","term2"]. No explanation.\n\n` +
            `Title: ${page.frontmatter.title}\n\n${page.content.slice(0, 3000)}`;
        const raw = callClaude(prompt);
        const match = raw.match(/\[.*\]/s);
        if (match) {
            keyTerms = JSON.parse(match[0]);
        }
    }
    catch (err) {
        console.error('[suggest-links] Claude key-terms error:', err);
        // Fall back to words from title
        keyTerms = page.frontmatter.title.split(/\s+/).filter(w => w.length > 3);
    }
    // Search for each term and collect unique results
    const seenIds = new Set([page_id]);
    const candidates = [];
    for (const term of keyTerms.slice(0, 6)) {
        try {
            const results = (0, store_1.searchPages)(term, 5);
            for (const r of results) {
                if (!seenIds.has(r.id)) {
                    seenIds.add(r.id);
                    candidates.push({ id: r.id, title: r.title, path: r.path, snippet: r.snippet });
                }
            }
        }
        catch (_) {
            // ignore individual search failures
        }
    }
    // Ask Claude to rank and give reasons for top suggestions
    let suggestions = [];
    if (candidates.length > 0) {
        try {
            const candidateList = candidates
                .slice(0, 15)
                .map((c, i) => `${i + 1}. [${c.title}] path:${c.path} — ${c.snippet}`)
                .join('\n');
            const prompt = `Given this wiki page:\nTitle: ${page.frontmatter.title}\n\n${page.content.slice(0, 2000)}\n\n` +
                `Here are candidate related pages:\n${candidateList}\n\n` +
                `Return ONLY a JSON array of the most relevant suggestions (max 5), each with fields: title, path, reason. ` +
                `Example: [{"title":"Foo","path":"spaces/x/foo.md","reason":"Both cover X"}]. No explanation.`;
            const raw = callClaude(prompt);
            const match = raw.match(/\[.*\]/s);
            if (match) {
                suggestions = JSON.parse(match[0]);
            }
        }
        catch (err) {
            console.error('[suggest-links] Claude ranking error:', err);
            // Return raw candidates as fallback
            suggestions = candidates.slice(0, 5).map(c => ({
                title: c.title,
                path: c.path,
                reason: 'Related by keyword search',
            }));
        }
    }
    logPromptOp({ op: 'suggest-links', page_id, suggestion_count: suggestions.length });
    res.json({ suggestions, key_terms: keyTerms });
});
// ============================================================
// POST /api/wiki/batch-summarize
// Body: { type?, missing_only?, limit? }
// ============================================================
exports.promptRouter.post('/batch-summarize', async (req, res) => {
    const { type, missing_only = true, limit = 50, } = req.body;
    const allPages = (0, store_1.listPages)({
        type: type ?? undefined,
        limit: 1000,
    });
    let targets = allPages;
    if (missing_only) {
        targets = allPages.filter(p => !p.summary);
    }
    targets = targets.slice(0, limit);
    let generated = 0;
    const errors = [];
    for (let i = 0; i < targets.length; i++) {
        const pageSum = targets[i];
        const page = (0, store_1.getPage)(pageSum.id);
        if (!page)
            continue;
        try {
            const prompt = `You are summarizing a wiki page. Read the following content and write a 2-3 sentence summary ` +
                `that captures the key information. Return ONLY the summary text, no explanation or labels.\n\n` +
                `Title: ${page.frontmatter.title}\n\n${page.content}`;
            let summary = callClaude(prompt);
            summary = summary.replace(/^summary:\s*/i, '').trim();
            (0, store_1.updatePage)(page.id, { frontmatter: { summary } });
            logPromptOp({ op: 'batch-summarize', page_id: page.id, status: 'ok' });
            generated++;
        }
        catch (err) {
            const msg = `${pageSum.id}: ${String(err)}`;
            errors.push(msg);
            logPromptOp({ op: 'batch-summarize', page_id: page.id, status: 'error', error: String(err) });
            console.error('[batch-summarize] error on', page.id, err);
        }
        // Rate limit: 1 per 2 seconds
        if (i < targets.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    res.json({
        generated,
        total_candidates: targets.length,
        errors: errors.length > 0 ? errors : undefined,
    });
});
//# sourceMappingURL=prompt.js.map