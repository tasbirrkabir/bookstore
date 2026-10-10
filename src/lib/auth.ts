import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hmacSign, hmacVerify, hashPassword, verifyPassword, safeEqual } from "@/lib/tokens";
import { rateLimit } from "@/lib/ratelimit";

export const SESSION_COOKIE = "pata_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  // Dev fallback — clearly documented; production must set AUTH_SECRET.
  if (process.env.NODE_ENV === "production") {
    console.warn("[auth] AUTH_SECRET missing in production — using ephemeral dev secret. Sessions will not survive restarts.");
  }
  return "pata-dev-secret-do-not-use-in-prod-0001";
}

export type SessionUser = {
  uid: string;
  email: string;
  name: string | null;
  role: "customer" | "admin";
  exp: number; // epoch ms
};

function serialize(u: Omit<SessionUser, "exp">): string {
  const payload: SessionUser = { ...u, exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${hmacSign(body, authSecret())}`;
}

function deserialize(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!hmacVerify(body, sig, authSecret())) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionUser;
    if (!parsed?.uid || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    if (parsed.role !== "admin" && parsed.role !== "customer") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Read the current session from cookies (server components + route handlers). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return deserialize(store.get(SESSION_COOKIE)?.value);
}

/** Load the full DB user for the current session. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.uid } });
}

/** Server-side admin guard — throws 403-shaped error if not admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("UNAUTHENTICATED", 401);
  if (session.role !== "admin") throw new AuthError("FORBIDDEN", 403);
  // Re-verify role from DB so demoted admins lose access immediately.
  const user = await db.user.findUnique({ where: { id: session.uid } });
  if (!user || user.role !== "admin") throw new AuthError("FORBIDDEN", 403);
  return session;
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("UNAUTHENTICATED", 401);
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function registerUser(input: { email: string; password: string; name?: string; phone?: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new AuthError("EMAIL_TAKEN", 409);
  const user = await db.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      phone: input.phone?.trim() || null,
      passwordHash: hashPassword(input.password),
      role: "customer", // Role is NEVER assignable from public input.
    },
  });
  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    // Generic message — do not reveal whether the email exists.
    throw new AuthError("BAD_CREDENTIALS", 401);
  }
  if (!verifyPassword(input.password, user.passwordHash)) {
    throw new AuthError("BAD_CREDENTIALS", 401);
  }
  return user;
}

/** Issue the session cookie (call from a route handler). */
export async function issueSessionCookie(user: { id: string; email: string; name: string | null; role: string }) {
  const store = await cookies();
  store.set(SESSION_COOKIE, serialize({ uid: user.id, email: user.email, name: user.name, role: user.role === "admin" ? "admin" : "customer" }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export { safeEqual };
