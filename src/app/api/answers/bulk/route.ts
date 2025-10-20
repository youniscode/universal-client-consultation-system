// src/app/api/answers/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const projectId = String(formData.get("projectId") ?? "").trim();

        if (!projectId) {
            return NextResponse.json({ ok: false, error: "Missing projectId" }, { status: 400 });
        }

        // Gate: block writes if submitted
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { status: true },
        });

        if (!project) {
            return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
        }

        if (project.status === ProjectStatus.SUBMITTED) {
            return NextResponse.json(
                { ok: false, error: "Project intake is submitted (read-only)" },
                { status: 403 }
            );
        }

        let upserts = 0;

        // Expect keys like q_<questionId>
        for (const [key, raw] of formData.entries()) {
            if (key === "projectId") continue;
            if (!key.startsWith("q_")) continue;

            const questionId = key.slice(2);
            if (!questionId) continue;

            if (typeof raw !== "string") continue;
            const value = raw.trim();

            // Ensure question exists (optional but safe)
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

            upserts++;
        }

        return NextResponse.json({ ok: true, upserts });
    } catch (e) {
        console.error("[answers.bulk] server error", e);
        return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
    }
}
