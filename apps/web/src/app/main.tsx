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
    element: <ShellLayout />,
    children: [
      {
        index: true,
        element: <HqPage />,
      },
      {
        path: "orgs/:orgId/spaces/:spaceId/projects/:projectId",
        element: <BlueprintPage />,
      },
      {
        path: "orgs/:orgId/spaces/:spaceId/projects/:projectId/git-ema",
        element: <GitEmaPage scope="project" />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "git-ema",
        element: <GitEmaPage scope="user" />,
      },
      {
        path: "agent-work",
        element: <AgentWorkPage />,
      },
      {
        path: "wiki",
        element: <PlaceholderPage kind="wiki" />,
      },
      {
        path: "threads",
        element: <PlaceholderPage kind="threads" />,
      },
    ],
  },
]);

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

createRoot(rootEl).render(
  <React.StrictMode>
    <IpcProvider>
      <RouterProvider router={router} />
    </IpcProvider>
  </React.StrictMode>,
);
