import Link from "next/link";
import { prisma } from "@/lib/db";
import Button from "@/components/ui/button";
import DeleteClient from "@/components/ui/DeleteClient";
import EmptyState from "@/components/ui/empty-state";
import { FlashToastOnLoad } from "@/components/ui/toast";
import type { Prisma as PrismaTypes } from "@prisma/client";
import { createClientAction } from "@/actions/clients";

export const dynamic = "force-dynamic";

// tiny pill
function Chip({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

// strongly typed so `_count` exists
type ClientWithCounts = PrismaTypes.ClientGetPayload<{
  include: { _count: { select: { projects: true } } };
}>;

export default async function ClientsPage({
  searchParams,
}: {
  // Next 13/14/15 app router gives a plain object (not Promise)
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sp = searchParams ?? {};
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "";

  const toastCode = Array.isArray(sp.toast) ? sp.toast[0] : sp.toast ?? null;
  const toastMessage =
    toastCode === "client+created" || toastCode === "created"
      ? "Client created."
      : toastCode === "client+deleted" || toastCode === "deleted"
      ? "Client deleted."
      : toastCode === "project+created" || toastCode === "project_created"
      ? "Project created."
      : toastCode === "submitted"
      ? "Intake marked as submitted."
      : toastCode === "reopened"
      ? "Intake reopened (back to Draft)."
      : null;

  // Prisma-safe where
  let where: PrismaTypes.ClientWhereInput = {};
  if (q.trim().length > 0) {
    where = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { industry: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const clients = (await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  })) as ClientWithCounts[];

  return (
    <main className="p-8 space-y-8">
      <FlashToastOnLoad message={toastMessage ?? undefined} variant="success" />

      {/* New Client (Server Action) */}
      <section className="rounded-2xl border p-6">
        <h2 className="text-lg font-medium">New Client</h2>
        <form
          action={createClientAction}
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
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-medium">All Clients</h2>

          <form method="get" className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or industry…"
              className="w-[22ch] rounded-md border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <Button type="submit" className="text-white" variant="primary">
              Search
            </Button>
            {q ? (
              <Link
                href="/clients"
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-ink-50"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>

        {clients.length === 0 ? (
          <EmptyState
            title={q ? "No matches" : "No clients yet"}
            description={
              q
                ? `No clients match “${q}”.`
                : "Create your first client to get started with projects and intakes."
            }
          />
        ) : (
          <ul className="space-y-3">
            {clients.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border bg-white p-4 flex items-center justify-between transition hover:shadow-card"
              >
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                    <Chip className="border border-ink-200 bg-ink-50 text-ink-800">
                      {c.clientType}
                    </Chip>
                    {c.industry ? (
                      <Chip className="border border-ink-200 bg-ink-50 text-ink-700">
                        {c.industry}
                      </Chip>
                    ) : null}
                    <Chip className="border border-brand-200 bg-brand-50 text-brand-700">
                      {c._count.projects} project
                      {c._count.projects === 1 ? "" : "s"}
                    </Chip>
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
