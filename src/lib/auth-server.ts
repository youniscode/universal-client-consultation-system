// src/lib/auth-server.ts
// Server-only auth helpers (no client imports)

import { createSignedToken, verifySignedToken } from "@/lib/session";

export const SESSION_COOKIE_NAME = "uc_session";
const WEEK = 60 * 60 * 24 * 7;

/** Minimal jar surface we use from next/headers cookies() */
type CookieJar = {
    get(name: string): { value?: string } | undefined;
    set(
        name: string,
        value: string,
        options?: {
            httpOnly?: boolean;
            sameSite?: "lax" | "strict" | "none";
            secure?: boolean;
            path?: string;
            maxAge?: number;
        }
    ): void;
    delete(name: string): void;
};

/** Trim/normalize env safely */
function envOrEmpty(v?: string): string {
    return (v ?? "").trim();
}

/** Lazy import next/headers so nothing client-side pulls it */
async function cookieJar(): Promise<CookieJar> {
    const { cookies } = await import("next/headers");
    // Works both where cookies() returns an object or a promise-like in server actions
    const v = cookies() as unknown;
    return (typeof v === "object" && v !== null ? v : await (v as Promise<unknown>)) as CookieJar;
}

/** Passphrase login (compares against ADMIN_PASSWORD, requires AUTH_SECRET to exist) */
export async function signInWithPassphrase(pass: string): Promise<boolean> {
    const ADMIN_PASSWORD = envOrEmpty(process.env.ADMIN_PASSWORD);
    const AUTH_SECRET = envOrEmpty(process.env.AUTH_SECRET);

    if (!ADMIN_PASSWORD || !AUTH_SECRET) return false;
    if (pass !== ADMIN_PASSWORD) return false;

    // Payload must match the type expected by createSignedToken
    const token = await createSignedToken({ email: "admin" }, { expiresInSeconds: WEEK });

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

/** Optional email+password login (not used by the passphrase page, but kept) */
export async function signIn(args: { email: string; password: string }): Promise<boolean> {
    const { email, password } = args;

    const ADMIN_EMAIL = envOrEmpty(process.env.ADMIN_EMAIL).toLowerCase();
    const ADMIN_PASSWORD = envOrEmpty(process.env.ADMIN_PASSWORD);
    const AUTH_SECRET = envOrEmpty(process.env.AUTH_SECRET);

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !AUTH_SECRET) return false;

    const ok = email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    if (!ok) return false;

    const token = await createSignedToken({ email }, { expiresInSeconds: WEEK });

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

export async function signOut(): Promise<void> {
    const jar = await cookieJar();
    jar.delete(SESSION_COOKIE_NAME);
}

export async function getToken(): Promise<string> {
    const jar = await cookieJar();
    return jar.get(SESSION_COOKIE_NAME)?.value ?? "";
}

export async function isAuthed(): Promise<boolean> {
    const token = await getToken();
    if (!token) return false;
    const { valid } = await verifySignedToken(token);
    return valid;
}
