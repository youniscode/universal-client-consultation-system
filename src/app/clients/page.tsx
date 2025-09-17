// src/app/clients/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
// if your action is named differently, keep your existing import
import { createClient } from "@/actions/clients";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (!clients) return notFound();

  return (
    <main className="p-8 space-y-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Link href="/" className="underline">
          ← Home
        </Link>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {/* New Client */}
        <div className="rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-semibold">New Client</h2>

          <form action={createClient} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Client Name
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Acme Retail"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="clientType" className="block text-sm font-medium">
                Client Type
              </label>
              <select
                id="clientType"
                name="clientType"
                className="w-full rounded-md border px-3 py-2"
                defaultValue="SMALL_BUSINESS"
              >
                {/* Keep these in sync with your enum values */}
                <option value="SMALL_BUSINESS">SMALL_BUSINESS</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
                <option value="CORPORATION">CORPORATION</option>
                <option value="STARTUP">STARTUP</option>
                <option value="NON_PROFIT">NON_PROFIT</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="industry" className="block text-sm font-medium">
                Industry
              </label>
              <input
                id="industry"
                name="industry"
                placeholder="Retail"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="contactName"
                  className="block text-sm font-medium"
                >
                  Contact Name
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="contactEmail"
                  className="block text-sm font-medium"
                >
                  Contact Email
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            {/* Plain, styled submit to avoid the blank pill */}
            <button
              type="submit"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Create client
            </button>
          </form>
        </div>

        {/* All Clients */}
        <div className="rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-semibold">All Clients</h2>

          <ul className="space-y-3">
            {clients.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-md border p-4 hover:shadow-sm transition"
              >
                <div className="space-y-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm opacity-70">
                    {c.clientType}
                    {c.industry ? ` • ${c.industry}` : ""}
                  </div>
                </div>

                <Link
                  href={`/clients/${c.id}`}
                  prefetch
                  className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
