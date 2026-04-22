import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    url: "ws://localhost:18789",
    token: process.env.OPENCLAW_GATEWAY_TOKEN || "",
  });
}
