import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { GoogleSession } from "./auth-core";

type StoredUser = {
  googleSub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
  updatedAt: number;
  totpSecret?: string;
  totpEnabledAt?: number;
};

type AuthStore = {
  users: Record<string, StoredUser>;
};

function storePath() {
  return process.env.EMA_AUTH_STORE_PATH?.trim() || join(/* turbopackIgnore: true */ process.cwd(), ".ema-dev", "web-auth-store.json");
}

async function readStore(): Promise<AuthStore> {
  try {
    const raw = await readFile(storePath(), "utf8");
    return JSON.parse(raw) as AuthStore;
  } catch {
    return { users: {} };
  }
}

async function writeStore(store: AuthStore) {
  const path = storePath();
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await rename(tmp, path);
}

export async function upsertGoogleUser(session: GoogleSession) {
  const store = await readStore();
  const existing = store.users[session.googleSub];
  store.users[session.googleSub] = {
    ...existing,
    googleSub: session.googleSub,
    email: session.email,
    emailVerified: session.emailVerified,
    name: session.name,
    picture: session.picture,
    updatedAt: Date.now(),
  };
  await writeStore(store);
}

export async function setTotpSecret(googleSub: string, secret: string) {
  const store = await readStore();
  const existing = store.users[googleSub];
  if (!existing) throw new Error("Google user is not registered");
  store.users[googleSub] = { ...existing, totpSecret: secret, updatedAt: Date.now() };
  await writeStore(store);
}

export async function enableTotp(googleSub: string) {
  const store = await readStore();
  const existing = store.users[googleSub];
  if (!existing?.totpSecret) throw new Error("No Authenticator secret is enrolled");
  store.users[googleSub] = { ...existing, totpEnabledAt: Date.now(), updatedAt: Date.now() };
  await writeStore(store);
}

export async function getTotpSecret(googleSub: string): Promise<string | null> {
  const store = await readStore();
  return store.users[googleSub]?.totpSecret ?? null;
}

export async function hasTotpEnabled(googleSub: string): Promise<boolean> {
  const store = await readStore();
  return Boolean(store.users[googleSub]?.totpEnabledAt);
}
