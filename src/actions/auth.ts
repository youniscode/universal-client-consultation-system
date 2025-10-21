// src/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSignedToken } from "@/lib/session";

const SESSION_COOKIE = "uc_session";

/**
 * POST /login (server action)
 * Expects: email, password
 * Creates a signed session cookie valid for 7 days.
 */
export async function loginAction(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
    const AUTH_SECRET = process.env.AUTH_SECRET ?? "";

    // Basic env guard
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !AUTH_SECRET) {
        return redirect("/login?error=server-config");
    }

    // Validate creds
    const ok = email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    if (!ok) return redirect("/login?error=invalid");

    // Sign a compact token (payload can be extended later)
    const token = await createSignedToken({ email }, { expiresInSeconds: 60 * 60 * 24 * 7 });

    // Set cookie (httpOnly session)
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return redirect("/clients");
}

/**
 * POST /logout (server action)
 * Clears the session cookie and returns to /login with a flag.
 */
export async function logoutAction() {
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
    return redirect("/login?loggedout=1");
}
