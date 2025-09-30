import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ClientType, Prisma } from "@prisma/client";

/** Relative redirect: keeps the Render host (avoids 0.0.0.0). */
function redirectRelative(path: string) {
    return new NextResponse(null, { status: 303, headers: { Location: path } });
}

/** Coerce empty strings to null for nullable columns */
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
            console.warn(`${LOG} invalid payload`, parsed.error.flatten().fieldErrors);
            return redirectRelative("/clients?toast=invalid+client+data");
        }

        // If your Prisma schema requires an ownerId (NOT NULL),
        // you must provide DEFAULT_OWNER_ID in Render env.
        const ownerId = process.env.DEFAULT_OWNER_ID?.trim();
        const common = {
            name: parsed.data.name,
            clientType: parsed.data.clientType,
            industry: parsed.data.industry ?? null,
            contactName: parsed.data.contactName ?? null,
            contactEmail: parsed.data.contactEmail ?? null,
        };

        let data: Prisma.ClientUncheckedCreateInput;

        if (ownerId && ownerId.length > 0) {
            data = { ...common, ownerId };
            console.log(`${LOG} using ownerId from env`, ownerId);
        } else {
            // If your schema has "ownerId String?", this is fine.
            // If it's required in your schema, Prisma will throw and we’ll show a toast.
            data = common as Prisma.ClientUncheckedCreateInput;
            console.log(`${LOG} no ownerId in env (assuming optional in schema)`);
        }

        console.log(`${LOG} creating client`, { ...data, contactEmail: !!data.contactEmail ? "set" : null });
        await prisma.client.create({ data });

        console.log(`${LOG} success -> redirect`);
        return redirectRelative("/clients?toast=client+created");
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${LOG} failed`, message);

        // If foreign key fails, make it obvious
        if (/Foreign key constraint/i.test(message)) {
            return redirectRelative("/clients?toast=owner_not_found");
        }

        // If owner is missing yet required
        if (/Null constraint failed.*ownerId/i.test(message)) {
            return redirectRelative("/clients?toast=config_error");
        }

        return redirectRelative("/clients?toast=failed+to+create+client");
    }
}
