import crypto from "node:crypto";

/** High-entropy URL-safe random token (default 32 bytes = 256 bits). */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** SHA-256 hex hash, used so guest capability tokens are never stored in plaintext. */
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // Still perform a comparison to keep timing roughly constant.
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

/** HMAC-SHA256 signature (hex), used by the mock payment gateway callback. */
export function hmacSign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function hmacVerify(payload: string, signature: string, secret: string): boolean {
  return safeEqual(hmacSign(payload, secret), signature);
}

/** Human-readable, non-sequential order number. Not an auth credential. */
export function generateOrderNumber(): string {
  // Crockford base32 without ambiguous chars, 10 chars ≈ 50 bits of entropy.
  const alphabet = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
  let out = "";
  const buf = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) out += alphabet[buf[i] % alphabet.length];
  return `PATA-${out}`;
}

/** Password hashing with scrypt (no native deps). Format: scrypt$N$salt$hash */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt$16384$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, nStr, salt, hash] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const derived = crypto.scryptSync(password, salt, 64, { N: parseInt(nStr, 10), r: 8, p: 1 });
    const expected = Buffer.from(hash, "hex");
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
