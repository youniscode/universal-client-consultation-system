// src/app/projects/[id]/intake/page.tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import AutosaveForm from "@/components/AutosaveForm";
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

type QGroup = Record<Phase, Question[]>;

/** Safely parse Prisma JSON question.options → string[] | null */
function parseOptions(o: unknown): string[] | null {
  if (Array.isArray(o) && o.every((x) => typeof x === "string")) {
    return o as string[];
  }
  return null;
}

/** Human label for phases */
function formatPhase(ph: Phase): string {
  switch (ph) {
    case Phase.DISCOVERY:
      return "1: Discovery";
    case Phase.AUDIENCE:
      return "2: Audience & UX";
    case Phase.FUNCTIONAL:
      return "3: Functional Requirements";
    case Phase.TECH:
      return "4: Technical Requirements";
    case Phase.DESIGN:
      return "5: Design & UI";
    case Phase.CONTENT:
      return "6: Content & SEO";
    case Phase.STACK:
      return "7: Stack & Hosting";
    default:
      return ph;
  }
}

function toArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    if (value.trim().startsWith("[")) {
      return JSON.parse(value) as string[];
    }
  } catch {
    /* ignore parse errors */
  }
  return [value];
}

export default async function ProjectIntakePage({ params }: PageProps) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!project) return notFound();

  const questionnaire = await prisma.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: { orderBy: [{ phase: "asc" }, { order: "asc" }] } },
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

  // Existing answers for this project
  const answers = await prisma.answer.findMany({
    where: { projectId: project.id },
  });

  const ansMap = new Map<string, string>();
  answers.forEach((a: Answer) => ansMap.set(a.questionId, a.value));

  // Group questions by Phase
  const groups = questionnaire.questions.reduce<QGroup>((acc, q) => {
    (acc[q.phase] ??= []).push(q);
    return acc;
  }, {} as QGroup);

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-sm opacity-80">
            {project.client.name} • {project.projectType}
          </p>
        </div>
        <Link
          href={`/clients/${project.clientId}`}
          className="underline whitespace-nowrap"
        >
          ← Back to client
        </Link>
      </div>

      {/* AUTOSAVE WRAPPER: renders a <form> internally and auto-saves on change/blur */}
      <AutosaveForm projectId={project.id}>
        {/* The API route also reads this, keep it in the DOM */}
        <input type="hidden" name="projectId" value={project.id} />

        {(Object.values(Phase) as Phase[]).map((ph) => {
          const qs = groups[ph];
          if (!qs || qs.length === 0) return null;

          return (
            <section key={ph} className="space-y-4 rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">{`Phase ${formatPhase(
                ph
              )}`}</h2>
              <div className="space-y-6">
                {qs.map((q, idx) => {
                  const name = `q_${q.id}`;
                  const saved = ansMap.get(q.id) ?? "";
                  const opts = parseOptions(q.options);

                  return (
                    <div key={q.id} className="space-y-2">
                      <label
                        htmlFor={name}
                        className="block text-sm font-medium"
                      >
                        {`${idx + 1}. ${q.questionText}`}
                      </label>

                      {/* TEXT */}
                      {q.type === QuestionType.TEXT && (
                        <input
                          id={name}
                          name={name}
                          defaultValue={typeof saved === "string" ? saved : ""}
                          className="w-full rounded-md border px-3 py-2"
                          placeholder="Type your answer"
                        />
                      )}

                      {/* TEXTAREA */}
                      {q.type === QuestionType.TEXTAREA && (
                        <textarea
                          id={name}
                          name={name}
                          defaultValue={typeof saved === "string" ? saved : ""}
                          className="w-full rounded-md border px-3 py-2 min-h-[96px]"
                          placeholder="Type your answer"
                        />
                      )}

                      {/* DROPDOWN */}
                      {q.type === QuestionType.DROPDOWN && opts && (
                        <select
                          id={name}
                          name={name}
                          defaultValue={
                            typeof saved === "string" && saved.length
                              ? saved
                              : ""
                          }
                          className="w-full rounded-md border px-3 py-2"
                        >
                          <option value="">{`— Select —`}</option>
                          {opts.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* CHECKBOX (multi-select) */}
                      {q.type === QuestionType.CHECKBOX && opts && (
                        <div className="space-y-2">
                          {(() => {
                            const current = toArray(saved);
                            return (
                              <>
                                {opts.map((opt) => {
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
                                {/* "Other" free text field if the list includes "Other" */}
                                {opts.includes("Other") && (
                                  <input
                                    type="text"
                                    name={`${name}__other`}
                                    placeholder={`If "Other", specify here`}
                                    className="w-full rounded-md border px-3 py-2"
                                    defaultValue={
                                      current
                                        .find((v) => v.startsWith("Other: "))
                                        ?.replace(/^Other:\s*/, "") ?? ""
                                    }
                                  />
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* MULTIPLE_CHOICE → radios (single select) */}
                      {q.type === QuestionType.MULTIPLE_CHOICE && opts && (
                        <div className="space-y-2">
                          {opts.map((opt) => {
                            const checked = saved === opt;
                            return (
                              <label
                                key={opt}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="radio"
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

                      {/* BOOLEAN → yes/no radios */}
                      {q.type === QuestionType.BOOLEAN && (
                        <div className="flex gap-6">
                          {["Yes", "No"].map((opt) => {
                            const checked = saved === opt;
                            return (
                              <label
                                key={opt}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="radio"
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

                      {/* SCALE (1–5 example) */}
                      {q.type === QuestionType.SCALE && (
                        <div className="flex items-center gap-3">
                          <input
                            id={name}
                            name={name}
                            type="range"
                            min={1}
                            max={5}
                            defaultValue={
                              typeof saved === "string" && saved ? saved : "3"
                            }
                          />
                          <span className="text-sm opacity-70">
                            {`Value: ${
                              typeof saved === "string" && saved ? saved : "3"
                            }`}
                          </span>
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
