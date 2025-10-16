// src/actions/projects.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import {
    ProjectStatus,
    ProjectType,
    ComplexityLevel,
    BudgetRange,
    Timeline,
} from "@prisma/client";

/** Convert nullish to undefined so Prisma/TS accept optional enum fields. */
const toUndef = <T,>(v: T | null | undefined): T | undefined =>
    v == null ? undefined : v;

/* ------------------------------- Validation ------------------------------ */

const createSchema = z.object({
    clientId: z.string().min(1),
    name: z.string().min(1, "Project name is required."),
    projectType: z.nativeEnum(ProjectType).default(ProjectType.WEBSITE),
    complexity: z.nativeEnum(ComplexityLevel).nullable().optional(),
    budget: z.nativeEnum(BudgetRange).nullable().optional(),
    timeline: z.nativeEnum(Timeline).nullable().optional(),
});

const updateSchema = z.object({
    projectId: z.string().min(1),
    clientId: z.string().min(1),
    name: z.string().optional(),
    projectType: z.nativeEnum(ProjectType).optional(),
    complexity: z.nativeEnum(ComplexityLevel).nullable().optional(),
    budget: z.nativeEnum(BudgetRange).nullable().optional(),
    timeline: z.nativeEnum(Timeline).nullable().optional(),
});

/* --------------------------------- Create -------------------------------- */

export async function createProject(formData: FormData) {
    const raw = {
        clientId: String(formData.get("clientId") ?? ""),
        name: String(formData.get("name") ?? ""),
        projectType: (formData.get("projectType") as string) ?? ProjectType.WEBSITE,
        complexity: (formData.get("complexity") as string) || null,
        budget: (formData.get("budget") as string) || null,
        timeline: (formData.get("timeline") as string) || null,
    };

    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
        console.error("[createProject] invalid payload:", parsed.error.flatten());
        return redirect(`/clients/${raw.clientId}?toast=action+failed`);
    }
    const d = parsed.data;

    try {
        await prisma.project.create({
            data: {
                clientId: d.clientId,
                name: d.name,
                projectType: d.projectType,
                // convert null → undefined when column is NOT NULL
                complexity: toUndef<ComplexityLevel>(d.complexity),
                budget: toUndef<BudgetRange>(d.budget),
                timeline: toUndef<Timeline>(d.timeline),
                status: ProjectStatus.DRAFT,
            },
        });
    } catch (err) {
        console.error("[createProject] prisma create failed:", err);
        return redirect(`/clients/${d.clientId}?toast=action+failed`);
    }

    revalidatePath(`/clients/${d.clientId}`);
    return redirect(`/clients/${d.clientId}?toast=project+created`);
}

/* --------------------------------- Update -------------------------------- */

export async function updateProject(formData: FormData) {
    const raw = {
        projectId: String(formData.get("projectId") ?? ""),
        clientId: String(formData.get("clientId") ?? ""),
        name: (formData.get("name") as string) || undefined,
        projectType: (formData.get("projectType") as string) || undefined,
        complexity: (formData.get("complexity") as string) || null,
        budget: (formData.get("budget") as string) || null,
        timeline: (formData.get("timeline") as string) || null,
    };

    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
        console.error("[updateProject] invalid payload:", parsed.error.flatten());
        return redirect(`/clients/${raw.clientId}?toast=action+failed`);
    }

    const { projectId, clientId, ...rest } = parsed.data;

    // Build a safe Prisma update object, only adding defined keys.
    const data: Prisma.ProjectUpdateInput = {};
    if (rest.name !== undefined) data.name = rest.name;
    if (rest.projectType !== undefined) data.projectType = rest.projectType;

    if (rest.complexity !== undefined) {
        const v = toUndef<ComplexityLevel>(rest.complexity);
        if (v !== undefined) data.complexity = v;
    }
    if (rest.budget !== undefined) {
        const v = toUndef<BudgetRange>(rest.budget);
        if (v !== undefined) data.budget = v;
    }
    if (rest.timeline !== undefined) {
        const v = toUndef<Timeline>(rest.timeline);
        if (v !== undefined) data.timeline = v;
    }

    try {
        await prisma.project.update({ where: { id: projectId }, data });
    } catch (err) {
        console.error("[updateProject] prisma update failed:", err);
        return redirect(`/clients/${clientId}?toast=action+failed`);
    }

    revalidatePath(`/clients/${clientId}`);
    return redirect(`/clients/${clientId}?toast=project+updated`);
}

/* --------------------------- Status + redirects --------------------------- */

export async function submitProjectAndRedirect(projectId: string, clientId: string) {
    try {
        await prisma.project.update({
            where: { id: projectId },
            data: { status: ProjectStatus.SUBMITTED },
        });
    } catch (err) {
        console.error("[submitProject] failed:", err);
        return redirect(`/clients/${clientId}?toast=action+failed`);
    }
    revalidatePath(`/clients/${clientId}`);
    return redirect(`/clients/${clientId}?toast=submitted`);
}

export async function reopenProjectAndRedirect(projectId: string, clientId: string) {
    try {
        await prisma.project.update({
            where: { id: projectId },
            data: { status: ProjectStatus.DRAFT },
        });
    } catch (err) {
        console.error("[reopenProject] failed:", err);
        return redirect(`/clients/${clientId}?toast=action+failed`);
    }
    revalidatePath(`/clients/${clientId}`);
    return redirect(`/clients/${clientId}?toast=reopened`);
}

/* --------------------------------- Delete -------------------------------- */

export async function deleteProjectAndRedirect(projectId: string, clientId: string) {
    try {
        // If you store answers, delete them first to avoid FK errors.
        await prisma.$transaction([
            prisma.answer.deleteMany({ where: { projectId } }),
            prisma.project.delete({ where: { id: projectId } }),
        ]);
    } catch (err) {
        console.error("[deleteProject] failed:", err);
        return redirect(`/clients/${clientId}?toast=action+failed`);
    }
    revalidatePath(`/clients/${clientId}`);
    return redirect(`/clients/${clientId}?toast=deleted`);
}

// Form wrapper so Client Components can post hidden inputs
export async function deleteProjectAction(formData: FormData) {
    const projectId = String(formData.get("projectId") ?? "");
    const clientId = String(formData.get("clientId") ?? "");
    return deleteProjectAndRedirect(projectId, clientId);
}
