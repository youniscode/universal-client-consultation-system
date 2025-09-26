// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ClientType, Prisma } from "@prisma/client";

// Build absolute redirect that works in Render
function redirectAbsolute(req: Request, path: string) {
    const xfProto = req.headers.get("x-forwarded-proto"); // https
    const xfHost = req.headers.get("x-forwarded-host");   // your render.com domain
    const host = xfHost ?? req.headers.get("host") ?? process.env.PUBLIC_ORIGIN ?? "localhost:3000";
    const proto = xfProto ?? (host.startsWith("localhost") ? "http" : "https");
    const origin = host.startsWith("http") ? host : `${proto}://${host}`;
    const url = new URL(path.startsWith("/") ? path : `/${path}`, origin);
    return NextResponse.redirect(url, 303);
}

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
            return redirectAbsolute(req, "/clients?toast=invalid+client+data");
        }

        const ownerId = process.env.DEFAULT_OWNER_ID;

        const base = {
            name: parsed.data.name,
            clientType: parsed.data.clientType,
            industry: parsed.data.industry ?? null,
            contactName: parsed.data.contactName ?? null,
            contactEmail: parsed.data.contactEmail ?? null,
        };

        // Use const here (no reassignment needed)
        const data: Prisma.ClientUncheckedCreateInput = ownerId
            ? { ...base, ownerId }
            : (base as Prisma.ClientUncheckedCreateInput);

        await prisma.client.create({ data });

        return redirectAbsolute(req, "/clients?toast=client+created");
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Create client failed:", message);
        return redirectAbsolute(req, "/clients?toast=failed+to+create+client");
    }
}
