// src/app/api/answers/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const projectId = String(formData.get("projectId") ?? "").trim();

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        // 🔒 Block writes if submitted (we're using ACTIVE to mean submitted)
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { status: true },
        });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        if (project.status === "ACTIVE") {
            return NextResponse.json(
                { error: "Project is submitted (read-only)" },
                { status: 403 }
            );
        }

        let upserts = 0;
        let deletes = 0;

        // Iterate through form fields like q_<questionId>=<value>
        for (const [key, raw] of formData.entries()) {
            if (key === "projectId") continue;
            if (!key.startsWith("q_")) continue;

            const questionId = key.slice(2); // after "q_"
            if (!questionId) continue;

            // We only expect string values from your inputs
            if (typeof raw !== "string") continue;

            const value = raw.trim();

            // Ensure question exists (optional, but safer)
            const exists = await prisma.question.findUnique({
                where: { id: questionId },
                select: { id: true },
            });
            if (!exists) continue;

            if (value.length === 0) {
                // Empty -> delete any existing answer
                await prisma.answer.deleteMany({
                    where: { projectId, questionId },
                });
                deletes++;
                continue;
            }

            // Upsert answer
            await prisma.answer.upsert({
                where: {
                    projectId_questionId: { projectId, questionId },
                },
                update: { value },
                create: { projectId, questionId, value },
            });
            upserts++;
        }

        return NextResponse.json({
            ok: true,
            route: "/api/answers/bulk",
            upserts,
            deletes,
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
