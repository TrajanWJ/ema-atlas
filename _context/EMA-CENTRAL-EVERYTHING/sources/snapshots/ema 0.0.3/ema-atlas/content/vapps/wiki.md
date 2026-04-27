# Wiki

A Google-Docs-meets-Wikipedia-meets-Obsidian semantic surface where humans
and agents read, edit, comment, and inline-prompt together. The Wiki is the
place where the project's prose becomes legible without becoming admin work.

## What it owns

Nothing canonical. The Wiki is a **collaboration-plane** surface — it
renders collaboration objects (wiki nodes, edges, comments, inline-prompt
threads) that live in the collab subsystem (see `graph/edges/collab.md`).
EMA's control plane keeps lineage; the workspace plane keeps durable
artifacts; the Wiki visualizes the live, multi-cursor middle.

## What it renders

- Wiki nodes (typed pages: concept, decision, person, project, term)
- Edges between nodes (cites, refines, contradicts, derived-from)
- Inline comments and inline prompts
- Live presence (who is reading / editing / prompting where)
- Backlinks pulled from the semantic layer
- Optional control-plane chrome: which nodes underlie which decisions

## What humans can do

- Create / edit / re-link wiki nodes
- Drop inline comments and inline prompts on any selection
- Promote a comment thread into a workspace artifact (note, proposal)
- Resolve a contradiction edge by editing one side or both
- Open the node in Blueprint to see its place in the larger structure

## What agents can do via CLI

- `ema wiki node create --title --type --space`
- `ema wiki node edit <id> --patch <file>`
- `ema wiki edge add <from> <to> --kind`
- `ema wiki prompt <node> --selection --prompt`
- `ema wiki search --query --space` (semantic + lexical)

## Chronicle / review / memory links

- Every node edit emits a control-plane `WikiEdit` event with author,
  space, prior hash, semantic-layer reindex hint.
- The Vault Cognitive Layer (see GLOSSARY) consumes the event stream for
  contradiction and gap detection.
- Inline-prompt threads link bidirectionally to their session in Chat.

## How it satisfies the canonical rule

Surfaces don't own state. The Wiki holds no truth: it renders collab
objects owned by the collaboration plane and emits proposed edits back
through a typed channel. There is no `Repo.insert` in any Wiki surface
module — every mutation goes through `collab_plane.propose_edit/2` and
is reconciled by the collab supervisor.

## v0.0.3 question

**After v0.0.3.** Wiki depends on Q2 (where collaboration state lives)
being answered. The smallest pre-v0.0.3 stand-in is a read-only renderer
over `content/briefs/*.md` and the GLOSSARY — useful, but not a vApp yet.
Ship the Wiki vApp once the collab plane has a CRDT or hybrid substrate
locked in.
