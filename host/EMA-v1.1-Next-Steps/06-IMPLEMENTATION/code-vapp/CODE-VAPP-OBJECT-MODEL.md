# Code vApp Object Model

## Goal
Define the EMA-native object model for the future Code vApp.

## First-class objects
- code-workstream
- code-session
- repo-binding
- worktree-binding
- runtime-binding
- provider-session
- terminal-session
- code-artifact
- code-review
- code-checkpoint
- code-diff
- code-command
- code-run
- environment-profile
- secret-reference

## Required relationships
- code-workstream -> EMA workstream
- code-workstream -> intention / proposal / execution
- code-session -> provider-session
- code-session -> terminal-session
- code-session -> repo-binding / worktree-binding
- code-run -> chronicle trace/events
- code-review -> review queue / artifact lineage
- secret-reference -> environment-profile / provider binding

## Rule
Code work is not a parallel universe. It is a specialized workstream inside EMA truth.
