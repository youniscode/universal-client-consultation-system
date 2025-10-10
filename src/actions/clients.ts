"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma, ClientType } from "@prisma/client";

const schema = z.object({
    name: z.string().min(2, "Client name is required."),
    clientType: z.nativeEnum(ClientType).default("SMALL_BUSINESS"),
    industry: z.string().transform(v => (v?.trim() ? v.trim() : null)).nullable().optional(),
    contactName: z.string().transform(v => (v?.trim() ? v.trim() : null)).nullable().optional(),
    contactEmail: z.string().transform(v => (v?.trim() ? v.trim() : null)).nullable().optional(),
});

// Make sure the owner exists in DB (so FK won’t fail on Render)
async function ensureOwner(ownerId: string) {
    const fallbackEmail =
        process.env.DEFAULT_OWNER_EMAIL ||
        `${ownerId.toLowerCase()}@example.com`;

    await prisma.user.upsert({
        where: { id: ownerId },
        update: { updatedAt: new Date() },
        create: {
            id: ownerId,
            name: ownerId,
            email: fallbackEmail,
        },
    });
}

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

    const ownerId = process.env.DEFAULT_OWNER_ID?.trim();
    if (!ownerId) {
        console.error("[createClientAction] DEFAULT_OWNER_ID is missing.");
        return redirect("/clients?toast=action+failed");
    }

    try {
        // Ensure FK row exists on whatever DB we’re running (Render/local)
        await ensureOwner(ownerId);

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
        return redirect("/clients?toast=action+failed");
    }

    revalidatePath("/clients");
    return redirect("/clients?toast=client+created");
}

export async function deleteClientAction(formData: FormData) {
    const id = String(formData.get("clientId") ?? "");
    if (!id) return redirect("/clients?toast=action+failed");

    try {
        await prisma.client.delete({ where: { id } });
    } catch (err) {
        console.error("[deleteClientAction] delete failed:", err);
        return redirect("/clients?toast=action+failed");
    }

    revalidatePath("/clients");
    return redirect("/clients?toast=client+deleted");
}
