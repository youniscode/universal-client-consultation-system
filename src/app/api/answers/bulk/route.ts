// src/app/api/answers/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const projectId = String(formData.get("projectId") ?? "").trim();

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        // Hard gate: block writes if submitted
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

        // Parse form entries: q_<questionId> = <value>
        let upsertCount = 0;

        for (const [key, rawValue] of formData.entries()) {
            if (key === "projectId") continue;
            if (!key.startsWith("q_")) continue;

            const questionId = key.slice(2);
            if (!questionId) continue;

            // Normalize to string
            if (typeof rawValue !== "string") continue;
            const value = rawValue.trim();

            // (Optional) make sure the question exists
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
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
