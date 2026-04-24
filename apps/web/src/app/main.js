import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { VirtualDesktopShell } from "../shell/virtual-desktop-shell";
import { IpcProvider } from "../lib/ipc";
import "@ema/design-system/tokens.css";
import "./styles.css";
// The VirtualDesktopShell owns rendering for every vApp as a window.
// Routes remain as deep links: the router matches a path, the shell
// opens the corresponding window. A single catch-all route lets the
// shell handle every known path without duplicating the vApp list.
const router = createBrowserRouter([
    {
        path: "*",
        element: _jsx(VirtualDesktopShell, {}),
    },
]);
const rootEl = document.getElementById("root");
if (!rootEl)
    throw new Error("#root not found");
createRoot(rootEl).render(_jsx(React.StrictMode, { children: _jsx(IpcProvider, { children: _jsx(RouterProvider, { router: router }) }) }));
