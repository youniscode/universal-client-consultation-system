// src/app/clients/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import DeleteClient from "@/components/ui/DeleteClient"; // NEW
import EmptyState from "@/components/ui/empty-state"; // NEW

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <main className="p-8 space-y-8">
      {/* New Client Form */}
      <section className="rounded-2xl border p-6">
        <h2 className="text-lg font-medium">New Client</h2>
        <form
          action="/api/clients"
          method="post"
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-2">
            <label htmlFor="name" className="ui-label">
              Client Name
            </label>
            <input id="name" name="name" required placeholder="Acme Inc." />
          </div>

          <div className="space-y-2">
            <label htmlFor="clientType" className="ui-label">
              Client Type
            </label>
            <select
              id="clientType"
              name="clientType"
              defaultValue="SMALL_BUSINESS"
            >
              <option value="SMALL_BUSINESS">Small Business</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="NON_PROFIT">Non-profit</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="industry" className="ui-label">
              Industry
            </label>
            <input
              id="industry"
              name="industry"
              placeholder="Retail, Finance…"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contactName" className="ui-label">
              Contact Name
            </label>
            <input id="contactName" name="contactName" />
          </div>

          <div className="space-y-2">
            <label htmlFor="contactEmail" className="ui-label">
              Contact Email
            </label>
            <input id="contactEmail" name="contactEmail" type="email" />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" variant="primary">
              Create client
            </Button>
          </div>
        </form>
      </section>

      {/* All Clients */}
      <section className="rounded-2xl border p-6 space-y-4">
        <h2 className="text-lg font-medium">All Clients</h2>
        {clients.length === 0 ? (
          <EmptyState
            title="No clients yet"
            description="Create your first client to get started with projects and intakes."
          />
        ) : (
          <ul className="space-y-3">
            {clients.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm opacity-70">
                    {c.clientType} • {c.industry || "—"} •{" "}
                    {c._count.projects ?? 0} projects
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/clients/${c.id}`}
                    className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-ink-50"
                  >
                    Open
                  </Link>
                  <DeleteClient clientId={c.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
