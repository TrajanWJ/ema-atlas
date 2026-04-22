"use client";

import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ChatView } from "@/components/sessions/ChatView";
import { MultiSessionView } from "@/components/sessions/MultiSessionView";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function SessionsPage() {
  const [splitView, setSplitView] = useState(false);

  return (
    <Layout
      splitView={splitView}
      onToggleSplit={() => setSplitView((p) => !p)}
    >
      <ErrorBoundary>
        {splitView ? <MultiSessionView /> : <ChatView />}
      </ErrorBoundary>
    </Layout>
  );
}
