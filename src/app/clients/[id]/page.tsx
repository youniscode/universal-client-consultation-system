// src/app/clients/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Progress from "@/components/ui/progress";
import { createProject, markIntakeSubmitted } from "@/actions/projects";
import {
  ProjectType,
  ComplexityLevel,
  BudgetRange,
  Timeline,
} from "@prisma/client";

export const dynamic = "force-dynamic";

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

  // Projects
  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  // Active questionnaire → total questions
  const questionnaire = await prisma.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: true },
  });
  const totalQuestions = questionnaire?.questions.length ?? 0;

  // Enrich with answers count, last saved, and % complete
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Projects list with progress + actions */}
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
              const isSubmitted = p.status === "ACTIVE";

              return (
                <li key={p.id} className="rounded-md border p-4 space-y-3">
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

                  <div className="flex gap-3">
                    <Link
                      href={`/projects/${p.id}/intake`}
                      className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Resume questionnaire
                    </Link>

                    {!isSubmitted && (
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
