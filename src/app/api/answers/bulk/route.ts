// src/app/api/answers/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const projectId = String(formData.get("projectId") ?? "").trim();

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        // Guard: project must exist & not be submitted
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

        // q_<questionId> = <value>
        let upsertCount = 0;

        for (const [key, raw] of formData.entries()) {
            if (key === "projectId") continue;
            if (!key.startsWith("q_")) continue;

            const questionId = key.slice(2);
            if (!questionId) continue;

            if (typeof raw !== "string") continue;
            const value = raw.trim();

            // (Optional) verify question exists
            const exists = await prisma.question.findUnique({
                where: { id: questionId },
                select: { id: true },
            });
            if (!exists) continue;

            await prisma.answer.upsert({
                where: { projectId_questionId: { projectId, questionId } },
                create: { projectId, questionId, value },
                update: { value },
            });

            upsertCount++;
        }

        return NextResponse.json({ ok: true, upserts: upsertCount });
    } catch (e) {
        console.error("[api/answers/bulk] POST error", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
