"use client";

import { useState, useEffect } from "react";
import { useWSStore } from "@/lib/stores/wsStore";
import DesktopApp from "@/components/DesktopApp";
import MobileApp from "@/components/MobileApp";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { status, messages, agentEvents, connect, disconnect } = useWSStore();

  // Initialize WebSocket connection
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    setMounted(true);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="h-screen noise-bg" style={{ background: "var(--color-bg)" }} />
    );
  }

  if (isMobile) {
    return <MobileApp status={status} messages={messages} agentEvents={agentEvents} />;
  }

  return (
    <div className="h-screen flex flex-col noise-bg" style={{ background: "var(--color-bg)" }}>
      <DesktopApp />
    </div>
  );
}
