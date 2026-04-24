import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ShellLayout } from "../shell/shell-layout";
import { AgentWorkPage } from "./agent-work-page";
import { BlueprintPage } from "../vapps/blueprint";
import { GitEmaPage } from "../vapps/git-ema";
import { HqPage } from "./hq-page";
import { PlaceholderPage } from "./placeholder-page";
import { SettingsPage } from "./settings-page";
import { IpcProvider } from "../lib/ipc";
import "@ema/design-system/tokens.css";
import "./styles.css";
const router = createBrowserRouter([
    {
        path: "/",
        element: _jsx(ShellLayout, {}),
        children: [
            {
                index: true,
                element: _jsx(HqPage, {}),
            },
            {
                path: "orgs/:orgId/spaces/:spaceId/projects/:projectId",
                element: _jsx(BlueprintPage, {}),
            },
            {
                path: "orgs/:orgId/spaces/:spaceId/projects/:projectId/git-ema",
                element: _jsx(GitEmaPage, { scope: "project" }),
            },
            {
                path: "settings",
                element: _jsx(SettingsPage, {}),
            },
            {
                path: "git-ema",
                element: _jsx(GitEmaPage, { scope: "user" }),
            },
            {
                path: "agent-work",
                element: _jsx(AgentWorkPage, {}),
            },
            {
                path: "wiki",
                element: _jsx(PlaceholderPage, { kind: "wiki" }),
            },
            {
                path: "threads",
                element: _jsx(PlaceholderPage, { kind: "threads" }),
            },
        ],
    },
]);
const rootEl = document.getElementById("root");
if (!rootEl)
    throw new Error("#root not found");
createRoot(rootEl).render(_jsx(React.StrictMode, { children: _jsx(IpcProvider, { children: _jsx(RouterProvider, { router: router }) }) }));
