"use server";

import { prisma } from "@/lib/db";
import { Prisma, ClientType } from "@prisma/client";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/** Zod schema mirrors Prisma create input (optionals -> nullable) */
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
    // raw values from form
    const raw = {
        name: String(formData.get("name") ?? ""),
        clientType: (formData.get("clientType") as string) || "SMALL_BUSINESS",
        industry: (formData.get("industry") as string) ?? "",
        contactName: (formData.get("contactName") as string) ?? "",
        contactEmail: (formData.get("contactEmail") as string) ?? "",
    };

    // validate payload
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return redirect("/clients?toast=invalid+client+data");
    }

    // REQUIRED owner id (because your Prisma model requires the relation)
    const ownerId = process.env.DEFAULT_OWNER_ID;
    if (!ownerId) {
        console.error(
            "[createClientAction] DEFAULT_OWNER_ID is missing. Set it in Render → Environment."
        );
        return redirect("/clients?toast=missing+owner+id");
    }

    // Build a CHECKED Prisma input including the relation connect
    const data: Prisma.ClientCreateInput = {
        name: parsed.data.name,
        clientType: parsed.data.clientType,
        industry: parsed.data.industry ?? null,
        contactName: parsed.data.contactName ?? null,
        contactEmail: parsed.data.contactEmail ?? null,
        owner: { connect: { id: ownerId } }, // <-- relation is required
    };

    try {
        await prisma.client.create({ data });
    } catch (err) {
        console.error("[createClientAction] failed:", err);
        return redirect("/clients?toast=failed+to+create+client");
    }

    revalidatePath("/clients");
    return redirect("/clients?toast=client+created");
}

export async function deleteClient(formData: FormData) {
    const clientId = String(formData.get("clientId") ?? "");
    if (!clientId) return redirect("/clients?toast=invalid+client+data");

    try {
        await prisma.$transaction(async (trx) => {
            await trx.answer
                .deleteMany({ where: { project: { clientId } } })
                .catch(() => { });
            await trx.proposal
                .deleteMany({ where: { project: { clientId } } })
                .catch(() => { });
            await trx.project.deleteMany({ where: { clientId } }).catch(() => { });
            await trx.client.delete({ where: { id: clientId } });
        });
    } catch (err) {
        console.error("[deleteClient] failed:", err);
        return redirect("/clients?toast=failed+to+delete+client");
    }

    revalidatePath("/clients");
    return redirect("/clients?toast=client+deleted");
}
