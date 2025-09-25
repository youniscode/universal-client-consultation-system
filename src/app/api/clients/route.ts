// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ClientType, Prisma } from "@prisma/client";

// Mirror the Prisma create input (nullable optionals)
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

function redirectRelative(location: string) {
    return new NextResponse(null, { status: 303, headers: { Location: location } });
}

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

        const ownerId = process.env.DEFAULT_OWNER_ID;

        // Build the common fields first
        const base = {
            name: parsed.data.name,
            clientType: parsed.data.clientType,
            industry: parsed.data.industry ?? null,
            contactName: parsed.data.contactName ?? null,
            contactEmail: parsed.data.contactEmail ?? null,
        };

        let data: Prisma.ClientUncheckedCreateInput;

        if (ownerId) {
            // Owner required or optional – we provide it explicitly
            data = { ...base, ownerId };
        } else {
            // No env owner – only valid if your schema makes ownerId optional
            // (If it is required, Prisma will throw; we’ll catch and show a toast)
            data = base as Prisma.ClientUncheckedCreateInput;
        }

        await prisma.client.create({ data });

        return redirectRelative("/clients?toast=client+created");
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Create client failed:", message);
        return redirectRelative("/clients?toast=failed+to+create+client");
    }
}

