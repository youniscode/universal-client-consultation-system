/**
 * Project Intake (Questionnaire) Page
 * ---------------------------------------------
 * - Loads current project & active questionnaire
 * - Groups questions by Phase
 * - Renders TEXT / TEXTAREA / DROPDOWN / CHECKBOX
 * - Adds a small "Other" text field whenever options include "Other"
 * - Posts to `submitAnswers` server action; values are pre-filled on refresh
 */

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { submitAnswers } from "@/actions/answers";
import { QuestionType, Phase, Question } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Extend type to say `options` can be unknown (JSON column)
type Q = Question & { options: unknown | null };

export default async function ProjectIntakePage({
  params,
}: {
  params: { id: string };
}) {
  // 1) Load the project + client
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!project) return notFound();

  // 2) Load the active questionnaire + ordered questions
  const questionnaire = await prisma.questionnaire.findFirst({
    where: { isActive: true },
    include: {
      questions: {
        orderBy: [{ phase: "asc" }, { order: "asc" }],
      },
    },
  });

  if (!questionnaire) {
    return (
      <main className="p-8 space-y-6">
        <h1 className="text-2xl font-bold">No active questionnaire</h1>
        <p className="opacity-80">Seed or create a questionnaire to begin.</p>
        <Link href={`/clients/${project.clientId}`} className="underline">
          ← Back to client
        </Link>
      </main>
    );
  }

  // 3) Fetch existing answers so we can pre-fill
  const answers = await prisma.answer.findMany({
    where: { projectId: project.id },
  });
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));

  // 4) Group questions by Phase for rendering
  const groups = questionnaire.questions.reduce<Record<Phase, Q[]>>(
    (acc, q) => {
      const ph = q.phase as Phase;
      (acc[ph] ??= []).push(q as Q);
      return acc;
    },
    {
      DISCOVERY: [],
      AUDIENCE: [],
      FUNCTIONAL: [],
      TECH: [],
      DESIGN: [],
      CONTENT: [],
      STACK: [],
    }
  );

  return (
    <main className="p-8 space-y-8">
      {/* Header */}
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

      {/* The form posts to server action; the page revalidates on save */}
      <form
        action={async (fd) => {
          "use server";
          await submitAnswers(fd);
        }}
        className="space-y-8"
      >
        <input type="hidden" name="projectId" value={project.id} />

        {Object.values(Phase).map((ph) => {
          const qs = groups[ph] as Q[];
          if (!qs || qs.length === 0) return null;

          return (
            <section key={ph} className="space-y-4 rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">{formatPhase(ph)}</h2>

              <div className="space-y-6">
                {qs.map((q) => {
                  const name = `q_${q.id}`;
                  const saved = answerMap.get(q.id) ?? "";

                  // Cast Question.options -> string[] safely
                  const opts: string[] = Array.isArray((q as Q).options)
                    ? ((q as Q).options as unknown[]).map(String)
                    : [];

                  return (
                    <div key={q.id} className="space-y-2">
                      <label
                        htmlFor={q.id}
                        className="block text-sm font-medium"
                      >
                        {q.order}. {q.questionText}
                      </label>

                      {/* TEXT */}
                      {q.type === QuestionType.TEXT && (
                        <input
                          id={q.id}
                          name={name}
                          defaultValue={typeof saved === "string" ? saved : ""}
                          className="w-full rounded-md border px-3 py-2"
                          placeholder="Type your answer"
                        />
                      )}

                      {/* TEXTAREA */}
                      {q.type === QuestionType.TEXTAREA && (
                        <textarea
                          id={q.id}
                          name={name}
                          defaultValue={typeof saved === "string" ? saved : ""}
                          className="w-full rounded-md border px-3 py-2 min-h-[90px]"
                          placeholder="Type your answer"
                        />
                      )}

                      {/* DROPDOWN (+ optional 'Other' text) */}
                      {q.type === QuestionType.DROPDOWN && (
                        <>
                          <select
                            id={q.id}
                            name={name}
                            className="w-full rounded-md border px-3 py-2"
                            defaultValue={
                              typeof saved === "string" ? saved : ""
                            }
                          >
                            <option value="">— Select —</option>
                            {opts.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>

                          {opts.includes("Other") && (
                            <input
                              name={`${name}__other`}
                              className="mt-2 w-full rounded-md border px-3 py-2"
                              placeholder='If "Other", specify here'
                              defaultValue=""
                            />
                          )}
                        </>
                      )}

                      {/* CHECKBOX (+ optional 'Other' text) */}
                      {q.type === QuestionType.CHECKBOX && (
                        <div className="space-y-1">
                          {opts.map((opt) => {
                            const current =
                              typeof saved === "string" && saved.startsWith("[")
                                ? (JSON.parse(saved) as string[])
                                : [];
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

                          {opts.includes("Other") && (
                            <input
                              name={`${name}__other`}
                              className="mt-2 w-full rounded-md border px-3 py-2"
                              placeholder='If "Other", specify here'
                              defaultValue=""
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <button
          type="submit"
          className="inline-flex items-center rounded-md border px-4 py-2 font-medium hover:bg-gray-50"
        >
          Save Answers
        </button>
      </form>
    </main>
  );
}

/** Render friendly section headings */
function formatPhase(ph: Phase) {
  switch (ph) {
    case "DISCOVERY":
      return "Phase 1: Discovery";
    case "AUDIENCE":
      return "Phase 2: Audience & UX";
    case "FUNCTIONAL":
      return "Phase 3: Functional Requirements";
    case "TECH":
      return "Phase 4: Technical Requirements";
    case "DESIGN":
      return "Phase 5: Design & UI";
    case "CONTENT":
      return "Phase 6: Content & SEO";
    case "STACK":
      return "Phase 7: Stack & Hosting";
    default:
      return ph;
  }
}
