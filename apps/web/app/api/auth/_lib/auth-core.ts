import {
	createHmac,
	createPublicKey,
	createVerify,
	randomBytes,
	timingSafeEqual,
} from "node:crypto";

export type GoogleSession = {
	readonly provider: "google";
	readonly googleSub: string;
	readonly email: string;
	readonly emailVerified: boolean;
	readonly name: string;
	readonly picture: string | null;
	readonly authenticatedAt: number;
};

export type TotpSession = {
	readonly googleSub: string;
	readonly method: "google_authenticator";
	readonly verifiedAt: number;
};

type GoogleIdTokenPayload = {
	readonly iss: string;
	readonly aud: string;
	readonly sub: string;
	readonly email?: string;
	readonly email_verified?: boolean;
	readonly name?: string;
	readonly picture?: string;
	readonly exp: number;
	readonly iat: number;
	readonly nonce?: string;
};

type GoogleJwk = {
	readonly kid: string;
	readonly alg: string;
	readonly kty: string;
	readonly use: string;
	readonly n: string;
	readonly e: string;
};

const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const TOTP_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function requiredEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`${name} is required`);
	return value;
}

export function base64url(input: Buffer | string): string {
	return Buffer.from(input).toString("base64url");
}

export function decodeBase64url(input: string): Buffer {
	return Buffer.from(input, "base64url");
}

export function randomToken(bytes = 32): string {
	return randomBytes(bytes).toString("base64url");
}

export function signJson(value: unknown, maxAgeSeconds: number): string {
	const secret = requiredEnv("EMA_SESSION_SECRET");
	const expiresAt = Math.floor(Date.now() / 1000) + maxAgeSeconds;
	const payload = base64url(JSON.stringify({ value, expiresAt }));
	const sig = createHmac("sha256", secret).update(payload).digest("base64url");
	return `${payload}.${sig}`;
}

export function readSignedJson<T>(raw: string | undefined): T | null {
	if (!raw) return null;
	const secret = process.env.EMA_SESSION_SECRET?.trim();
	if (!secret) return null;
	const [payload, sig] = raw.split(".");
	if (!payload || !sig) return null;
	const expected = createHmac("sha256", secret).update(payload).digest("base64url");
	const given = Buffer.from(sig);
	const wanted = Buffer.from(expected);
	if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
	try {
		const decoded = JSON.parse(decodeBase64url(payload).toString("utf8")) as {
			readonly value: T;
			readonly expiresAt: number;
		};
		if (decoded.expiresAt < Math.floor(Date.now() / 1000)) return null;
		return decoded.value;
	} catch {
		return null;
	}
}

export function secureCookie(): boolean {
	return process.env.NODE_ENV === "production";
}

export async function verifyGoogleIdToken(
	idToken: string,
	expectedNonce: string,
): Promise<GoogleSession> {
	const parts = idToken.split(".");
	if (parts.length !== 3) throw new Error("invalid Google ID token");
	const [encodedHeader, encodedPayload, encodedSignature] = parts;
	if (!encodedHeader || !encodedPayload || !encodedSignature) {
		throw new Error("invalid Google ID token");
	}
	const header = JSON.parse(decodeBase64url(encodedHeader).toString("utf8")) as {
		readonly alg: string;
		readonly kid: string;
	};
	if (header.alg !== "RS256" || !header.kid) {
		throw new Error("unsupported Google token algorithm");
	}

	const certsResponse = await fetch(GOOGLE_CERTS_URL, { cache: "force-cache" });
	if (!certsResponse.ok) throw new Error("could not fetch Google signing keys");
	const certs = (await certsResponse.json()) as { readonly keys: readonly GoogleJwk[] };
	const jwk = certs.keys.find((key) => key.kid === header.kid);
	if (!jwk) throw new Error("Google signing key not found");

	const verifier = createVerify("RSA-SHA256");
	verifier.update(`${encodedHeader}.${encodedPayload}`);
	verifier.end();
	const key = createPublicKey({ key: jwk, format: "jwk" });
	if (!verifier.verify(key, decodeBase64url(encodedSignature))) {
		throw new Error("bad Google token signature");
	}

	const payload = JSON.parse(
		decodeBase64url(encodedPayload).toString("utf8"),
	) as GoogleIdTokenPayload;
	const clientId = requiredEnv("EMA_GOOGLE_CLIENT_ID");
	const now = Math.floor(Date.now() / 1000);
	if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
		throw new Error("bad Google issuer");
	}
	if (payload.aud !== clientId) throw new Error("bad Google audience");
	if (payload.exp < now) throw new Error("expired Google token");
	if (payload.nonce !== expectedNonce) throw new Error("bad Google nonce");
	if (!payload.email || !payload.email_verified) {
		throw new Error("Google email must be verified");
	}

	return {
		provider: "google",
		googleSub: payload.sub,
		email: payload.email,
		emailVerified: payload.email_verified,
		name: payload.name ?? payload.email,
		picture: payload.picture ?? null,
		authenticatedAt: Date.now(),
	};
}

export function newTotpSecret(length = 20): string {
	let bits = 0;
	let value = 0;
	let output = "";
	for (const byte of randomBytes(length)) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			output += TOTP_ALPHABET[(value >>> (bits - 5)) & 31] ?? "";
			bits -= 5;
		}
	}
	if (bits > 0) output += TOTP_ALPHABET[(value << (5 - bits)) & 31] ?? "";
	return output;
}

export function otpauthUri(secret: string, email: string): string {
	const issuer = process.env.EMA_AUTH_ISSUER_NAME?.trim() || "EMA";
	const label = encodeURIComponent(`${issuer}:${email}`);
	const params = new URLSearchParams({
		secret,
		issuer,
		algorithm: "SHA1",
		digits: "6",
		period: "30",
	});
	return `otpauth://totp/${label}?${params.toString()}`;
}

export function verifyTotp(secret: string, code: string, window = 1): boolean {
	const normalized = code.replace(/\s+/g, "");
	if (!/^\d{6}$/.test(normalized)) return false;
	const counter = Math.floor(Date.now() / 30_000);
	for (let offset = -window; offset <= window; offset += 1) {
		if (totpAt(secret, counter + offset) === normalized) return true;
	}
	return false;
}

function totpAt(secret: string, counter: number): string {
	const key = decodeBase32(secret);
	const msg = Buffer.alloc(8);
	msg.writeBigUInt64BE(BigInt(counter));
	const hmac = createHmac("sha1", key).update(msg).digest();
	const last = hmac[hmac.length - 1] ?? 0;
	const offset = last & 0xf;
	const binary =
		((hmac[offset] ?? 0) & 0x7f) << 24 |
		(hmac[offset + 1] ?? 0) << 16 |
		(hmac[offset + 2] ?? 0) << 8 |
		(hmac[offset + 3] ?? 0);
	return String(binary % 1_000_000).padStart(6, "0");
}

function decodeBase32(input: string): Buffer {
	let bits = 0;
	let value = 0;
	const bytes: number[] = [];
	for (const char of input.replace(/=+$/g, "").toUpperCase()) {
		const index = TOTP_ALPHABET.indexOf(char);
		if (index === -1) throw new Error("invalid base32 secret");
		value = (value << 5) | index;
		bits += 5;
		if (bits >= 8) {
			bytes.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return Buffer.from(bytes);
}
