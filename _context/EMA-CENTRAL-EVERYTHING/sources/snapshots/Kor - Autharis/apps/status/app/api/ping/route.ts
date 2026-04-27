import { NextResponse } from "next/server";
import { SERVICES, type ServiceDef } from "../../../lib/services";
import { recordPing } from "../../../lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIMEOUT_MS = 3000;

interface PingResult {
  service: string;
  ok: boolean;
  latency_ms: number | null;
  status: number | null;
  error: string | null;
  ts: number;
}

async function pingOne(svc: ServiceDef): Promise<PingResult> {
  const ts = Date.now();
  if (svc.kind === "static") {
    // Static artifact — we don't hit the network for this pass; mark nodata-friendly.
    return {
      service: svc.id,
      ok: true,
      latency_ms: 0,
      status: 200,
      error: null,
      ts,
    };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch(svc.healthz, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const latency = Math.round(performance.now() - started);
    const ok = res.ok;
    return {
      service: svc.id,
      ok,
      latency_ms: latency,
      status: res.status,
      error: ok ? null : `HTTP ${res.status}`,
      ts,
    };
  } catch (err) {
    const latency = Math.round(performance.now() - started);
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? `timeout after ${TIMEOUT_MS}ms`
          : err.message
        : "unknown error";
    return {
      service: svc.id,
      ok: false,
      latency_ms: latency,
      status: null,
      error: msg,
      ts,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const results = await Promise.all(SERVICES.map((s) => pingOne(s)));
  for (const r of results) {
    try {
      recordPing(r.service, r.ts, r.ok, r.latency_ms);
    } catch {
      // DB may be unavailable in edge cases; swallow so the response still returns.
    }
  }
  return NextResponse.json({ ts: Date.now(), results });
}

export async function POST() {
  return GET();
}
