// src/app/projects/[id]/brief/page.tsx
import Link from "next/link";
import { buildBrief } from "@/lib/brief";
import { saveProposalFromAnswers } from "@/actions/proposals";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BriefPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = params.id;
  const { project, html } = await buildBrief(projectId);

  const latest = await prisma.proposal.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });

  return (
    <main className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Brief</h1>
          <p className="text-sm opacity-80">
            {project.client.name} • {project.projectType}
          </p>
        </div>
        <Link href={`/clients/${project.clientId}`} className="underline">
          ← Back to client
        </Link>
      </div>

      <div className="flex gap-3">
        <form
          action={async () => {
            "use server";
            await saveProposalFromAnswers(projectId);
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center rounded-md border px-4 py-2 font-medium hover:bg-gray-50"
          >
            Save as proposal (new version)
          </button>
        </form>

        {latest && (
          <span className="text-sm opacity-80 self-center">
            Latest saved proposal: v{latest.version} •{" "}
            {latest.updatedAt.toLocaleString()}
          </span>
        )}
      </div>

      {/* Render the HTML brief */}
      <div
        className="rounded-2xl border p-6 bg-white"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
