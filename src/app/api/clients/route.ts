// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ClientType, Prisma } from "@prisma/client";

// Match Prisma.ClientUncheckedCreateInput (nullable optionals)
const schema = z.object({
    name: z.string().min(2, "Client name is required."),
    clientType: z.nativeEnum(ClientType).default("SMALL_BUSINESS"),
    industry: z.string().trim().optional().nullable(),
    contactName: z.string().trim().optional().nullable(),
    contactEmail: z.string().trim().email().optional().nullable(),
});

// helper: send a **relative** redirect so host is preserved on Render
function redirectRelative(location: string) {
    return new NextResponse(null, { status: 303, headers: { Location: location } });
}

export async function POST(req: Request) {
    try {
        const form = await req.formData();

        // Raw strings from the form
        const raw = {
            name: String(form.get("name") ?? ""),
            clientType: (form.get("clientType") as string) || "SMALL_BUSINESS",
            industry: (form.get("industry") as string | null) ?? null,
            contactName: (form.get("contactName") as string | null) ?? null,
            contactEmail: (form.get("contactEmail") as string | null) ?? null,
        };

        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
            return redirectRelative("/clients?toast=invalid+client+data");
        }

        // If your schema REQUIRES ownerId (non-nullable):
        const ownerId = process.env.DEFAULT_OWNER_ID;

        // Guard so TS knows it's a string and to avoid runtime error
        if (!ownerId) {
            console.error("DEFAULT_OWNER_ID is missing. Set it in your env / Render.");
            return redirectRelative("/clients?toast=server+missing+owner");
        }

        // Build data with the now-guaranteed string ownerId
        const data: Prisma.ClientUncheckedCreateInput = {
            name: parsed.data.name,
            clientType: parsed.data.clientType,
            industry: parsed.data.industry ?? null,
            contactName: parsed.data.contactName ?? null,
            contactEmail: parsed.data.contactEmail ?? null,
            ownerId, // <- string (not string | undefined), TS is happy
        };

        await prisma.client.create({ data });

        return redirectRelative("/clients?toast=client+created");
    } catch (err) {
        console.error("Create client failed:", err);
        return redirectRelative("/clients?toast=failed+to+create+client");
    }
}
