# Host / Repo / Runtime Bindings

Type: implementation-note
Plane: planning
Status: active

## Purpose
Define the binding layer between:
- machine
- repo path
- worktree
- runtime/provider session
- terminal session
- EMA workstream

## Why it matters
This is the seam that prevents EMA from becoming detached from real execution reality.

## Binding rules
- a code session should know its machine
- a machine-bound code session should know its repo/worktree
- a runtime/provider session should be attachable and reattachable
- bindings should survive restart and support stale-binding detection
- chronicle should be able to reference bindings as part of execution truth

## Related
- [CODE-VAPP-HOST-BINDINGS](../06-IMPLEMENTATION/code-vapp/CODE-VAPP-HOST-BINDINGS.md)
- [TRACK-D-HOST-OPS-SEED](../07-TRACKS/TRACK-D-HOST-OPS-SEED.md)
- [CLI-GUI-MIRRORED-WORKSPACE-VISION](../13-CLI-GUI-PARITY/CLI-GUI-MIRRORED-WORKSPACE-VISION.md)
