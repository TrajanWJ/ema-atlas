# EMA Shared Object Model (Draft)

## Purpose
A single object vocabulary that can be used by CLI, GUI, chronicle, host ops, and knowledge surfaces.

## Core objects
- intention
- proposal
- approval
- execution
- trace
- observation / step / event
- workstream / session / thread
- artifact
- review
- memory
- machine
- service
- peer
- notification
- planning-node
- research-item
- note / meeting-output / decision

## Required universal properties
Every major object should have, where relevant:
- `id`
- `type`
- `title` or compact summary
- `status`
- `created_at`
- `updated_at`
- `source_plane` (canon / planning / reality / gap / chronicle)
- `related_ids`
- `workstream_id` when part of active work
- `trace_id` / `execution_id` where operationally relevant
- `freshness` / `last_validated_at` where truth can stale

## Critical relationships
- intention -> proposal
- proposal -> approval
- approval -> execution
- execution -> trace
- execution -> artifacts
- execution -> review
- trace -> memory candidates
- workstream <-> session/thread/chat/CLI/GUI surfaces
- machine/service/peer/notification linked into active operations and chronicle
