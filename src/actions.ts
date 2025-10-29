// src/actions.ts
"use server";

import { signOut } from "@/lib/auth-server";

export async function doLogout() {
    await signOut();
}
