// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ClientType, Prisma } from "@prisma/client";

// Mirror the Prisma create input (nullable optionals)
const schema = z.object({
    name: z.string().min(2, "Client name is required."),
    clientType: z.nativeEnum(ClientType).default("SMALL_BUSINESS"),
    industry: z.string().transform(v => (v?.trim() ? v.trim() : null)).nullable().optional(),
    contactName: z.string().transform(v => (v?.trim() ? v.trim() : null)).nullable().optional(),
    contactEmail: z.string().transform(v => (v?.trim() ? v.trim() : null)).nullable().optional(),
});

// Always return an **absolute** redirect (more reliable behind proxies like Render)
function redirectAbsolute(req: Request, pathAndQuery: string) {
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(`${origin}${pathAndQuery}`, 303);
}

export async function POST(req: Request) {
    try {
        // Ensure we have an owner id on the server (and that you created this row in "User")
        const ownerId = process.env.DEFAULT_OWNER_ID;
        if (!ownerId) {
            console.error("Missing DEFAULT_OWNER_ID env var on server.");
            return redirectAbsolute(req, "/clients?toast=missing+owner");
        }

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
            return redirectAbsolute(req, "/clients?toast=invalid+client+data");
        }

        // Build payload (ownerId is required by your schema)
        const base = {
            name: parsed.data.name,
            clientType: parsed.data.clientType,
            industry: parsed.data.industry ?? null,
            contactName: parsed.data.contactName ?? null,
            contactEmail: parsed.data.contactEmail ?? null,
        };

        const data: Prisma.ClientUncheckedCreateInput = { ...base, ownerId };

        await prisma.client.create({ data });

        return redirectAbsolute(req, "/clients?toast=client+created");
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Create client failed:", message);
        // Common case: FK violation if the owner row doesn't exist
        return redirectAbsolute(req, "/clients?toast=failed+to+create+client");
    }
}
