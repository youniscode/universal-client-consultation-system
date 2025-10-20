// src/app/api/answers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";      // ✅ ensure Node runtime on Vercel



export async function POST(req: Request) {
    try {
        const form = await req.formData();

        const projectId = String(form.get("projectId") ?? "").trim();
        const questionId = String(form.get("questionId") ?? "").trim();
        const value = String(form.get("value") ?? "");

        if (!projectId || !questionId) {
            return NextResponse.json(
                { error: "Missing projectId or questionId" },
                { status: 400 }
            );
        }

        // Make sure project exists and isn’t submitted (read-only)
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { status: true },
        });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        if (project.status === ProjectStatus.SUBMITTED) {
            return NextResponse.json(
                { error: "Project intake is submitted (read-only)" },
                { status: 403 }
            );
        }

        // Upsert single answer
        await prisma.answer.upsert({
            where: { projectId_questionId: { projectId, questionId } },
            create: { projectId, questionId, value },
            update: { value },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[api/answers] POST error", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
