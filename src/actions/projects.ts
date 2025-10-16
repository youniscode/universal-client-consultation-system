// src/actions/projects.ts
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
    Prisma,
    ProjectStatus,
    ProjectType,
    ComplexityLevel,
    BudgetRange,
    Timeline,
} from "@prisma/client";

/** helper: convert nullish → undefined so optional (non-nullable) prisma fields are happy */
const toUndef = <T,>(v: T | null | undefined): T | undefined =>
    v == null ? undefined : v;

/* ------------------------------ validation ------------------------------ */

const createSchema = z.object({
    clientId: z.string().min(1),
    name: z.string().min(2, "Project name is required."),
    projectType: z.nativeEnum(ProjectType).default(ProjectType.WEBSITE),
    // allow the form to send nothing/null, but we'll omit them for Prisma if nullish
    complexity: z.nativeEnum(ComplexityLevel).optional().nullable(),
    budget: z.nativeEnum(BudgetRange).optional().nullable(),
    timeline: z.nativeEnum(Timeline).optional().nullable(),
});

const updateSchema = z.object({
    projectId: z.string().min(1),
    clientId: z.string().min(1),
    name: z.string().optional(),
    projectType: z.nativeEnum(ProjectType).optional(),
    complexity: z.nativeEnum(ComplexityLevel).optional().nullable(),
    budget: z.nativeEnum(BudgetRange).optional().nullable(),
    timeline: z.nativeEnum(Timeline).optional().nullable(),
});

/* --------------------------------- create -------------------------------- */

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
                // If your schema makes these optional (non-nullable), omit when nullish:
                complexity: toUndef(d.complexity),
                budget: toUndef(d.budget),
                timeline: toUndef(d.timeline),
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

/* --------------------------------- update -------------------------------- */

export async function updateProject(formData: FormData) {
    const raw = {
        projectId: String(formData.get("projectId") ?? ""),
        clientId: String(formData.get("clientId") ?? ""),
        name: (formData.get("name") as string) ?? undefined,
        projectType: (formData.get("projectType") as string) ?? undefined,
        complexity: ((formData.get("complexity") as string) || null) as
            | ComplexityLevel
            | null
            | undefined,
        budget: ((formData.get("budget") as string) || null) as
            | BudgetRange
            | null
            | undefined,
        timeline: ((formData.get("timeline") as string) || null) as
            | Timeline
            | null
            | undefined,
    };

    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
        console.error("[updateProject] invalid payload:", parsed.error.flatten());
        return redirect(`/clients/${raw.clientId}?toast=action+failed`);
    }

    const { projectId, clientId, ...rest } = parsed.data;

    // Build only defined keys; convert null → undefined for optional fields
    const data: Prisma.ProjectUpdateInput = {};
    if (rest.name !== undefined) data.name = rest.name;
    if (rest.projectType !== undefined) data.projectType = rest.projectType;
    if (rest.complexity !== undefined) {
        const v = toUndef(rest.complexity);
        if (v !== undefined) data.complexity = v;
    }
    if (rest.budget !== undefined) {
        const v = toUndef(rest.budget);
        if (v !== undefined) data.budget = v;
    }
    if (rest.timeline !== undefined) {
        const v = toUndef(rest.timeline);
        if (v !== undefined) data.timeline = v;
    }

    try {
        await prisma.project.update({
            where: { id: projectId },
            data,
        });
    } catch (err) {
        console.error("[updateProject] prisma update failed:", err);
        return redirect(`/clients/${clientId}?toast=action+failed`);
    }

    revalidatePath(`/clients/${clientId}`);
    return redirect(`/clients/${clientId}?toast=project+updated`);
}

/* --------------------------- status + redirect --------------------------- */

export async function submitProjectAndRedirect(projectId: string, clientId: string) {
    try {
        await prisma.project.update({
            where: { id: projectId },
            data: { status: ProjectStatus.SUBMITTED },
        });
    } catch (err) {
        console.error("[submitProjectAndRedirect] failed:", err);
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
        console.error("[reopenProjectAndRedirect] failed:", err);
        return redirect(`/clients/${clientId}?toast=action+failed`);
    }
    revalidatePath(`/clients/${clientId}`);
    return redirect(`/clients/${clientId}?toast=reopened`);
}

/* --------------------------------- delete -------------------------------- */

export async function deleteProjectAndRedirect(projectId: string, clientId: string) {
    try {
        // If you have dependent rows (answers, etc.), delete them here first.
        await prisma.project.delete({ where: { id: projectId } });
    } catch (err) {
        console.error("[deleteProjectAndRedirect] failed:", err);
        return redirect(`/clients/${clientId}?toast=action+failed`);
    }
    revalidatePath(`/clients/${clientId}`);
    return redirect(`/clients/${clientId}?toast=deleted`);
}