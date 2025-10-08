"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ClientType, Prisma } from "@prisma/client";

// Form schema (nullable optionals)
const schema = z.object({
    name: z.string().min(2, "Client name is required."),
    clientType: z.nativeEnum(ClientType).default("SMALL_BUSINESS"),
    industry: z
        .string()
        .transform(v => (v?.trim() ? v.trim() : null))
        .nullable()
        .optional(),
    contactName: z
        .string()
        .transform(v => (v?.trim() ? v.trim() : null))
        .nullable()
        .optional(),
    contactEmail: z
        .string()
        .transform(v => (v?.trim() ? v.trim() : null))
        .nullable()
        .optional(),
});

/** Create client (server action) */
export async function createClientAction(formData: FormData) {
    // Pull raw values
    const raw = {
        name: String(formData.get("name") ?? ""),
        clientType: (formData.get("clientType") as string) || "SMALL_BUSINESS",
        industry: (formData.get("industry") as string) ?? "",
        contactName: (formData.get("contactName") as string) ?? "",
        contactEmail: (formData.get("contactEmail") as string) ?? "",
    };

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        console.warn("createClientAction: invalid payload", parsed.error.flatten().fieldErrors);
        redirect("/clients?toast=Action+failed");
    }

    // REQUIRED owner id (FK): read from env (Render → Environment tab)
    const ownerId = process.env.DEFAULT_OWNER_ID?.trim();
    if (!ownerId) {
        console.error("createClientAction: DEFAULT_OWNER_ID missing.");
        redirect("/clients?toast=Action+failed");
    }

    // Build a concrete Prisma payload (no conditionals, no 'let')
    const data: Prisma.ClientUncheckedCreateInput = {
        ownerId, // required FK
        name: parsed.data.name,
        clientType: parsed.data.clientType,
        industry: parsed.data.industry ?? null,
        contactName: parsed.data.contactName ?? null,
        contactEmail: parsed.data.contactEmail ?? null,
    };

    try {
        await prisma.client.create({ data });
    } catch (err) {
        console.error("[createClientAction] error:", err);
        redirect("/clients?toast=Action+failed");
    }

    revalidatePath("/clients");
    redirect("/clients?toast=Client+created");
}

/** Delete client (server action) */
export async function deleteClientAction(formData: FormData) {
    const id = String(formData.get("clientId") ?? "");
    if (!id) redirect("/clients?toast=Action+failed");

    try {
        await prisma.client.delete({ where: { id } });
    } catch (err) {
        console.error("[deleteClientAction] error:", err);
        redirect("/clients?toast=Action+failed");
    }

    revalidatePath("/clients");
    redirect("/clients?toast=Client+deleted");
}
