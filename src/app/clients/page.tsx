// src/app/clients/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import DeleteClient from "@/components/ui/DeleteClient"; // ⬅️ NEW

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    // If you want to show a project count before deleting, include:
    include: { _count: { select: { projects: true } } },
  });

  return (
    <main className="p-8 space-y-8">
      {/* ... your New Client form ... */}

      <section className="rounded-2xl border p-6 space-y-4">
        <h2 className="text-lg font-medium">All Clients</h2>

        <ul className="space-y-3">
          {clients.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm opacity-70">
                  {c.clientType} • {c.industry || "—"}
                  {/* Optional count:  • {c._count?.projects ?? 0} projects */}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/clients/${c.id}`}
                  className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-ink-50"
                >
                  Open →
                </Link>

                {/* ⬇️ NEW: Delete button */}
                <DeleteClient clientId={c.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
