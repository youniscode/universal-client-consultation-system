// src/app/clients/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Button from "@/components/ui/button";
import Progress from "@/components/ui/progress";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state"; // NEW
import DeleteProject from "@/components/ui/DeleteProject"; // NEW
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
  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return notFound();

  const projects = await prisma.project.findMany({
    where: { clientId: id },
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
    <main className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm tracking-wide text-ink-600/80">
            {client.clientType}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {client.name}
          </h1>
          <p className="text-sm opacity-70">{client.industry || "—"}</p>
        </div>
        <Link href="/clients" className="text-sm underline underline-offset-4">
          ← All clients
        </Link>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        {/* New Project */}
        <Card className="p-6">
          <h2 className="text-lg font-medium">New Project</h2>
          <form
            action={createProject}
            className="mt-4 space-y-4"
            autoComplete="off"
          >
            <input type="hidden" name="clientId" value={client.id} />

            <div className="space-y-2">
              <label htmlFor="name" className="ui-label">
                Project Name
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Website redesign"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="projectType" className="ui-label">
                Project Type
              </label>
              <select
                id="projectType"
                name="projectType"
                defaultValue={ProjectType.WEBSITE}
              >
                {Object.values(ProjectType).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FieldSelect
                id="complexity"
                name="complexity"
                label="Complexity"
                options={Object.values(ComplexityLevel)}
              />
              <FieldSelect
                id="budget"
                name="budget"
                label="Budget"
                options={Object.values(BudgetRange)}
              />
              <FieldSelect
                id="timeline"
                name="timeline"
                label="Timeline"
                options={Object.values(Timeline)}
              />
            </div>

            <Button type="submit" variant="primary">
              Create project
            </Button>
          </form>
        </Card>

        {/* Projects */}
        <Card className="p-6">
          <h2 className="text-lg font-medium">Projects</h2>

          {enriched.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Create a project to launch the questionnaire and generate a brief."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {enriched.map((p) => {
                const label =
                  p.totalQuestions > 0
                    ? `${p.answerCount}/${p.totalQuestions} answered`
                    : "No questionnaire";

                const isSubmitted = p.status === ProjectStatus.SUBMITTED;
                const canMarkSubmitted =
                  p.status !== ProjectStatus.SUBMITTED && p.pct === 100;
                const canReopen = p.status === ProjectStatus.SUBMITTED;

                return (
                  <li
                    key={p.id}
                    className="rounded-lg border p-4 transition hover:bg-ink-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <div>
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

                    <div className="mt-3">
                      <Progress value={p.pct} label={label} />
                    </div>

                    {/* Actions row */}
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Link
                        href={`/projects/${p.id}/intake`}
                        prefetch
                        className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-ink-50"
                      >
                        {isSubmitted
                          ? "View questionnaire"
                          : "Resume questionnaire"}
                      </Link>

                      <Link
                        href={`/projects/${p.id}/brief`}
                        prefetch
                        className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-ink-50"
                      >
                        Generate brief
                      </Link>

                      {canMarkSubmitted && (
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

                      {canReopen && (
                        <form
                          action={async () => {
                            "use server";
                            await reopenIntake(p.id, client.id);
                          }}
                        >
                          <Button type="submit" variant="destructive" size="sm">
                            Reopen intake
                          </Button>
                        </form>
                      )}

                      {p.status === ProjectStatus.DRAFT && (
                        <DeleteProject projectId={p.id} clientId={client.id} />
                      )}
                    </div>

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
                        <input
                          type="hidden"
                          name="clientId"
                          value={client.id}
                        />

                        <div className="space-y-2">
                          <label htmlFor={`name-${p.id}`} className="ui-label">
                            Name
                          </label>
                          <input
                            id={`name-${p.id}`}
                            name="name"
                            defaultValue={p.name}
                          />
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <FieldSelect
                            id={`type-${p.id}`}
                            name="projectType"
                            label="Type"
                            defaultValue={p.projectType}
                            options={Object.values(ProjectType)}
                          />
                          <FieldSelect
                            id={`budget-${p.id}`}
                            name="budget"
                            label="Budget"
                            defaultValue={p.budget ?? ""}
                            options={Object.values(BudgetRange)}
                            allowEmpty
                          />
                          <FieldSelect
                            id={`timeline-${p.id}`}
                            name="timeline"
                            label="Timeline"
                            defaultValue={p.timeline ?? ""}
                            options={Object.values(Timeline)}
                            allowEmpty
                          />
                        </div>

                        <FieldSelect
                          id={`complexity-${p.id}`}
                          name="complexity"
                          label="Complexity"
                          defaultValue={p.complexity ?? ""}
                          options={Object.values(ComplexityLevel)}
                          allowEmpty
                        />

                        <Button type="submit">Save changes</Button>
                      </form>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </main>
  );
}

function FieldSelect({
  id,
  name,
  label,
  options,
  defaultValue = "",
  allowEmpty = true,
}: {
  id: string;
  name: string;
  label: string;
  options: string[];
  defaultValue?: string;
  allowEmpty?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="ui-label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue}>
        {allowEmpty && <option value="">(unspecified)</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
