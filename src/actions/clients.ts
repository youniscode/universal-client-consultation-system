// src/actions/clients.ts
"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ClientType, Prisma } from "@prisma/client";

const schema = z.object({
    name: z.string().min(2, "Client name is required."),
    clientType: z.nativeEnum(ClientType).default("SMALL_BUSINESS"),
    industry: z.string().trim().optional().nullable(),
    contactName: z.string().trim().optional().nullable(),
    contactEmail: z.string().trim().email("Invalid email").optional().nullable(),
});

export async function createClientAction(formData: FormData) {
    const raw = {
        name: String(formData.get("name") ?? ""),
        clientType: (formData.get("clientType") as string) || "SMALL_BUSINESS",
        industry: (formData.get("industry") as string | null) ?? null,
        contactName: (formData.get("contactName") as string | null) ?? null,
        contactEmail: (formData.get("contactEmail") as string | null) ?? null,
    };

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return redirect("/clients?toast=invalid+client+data");
    }

    // ✅ OWNER IS REQUIRED (fixes the red error)
    const ownerId = process.env.DEFAULT_OWNER_ID;
    if (!ownerId) {
        console.error("Missing DEFAULT_OWNER_ID env var — cannot create Client.");
        return redirect("/clients?toast=failed+to+create+client");
    }

    // All optionals coerced to null (never undefined) + required ownerId set
    const data: Prisma.ClientUncheckedCreateInput = {
        ownerId, // required
        name: parsed.data.name,
        clientType: parsed.data.clientType,
        industry: parsed.data.industry ?? null,
        contactName: parsed.data.contactName ?? null,
        contactEmail: parsed.data.contactEmail ?? null,
    };

    try {
        await prisma.client.create({ data });
        return redirect("/clients?toast=client+created");
    } catch (err) {
        console.error("Create client failed:", err);
        return redirect("/clients?toast=failed+to+create+client");
    }
}
