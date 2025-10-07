// src/actions/clients.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ClientType, Prisma } from "@prisma/client";

/** Zod: coerce empty strings to null for optional text fields */
const schema = z.object({
    name: z.string().min(2, "Client name is required."),
    clientType: z.nativeEnum(ClientType).default("SMALL_BUSINESS"),
    industry: z
        .string()
        .transform((v) => (v?.trim() ? v.trim() : null))
        .nullable()
        .optional(),
    contactName: z
        .string()
        .transform((v) => (v?.trim() ? v.trim() : null))
        .nullable()
        .optional(),
    contactEmail: z
        .string()
        .transform((v) => (v?.trim() ? v.trim() : null))
        .nullable()
        .optional(),
});

export async function createClientAction(formData: FormData) {
    // Parse incoming form
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
        redirect("/clients?toast=created+failed");
    }

    // ✅ Require OWNER ID (fixes TS AND runtime FK)
    const ownerId = process.env.DEFAULT_OWNER_ID?.trim();
    if (!ownerId) {
        console.error("[createClientAction] DEFAULT_OWNER_ID is missing on this environment");
        redirect("/clients?toast=created+failed");
    }

    // Build Unchecked payload with required ownerId
    const data: Prisma.ClientUncheckedCreateInput = {
        name: parsed.data.name,
        clientType: parsed.data.clientType,
        industry: parsed.data.industry ?? null,
        contactName: parsed.data.contactName ?? null,
        contactEmail: parsed.data.contactEmail ?? null,
        ownerId, // required at type level -> no red underline
    };

    try {
        await prisma.client.create({ data });
        revalidatePath("/clients");
        redirect("/clients?toast=client+created");
    } catch (err) {
        console.error("createClientAction error:", err);
        redirect("/clients?toast=created+failed");
    }
}

export async function deleteClientAction(formData: FormData) {
    try {
        const id = String(formData.get("clientId") ?? "");
        if (!id) redirect("/clients?toast=deleted+failed");

        await prisma.client.delete({ where: { id } });
        revalidatePath("/clients");
        redirect("/clients?toast=deleted");
    } catch (err) {
        console.error("deleteClientAction error:", err);
        redirect("/clients?toast=deleted+failed");
    }
}
