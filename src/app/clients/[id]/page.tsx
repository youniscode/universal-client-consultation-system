// src/app/clients/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createProject } from "@/actions/projects";
import {
  ProjectType,
  ComplexityLevel,
  BudgetRange,
  Timeline,
} from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { projects: { orderBy: { createdAt: "desc" } } },
  });

  if (!client) return notFound();

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

        {/* Projects list */}
        <div className="rounded-2xl border p-6 space-y-3">
          <h2 className="text-xl font-semibold">Projects</h2>
          <ul className="space-y-2">
            {client.projects.length === 0 && (
              <li className="opacity-70">No projects yet.</li>
            )}
            {client.projects.map((p) => (
              <li key={p.id} className="rounded-md border px-4 py-2">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm opacity-70">
                  {p.projectType}
                  {p.complexity ? ` • ${p.complexity}` : ""}
                  {p.budget ? ` • ${p.budget}` : ""}
                  {p.timeline ? ` • ${p.timeline}` : ""}
                </div>
                <div className="mt-2">
                  <Link href={`/projects/${p.id}/intake`} className="underline">
                    Open questionnaire →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
