"use client";

import dynamic from "next/dynamic";

const ToastRoot = dynamic(
  () =>
    import("@/components/ui/Toast").then((mod) => ({
      default: mod.ToastContainer,
    })),
  { ssr: false }
);

export default ToastRoot;
