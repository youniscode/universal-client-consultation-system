"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma, ClientType } from "@prisma/client";

/* ------------------------------- zod schema ------------------------------ */
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

/* -------------------------- toast helpers (redirects) -------------------- */
function toastUrl(code: string) {
    return `/clients?toast=${encodeURIComponent(code)}`;
}
function okToast(code: string): never {
    return redirect(toastUrl(code));
}
function failToast(reason?: string): never {
    const code = reason ? `action+failed:+${reason}` : "action+failed";
    return redirect(toastUrl(code));
}

/* ------------------------------ error helper ----------------------------- */
function errorMessage(err: unknown): string {
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && "message" in err) {
        const m = (err as { message?: unknown }).message;
        if (typeof m === "string") return m;
    }
    try {
        return JSON.stringify(err);
    } catch {
        return "unknown error";
    }
}

/* ---------------------------- ensure owner row --------------------------- */
async function ensureOwner(ownerId: string, email: string) {
    await prisma.user.upsert({
        where: { id: ownerId },
        update: { updatedAt: new Date() },
        create: { id: ownerId, name: ownerId, email },
    });
}

/* --------------------------------- create -------------------------------- */
export async function createClientAction(formData: FormData) {
    const ownerId = (process.env.DEFAULT_OWNER_ID ?? "").trim();
    const ownerEmail = (process.env.DEFAULT_OWNER_EMAIL ?? "").trim();

    if (!ownerId) return failToast("DEFAULT_OWNER_ID+missing");
    if (!ownerEmail) return failToast("DEFAULT_OWNER_EMAIL+missing");
    if (!process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY)
        return failToast("server+actions+key+missing");

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
        return failToast("invalid+form");
    }

    try {
        await ensureOwner(ownerId, ownerEmail);
    } catch (e: unknown) {
        console.error("[createClientAction] ensureOwner failed:", e);
        return failToast(errorMessage(e));
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
    } catch (e: unknown) {
        console.error("[createClientAction] Prisma create failed:", e);
        const code =
            e && typeof e === "object" && "code" in e && typeof (e as { code?: unknown }).code === "string"
                ? (e as { code: string }).code
                : undefined;
        const reason = code === "P2002" ? "duplicate+client" : errorMessage(e);
        return failToast(reason);
    }

    revalidatePath("/clients");
    return okToast("client+created");
}

/* --------------------------------- delete -------------------------------- */
export async function deleteClientAction(formData: FormData) {
    const id = String(formData.get("clientId") ?? "");
    if (!id) return failToast("missing+clientId");

    try {
        await prisma.client.delete({ where: { id } });
    } catch (e: unknown) {
        console.error("[deleteClientAction] delete failed:", e);
        return failToast(errorMessage(e));
    }

    revalidatePath("/clients");
    return okToast("client+deleted");
}
