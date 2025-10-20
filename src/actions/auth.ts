// src/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSignedToken } from "@/lib/session";

const SESSION_COOKIE = "uc_session";

export async function loginAction(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
    const AUTH_SECRET = process.env.AUTH_SECRET ?? "";

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !AUTH_SECRET) {
        return redirect("/login?error=server-config");
    }
    const ok = email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
    if (!ok) return redirect("/login?error=invalid");

    const token = await createSignedToken({ email }, { expiresInSeconds: 60 * 60 * 24 * 7 });

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

export async function logoutAction() {
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
    return redirect("/login?loggedout=1");
}
