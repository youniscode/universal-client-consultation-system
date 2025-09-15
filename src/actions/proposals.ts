// src/actions/proposals.ts
"use server";

import { prisma } from "@/lib/db";
import { buildBrief } from "@/lib/brief";
import { revalidatePath } from "next/cache";

export async function saveProposalFromAnswers(projectId: string) {
    const { html } = await buildBrief(projectId);

    const last = await prisma.proposal.findFirst({
        where: { projectId },
        orderBy: { version: "desc" },
        select: { version: true },
    });

    const version = (last?.version ?? 0) + 1;

    await prisma.proposal.create({
        data: {
            projectId,
            version,
            html,
        },
    });

    // So the Brief page shows the new "latest" badge/state instantly.
    revalidatePath(`/projects/${projectId}/brief`);
}
