"use client";

import dynamic from "next/dynamic";
import { IpcProvider } from "../src/lib/ipc";

const VirtualDesktopShell = dynamic(
  () => import("../src/shell/virtual-desktop-shell").then((m) => m.VirtualDesktopShell),
  { ssr: false },
);

export default function Page() {
  return (
    <IpcProvider>
      <VirtualDesktopShell />
    </IpcProvider>
  );
}
