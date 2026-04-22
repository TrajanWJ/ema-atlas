"use client";

import { useEffect, useCallback } from "react";
import type { VaultFile } from "@/lib/types";
import type { CommandAction } from "@/components/CommandPalette";
import { useWSStore } from "@/lib/stores/wsStore";
import { useUIStore, type AppTab } from "@/lib/stores/uiStore";
import PulseBar from "@/components/PulseBar";
import Bridge from "@/components/Bridge";
import AgentActivity from "@/components/AgentActivity";
import VaultBrowser from "@/components/VaultBrowser";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import ExecutiveDashboard from "@/components/ExecutiveDashboard";
import Channels from "@/components/Channels";
import { useState } from "react";

const TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: "executive", label: "Today", icon: "🧠" },
  { id: "bridge", label: "Bridge", icon: "🛎️" },
  { id: "channels", label: "Channels", icon: "📡" },
  { id: "activity", label: "Agent Activity", icon: "🎭" },
  { id: "vault", label: "Vault Browser", icon: "📚" },
];

export default function DesktopApp() {
  const { status, messages, agentEvents } = useWSStore();
  const { activeTab, setActiveTab, commandPaletteOpen, setCommandPaletteOpen, shortcutsOpen, setShortcutsOpen } =
    useUIStore();

  const [vaultTree, setVaultTree] = useState<VaultFile[]>([]);
  const [vaultAction, setVaultAction] = useState<
    { type: "search"; query: string } | { type: "open"; path: string } | null
  >(null);
  const [selectedVaultFile, setSelectedVaultFile] = useState<string>("");
  const [vaultFileContent, setVaultFileContent] = useState<string>("");

  const runningAgents = agentEvents.filter((e) => e.status === "running").length;

  const handleCommandAction = useCallback(
    (action: CommandAction) => {
      switch (action.type) {
        case "search-vault":
          setActiveTab("vault");
          setVaultAction({ type: "search", query: action.query });
          break;
        case "open-file":
          setActiveTab("vault");
          setVaultAction({ type: "open", path: action.path });
          break;
        case "system-status":
          break;
        case "agent-info":
          setActiveTab("activity");
          break;
      }
    },
    [setActiveTab]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      if (e.key === "Escape") {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        return;
      }

      if (isInput) return;

      if (e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "1") { e.preventDefault(); setActiveTab("executive"); return; }
        if (e.key === "2") { e.preventDefault(); setActiveTab("bridge"); return; }
        if (e.key === "3") { e.preventDefault(); setActiveTab("channels"); return; }
        if (e.key === "4") { e.preventDefault(); setActiveTab("activity"); return; }
        if (e.key === "5") { e.preventDefault(); setActiveTab("vault"); return; }
      }

      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setActiveTab("vault");
        setTimeout(() => {
          const searchInput = document.querySelector(
            "#vault-browser input[type='text']"
          ) as HTMLInputElement;
          searchInput?.focus();
        }, 100);
        return;
      }

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, shortcutsOpen, setActiveTab, setCommandPaletteOpen, setShortcutsOpen]);

  const handleTreeLoaded = useCallback((tree: VaultFile[]) => {
    setVaultTree(tree);
  }, []);

  return (
    <>
      <PulseBar connectionStatus={status} agentCount={runningAgents} />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Tab bar */}
          <div className="flex border-b shrink-0" style={{ borderColor: "var(--color-border)" }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer relative"
                style={{
                  color:
                    activeTab === tab.id
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                  background:
                    activeTab === tab.id ? "var(--color-surface)" : "transparent",
                }}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-200"
                    style={{
                      height: "2px",
                      background: "var(--color-accent)",
                      boxShadow:
                        "0 0 6px var(--color-accent), 0 0 2px var(--color-accent)",
                    }}
                  />
                )}
              </button>
            ))}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="ml-auto mr-2 flex items-center gap-1.5 px-2 py-1 text-[10px] cursor-pointer transition-colors hover:bg-[var(--color-surface-elevated)] rounded"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <kbd
                className="px-1 py-0.5 rounded"
                style={{
                  background: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border)",
                }}
              >
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeTab === "executive" && <ExecutiveDashboard />}
            {activeTab === "bridge" && <Bridge />}
            {activeTab === "channels" && <Channels />}
            {activeTab === "activity" && <AgentActivity events={agentEvents} />}
            {activeTab === "vault" && (
              <VaultBrowser
                externalAction={vaultAction}
                onTreeLoaded={handleTreeLoaded}
              />
            )}
          </div>
        </div>

        <Sidebar
          messages={messages}
          agentEvents={agentEvents}
          selectedVaultFile={selectedVaultFile}
          fileContent={vaultFileContent}
          vaultTree={vaultTree}
        />
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onAction={handleCommandAction}
        vaultTree={vaultTree}
      />

      <KeyboardShortcuts
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}
