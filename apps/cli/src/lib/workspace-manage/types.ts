// Shared types for the `ema workspace` management kernel.
//
// This is the *actuation* counterpart to `workspace-audit/`: same Class A /
// Class B / operator-gate posture, but expressed as commands the operator
// runs against the desktop filesystem rather than detector findings.

import type {
	AuditFinding,
	FixClass,
	Severity,
} from "../workspace-audit/types.js";

// Re-export so callers don't need to import both paths for shape parity.
export type { AuditFinding, FixClass, Severity };

// A single management action that the kernel either *would* take (preview)
// or *did* take (under --apply). Inter-readable with audit findings.
export interface ManageAction {
	id: string; // category-scoped stable id
	category: ManageCategory;
	severity: Severity;
	fix_class: FixClass;
	repo?: string; // absolute path to the clone, when applicable
	target?: string; // branch / worktree path / remote name, when applicable
	note: string;
	command?: string; // human-readable preview of the underlying git invocation
	requires_flag?: string; // e.g. "with-branches", "with-remotes", "with-create"
	applied?: boolean; // true under --apply when execution succeeded
	skipped_reason?: string; // why a Class B / dirty-tree / gate refused
	error?: string; // execution failure
}

export type ManageCategory =
	| "worktree-list"
	| "worktree-prune"
	| "worktree-add"
	| "worktree-move"
	| "branch-list"
	| "branch-clean"
	| "branch-sync"
	| "remote-sync"
	| "remote-ensure"
	| "remote-status"
	| "pair-symmetry"
	| "status";

export interface CloneSummary {
	repo: string;
	name: string;
	default_branch: string | null;
	current_branch: string | null;
	dirty: boolean;
	has_origin: boolean;
	origin_url: string | null;
	branches: BranchSummary[];
	worktrees: WorktreeSummary[];
}

export interface BranchSummary {
	name: string;
	upstream: string | null;
	upstream_gone: boolean;
	ahead: number;
	behind: number;
}

export interface WorktreeSummary {
	path: string;
	branch: string | null;
	exists: boolean;
	prunable: boolean;
}

export interface PairFinding {
	id: string;
	severity: Severity;
	kind: "orphan-active" | "dormant-project";
	name: string;
	path: string;
	note: string;
}

export interface ManageContext {
	desktopRoot: string;
	emaRoot: string;
	activeBuildsRoot: string;
	projectsRoot: string;
	apply: boolean;
	withStash: boolean;
	withRemotes: boolean;
	withBranches: boolean;
	withCreate: boolean;
	githubOwner: string; // default: "TrajanWJ"
	verbose: boolean;
}

export interface ManageReport {
	ok: boolean;
	category: ManageCategory | "multi";
	scanned_at: string;
	desktop_root: string;
	gates: {
		apply: boolean;
		with_stash: boolean;
		with_remotes: boolean;
		with_branches: boolean;
		with_create: boolean;
	};
	actions: ManageAction[];
	clones?: CloneSummary[];
	pairs?: PairFinding[];
	totals: {
		actions: number;
		applied: number;
		skipped: number;
		errors: number;
	};
}

// Gate names a Class B action may name.
export type ManageGate = "with-stash" | "with-remotes" | "with-branches" | "with-create";

export const IGNORE_DIR_NAMES = new Set<string>([
	".DS_Store",
	".git",
	"_archive",
	"_archive_old",
	"README.md",
]);
