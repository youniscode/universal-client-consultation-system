// src/actions/logout.ts
"use server";

import { signOut } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export async function logoutAction() {
    await signOut();
    redirect("/login?loggedout=1");
}
