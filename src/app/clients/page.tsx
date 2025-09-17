import Link from "next/link";
import { prisma } from "@/lib/db";
import { createClient } from "@/actions/clients"; // keep whatever you had before
import { ClientType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Link href="/" className="underline">
          ← Home
        </Link>
      </div>

      {/* New client */}
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-4">New Client</h2>

        <form action={createClient} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Client Name
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="Acme Retail"
            />
          </div>

          {/* Client type */}
          <div className="space-y-2">
            <label htmlFor="clientType" className="block text-sm font-medium">
              Client Type
            </label>
            <select
              id="clientType"
              name="clientType"
              className="w-full rounded-md border px-3 py-2"
              defaultValue={ClientType.SMALL_BUSINESS}
            >
              {Object.values(ClientType).map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <label htmlFor="industry" className="block text-sm font-medium">
              Industry
            </label>
            <input
              id="industry"
              name="industry"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Retail"
            />
          </div>

          {/* Contact info */}
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
                placeholder="Jane Doe"
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
                placeholder="jane@company.com"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center rounded-md border px-4 py-2 font-medium hover:bg-gray-50"
          >
            Create Client
          </button>
        </form>
      </section>

      {/* Existing clients */}
      <section className="rounded-2xl border p-6 space-y-3">
        <h2 className="text-xl font-semibold">All Clients</h2>

        <ul className="space-y-2">
          {clients.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm opacity-70">
                  {c.clientType}
                  {c.industry ? ` • ${c.industry}` : ""}
                </div>
              </div>
              <Link
                href={`/clients/${c.id}`}
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Open →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
