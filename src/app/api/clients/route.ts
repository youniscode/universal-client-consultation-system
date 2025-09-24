// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { ClientType, type Prisma } from "@prisma/client";

const schema = z.object({
    name: z.string().min(2, "Client name is required"),
    clientType: z.nativeEnum(ClientType).default("SMALL_BUSINESS"),
    industry: z
        .string()
        .optional()
        .transform((v) => (v && v.trim() ? v.trim() : null)),
    contactName: z
        .string()
        .optional()
        .transform((v) => (v && v.trim() ? v.trim() : null)),
    contactEmail: z
        .string()
        .optional()
        .transform((v) => (v && v.trim() ? v.trim() : null)),
});

export async function POST(req: Request) {
    try {
        const form = await req.formData();

        const raw = {
            name: String(form.get("name") ?? ""),
            clientType: String(form.get("clientType") ?? "SMALL_BUSINESS") as ClientType,
            industry: (form.get("industry") as string | null) ?? undefined,
            contactName: (form.get("contactName") as string | null) ?? undefined,
            contactEmail: (form.get("contactEmail") as string | null) ?? undefined,
        };

        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.redirect(
                new URL("/clients?toast=invalid+client+data", req.url),
            );
        }

        // REQUIRED: who owns this client?
        const ownerId = process.env.DEFAULT_OWNER_ID;
        if (!ownerId) {
            console.error("DEFAULT_OWNER_ID is not set");
            return NextResponse.redirect(
                new URL("/clients?toast=missing+owner+config", req.url),
            );
        }

        const data: Prisma.ClientCreateInput = {
            ...parsed.data,
            owner: { connect: { id: ownerId } }, // 👈 satisfy required relation
        };

        await prisma.client.create({ data });

        return NextResponse.redirect(
            new URL("/clients?toast=client+created", req.url),
        );
    } catch (err) {
        console.error("Create client failed:", err);
        return NextResponse.redirect(
            new URL("/clients?toast=failed+to+create+client", req.url),
        );
    }
}
