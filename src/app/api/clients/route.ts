// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ClientType, Prisma } from "@prisma/client";

/** Always return a RELATIVE redirect so the browser keeps the current host. */
function redirectRelative(path: string) {
    return new NextResponse(null, { status: 303, headers: { Location: path } });
}

// Zod schema: keep yours as-is
const schema = z.object({
    name: z.string().min(2, "Client name is required."),
    clientType: z.nativeEnum(ClientType).default("SMALL_BUSINESS"),
    industry: z.string().transform(v => (v?.trim() ? v.trim() : null)).nullable().optional(),
    contactName: z.string().transform(v => (v?.trim() ? v.trim() : null)).nullable().optional(),
    contactEmail: z.string().transform(v => (v?.trim() ? v.trim() : null)).nullable().optional(),
});

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const raw = {
            name: String(form.get("name") ?? ""),
            clientType: (form.get("clientType") as string) || "SMALL_BUSINESS",
            industry: (form.get("industry") as string) ?? "",
            contactName: (form.get("contactName") as string) ?? "",
            contactEmail: (form.get("contactEmail") as string) ?? "",
        };

        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
            console.warn("Invalid client payload:", parsed.error.flatten().fieldErrors);
            return redirectRelative("/clients?toast=invalid+client+data");
        }

        // ownerId optional: only include if you set DEFAULT_OWNER_ID in env
        const ownerId = process.env.DEFAULT_OWNER_ID;

        const base = {
            name: parsed.data.name,
            clientType: parsed.data.clientType,
            industry: parsed.data.industry ?? null,
            contactName: parsed.data.contactName ?? null,
            contactEmail: parsed.data.contactEmail ?? null,
        };

        const data: Prisma.ClientUncheckedCreateInput = ownerId
            ? { ...base, ownerId }
            : (base as Prisma.ClientUncheckedCreateInput);

        await prisma.client.create({ data });

        return redirectRelative("/clients?toast=client+created");
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Create client failed:", message);
        return redirectRelative("/clients?toast=failed+to+create+client");
    }
}
