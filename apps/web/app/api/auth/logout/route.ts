import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
	const cookieStore = await cookies();
	cookieStore.delete("ema_google_session");
	cookieStore.delete("ema_totp_session");
	cookieStore.delete("ema_totp_pending");
	return NextResponse.json({ ok: true });
}
