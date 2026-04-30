import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { enableTotp, getTotpSecret } from "../../_lib/auth-store";
import {
	type GoogleSession,
	readSignedJson,
	secureCookie,
	signJson,
	verifyTotp,
} from "../../_lib/auth-core";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const cookieStore = await cookies();
	const google = readSignedJson<GoogleSession>(
		cookieStore.get("ema_google_session")?.value,
	);
	const body = (await request.json().catch(() => ({}))) as { readonly code?: string };
	const secret = google ? await getTotpSecret(google.googleSub) : null;

	if (!google) {
		return NextResponse.json({ ok: false, error: "Google sign-in required" }, { status: 401 });
	}
	if (!secret) {
		return NextResponse.json(
			{ ok: false, error: "No Authenticator secret is enrolled" },
			{ status: 400 },
		);
	}
	if (!body.code || !verifyTotp(secret, body.code)) {
		return NextResponse.json(
			{ ok: false, error: "Invalid Authenticator code" },
			{ status: 400 },
		);
	}

	await enableTotp(google.googleSub);
	cookieStore.set(
		"ema_totp_session",
		signJson(
			{
				googleSub: google.googleSub,
				method: "google_authenticator",
				verifiedAt: Date.now(),
			},
			60 * 60 * 8,
		),
		{
			httpOnly: true,
			sameSite: "lax",
			secure: secureCookie(),
			path: "/",
			maxAge: 60 * 60 * 8,
		},
	);
	return NextResponse.json({ ok: true });
}
