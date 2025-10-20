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
  ProjectStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

// --------------------------------------------------
// Helpers
// --------------------------------------------------
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

// Render one control by type.
// For CHECKBOX we treat Answer.value as a CSV of selected labels.
function renderControl(
  q: Question,
  value: string | null,
  readonly: boolean
): React.ReactNode {
  const v = value ?? "";

  const csvToSet = (s: string) =>
    new Set(
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    );

  switch (q.type) {
    case "TEXT":
      return (
        <input
          id={`q_${q.id}`}
          name={`q_${q.id}`}
          className="w-full rounded-md border px-3 py-2"
          defaultValue={v}
          disabled={readonly}
          placeholder={readonly ? undefined : "Type your answer"}
        />
      );

    case "TEXTAREA":
      return (
        <textarea
          id={`q_${q.id}`}
          name={`q_${q.id}`}
          className="w-full rounded-md border px-3 py-2 min-h-[100px]"
          defaultValue={v}
          disabled={readonly}
          placeholder={readonly ? undefined : "Type your answer"}
        />
      );

    case "DROPDOWN": {
      const opts: string[] = Array.isArray(q.options)
        ? (q.options as string[])
        : [];
      return (
        <select
          id={`q_${q.id}`}
          name={`q_${q.id}`}
          className="w-full rounded-md border px-3 py-2"
          defaultValue={v}
          disabled={readonly || opts.length === 0}
        >
          {readonly ? (
            <option value="">—</option>
          ) : (
            <option value="">— Select —</option>
          )}
          {opts.length > 0
            ? opts.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))
            : null}
        </select>
      );
    }

    case "CHECKBOX": {
      const opts: string[] = Array.isArray(q.options)
        ? (q.options as string[])
        : [];
      const selected = csvToSet(v);

      // If no options were seeded, gracefully fall back to a single text input
      if (opts.length === 0) {
        return (
          <input
            id={`q_${q.id}`}
            name={`q_${q.id}`}
            className="w-full rounded-md border px-3 py-2"
            defaultValue={v}
            disabled={readonly}
            placeholder={readonly ? undefined : "Type your answer"}
          />
        );
      }

      return (
        <fieldset className="space-y-2">
          {opts.map((opt) => {
            const cid = `q_${q.id}_${opt}`;
            return (
              <label
                key={opt}
                htmlFor={cid}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  id={cid}
                  type="checkbox"
                  name={`q_${q.id}`}
                  value={opt}
                  defaultChecked={selected.has(opt)}
                  disabled={readonly}
                  className="h-4 w-4 rounded border"
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </fieldset>
      );
    }

    default:
      // Future-proof fallback
      return (
        <input
          id={`q_${q.id}`}
          name={`q_${q.id}`}
          className="w-full rounded-md border px-3 py-2"
          defaultValue={v}
          disabled={readonly}
        />
      );
  }
}

export default async function ProjectIntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Load project + client
  const project = await prisma.project.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!project) return notFound();

  // Lock when submitted
  const isLocked = project.status === ProjectStatus.SUBMITTED;

  // Active questionnaire
  const questionnaire = await prisma.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: { orderBy: { order: "asc" } } },
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

  // Map questionId -> value
  const ansMap = new Map<string, string>(
    answers.map((a) => [a.questionId, a.value] as const)
  );

  // Group questions by phase
  const grouped: Record<Phase, Question[]> = Object.values(Phase).reduce(
    (acc, ph) => {
      acc[ph as Phase] = [];
      return acc;
    },
    {} as Record<Phase, Question[]>
  );
  for (const q of questionnaire.questions) grouped[q.phase].push(q);

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

        {isLocked ? (
          // READ-ONLY (reuses the same renderer with disabled=true)
          <fieldset disabled className="space-y-8">
            {Object.values(Phase).map((ph) => {
              const qs = grouped[ph] || [];
              if (qs.length === 0) return null;

              return (
                <section key={ph} className="space-y-4 rounded-2xl border p-6">
                  <h2 className="text-xl font-semibold">
                    {`Phase ${formatPhase(ph)}`}
                  </h2>

                  <div className="space-y-6">
                    {qs.map((q, idx) => {
                      const saved = ansMap.get(q.id) ?? "";
                      return (
                        <div key={q.id} className="space-y-2">
                          <label className="block text-sm font-medium">
                            {`${idx + 1}. ${q.questionText}`}
                          </label>
                          {renderControl(q, saved, true)}
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
                  <h2 className="text-xl font-semibold">
                    {`Phase ${formatPhase(ph)}`}
                  </h2>

                  <div className="space-y-6">
                    {qs.map((q, idx) => {
                      const saved = ansMap.get(q.id) ?? "";
                      return (
                        <div key={q.id} className="space-y-2">
                          <label className="block text-sm font-medium">
                            {`${idx + 1}. ${q.questionText}`}
                          </label>
                          {renderControl(q, saved, false)}
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
