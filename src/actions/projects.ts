// src/actions/projects.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
    ProjectType,
    ComplexityLevel,
    BudgetRange,
    Timeline,
    ProjectStatus,
    Prisma,
} from "@prisma/client";

/* ──────────────────────────────────────────────────────────
   Schemas
────────────────────────────────────────────────────────── */
const createProjectSchema = z.object({
    clientId: z.string().min(1),
    name: z.string().min(2, "Project name is too short"),
    projectType: z.nativeEnum(ProjectType),
    complexity: z.nativeEnum(ComplexityLevel).optional(),
    budget: z.nativeEnum(BudgetRange).optional(),
    timeline: z.nativeEnum(Timeline).optional(),
});

const updateProjectSchema = z.object({
    projectId: z.string().min(1),
    clientId: z.string().min(1),
    name: z.string().min(2).optional(),
    projectType: z.nativeEnum(ProjectType).optional(),
    complexity: z.nativeEnum(ComplexityLevel).optional(),
    budget: z.nativeEnum(BudgetRange).optional(),
    timeline: z.nativeEnum(Timeline).optional(),
});

const deleteProjectSchema = z.object({
    projectId: z.string().min(1),
    clientId: z.string().min(1),
});

/* ──────────────────────────────────────────────────────────
   Create
────────────────────────────────────────────────────────── */
export async function createProject(formData: FormData): Promise<void> {
    const raw = {
        clientId: String(formData.get("clientId") ?? ""),
        name: String(formData.get("name") ?? ""),
        projectType: String(formData.get("projectType") ?? ProjectType.WEBSITE) as ProjectType,
        complexity: (formData.get("complexity") ? String(formData.get("complexity")) : undefined) as
            | ComplexityLevel
            | undefined,
        budget: (formData.get("budget") ? String(formData.get("budget")) : undefined) as
            | BudgetRange
            | undefined,
        timeline: (formData.get("timeline") ? String(formData.get("timeline")) : undefined) as
            | Timeline
            | undefined,
    };

    const parsed = createProjectSchema.safeParse(raw);
    if (!parsed.success) {
        console.error(parsed.error.flatten().fieldErrors);
        return;
    }

    await prisma.project.create({
        data: {
            clientId: parsed.data.clientId,
            name: parsed.data.name,
            projectType: parsed.data.projectType,
            complexity: parsed.data.complexity ?? undefined,
            budget: parsed.data.budget ?? undefined,
            timeline: parsed.data.timeline ?? undefined,
            status: ProjectStatus.DRAFT,
        },
    });

    // Redirect so the layout/page can read ?toast=...
    redirect(`/clients/${parsed.data.clientId}?toast=project_created`);
}

/* ──────────────────────────────────────────────────────────
   Submit / Reopen (status gate)
────────────────────────────────────────────────────────── */
export async function markIntakeSubmitted(projectId: string, clientId: string): Promise<void> {
    await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.SUBMITTED },
    });

    redirect(`/clients/${clientId}?toast=submitted`);
}

export async function reopenIntake(projectId: string, clientId: string): Promise<void> {
    await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.DRAFT },
    });

    redirect(`/clients/${clientId}?toast=reopened`);
}

/* ──────────────────────────────────────────────────────────
   Update (name/type/enums)
────────────────────────────────────────────────────────── */
export async function updateProject(formData: FormData): Promise<void> {
    const raw = {
        projectId: String(formData.get("projectId") ?? ""),
        clientId: String(formData.get("clientId") ?? ""),
        name: (formData.get("name") ? String(formData.get("name")) : undefined) as string | undefined,
        projectType: (formData.get("projectType")
            ? (String(formData.get("projectType")) as ProjectType)
            : undefined) as ProjectType | undefined,
        complexity: (formData.get("complexity")
            ? (String(formData.get("complexity")) as ComplexityLevel)
            : undefined) as ComplexityLevel | undefined,
        budget: (formData.get("budget")
            ? (String(formData.get("budget")) as BudgetRange)
            : undefined) as BudgetRange | undefined,
        timeline: (formData.get("timeline")
            ? (String(formData.get("timeline")) as Timeline)
            : undefined) as Timeline | undefined,
    };

    const parsed = updateProjectSchema.safeParse(raw);
    if (!parsed.success) {
        console.error(parsed.error.flatten().fieldErrors);
        return;
    }

    const proj = await prisma.project.findUnique({
        where: { id: parsed.data.projectId },
        select: { id: true, status: true },
    });
    if (!proj) return;

    const data: Prisma.ProjectUpdateInput = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.projectType !== undefined) data.projectType = { set: parsed.data.projectType };
    if (parsed.data.complexity !== undefined) data.complexity = { set: parsed.data.complexity };
    if (parsed.data.budget !== undefined) data.budget = { set: parsed.data.budget };
    if (parsed.data.timeline !== undefined) data.timeline = { set: parsed.data.timeline };

    await prisma.project.update({
        where: { id: parsed.data.projectId },
        data,
    });

    revalidatePath(`/clients/${parsed.data.clientId}`);
}

/* ──────────────────────────────────────────────────────────
   Delete (only when DRAFT) — non-redirecting utility
────────────────────────────────────────────────────────── */
export async function deleteProject(formData: FormData): Promise<void> {
    const raw = {
        projectId: String(formData.get("projectId") ?? ""),
        clientId: String(formData.get("clientId") ?? ""),
    };

    const parsed = deleteProjectSchema.safeParse(raw);
    if (!parsed.success) {
        console.error(parsed.error.flatten().fieldErrors);
        return;
    }

    const proj = await prisma.project.findUnique({
        where: { id: parsed.data.projectId },
        select: { id: true, status: true },
    });
    if (!proj) return;

    if (proj.status !== ProjectStatus.DRAFT) {
        console.warn("Delete refused: project not in DRAFT.");
        return;
    }

    await prisma.$transaction([
        prisma.answer.deleteMany({ where: { projectId: parsed.data.projectId } }),
        prisma.proposal.deleteMany({ where: { projectId: parsed.data.projectId } }),
        prisma.project.delete({ where: { id: parsed.data.projectId } }),
    ]);

    revalidatePath(`/clients/${parsed.data.clientId}`);
}

/* ──────────────────────────────────────────────────────────
   Redirecting actions (for forms that should land back on client)
────────────────────────────────────────────────────────── */
export async function submitProjectAndRedirect(projectId: string, clientId: string) {
    await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.SUBMITTED },
    });
    redirect(`/clients/${clientId}?toast=submitted`);
}

export async function reopenProjectAndRedirect(projectId: string, clientId: string) {
    await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.DRAFT },
    });
    redirect(`/clients/${clientId}?toast=reopened`);
}

export async function deleteProjectAndRedirect(formData: FormData) {
    const projectId = String(formData.get("projectId") ?? "");
    const clientId = String(formData.get("clientId") ?? "");
    if (!projectId || !clientId) redirect("/clients");

    const proj = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, status: true },
    });
    if (!proj) redirect(`/clients/${clientId}`);

    if (proj.status !== ProjectStatus.DRAFT) {
        redirect(`/clients/${clientId}`);
    }

    await prisma.$transaction([
        prisma.answer.deleteMany({ where: { projectId } }),
        prisma.proposal.deleteMany({ where: { projectId } }),
        prisma.project.delete({ where: { id: projectId } }),
    ]);

    redirect(`/clients/${clientId}?toast=deleted`);
}
