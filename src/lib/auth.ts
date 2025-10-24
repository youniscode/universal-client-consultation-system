// src/lib/auth.ts
import { cookies } from "next/headers";
import { createSignedToken, verifySignedToken } from "@/lib/session";

export const SESSION_COOKIE_NAME = "uc_session";
const WEEK = 60 * 60 * 24 * 7;

/* ---------- small helpers ---------- */

function envOrEmpty(v?: string): string {
    return (v ?? "").trim();
}

type CookieSetOptions = {
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
    path?: string;
    maxAge?: number;
};

type CookieMutator = {
    get(name: string): { value?: string } | undefined;
    set(name: string, value: string, options?: CookieSetOptions): void;
    delete(name: string): void;
};

type Thenable = { then: (...args: unknown[]) => unknown };
function isThenable(v: unknown): v is Thenable {
    return typeof v === "object" && v !== null && "then" in v;
}

/**
 * Return a cookies jar that works in both environments:
 * - dev / server components: cookies() is sync
 * - server actions / Vercel: cookies() can be a Promise
 */
async function cookieJar(): Promise<CookieMutator> {
    const raw = cookies() as unknown;
    if (isThenable(raw)) {
        const resolved = (await (raw as unknown as Promise<unknown>)) as CookieMutator;
        return resolved;
    }
    return raw as CookieMutator;
}

/** Narrow token creator signature (no `any`) */
const createToken = createSignedToken as unknown as (
    payload: unknown,
    opts: { expiresInSeconds: number }
) => Promise<string>;

/* ---------- auth APIs ---------- */

/** Pass-phrase login (checks ADMIN_PASSWORD; requires AUTH_SECRET to exist). */
export async function signInWithPassphrase(pass: string): Promise<boolean> {
    const ADMIN_PASSWORD = envOrEmpty(process.env.ADMIN_PASSWORD);
    const AUTH_SECRET = envOrEmpty(process.env.AUTH_SECRET);
    if (!ADMIN_PASSWORD || !AUTH_SECRET) return false;
    if (pass !== ADMIN_PASSWORD) return false;

    const token = await createToken({ ok: true }, { expiresInSeconds: WEEK });

    const jar = await cookieJar();
    jar.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: WEEK,
    });
    return true;
}

/** Optional email+password login (not used by the /login UI). */
export async function signIn({
    email,
    password,
}: {
    email: string;
    password: string;
}): Promise<boolean> {
    const ADMIN_EMAIL = envOrEmpty(process.env.ADMIN_EMAIL).toLowerCase();
    const ADMIN_PASSWORD = envOrEmpty(process.env.ADMIN_PASSWORD);
    const AUTH_SECRET = envOrEmpty(process.env.AUTH_SECRET);
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !AUTH_SECRET) return false;

    const ok = email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    if (!ok) return false;

    const token = await createToken({ email }, { expiresInSeconds: WEEK });

    const jar = await cookieJar();
    jar.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: WEEK,
    });
    return true;
}

/** Sign out (remove cookie). */
export async function signOut(): Promise<void> {
    const jar = await cookieJar();
    jar.delete(SESSION_COOKIE_NAME);
}

/** Raw token string or empty string. */
export async function getToken(): Promise<string> {
    const jar = await cookieJar();
    return jar.get(SESSION_COOKIE_NAME)?.value ?? "";
}

/** True if a valid signed token exists. */
export async function isAuthed(): Promise<boolean> {
    const token = await getToken();
    if (!token) return false;
    const { valid } = await verifySignedToken(token);
    return !!valid;
}
