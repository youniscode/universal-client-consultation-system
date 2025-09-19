// src/actions/clients.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const deleteClientSchema = z.object({
    clientId: z.string().min(1),
});

/**
 * Deletes a client and ALL of its related data (projects, answers, proposals)
 * in a single transaction.
 */
export async function deleteClient(formData: FormData): Promise<void> {
    const raw = { clientId: String(formData.get("clientId") ?? "") };
    const parsed = deleteClientSchema.safeParse(raw);
    if (!parsed.success) {
        console.error(parsed.error.flatten().fieldErrors);
        return;
    }

    const { clientId } = parsed.data;

    await prisma.$transaction([
        // Delete answers for all projects that belong to this client
        prisma.answer.deleteMany({ where: { project: { clientId } } }),
        // Delete proposals for all projects that belong to this client
        prisma.proposal.deleteMany({ where: { project: { clientId } } }),
        // Delete projects
        prisma.project.deleteMany({ where: { clientId } }),
        // Finally, delete the client record
        prisma.client.delete({ where: { id: clientId } }),
    ]);

    // Refresh the clients listing
    revalidatePath("/clients");
}
