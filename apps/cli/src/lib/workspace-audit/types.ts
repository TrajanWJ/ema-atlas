// Shared types for the `ema doctor --workspace` audit kernel.
//
// Every audit module returns a `ModuleResult`: a list of findings tagged with
// the audit category, a human note, and whether the finding is automatically
// fixable under `--apply` (Class A) or requires explicit operator action.
//
// Plan reference: `your-missing-many-pieces-dazzling-tulip.md` Option 5a.

export type AuditCategory =
	| "active-projects-symmetry"
	| "naming-drift"
	| "unborn-projects"
	| "stale-worktrees"
	| "old-stashes"
	| "broken-symlinks"
	| "untracked-cruft"
	| "cross-clone-dups"
	| "branch-hygiene"
	| "push-lag"
	| "ds-store"
	| "wiki-coverage";

export type Severity = "info" | "warn" | "error";

// Fix classes drive `--apply` behavior:
// A → safe to auto-delete (DS_Store, empty desktop dir, abandoned clean worktree).
// B → behind a `--with-stash`/`--with-remotes`/`--with-branches` gate.
// C → never auto-fixable; requires operator judgement (3.9GB project move, etc.).
export type FixClass = "A" | "B" | "C";

export interface AuditFinding {
	category: AuditCategory;
	severity: Severity;
	fix_class: FixClass;
	id: string; // category-scoped stable id for dedupe / apply
	path?: string;
	note: string;
	suggested_fix?: string;
	// Optional sub-flag gate name; if present, `--apply` only acts when the
	// flag is set. Examples: "with-stash", "with-remotes", "with-branches".
	requires_flag?: string;
}

export interface ModuleResult {
	category: AuditCategory;
	skipped?: boolean;
	skip_reason?: string;
	findings: AuditFinding[];
	scan_ms?: number;
}

export interface AuditContext {
	// Root of the desktop workspace (what we audit). Defaults to `~/Desktop`.
	desktopRoot: string;
	// The current EMA build path (excluded from some scans to avoid self-flag).
	emaRoot: string;
	// Path to `Active builds/`.
	activeBuildsRoot: string;
	// Path to `Projects/`.
	projectsRoot: string;
	// Whether the kernel is in `--apply` mode (Class A only by default).
	apply: boolean;
	// Optional sub-flag gates for Class B operations.
	withStash: boolean;
	withRemotes: boolean;
	withBranches: boolean;
	// If true, scan output should include scan_ms timing per module.
	verbose: boolean;
}

export interface ApplyResult {
	finding_id: string;
	category: AuditCategory;
	applied: boolean;
	skipped_reason?: string;
	error?: string;
}

export interface WorkspaceAuditReport {
	ok: boolean; // true iff no findings of severity error|warn
	desktop_root: string;
	scanned_at: string; // ISO timestamp
	modules: ModuleResult[];
	totals: {
		findings: number;
		by_severity: Record<Severity, number>;
		by_category: Record<AuditCategory, number>;
		auto_fixable_class_a: number;
	};
	applied?: ApplyResult[];
	gates: {
		apply: boolean;
		with_stash: boolean;
		with_remotes: boolean;
		with_branches: boolean;
	};
}
