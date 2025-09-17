// src/app/clients/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Button from "@/components/ui/button";
import Progress from "@/components/ui/progress";
import {
  createProject,
  updateProject,
  markIntakeSubmitted,
  reopenIntake,
} from "@/actions/projects";
import {
  ProjectType,
  ComplexityLevel,
  BudgetRange,
  Timeline,
  ProjectStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

function formatLastSaved(date: Date | null) {
  if (!date) return "Never";
  const ms = Date.now() - date.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// DEV ONLY — will outline any unexpected extra child in the actions row.
// Remove later if you like.
function Guard({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-guard
      className="flex gap-3 [&>*]:outline-transparent"
      // If something extra slips in, it will get a faint outline
      // so we can see *what* it is in DevTools.
    >
      {children}
    </div>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
  });
  if (!client) return notFound();

  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  const questionnaire = await prisma.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: true },
  });
  const totalQuestions = questionnaire?.questions.length ?? 0;

  const enriched = await Promise.all(
    projects.map(async (p) => {
      const [answerCount, lastAnswer] = await Promise.all([
        prisma.answer.count({ where: { projectId: p.id } }),
        prisma.answer.findFirst({
          where: { projectId: p.id },
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true },
        }),
      ]);

      const pct =
        totalQuestions > 0
          ? Math.round((answerCount / totalQuestions) * 100)
          : 0;

      return {
        ...p,
        answerCount,
        totalQuestions,
        pct,
        lastSaved: lastAnswer?.updatedAt ?? null,
      };
    })
  );

  return (
    <main className="p-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-sm opacity-80">
            {client.clientType}
            {client.industry ? ` • ${client.industry}` : ""}
          </p>
        </div>
        <Link href="/clients" className="underline">
          ← All clients
        </Link>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        {/* New project */}
        <div className="rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-semibold">New Project</h2>

          <form action={createProject} className="space-y-4" autoComplete="off">
            <input type="hidden" name="clientId" value={client.id} />

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Project Name
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full rounded-md border px-3 py-2"
                placeholder="Website redesign"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="projectType"
                className="block text-sm font-medium"
              >
                Project Type
              </label>
              <select
                id="projectType"
                name="projectType"
                className="w-full rounded-md border px-3 py-2"
                defaultValue={ProjectType.WEBSITE}
              >
                {Object.values(ProjectType).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label
                  htmlFor="complexity"
                  className="block text-sm font-medium"
                >
                  Complexity
                </label>
                <select
                  id="complexity"
                  name="complexity"
                  className="w-full rounded-md border px-3 py-2"
                  defaultValue=""
                >
                  <option value="">(unspecified)</option>
                  {Object.values(ComplexityLevel).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="budget" className="block text-sm font-medium">
                  Budget
                </label>
                <select
                  id="budget"
                  name="budget"
                  className="w-full rounded-md border px-3 py-2"
                  defaultValue=""
                >
                  <option value="">(unspecified)</option>
                  {Object.values(BudgetRange).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="timeline" className="block text-sm font-medium">
                  Timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  className="w-full rounded-md border px-3 py-2"
                  defaultValue=""
                >
                  <option value="">(unspecified)</option>
                  {Object.values(Timeline).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit">Create Project</Button>
          </form>
        </div>

        {/* Projects */}
        <div className="rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Projects</h2>

          {enriched.length === 0 && (
            <div className="opacity-70">No projects yet.</div>
          )}

          <ul className="space-y-3">
            {enriched.map((p) => {
              const label =
                p.totalQuestions > 0
                  ? `${p.answerCount}/${p.totalQuestions} answered`
                  : "No questionnaire";

              const isSubmitted = p.status === ProjectStatus.SUBMITTED;
              const isDraft = p.status === ProjectStatus.DRAFT;

              return (
                <li
                  key={p.id}
                  className="rounded-md border p-4 space-y-3 transition hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm opacity-70">
                        {p.projectType} • Last saved:{" "}
                        {formatLastSaved(p.lastSaved)}
                      </div>
                    </div>
                    {isSubmitted && (
                      <span className="rounded-full border px-2 py-1 text-xs">
                        Submitted
                      </span>
                    )}
                  </div>

                  <Progress value={p.pct} label={label} />

                  {/* Actions row — strictly controlled */}
                  <Guard>
                    <Link
                      href={`/projects/${p.id}/intake`}
                      className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                      prefetch
                    >
                      {isSubmitted
                        ? "View questionnaire"
                        : "Resume questionnaire"}
                    </Link>

                    <Link
                      href={`/projects/${p.id}/brief`}
                      className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                      prefetch
                    >
                      Generate brief
                    </Link>

                    {/* Only render a third control if DRAFT */}
                    {isDraft && (
                      <form
                        action={async () => {
                          "use server";
                          await markIntakeSubmitted(p.id, client.id);
                        }}
                      >
                        <Button type="submit" size="sm">
                          Mark as submitted
                        </Button>
                      </form>
                    )}
                  </Guard>

                  {/* Edit panel */}
                  <details className="mt-4 rounded-lg border bg-ink-50/50 p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Edit project
                    </summary>

                    <form
                      action={updateProject}
                      className="mt-3 space-y-3"
                      autoComplete="off"
                    >
                      <input type="hidden" name="projectId" value={p.id} />
                      <input type="hidden" name="clientId" value={client.id} />

                      <div className="space-y-2">
                        <label
                          htmlFor={`name-${p.id}`}
                          className="block text-sm font-medium"
                        >
                          Name
                        </label>
                        <input
                          id={`name-${p.id}`}
                          name="name"
                          defaultValue={p.name}
                          className="w-full rounded-md border px-3 py-2"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="space-y-2">
                          <label
                            htmlFor={`type-${p.id}`}
                            className="block text-sm font-medium"
                          >
                            Type
                          </label>
                          <select
                            id={`type-${p.id}`}
                            name="projectType"
                            defaultValue={p.projectType}
                            className="w-full rounded-md border px-3 py-2"
                          >
                            {Object.values(ProjectType).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`budget-${p.id}`}
                            className="block text-sm font-medium"
                          >
                            Budget
                          </label>
                          <select
                            id={`budget-${p.id}`}
                            name="budget"
                            defaultValue={p.budget ?? ""}
                            className="w-full rounded-md border px-3 py-2"
                          >
                            <option value="">(unspecified)</option>
                            {Object.values(BudgetRange).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`timeline-${p.id}`}
                            className="block text-sm font-medium"
                          >
                            Timeline
                          </label>
                          <select
                            id={`timeline-${p.id}`}
                            name="timeline"
                            defaultValue={p.timeline ?? ""}
                            className="w-full rounded-md border px-3 py-2"
                          >
                            <option value="">(unspecified)</option>
                            {Object.values(Timeline).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`complexity-${p.id}`}
                          className="block text-sm font-medium"
                        >
                          Complexity
                        </label>
                        <select
                          id={`complexity-${p.id}`}
                          name="complexity"
                          defaultValue={p.complexity ?? ""}
                          className="w-full rounded-md border px-3 py-2"
                        >
                          <option value="">(unspecified)</option>
                          {Object.values(ComplexityLevel).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button type="submit">Save changes</Button>
                    </form>
                  </details>

                  {/* Reopen appears only when SUBMITTED, and below the card */}
                  {isSubmitted && (
                    <form
                      action={async () => {
                        "use server";
                        await reopenIntake(p.id, client.id);
                      }}
                      className="mt-3"
                    >
                      <Button type="submit" variant="destructive" size="sm">
                        Reopen intake
                      </Button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}
