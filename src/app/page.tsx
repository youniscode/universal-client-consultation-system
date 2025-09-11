// app/page.tsx
import type { Client, Project } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type ClientWithProjects = Client & { projects: Project[] };

export default async function Home() {
  const clients: ClientWithProjects[] = await prisma.client.findMany({
    include: { projects: true },
  });

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">UCCS — Universal Consultation</h1>
      <p className="text-sm opacity-80">
        Starter wired to Postgres via Prisma.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Seeded Clients & Projects</h2>
        <ul className="list-disc pl-6">
          {clients.map((c: ClientWithProjects) => (
            <li key={c.id}>
              <span className="font-medium">{c.name}</span>{" "}
              <span className="opacity-70">({c.industry ?? "—"})</span>
              <ul className="list-disc pl-6">
                {c.projects.map((p: Project) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
