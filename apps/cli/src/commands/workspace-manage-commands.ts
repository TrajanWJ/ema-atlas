// Command-surface for `ema workspace status / worktree / branch / remote /
// pair`. Each verb dispatches into the workspace-manage kernel.
//
// Class A vs Class B is enforced inside the kernel; this file is purely
// argument plumbing + pretty/JSON output.

import path from "node:path";

import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import {
	branch as mBranch,
	buildContext,
	buildStatus,
	newReport,
	remote as mRemote,
	sync as mSync,
	worktree as mWorktree,
} from "../lib/workspace-manage/index.js";
import type { ManageAction, ManageContext, ManageReport } from "../lib/workspace-manage/types.js";

interface CmdOpts {
	json: boolean;
	verbose: boolean;
}

function readOpts(args: ParsedArgs): CmdOpts {
	return {
		json: flagBool(args, "json"),
		verbose: flagBool(args, "verbose"),
	};
}

async function ctxFromArgs(args: ParsedArgs): Promise<ManageContext> {
	return await buildContext({
		desktopRoot: flagString(args, "desktop-root"),
		emaRoot: flagString(args, "ema-root"),
		apply: flagBool(args, "apply"),
		withStash: flagBool(args, "with-stash"),
		withRemotes: flagBool(args, "with-remotes"),
		withBranches: flagBool(args, "with-branches"),
		withCreate: flagBool(args, "with-create"),
		githubOwner: flagString(args, "github-owner"),
		verbose: flagBool(args, "verbose"),
	});
}

function exitCode(report: ManageReport): number {
	if (report.totals.errors > 0) return 1;
	const hasError = report.actions.some((a) => a.severity === "error");
	return hasError ? 1 : 0;
}

function emitReport(opts: CmdOpts, report: ManageReport): void {
	if (opts.json) {
		emitJson(report);
		return;
	}
	emitPretty(`# ema workspace ${report.category}`);
	emitPretty(`scanned:          ${report.scanned_at}`);
	emitPretty(`desktop root:     ${report.desktop_root}`);
	emitPretty(
		`gates:            apply=${report.gates.apply} stash=${report.gates.with_stash} remotes=${report.gates.with_remotes} branches=${report.gates.with_branches} create=${report.gates.with_create}`,
	);
	emitPretty("");
	if (report.clones && report.clones.length > 0) {
		emitPretty(`clones:           ${report.clones.length}`);
		for (const c of report.clones) {
			emitPretty(
				`  ${c.dirty ? "*" : " "} ${c.name.padEnd(28)} ${(c.current_branch ?? "(detached)").padEnd(28)} origin=${c.has_origin ? "y" : "n"} branches=${c.branches.length} worktrees=${c.worktrees.length}`,
			);
		}
		emitPretty("");
	}
	if (report.pairs && report.pairs.length > 0) {
		emitPretty(`pair findings:    ${report.pairs.length}`);
		for (const p of report.pairs) {
			emitPretty(`  [${p.kind}] ${p.note}`);
		}
		emitPretty("");
	}
	emitPretty(`actions:          ${report.totals.actions} (${report.totals.applied} applied · ${report.totals.skipped} skipped · ${report.totals.errors} errors)`);
	for (const a of report.actions) {
		const sev = a.severity === "error" ? "!" : a.severity === "warn" ? "~" : ".";
		const tag = a.applied === true ? "+" : a.applied === false ? "-" : "?";
		emitPretty(`  ${tag}${sev} [${a.fix_class}] ${a.note}`);
		if (a.command) emitPretty(`      $ ${a.command}`);
		if (a.skipped_reason) emitPretty(`      skipped: ${a.skipped_reason}`);
		if (a.error) emitPretty(`      error: ${a.error}`);
	}
	emitPretty("");
	emitPretty(`status:           ${report.ok ? "ok" : "drift / errors"}`);
}

export async function runWorkspaceStatus(args: ParsedArgs): Promise<number> {
	const opts = readOpts(args);
	const ctx = await ctxFromArgs(args);
	const report = await buildStatus(ctx);
	emitReport(opts, report);
	return exitCode(report);
}

