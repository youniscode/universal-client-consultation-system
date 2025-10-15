// src/app/clients/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Button from "@/components/ui/button";
import Progress from "@/components/ui/progress";
import Card from "@/components/ui/card";
import StatusPill from "@/components/ui/StatusPill";
import DeleteProject from "@/components/ui/DeleteProject";
import {
  createProject,
  updateProject,
  submitProjectAndRedirect,
  reopenProjectAndRedirect,
} from "@/actions/projects";
import {
  ProjectType,
  ComplexityLevel,
  BudgetRange,
  Timeline,
  ProjectStatus,
} from "@prisma/client";
import { FlashToastOnLoad } from "@/components/ui/toast";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  // Map ?toast= to a human string for the global toaster
  const toastParam = Array.isArray(sp.toast) ? sp.toast[0] : sp.toast ?? null;
  const toastMessage =
    toastParam === "submitted"
      ? "Intake marked as submitted."
      : toastParam === "reopened"
      ? "Intake reopened (back to Draft)."
      : toastParam === "deleted"
      ? "Project deleted."
      : null;

  // 1) Fetch client (and 404 if missing)
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return notFound();

  // 2) Fetch projects for this client
  const projects = await prisma.project.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
  });

  // 3) Questionnaire / counts
  const questionnaire = await prisma.questionnaire.findFirst({
    where: { isActive: true },
    include: { questions: true },
  });
  const totalQuestions = questionnaire?.questions.length ?? 0;

  // 4) Enrich projects with progress & last-saved (count only non-empty answers)
  const enriched = await Promise.all(
    projects.map(async (p) => {
      const [answeredCount, lastAnswer] = await Promise.all([
        prisma.answer.count({ where: { projectId: p.id, NOT: { value: "" } } }),
        prisma.answer.findFirst({
          where: { projectId: p.id },
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true },
        }),
      ]);

      const pct =
        totalQuestions > 0
          ? Math.round((answeredCount / totalQuestions) * 100)
          : 0;

      return {
        ...p,
        answerCount: answeredCount,
        totalQuestions,
        pct,
        lastSaved: lastAnswer?.updatedAt ?? null,
      };
    })
  );

  return (
    <main className="space-y-10">
      {/* Show a toast if ?toast=... is present */}
      <FlashToastOnLoad message={toastMessage ?? undefined} variant="success" />

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
        {/* New project */}
        <Card className="p-6">
          <h2 className="text-lg font-medium">New Project</h2>
          <form
            action={createProject}
            className="mt-4 space-y-4"
            autoComplete="off"
          >
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
            <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-sm opacity-70">
              No projects yet.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {enriched.map((p) => {
                const label =
                  p.totalQuestions > 0
                    ? `${p.answerCount}/${p.totalQuestions} answered`
                    : "No questionnaire";

                const canMarkSubmitted =
                  p.status !== ProjectStatus.SUBMITTED && p.pct === 100;
                const canReopen = p.status === ProjectStatus.SUBMITTED;

                return (
                  <li
                    key={p.id}
                    className="rounded-lg border p-4 transition hover:bg-ink-50/40"
                  >
                    {/* Row: name + status */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm opacity-70">
                          {p.projectType} • Last saved:{" "}
                          {formatLastSaved(p.lastSaved)}
                        </div>
                      </div>
                      <StatusPill status={p.status} />
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <Progress value={p.pct} label={label} />
                    </div>

                    {/* Actions row */}
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Link
                        href={`/projects/${p.id}/intake`}
                        className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-ink-50"
                      >
                        {p.status === ProjectStatus.SUBMITTED
                          ? "View questionnaire"
                          : "Resume questionnaire"}
                      </Link>

                      <Link
                        href={`/projects/${p.id}/brief`}
                        className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-ink-50"
                      >
                        Generate brief
                      </Link>

                      {canMarkSubmitted && (
                        <form
                          action={async () => {
                            "use server";
                            await submitProjectAndRedirect(p.id, client.id);
                          }}
                        >
                          <Button type="submit" size="sm" variant="primary">
                            Mark as submitted
                          </Button>
                        </form>
                      )}

                      {canReopen && (
                        <form
                          action={async () => {
                            "use server";
                            await reopenProjectAndRedirect(p.id, client.id);
                          }}
                        >
                          <Button type="submit" size="sm">
                            Reopen intake
                          </Button>
                        </form>
                      )}

                      {/* Delete (DRAFT only) — uses your component */}
                      {p.status === ProjectStatus.DRAFT && (
                        <DeleteProject
                          projectId={p.id}
                          clientId={client.id}
                          name={p.name}
                        />
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
  options: Array<string | number>;
  defaultValue?: string | number;
  allowEmpty?: boolean;
}) {
  // Convert defaultValue to something <select> accepts:
  // - if undefined/null and allowEmpty, use empty string
  // - otherwise, stringify numbers/enums safely
  const dv: string | number | readonly string[] | undefined =
    defaultValue == null
      ? allowEmpty
        ? ""
        : undefined
      : typeof defaultValue === "number"
      ? String(defaultValue)
      : defaultValue;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        className="w-full rounded-md border px-3 py-2"
        defaultValue={dv}
      >
        {allowEmpty && <option value="">(unspecified)</option>}
        {options.map((opt) => {
          const v = typeof opt === "number" ? String(opt) : String(opt);
          return (
            <option key={v} value={v}>
              {v}
            </option>
          );
        })}
      </select>
    </div>
  );
}
