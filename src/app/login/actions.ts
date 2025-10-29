// src/app/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import { signInWithPassphrase } from "@/lib/auth-server";

export async function doLogin(formData: FormData) {
    const pass = String(formData.get("pass") ?? "").trim();
    const ok = await signInWithPassphrase(pass);
    if (!ok) {
        redirect("/login?error=invalid");
    }
    redirect("/clients");
}
