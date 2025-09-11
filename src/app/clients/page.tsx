import { prisma } from "@/lib/db";
import { ClientType } from "@prisma/client";
import { createClient } from "@/actions/clients";

export const dynamic = "force-dynamic"; // always fetch fresh data

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-8 space-y-10">
      <section>
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-sm opacity-80">
          Create a client, then we’ll attach projects.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {/* Create form */}
        <div className="rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-semibold">New Client</h2>
          <form
            action={async (formData) => {
              "use server";
              await createClient(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full rounded-md border px-3 py-2"
                placeholder="Acme Retail"
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
              >
                {Object.values(ClientType).map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="jane@acme.com"
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
        </div>

        {/* List */}
        <div className="rounded-2xl border p-6 space-y-3">
          <h2 className="text-xl font-semibold">Existing Clients</h2>
          <ul className="space-y-2">
            {clients.length === 0 && (
              <li className="opacity-70">No clients yet.</li>
            )}
            {clients.map((c) => (
              <li key={c.id} className="rounded-md border px-4 py-2">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm opacity-70">
                  {c.clientType}
                  {c.industry ? ` • ${c.industry}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
