"use server";

/**
 * Server Action: submitAnswers
 * ---------------------------------------------
 * Accepts a <form> POST with fields named like:
 *   - q_<questionId>              (text/textarea/dropdown)
 *   - q_<questionId> (multiple)   (checkboxes → multiple values)
 *   - q_<questionId>__other       (optional companion text if options include "Other")
 *
 * It normalizes everything and upserts into Prisma `Answer`:
 *   - Single value -> stored as a string
 *   - Multiple values -> stored as JSON string array: '["A","B","Other: something"]'
 *
 * Finally, we revalidate the intake page so the saved answers re-render immediately.
 */

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitAnswers(formData: FormData) {
    const projectId = String(formData.get("projectId") ?? "");
    if (!projectId) return;

    // Pull all fields starting with "q_"
    const all = Array.from(formData.entries());

    // For normal values: q_<id> -> string[]
    const valuesByKey = new Map<string, string[]>();
    // For optional "Other" text: q_<id>__other -> string
    const othersByKey = new Map<string, string>();

    for (const [key, raw] of all) {
        if (!key.startsWith("q_")) continue;

        // Companions for "Other" inputs
        if (key.endsWith("__other")) {
            const base = key.replace(/__other$/, "");
            const text = String(raw ?? "");
            if (text.trim()) {
                othersByKey.set(base, text.trim());
            }
            continue;
        }

        // Main values (text/textarea/dropdown or checkbox)
        const val = String(raw ?? "");
        const existing = valuesByKey.get(key) ?? [];
        if (val !== "") existing.push(val);
        valuesByKey.set(key, existing);
    }

    // Upsert each answer.
    const tasks: Promise<unknown>[] = [];
    for (const [key, vals] of valuesByKey.entries()) {
        const questionId = key.replace(/^q_/, "");
        const other = othersByKey.get(key);

        let toStore: string;

        if (vals.length > 1) {
            // Checkbox: merge “Other” if provided.
            const merged = other ? [...vals, `Other: ${other}`] : vals;
            toStore = JSON.stringify(merged);
        } else {
            // Single: dropdown / text / textarea
            const v = vals[0] ?? "";
            toStore = other ? `Other: ${other}` : v;
        }

        tasks.push(
            prisma.answer.upsert({
                where: { projectId_questionId: { projectId, questionId } },
                create: { projectId, questionId, value: toStore },
                update: { value: toStore },
            })
        );
    }

    await Promise.all(tasks);

    // Re-render the page with fresh values
    revalidatePath(`/projects/${projectId}/intake`);
}
