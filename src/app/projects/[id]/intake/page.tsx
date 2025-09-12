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

type PageProps = { params: { id: string } };

// helper (same one you already use; keep your version if present)
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

export default async function ProjectIntakePage({ params }: PageProps) {
  // Load project + client
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!project) return notFound();

  // Lock if already submitted (we use ACTIVE = submitted)
  const isLocked = project.status === "ACTIVE";

  // Active questionnaire
  const questionnaire = await prisma.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: { orderBy: { phase: "asc" } } },
  });
  if (!questionnaire) {
    return (
      <main className="p-8 space-y-6">
        <h1 className="text-2xl font-bold">No active questionnaire</h1>
        <Link href={`/clients/${project.clientId}`} className="underline">
          ← Back to client
        </Link>
      </main>
    );
  }

  // Current answers for this project
  const answers = await prisma.answer.findMany({
    where: { projectId: project.id },
    orderBy: { updatedAt: "desc" },
    select: { questionId: true, value: true },
  });

  // value is already a string in your schema, so no need to JSON.stringify here
  const ansMap = new Map<string, string>(
    answers.map((a) => [a.questionId, a.value] as const)
  );

  // Group questions by phase (strictly typed, no `any`)
  const grouped: Record<Phase, Question[]> = Object.values(Phase).reduce(
    (acc, ph) => {
      acc[ph as Phase] = [];
      return acc;
    },
    {} as Record<Phase, Question[]>
  );

  for (const q of questionnaire.questions) {
    grouped[q.phase].push(q);
  }

  // Simple progress
  const total = questionnaire.questions.length;
  const answered = answers.length;
  const pct = total ? Math.round((answered / total) * 100) : 0;

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

      {isLocked && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
          This intake was submitted. Answers are read-only.
        </div>
      )}

      <div className="rounded-2xl border p-6 space-y-4">
        <Progress value={pct} label={`${answered}/${total} answered`} />

        {/* When locked: no autosave wrapper. When editable: keep autosave. */}
        {isLocked ? (
          // READ-ONLY RENDER
          <fieldset disabled className="space-y-8">
            {Object.values(Phase).map((ph) => {
              const qs = grouped[ph] || [];
              if (qs.length === 0) return null;

              return (
                <section key={ph} className="space-y-4 rounded-2xl border p-6">
                  <h2 className="text-xl font-semibold">{`Phase ${formatPhase(
                    ph
                  )}`}</h2>

                  <div className="space-y-6">
                    {qs.map((q, idx) => {
                      const name = `q_${q.id}`;
                      const saved = ansMap.get(q.id) ?? "";

                      return (
                        <div key={q.id} className="space-y-2">
                          <label className="block text-sm font-medium">
                            {`${idx + 1}. ${q.questionText}`}
                          </label>

                          {/* Inputs are disabled by fieldset; we still show values */}
                          {q.type === "TEXT" && (
                            <input
                              id={name}
                              name={name}
                              className="w-full rounded-md border px-3 py-2"
                              defaultValue={
                                typeof saved === "string" ? saved : ""
                              }
                              readOnly
                            />
                          )}

                          {q.type === "TEXTAREA" && (
                            <textarea
                              id={name}
                              name={name}
                              className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                              defaultValue={
                                typeof saved === "string" ? saved : ""
                              }
                              readOnly
                            />
                          )}

                          {q.type === "DROPDOWN" &&
                            Array.isArray(q.options) && (
                              <select
                                id={name}
                                name={name}
                                className="w-full rounded-md border px-3 py-2"
                                defaultValue={
                                  typeof saved === "string" ? saved : ""
                                }
                                disabled
                              >
                                <option value="">—</option>
                                {(q.options as string[]).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                          {/* Add any other types you support, all rendered read-only */}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </fieldset>
        ) : (
          // EDITABLE + AUTOSAVE
          <AutosaveForm projectId={project.id}>
            <input type="hidden" name="projectId" value={project.id} />

            {Object.values(Phase).map((ph) => {
              const qs = grouped[ph] || [];
              if (qs.length === 0) return null;

              return (
                <section key={ph} className="space-y-4 rounded-2xl border p-6">
                  <h2 className="text-xl font-semibold">{`Phase ${formatPhase(
                    ph
                  )}`}</h2>

                  <div className="space-y-6">
                    {qs.map((q, idx) => {
                      const name = `q_${q.id}`;
                      const saved = ansMap.get(q.id) ?? "";

                      return (
                        <div key={q.id} className="space-y-2">
                          <label
                            htmlFor={name}
                            className="block text-sm font-medium"
                          >
                            {`${idx + 1}. ${q.questionText}`}
                          </label>

                          {q.type === "TEXT" && (
                            <input
                              id={name}
                              name={name}
                              className="w-full rounded-md border px-3 py-2"
                              defaultValue={
                                typeof saved === "string" ? saved : ""
                              }
                              placeholder="Type your answer"
                            />
                          )}

                          {q.type === "TEXTAREA" && (
                            <textarea
                              id={name}
                              name={name}
                              className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                              defaultValue={
                                typeof saved === "string" ? saved : ""
                              }
                              placeholder="Type your answer"
                            />
                          )}

                          {q.type === "DROPDOWN" &&
                            Array.isArray(q.options) && (
                              <select
                                id={name}
                                name={name}
                                className="w-full rounded-md border px-3 py-2"
                                defaultValue={
                                  typeof saved === "string" ? saved : ""
                                }
                              >
                                <option value="">— Select —</option>
                                {(q.options as string[]).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </AutosaveForm>
        )}
      </div>
    </main>
  );
}
