// src/app/projects/[id]/intake/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import AutosaveForm from "@/components/ui/AutosaveForm";
import Progress from "@/components/ui/progress";

import {
  Phase,
  QuestionType,
  type Question,
  type Answer,
} from "@prisma/client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

/* ---------- helpers ---------- */
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
      return "Stack";
    default:
      return p;
  }
}

/** answers are JSON or string; normalize into string[] for checkbox rendering */
function asStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [trimmed];
  }
}

/** safe options extraction */
function getOptions(q: Question): string[] {
  return Array.isArray(q.options) ? (q.options as string[]) : [];
}

/** compute answered/total for a phase */
function computePhaseStats(
  qs: Question[],
  ansMap: Map<string, string>
): { answered: number; total: number; pct: number } {
  const total = qs.length;
  const answered = qs.reduce((acc, q) => {
    const v = ansMap.get(q.id);
    if (!v) return acc;
    if (q.type === "CHECKBOX") {
      return asStringArray(v).length > 0 ? acc + 1 : acc;
    }
    return v.trim() ? acc + 1 : acc;
  }, 0);
  const pct = total === 0 ? 0 : (answered / total) * 100;
  return { answered, total, pct };
}

/* ---------- page ---------- */
export default async function ProjectIntakePage({ params }: PageProps) {
  // project
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!project) return notFound();

  // latest active questionnaire + questions
  const questionnaire = await prisma.questionnaire.findFirst({
    where: { isActive: true },
    include: {
      questions: { orderBy: [{ phase: "asc" }, { order: "asc" }] },
    },
  });

  // answers for this project
  const answers = await prisma.answer.findMany({
    where: { projectId: project.id },
  });

  // normalize
  const questions = questionnaire?.questions ?? [];
  const ansMap = new Map<string, string>(
    answers.map((a) => [a.questionId, a.value])
  );

  // group questions by phase
  const byPhase = questions.reduce<Record<Phase, Question[]>>((acc, q) => {
    (acc[q.phase] ??= []).push(q);
    return acc;
  }, {} as Record<Phase, Question[]>);

  // list phases that actually have questions
  const phasesInUse = (Object.values(Phase) as Phase[]).filter(
    (p) => (byPhase[p]?.length ?? 0) > 0
  );

  return (
    <main className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-sm opacity-80">
            {project.client.name} • {project.projectType}
          </p>
        </div>
        <Link href={`/clients/${project.clientId}`} className="underline">
          ← Back to client
        </Link>
      </div>

      {/* Autosave wrapper captures all field changes */}
      <AutosaveForm projectId={project.id}>
        {/* keep a hidden projectId for good measure */}
        <input
          type="hidden"
          name="projectId"
          defaultValue={project.id}
          readOnly
        />

        {phasesInUse.map((ph) => {
          const qs = byPhase[ph] ?? [];
          if (qs.length === 0) return null;

          // phase header progress
          const stats = computePhaseStats(qs, ansMap);

          return (
            <section key={ph} className="space-y-4 rounded-2xl border p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {`Phase ${formatPhase(ph)}`}
                </h2>
              </div>

              <div className="w-56">
                <Progress
                  value={stats.pct}
                  label={`${stats.answered}/${stats.total} answered`}
                />
              </div>

              <div className="space-y-6">
                {qs.map((q, idx) => {
                  const name = `q_${q.id}`;
                  const saved = ansMap.get(q.id) ?? "";
                  const opts = getOptions(q);

                  return (
                    <div key={q.id} className="space-y-2">
                      <label
                        htmlFor={name}
                        className="block text-sm font-medium"
                      >
                        {`${idx + 1}. ${q.questionText}`}
                      </label>

                      {/* TEXT */}
                      {q.type === "TEXT" && (
                        <input
                          id={name}
                          name={name}
                          className="w-full rounded-md border px-3 py-2"
                          placeholder="Type your answer"
                          defaultValue={typeof saved === "string" ? saved : ""}
                        />
                      )}

                      {/* TEXTAREA */}
                      {q.type === "TEXTAREA" && (
                        <textarea
                          id={name}
                          name={name}
                          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                          placeholder="Type your answer"
                          defaultValue={typeof saved === "string" ? saved : ""}
                        />
                      )}

                      {/* DROPDOWN */}
                      {q.type === "DROPDOWN" && opts.length > 0 && (
                        <select
                          id={name}
                          name={name}
                          className="w-full rounded-md border px-3 py-2"
                          defaultValue={typeof saved === "string" ? saved : ""}
                        >
                          <option value="">— Select —</option>
                          {opts.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* CHECKBOX (multi) */}
                      {q.type === "CHECKBOX" && opts.length > 0 && (
                        <div className="space-y-1">
                          {opts.map((opt) => {
                            const current = asStringArray(saved);
                            const checked = current.includes(opt);
                            return (
                              <label
                                key={opt}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  name={name}
                                  value={opt}
                                  defaultChecked={checked}
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </AutosaveForm>
    </main>
  );
}
