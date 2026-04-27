// HMAC-SHA256 sign/verify.
//
// Prefers `Bun.CryptoHasher` when the runtime exposes it, otherwise falls back
// to Node's `node:crypto`. Both paths emit lowercase hex digests to match the
// `x-autharis-signature: sha256=<hex>` header contract published to F6.

declare const Bun: {
  CryptoHasher?: new (algo: string, key?: string | ArrayBufferView) => {
    update(data: string | ArrayBufferView): void;
    digest(encoding: "hex"): string;
  };
} | undefined;

function hmacHex(secret: string, body: string): string {
  // Prefer Bun.CryptoHasher if it supports keyed HMAC construction.
  try {
    if (typeof Bun !== "undefined" && Bun?.CryptoHasher) {
      const hasher = new Bun.CryptoHasher("sha256", secret);
      hasher.update(body);
      return hasher.digest("hex");
    }
  } catch {
    // fall through to node:crypto
  }
  // Node / test fallback.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require("node:crypto") as typeof import("node:crypto");
  return nodeCrypto.createHmac("sha256", secret).update(body).digest("hex");
}

export function sign(secret: string, body: string): string {
  return `sha256=${hmacHex(secret, body)}`;
}

export function verify(
  secret: string,
  body: string,
  header: string | null | undefined,
): boolean {
  if (!header || typeof header !== "string") return false;
  const expected = sign(secret, body);
  // constant-time compare
  if (expected.length !== header.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  }
  return mismatch === 0;
}
