import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { AuthSession, UserRole } from "@/lib/auth/types";

export const AUTH_SESSION_COOKIE = "autharis_session";
const AUTH_SESSION_MAX_AGE = 60 * 60 * 12;
const authSessionSecret = process.env.AUTHARIS_SESSION_SECRET ?? "autharis-dev-session-secret";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

let signingKeyPromise: Promise<CryptoKey> | undefined;

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

function getCookieOptions() {
  return {
    httpOnly: true,
    maxAge: AUTH_SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function getSigningKey() {
  signingKeyPromise ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(authSessionSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  return signingKeyPromise;
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "client" || value === "talent" || value === "admin";
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<AuthSession>;

  return (
    session.version === 1 &&
    typeof session.profileId === "string" &&
    typeof session.userId === "string" &&
    typeof session.name === "string" &&
    typeof session.email === "string" &&
    isUserRole(session.role) &&
    typeof session.title === "string" &&
    typeof session.organization === "string" &&
    typeof session.issuedAt === "string" &&
    session.impersonationMode === "dev"
  );
}

async function signPayload(payload: string) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return encodeBase64Url(new Uint8Array(signature));
}

async function verifySignature(payload: string, signature: string) {
  const key = await getSigningKey();

  try {
    return await crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), encoder.encode(payload));
  } catch {
    return false;
  }
}

export async function createSessionCookieValue(session: AuthSession) {
  const payload = encodeBase64Url(encoder.encode(JSON.stringify(session)));
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function parseSessionCookieValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const isValid = await verifySignature(payload, signature);

  if (!isValid) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoder.decode(decodeBase64Url(payload)));
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function readSessionFromCookieStore(cookieStore: CookieReader) {
  return parseSessionCookieValue(cookieStore.get(AUTH_SESSION_COOKIE)?.value);
}

export async function getSession() {
  const cookieStore = await cookies();
  return readSessionFromCookieStore(cookieStore);
}

export async function setSessionCookie(response: NextResponse, session: AuthSession) {
  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: await createSessionCookieValue(session),
    ...getCookieOptions(),
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: "",
    ...getCookieOptions(),
    maxAge: 0,
  });

  return response;
}
