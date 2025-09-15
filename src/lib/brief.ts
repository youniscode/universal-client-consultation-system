// src/lib/brief.ts
import { prisma } from "@/lib/db";
import { Phase } from "@prisma/client";

export type BriefItem = { label: string; value: string };
export type BriefSection = { phase: Phase; title: string; items: BriefItem[] };

function formatPhase(p: Phase): string {
    switch (p) {
        case "DISCOVERY":
            return "Discovery";
        case "AUDIENCE":
            return "Audience & UX";
        case "FUNCTIONAL":
            return "Functional Requirements";
        case "TECH":
            return "Technical Requirements";
        case "DESIGN":
            return "Design";
        case "CONTENT":
            return "Content";
        case "STACK":
            return "Tech Stack";
        default:
            return p;
    }
}

function jsonToText(raw: string | null | undefined): string {
    if (!raw) return "—";
    // Many of our answers are JSON-encoded strings (arrays for multi-select)
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.join(", ");
        if (typeof parsed === "object") return Object.entries(parsed).map(([k, v]) => `${k}: ${v as string}`).join("; ");
        return String(parsed);
    } catch {
        return raw;
    }
}

export async function buildBrief(projectId: string) {
    const [project, questionnaire, answers] = await Promise.all([
        prisma.project.findUnique({
            where: { id: projectId },
            include: { client: true },
        }),
        prisma.questionnaire.findFirst({
            where: { isActive: true },
            include: { questions: { orderBy: [{ phase: "asc" }, { order: "asc" }] } },
        }),
        prisma.answer.findMany({
            where: { projectId },
            select: { questionId: true, value: true },
        }),
    ]);

    if (!project) throw new Error("Project not found");
    if (!questionnaire) {
        return {
            project,
            sections: [] as BriefSection[],
            html: `<p>No active questionnaire found.</p>`,
        };
    }

    const answerMap = new Map<string, string>();
    for (const a of answers) {
        answerMap.set(a.questionId, a.value ?? "");
    }

    const sections: BriefSection[] = [];
    for (const q of questionnaire.questions) {
        const text = jsonToText(answerMap.get(q.id) ?? "");
        const title = formatPhase(q.phase);
        let sec = sections.find((s) => s.phase === q.phase);
        if (!sec) {
            sec = { phase: q.phase, title, items: [] };
            sections.push(sec);
        }
        sec.items.push({ label: q.questionText, value: text || "—" });
    }

    // Simple HTML (inline styles so it prints nicely)
    const html = `
  <article style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5; color:#111">
    <header style="margin-bottom:24px">
      <h1 style="font-size:22px; font-weight:700; margin:0">${project.name}</h1>
      <p style="margin:4px 0 0; opacity:.75">${project.client.name} • ${project.projectType}</p>
      <p style="margin:2px 0 0; opacity:.6">${new Date().toLocaleString()}</p>
    </header>

    ${sections
            .map(
                (sec) => `
        <section style="margin:24px 0; padding:16px; border:1px solid #e5e7eb; border-radius:12px">
          <h2 style="font-size:16px; font-weight:600; margin:0 0 12px">${sec.title}</h2>
          <dl style="display:grid; grid-template-columns: 220px 1fr; gap:10px 16px; margin:0">
            ${sec.items
                        .map(
                            (it) => `
                <dt style="opacity:.7">${it.label}</dt>
                <dd style="margin:0">${it.value}</dd>
              `
                        )
                        .join("")}
          </dl>
        </section>`
            )
            .join("")}
  </article>
  `;

    return { project, sections, html };
}
