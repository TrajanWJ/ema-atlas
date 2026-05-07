# 22 - Git-backed project storage

Status: active storage rule
Date: 2026-05-07

## Claim

Every EMA project should have a versioned project record. Git is the default
storage/versioning substrate for those project files.

EMA daemon events remain canonical for coordination. Git versions the project
storage artifacts that humans and agents read, edit, export, and migrate.

## Model

```text
daemon events       -> canonical coordination truth
project Git repo    -> versioned project storage
git-ema attachments -> external code/file pointers
CWT shared files    -> feeder projection before import
```

Project materialization creates:

```text
Projects/<project>/
  .git/
  .gitignore
  project.md
  PROJECT-MAP.md
  atlas/
  builds/
```

The `project.materialized` event exposes:

- `storage_driver: "git_worktree"`
- `versioning: "git"`
- `git_repo_path`
- `git_branch`

## Why Git Is Built In

Git gives EMA cheap versioning, diffing, restore points, branchable agent
workspaces, and remote backup. Agents already reason well about Git state, so
project storage should expose it as a first-class backing rather than as an
incidental folder detail.

## Boundary With git-ema

`git-ema` is still the attachment and external-source system. It links GitHub
repos, git paths, Drive files, and local blobs into EMA objects.

Git-backed project storage is different: it is the local versioned record of an
EMA project itself. A project can both have its own Git worktree and attach
external Git repos through git-ema.

## CWT Promotion

CWT remains a feeder surface. Its shared-files projection should never become
canonical storage. When CWT records are promoted into EMA:

1. daemon events record the canonical lane/queue/problem/project facts;
2. project storage artifacts are written into the project Git worktree;
3. Git commits/snapshots provide file-level history for imported artifacts;
4. provenance keeps the CWT source id and manifest timestamp.

The current CLI dry-run exposes this boundary through
`ema cwt ingest --dry-run --json`, including a `project_storage` policy and
per-candidate Git targets.

## Near-Term Work

- Add explicit commit/snapshot commands for project storage.
- Add remote-binding metadata for canonical private GitHub repos.
- Add CWT `import_commit` after preview validation.
- Show Git dirty/clean state in `project.filesystem_status`.
