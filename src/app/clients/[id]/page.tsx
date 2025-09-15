// src/app/clients/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Progress from "@/components/ui/progress";
import {
  createProject,
  markIntakeSubmitted,
  reopenIntake,
  updateProject,
  deleteProject,
} from "@/actions/projects";
import {
  ProjectType,
  ComplexityLevel,
  BudgetRange,
  Timeline,
  ProjectStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

/** Pretty "last saved" label */
function formatLastSaved(date: Date | null) {
  if (!date) return "Never";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

  // Projects for this client
  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  // Active questionnaire (for progress)
  const questionnaire = await prisma.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: true },
  });
  const totalQuestions = questionnaire?.questions.length ?? 0;

  // Enrich projects with counts, last saved, % complete
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
        {/* Create Project */}
        <div className="rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-semibold">New Project</h2>

          <form action={createProject} className="space-y-4">
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

            <button
              type="submit"
              className="inline-flex items-center rounded-md border px-4 py-2 font-medium hover:bg-gray-50"
            >
              Create Project
            </button>
          </form>
        </div>

        {/* Projects list */}
        <div className="rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Projects</h2>

          {enriched.length === 0 && (
            <div className="opacity-70">No projects yet.</div>
          )}

          <ul className="space-y-4">
            {enriched.map((p) => {
              const label =
                p.totalQuestions > 0
                  ? `${p.answerCount}/${p.totalQuestions} answered`
                  : "No questionnaire";

              const isDraft = p.status === ProjectStatus.DRAFT;
              const isSubmitted = p.status === ProjectStatus.SUBMITTED;
              // NEW: allow reopening for any non-draft status (covers legacy ACTIVE, etc.)
              const canReopen = p.status !== ProjectStatus.DRAFT;

              return (
                <li key={p.id} className="rounded-xl border p-4 space-y-3">
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

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/projects/${p.id}/intake`}
                      className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {isSubmitted
                        ? "View questionnaire"
                        : "Resume questionnaire"}
                    </Link>

                    <Link
                      href={`/projects/${p.id}/brief`}
                      className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Generate brief
                    </Link>

                    {isDraft && (
                      <form
                        action={async () => {
                          "use server";
                          await markIntakeSubmitted(p.id, client.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          Mark as submitted
                        </button>
                      </form>
                    )}

                    {canReopen && (
                      <form
                        action={async () => {
                          "use server";
                          await reopenIntake(p.id, client.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          Reopen intake
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Edit panel */}
                  <details className="rounded-lg border bg-white/50 p-3">
                    <summary className="cursor-pointer select-none text-sm font-medium">
                      ▸ Edit project
                    </summary>

                    <form action={updateProject} className="mt-3 space-y-3">
                      <input type="hidden" name="projectId" value={p.id} />
                      <input type="hidden" name="clientId" value={client.id} />

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium">
                            Name
                          </label>
                          <input
                            name="name"
                            defaultValue={p.name}
                            className="w-full rounded-md border px-3 py-2"
                            placeholder="Project name"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-sm font-medium">
                            Type
                          </label>
                          <select
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

                        <div className="space-y-1">
                          <label className="block text-sm font-medium">
                            Complexity
                          </label>
                          <select
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

                        <div className="space-y-1">
                          <label className="block text-sm font-medium">
                            Budget
                          </label>
                          <select
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

                        <div className="space-y-1">
                          <label className="block text-sm font-medium">
                            Timeline
                          </label>
                          <select
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

                      <button
                        type="submit"
                        className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Save changes
                      </button>
                    </form>
                  </details>

                  {/* Delete (only when DRAFT) */}
                  <div className="flex justify-end">
                    <form action={deleteProject}>
                      <input type="hidden" name="projectId" value={p.id} />
                      <input type="hidden" name="clientId" value={client.id} />
                      <button
                        type="submit"
                        disabled={!isDraft}
                        className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                        title={
                          isDraft
                            ? "Delete project"
                            : "Only draft projects can be deleted"
                        }
                      >
                        Delete project
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}
