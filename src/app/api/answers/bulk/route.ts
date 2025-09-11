// src/app/api/answers/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Quick health check in the browser (GET /api/answers/bulk)
export async function GET() {
    return NextResponse.json({ ok: true, route: "/api/answers/bulk" });
}

/**
 * Accepts multipart/form-data
 *  - projectId: string
 *  - __allNames: string (space-separated input names present in the form)
 *  - q_<questionId>: value(s)
 */
export async function POST(req: Request) {
    try {
        const fd = await req.formData();
        const projectId = String(fd.get("projectId") ?? "");
        const rawNames = String(fd.get("__allNames") ?? "");
        if (!projectId) {
            return NextResponse.json({ ok: false, error: "Missing projectId" }, { status: 400 });
        }

        const names = rawNames
            .split(/\s+/)
            .map((s) => s.trim())
            .filter(Boolean);

        if (names.length === 0) {
            return NextResponse.json({ ok: true, saved: 0 });
        }

        // Active questionnaire + its questions for validation
        const questionnaire = await prisma.questionnaire.findFirst({
            where: { isActive: true },
            include: { questions: { select: { id: true } } },
        });

        if (!questionnaire) {
            return NextResponse.json({ ok: false, error: "No active questionnaire" }, { status: 500 });
        }

        const validIds = new Set(questionnaire.questions.map((q) => q.id));

        let saved = 0;
        for (const name of names) {
            if (!name.startsWith("q_")) continue;
            const questionId = name.slice(2);

            // ignore any field that isn't in the active questionnaire
            if (!validIds.has(questionId)) continue;

            // read one or many values
            const all = fd.getAll(name);
            let value: string | null = null;
            if (all.length === 0) {
                value = null;
            } else if (all.length === 1) {
                value = String(all[0]);
            } else {
                value = JSON.stringify(all.map((v) => String(v)));
            }

            await prisma.answer.upsert({
                where: { projectId_questionId: { projectId, questionId } },
                create: { projectId, questionId, value: value ?? "" },
                update: { value: value ?? "" },
            });

            saved++;
        }

        return NextResponse.json({ ok: true, saved });
    } catch (err) {
        console.error("answers/bulk error", err);
        return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
    }
}