// `ema workspace worktree <verb>`
export async function runWorkspaceWorktree(args: ParsedArgs): Promise<number> {
	const verb = args.positional[1] ?? "list";
	const opts = readOpts(args);
	const ctx = await ctxFromArgs(args);
	if (verb === "list") {
		const rows = await mWorktree.listAll(ctx);
		const actions: ManageAction[] = rows.map((r) => ({
			id: `worktree-list:${r.repo}:${r.path}`,
			category: "worktree-list",
			severity: "info",
			fix_class: "C",
			repo: r.repo,
			target: r.path,
			note: `${path.basename(r.repo)}: ${r.path}${r.branch ? ` (${r.branch})` : ""}${r.exists ? "" : " [MISSING]"}${r.prunable ? " [prunable]" : ""}`,
		}));
		const report = newReport(ctx, "worktree-list", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	if (verb === "prune") {
		const actions = await mWorktree.planPrune(ctx);
		if (ctx.apply) await mWorktree.applyPrune(ctx, actions);
		const report = newReport(ctx, "worktree-prune", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	if (verb === "add") {
		const repo = flagString(args, "repo") ?? ctx.emaRoot;
		const wtPath = args.positional[2];
		const branch = args.positional[3];
		if (!wtPath || !branch) {
			emitError("Usage: ema workspace worktree add <path> <branch> [--repo <abs-path>]");
			return 64;
		}
		const actions = await mWorktree.planAdd(ctx, repo, wtPath, branch);
		if (ctx.apply && actions[0]?.fix_class === "A") {
			const r = await mWorktree.applyAdd(repo, wtPath, branch);
			actions[0].applied = r.ok;
			if (!r.ok) actions[0].error = r.error;
		}
		const report = newReport(ctx, "worktree-add", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	if (verb === "move") {
		const repo = flagString(args, "repo") ?? ctx.emaRoot;
		const from = args.positional[2];
		const to = args.positional[3];
		if (!from || !to) {
			emitError("Usage: ema workspace worktree move <from> <to> [--repo <abs-path>]");
			return 64;
		}
		const actions = await mWorktree.planMove(repo, from, to);
		if (ctx.apply && actions[0]?.fix_class === "A") {
			const r = await mWorktree.applyMove(repo, from, to);
			actions[0].applied = r.ok;
			if (!r.ok) actions[0].error = r.error;
		}
		const report = newReport(ctx, "worktree-move", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	emitError(`ema workspace worktree: unknown verb "${verb}" (expected: list | prune | add | move)`);
	return 64;
}

// `ema workspace branch <verb>`
export async function runWorkspaceBranch(args: ParsedArgs): Promise<number> {
	const verb = args.positional[1] ?? "list";
	const opts = readOpts(args);
	const ctx = await ctxFromArgs(args);
	if (verb === "list") {
		const rows = await mBranch.listAll(ctx);
		const actions: ManageAction[] = rows.map((r) => ({
			id: `branch-list:${r.repo}:${r.branch.name}`,
			category: "branch-list",
			severity: "info",
			fix_class: "C",
			repo: r.repo,
			target: r.branch.name,
			note: `${r.repo_name}: ${r.branch.name}${r.branch.upstream ? ` -> ${r.branch.upstream}` : " (no upstream)"}${r.branch.upstream_gone ? " [gone]" : ""}${r.branch.ahead ? ` ↑${r.branch.ahead}` : ""}${r.branch.behind ? ` ↓${r.branch.behind}` : ""}`,
		}));
		const report = newReport(ctx, "branch-list", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	if (verb === "clean") {
		const actions = await mBranch.planClean(ctx);
		if (ctx.apply) await mBranch.applyClean(ctx, actions);
		const report = newReport(ctx, "branch-clean", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	if (verb === "sync") {
		const actions = await mBranch.planSync(ctx);
		if (ctx.apply) await mBranch.applySync(ctx, actions);
		const report = newReport(ctx, "branch-sync", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	emitError(`ema workspace branch: unknown verb "${verb}" (expected: list | clean | sync)`);
	return 64;
}

// `ema workspace remote <verb>`
export async function runWorkspaceRemote(args: ParsedArgs): Promise<number> {
	const verb = args.positional[1] ?? "status";
	const opts = readOpts(args);
	const ctx = await ctxFromArgs(args);
	if (verb === "sync") {
		const actions = await mRemote.planSync(ctx);
		if (ctx.apply) await mRemote.applySync(ctx, actions);
		const report = newReport(ctx, "remote-sync", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	if (verb === "ensure") {
		const actions = await mRemote.planEnsure(ctx);
		if (ctx.apply) await mRemote.applyEnsure(ctx, actions);
		const report = newReport(ctx, "remote-ensure", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	if (verb === "status") {
		const actions = await mRemote.reportStatus(ctx);
		const report = newReport(ctx, "remote-status", actions);
		emitReport(opts, report);
		return exitCode(report);
	}
	emitError(`ema workspace remote: unknown verb "${verb}" (expected: sync | ensure | status)`);
	return 64;
}

// `ema workspace pair`
export async function runWorkspacePair(args: ParsedArgs): Promise<number> {
	const opts = readOpts(args);
	const ctx = await ctxFromArgs(args);
	const pair = await mSync.pairSymmetry(ctx);
	const report = newReport(ctx, "pair-symmetry", pair.actions);
	report.pairs = pair.findings;
	emitReport(opts, report);
	return exitCode(report);
}
