// src/actions/clients.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma, ClientType } from "@prisma/client";

/* ------------------------------- validation ------------------------------ */

const schema = z.object({
    name: z.string().min(2, "Client name is required."),
    // IMPORTANT: default to the enum value, not a string literal
    clientType: z.nativeEnum(ClientType).default(ClientType.SMALL_BUSINESS),
    industry: z
        .string()
        .optional()
        .transform((v) => (v && v.trim().length ? v.trim() : null)),
    contactName: z
        .string()
        .optional()
        .transform((v) => (v && v.trim().length ? v.trim() : null)),
    contactEmail: z
        .string()
        .optional()
        .transform((v) => (v && v.trim().length ? v.trim() : null)),
});

/* --------------------------- owner resolution --------------------------- */
/**
 * Instead of requiring DEFAULT_OWNER_ID, we upsert a single owner by email.
 * If no env is provided, we fall back to "demo@uccs.local".
 */
async function getOrCreateOwnerId(): Promise<string> {
    const ownerEmail =
        process.env.DEFAULT_OWNER_EMAIL?.trim() || "demo@uccs.local";
    const ownerName = process.env.DEFAULT_OWNER_NAME?.trim() || "Demo Owner";

    const owner = await prisma.user.upsert({
        where: { email: ownerEmail },
        update: { name: ownerName },
        create: { email: ownerEmail, name: ownerName },
        select: { id: true },
    });

    return owner.id;
}

/* --------------------------------- create ------------------------------- */

export async function createClientAction(formData: FormData) {
    const raw = {
        name: String(formData.get("name") ?? ""),
        clientType: (formData.get("clientType") as string) || ClientType.SMALL_BUSINESS,
        industry: (formData.get("industry") as string) ?? "",
        contactName: (formData.get("contactName") as string) ?? "",
        contactEmail: (formData.get("contactEmail") as string) ?? "",
    };

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        console.warn("[createClientAction] invalid payload:", parsed.error.flatten());
        redirect("/clients?toast=action+failed");
    }

    let ownerId: string;
    try {
        ownerId = await getOrCreateOwnerId();
    } catch (e) {
        console.error("[createClientAction] failed to resolve owner:", e);
        redirect("/clients?toast=action+failed");
        return; // for type-safety; redirect already sent
    }

    try {
        const data: Prisma.ClientUncheckedCreateInput = {
            name: parsed.data.name,
            clientType: parsed.data.clientType,
            industry: parsed.data.industry ?? null,
            contactName: parsed.data.contactName ?? null,
            contactEmail: parsed.data.contactEmail ?? null,
            ownerId,
        };

        await prisma.client.create({ data });
    } catch (err) {
        console.error("[createClientAction] Prisma create failed:", err);
        redirect("/clients?toast=action+failed");
    }

    revalidatePath("/clients");
    redirect("/clients?toast=client+created");
}

/* --------------------------------- delete ------------------------------- */

export async function deleteClientAction(formData: FormData) {
    const id = String(formData.get("clientId") ?? "");
    if (!id) redirect("/clients?toast=action+failed");

    try {
        await prisma.client.delete({ where: { id } });
    } catch (err) {
        console.error("[deleteClientAction] delete failed:", err);
        redirect("/clients?toast=action+failed");
    }

    revalidatePath("/clients");
    redirect("/clients?toast=client+deleted");
}
