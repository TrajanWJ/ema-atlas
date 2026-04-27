/**
 * use-command-palette — donor-compatible hook for the direct-rip
 * CommandPalette.tsx component.
 *
 * Returns the shape the donor expects:
 *   { isOpen, query, results, setQuery, close }
 *
 * Results are composed from three sources:
 *   1. Surfaces — open a virtual-desktop window for any app in
 *      `surfaceLinks`.
 *   2. Shipped commands — dispatched via `useCommand`. Current set:
 *      `org.create`, `space.create`, `project.create`,
 *      `connector.connect` (all typed via `useOrgCommands`).
 *   3. Pending-daemon-writer commands — surfaced as visible
 *      `pending daemon writer` entries so the palette remains honest
 *      until the Wave 5 handoff writers land. See the handoff doc at
 *      `docs/orchestration/handoffs/surface-to-runtime-2026-04-24.md`.
 */

"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { EMA_SCOPE, surfaceLinks } from "../../app/mock-projections";
import { useWindowStore } from "../shell-state/window-store-bridge";
import { useDesktopStore } from "../shell-state/desktop-store-bridge";
import { useTopbar } from "../projections/use-topbar";
import type { AppId } from "../types/window";
import { useOrgCommands } from "./use-org-commands";
import { useCommand } from "../../lib/ipc";

export interface CommandResult {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly hint?: string;
  readonly action?: () => void | Promise<void>;
}

export type CommandPaletteView = {
  readonly isOpen: boolean;
  readonly query: string;
  readonly results: readonly CommandResult[];
  readonly setQuery: (value: string) => void;
  readonly close: () => void;
};

type RawCommand = CommandResult & { readonly searchBlob: string };

function searchBlobFor(label: string, hint: string | undefined): string {
  return `${label} ${hint ?? ""}`.toLowerCase();
}

function matchesQuery(blob: string, query: string): boolean {
  if (!query) return true;
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .every((token) => blob.includes(token));
}

function stripSearchBlob(entry: RawCommand): CommandResult {
  const { searchBlob: _searchBlob, ...rest } = entry;
  void _searchBlob;
  return rest;
}

export function useCommandPalette(): CommandPaletteView {
  const isOpen = useDesktopStore((s) => s.commandPaletteOpen);
  const closePalette = useDesktopStore((s) => s.closeCommandPalette);
  const openWindow = useWindowStore((s) => s.openWindow);
  const topbar = useTopbar();
  const orgCommands = useOrgCommands();
  const dispatch = useCommand();

  const [query, setQuery] = useState("");

  const rawResults = useMemo<readonly RawCommand[]>(() => {
    const commands: RawCommand[] = [];

    for (const surface of surfaceLinks) {
      const label = `Open ${surface.label}`;
      commands.push({
        id: `surface:${surface.id}`,
        label,
        icon: "◻",
        hint: surface.eyebrow,
        action: () => {
          openWindow(surface.id as AppId);
        },
        searchBlob: searchBlobFor(label, surface.eyebrow),
      });
    }

    const currentSpaceId = topbar.scope.space?.id ?? EMA_SCOPE.spaceId;
    const currentOrgId = topbar.scope.org?.id ?? EMA_SCOPE.orgId;

    const shipped: Array<
      Omit<RawCommand, "searchBlob"> & { readonly searchBlobLabel: string }
    > = [
      {
        id: "cmd:org.create",
        label: "Create org…",
        icon: "⊕",
        hint: "org.create",
        searchBlobLabel: "create organization org.create new",
        action: () => {
          const name = window.prompt("Org name?");
          if (!name) return;
          void orgCommands.createOrg({ name });
        },
      },
      {
        id: "cmd:space.create",
        label: "Create space…",
        icon: "⊕",
        hint: `space.create · ${topbar.scope.org?.name ?? "current org"}`,
        searchBlobLabel: "create space space.create new",
        action: () => {
          const name = window.prompt("Space name?");
          if (!name) return;
          void orgCommands.createSpace({ org_id: currentOrgId, name });
        },
      },
      {
        id: "cmd:project.create",
        label: "Create project…",
        icon: "⊕",
        hint: `project.create · ${topbar.scope.space?.name ?? "current space"}`,
        searchBlobLabel: "create project project.create new",
        action: () => {
          const name = window.prompt("Project name?");
          if (!name) return;
          void orgCommands.createProject({ space_id: currentSpaceId, name });
        },
      },
      {
        id: "cmd:connector.connect",
        label: "Connect git-ema…",
        icon: "⊕",
        hint: "connector.connect",
        searchBlobLabel: "connect connector github gitlab link connector.connect",
        action: () => {
          const label = window.prompt("Connector label?", "main");
          if (!label) return;
          void orgCommands.connectConnector({ kind: "github", label });
        },
      },
    ];

    for (const cmd of shipped) {
      const { searchBlobLabel, ...rest } = cmd;
      commands.push({ ...rest, searchBlob: searchBlobLabel });
    }

    const pending: Array<{
      readonly id: string;
      readonly op: string;
      readonly label: string;
      readonly searchTerms: string;
    }> = [
      { id: "cmd:swarm.start", op: "swarm.start", label: "Start swarm", searchTerms: "swarm start run" },
      { id: "cmd:swarm.pause", op: "swarm.pause", label: "Pause swarm", searchTerms: "swarm pause" },
      { id: "cmd:swarm.stop", op: "swarm.stop", label: "Stop swarm", searchTerms: "swarm stop kill" },
      { id: "cmd:mission.create", op: "mission.create", label: "Create mission", searchTerms: "mission create new" },
      { id: "cmd:lane.item_add", op: "lane.item_add", label: "Add lane item", searchTerms: "lane item add backlog" },
      { id: "cmd:handoff.request", op: "handoff.request", label: "Request handoff", searchTerms: "handoff request lane" },
      { id: "cmd:checkup.schedule", op: "checkup.schedule", label: "Schedule checkup", searchTerms: "checkup schedule review" },
    ];

    for (const cmd of pending) {
      commands.push({
        id: cmd.id,
        label: cmd.label,
        icon: "◌",
        hint: `${cmd.op} · pending daemon writer`,
        action: async () => {
          const result = await dispatch(cmd.op, {});
          if (!result.ok) {
            console.info(
              `[command-palette] ${cmd.op} rejected as expected — daemon writer not shipped.`,
              result.error,
            );
          }
        },
        searchBlob: searchBlobFor(
          cmd.label,
          `${cmd.op} ${cmd.searchTerms} pending daemon writer`,
        ),
      });
    }

    return commands;
  }, [dispatch, openWindow, orgCommands, topbar.scope.org, topbar.scope.space]);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return rawResults.slice(0, 12).map(stripSearchBlob);
    return rawResults
      .filter((entry) => matchesQuery(entry.searchBlob, trimmed))
      .slice(0, 20)
      .map(stripSearchBlob);
  }, [rawResults, query]);

  const close = useCallback(() => closePalette(), [closePalette]);

  return { isOpen, query, results, setQuery, close };
}
