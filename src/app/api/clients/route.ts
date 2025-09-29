// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ClientType, Prisma } from "@prisma/client";

// Small helper: always redirect RELATIVE so Render doesn't invent 0.0.0.0
function redirectRelative(path: string) {
    return new NextResponse(null, { status: 303, headers: { Location: path } });
}

// Normalize empty strings to null for nullable optionals
const nullableString = z
    .string()
    .transform((v) => {
        const t = (v ?? "").trim();
        return t.length ? t : null;
    })
    .nullish();

const schema = z.object({
    name: z.string().min(2, "Client name is required."),
    clientType: z.nativeEnum(ClientType).default("SMALL_BUSINESS"),
    industry: nullableString,
    contactName: nullableString,
    contactEmail: nullableString,
});

export async function POST(req: Request) {
    const LOG = "[api/clients POST]";
    try {
        console.log(`${LOG} begin`);

        const form = await req.formData();
        // Raw strings from the form (avoid 'as string' surprises)
        const raw = {
            name: String(form.get("name") ?? ""),
            clientType: String(form.get("clientType") ?? "SMALL_BUSINESS"),
            industry: String(form.get("industry") ?? ""),
            contactName: String(form.get("contactName") ?? ""),
            contactEmail: String(form.get("contactEmail") ?? ""),
        };

        console.log(`${LOG} raw`, raw);

        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
            console.warn(
                `${LOG} invalid payload`,
                parsed.error.flatten().fieldErrors
            );
            return redirectRelative("/clients?toast=invalid+client+data");
        }

        const dataCommon = {
            name: parsed.data.name,
            clientType: parsed.data.clientType,
            industry: parsed.data.industry ?? null,
            contactName: parsed.data.contactName ?? null,
            contactEmail: parsed.data.contactEmail ?? null,
        };

        const ownerId = process.env.DEFAULT_OWNER_ID;
        let data: Prisma.ClientUncheckedCreateInput;

        if (ownerId && ownerId.trim().length > 0) {
            data = { ...dataCommon, ownerId };
            console.log(`${LOG} using ownerId from env`, ownerId);
        } else {
            // ownerId optional in your schema => this is fine
            data = dataCommon as Prisma.ClientUncheckedCreateInput;
            console.log(`${LOG} no ownerId in env (assuming optional in schema)`);
        }

        console.log(`${LOG} creating client`, data);
        await prisma.client.create({ data });

        console.log(`${LOG} success -> redirect`);
        return redirectRelative("/clients?toast=client+created");
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${LOG} failed`, message);
        return redirectRelative("/clients?toast=failed+to+create+client");
    }
}
