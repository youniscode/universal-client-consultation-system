// src/app/clients/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <Link href="/" className="underline">
          ← Home
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="card p-6 opacity-70">No clients yet.</div>
      ) : (
        <ul className="space-y-2">
          {clients.map((c) => (
            <li
              key={c.id}
              className="card p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm opacity-70">
                  {c.clientType}
                  {c.industry ? ` • ${c.industry}` : ""}
                </div>
              </div>

              <Link href={`/clients/${c.id}`} className="btn">
                Open →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
