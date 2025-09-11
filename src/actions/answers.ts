"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Accepts a dynamic form with inputs named like: q_<questionId>
export async function submitAnswers(formData: FormData) {
    const projectId = String(formData.get("projectId") ?? "");
    if (!projectId) return;

    // Only fields that start with q_
    const entries = Array.from(formData.entries()).filter(([k]) => k.startsWith("q_"));

    await Promise.all(
        entries.map(async ([key]) => {
            const questionId = key.replace(/^q_/, "");
            const all = formData.getAll(key);

            // Single vs multi (checkbox)
            const value =
                all.length <= 1 ? String(all[0] ?? "") : JSON.stringify(all.map((v) => String(v)));

            await prisma.answer.upsert({
                where: { projectId_questionId: { projectId, questionId } },
                create: { projectId, questionId, value },
                update: { value },
            });
        })
    );

    // Revalidate the intake page for this project
    revalidatePath(`/projects/${projectId}/intake`);
}
