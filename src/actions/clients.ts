"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma, ClientType } from "@prisma/client";

// --- Validation schema (simple & Prisma-compatible) ---
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

// ---------- CREATE ----------
export async function createClientAction(formData: FormData) {
    const raw = {
        name: String(formData.get("name") ?? ""),
        clientType: (formData.get("clientType") as string) || "SMALL_BUSINESS",
        industry: (formData.get("industry") as string) ?? "",
        contactName: (formData.get("contactName") as string) ?? "",
        contactEmail: (formData.get("contactEmail") as string) ?? "",
    };

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        console.warn("[createClientAction] invalid payload:", parsed.error.flatten());
        return redirect("/clients?toast=action+failed");
    }

    const base = {
        name: parsed.data.name,
        clientType: parsed.data.clientType,
        industry: parsed.data.industry ?? null,
        contactName: parsed.data.contactName ?? null,
        contactEmail: parsed.data.contactEmail ?? null,
    };

    // require owner id (since Client.ownerId is NOT NULL in schema)
    const ownerId = process.env.DEFAULT_OWNER_ID?.trim();
    if (!ownerId) {
        console.error("[createClientAction] DEFAULT_OWNER_ID is missing.");
        return redirect("/clients?toast=action+failed");
    }

    try {
        // Always use Unchecked input with explicit FK
        const data: Prisma.ClientUncheckedCreateInput = {
            ...base,
            ownerId,
        };
        await prisma.client.create({ data });
    } catch (err) {
        console.error("[createClientAction] Prisma create failed:", err);
        return redirect("/clients?toast=action+failed");
    }

    revalidatePath("/clients");
    return redirect("/clients?toast=client+created");
}

// ---------- DELETE ----------
export async function deleteClientAction(formData: FormData) {
    "use server";

    const id = String(formData.get("clientId") ?? "");
    if (!id) {
        console.error("[deleteClientAction] missing clientId");
        return redirect("/clients?toast=action+failed");
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.answer.deleteMany({ where: { project: { clientId: id } } }).catch(() => { });
            await tx.proposal.deleteMany({ where: { project: { clientId: id } } }).catch(() => { });
            await tx.project.deleteMany({ where: { clientId: id } });
            await tx.client.delete({ where: { id } });
        });
    } catch (err) {
        console.error("[deleteClientAction] Prisma delete failed:", err);
        return redirect("/clients?toast=action+failed");
    }

    revalidatePath("/clients");
    return redirect("/clients?toast=client+deleted");
}
