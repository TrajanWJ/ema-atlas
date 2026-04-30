import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setTotpSecret } from "../../_lib/auth-store";
import {
	type GoogleSession,
	newTotpSecret,
	otpauthUri,
	readSignedJson,
} from "../../_lib/auth-core";

export const runtime = "nodejs";

export async function POST() {
	const cookieStore = await cookies();
	const google = readSignedJson<GoogleSession>(
		cookieStore.get("ema_google_session")?.value,
	);
	if (!google) {
		return NextResponse.json(
			{ ok: false, error: "Google sign-in required before Authenticator enrollment" },
			{ status: 401 },
		);
	}

	const secret = newTotpSecret();
	await setTotpSecret(google.googleSub, secret);

	return NextResponse.json({
		ok: true,
		issuer: process.env.EMA_AUTH_ISSUER_NAME?.trim() || "EMA",
		account: google.email,
		secret,
		otpauthUri: otpauthUri(secret, google.email),
	});
}
