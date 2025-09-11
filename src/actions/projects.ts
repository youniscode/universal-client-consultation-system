// src/actions/projects.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { ProjectType, ComplexityLevel, BudgetRange, Timeline } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const createProjectSchema = z.object({
    clientId: z.string().min(1),
    name: z.string().min(2, 'Project name is too short'),
    projectType: z.nativeEnum(ProjectType),
    complexity: z.nativeEnum(ComplexityLevel).optional(),
    budget: z.nativeEnum(BudgetRange).optional(),
    timeline: z.nativeEnum(Timeline).optional(),
});

export async function createProject(formData: FormData): Promise<void> {
    const raw = {
        clientId: String(formData.get('clientId') ?? ''),
        name: String(formData.get('name') ?? ''),
        projectType: String(formData.get('projectType') ?? 'WEBSITE') as ProjectType,
        complexity: (formData.get('complexity') ? String(formData.get('complexity')) : undefined) as
            | ComplexityLevel
            | undefined,
        budget: (formData.get('budget') ? String(formData.get('budget')) : undefined) as
            | BudgetRange
            | undefined,
        timeline: (formData.get('timeline') ? String(formData.get('timeline')) : undefined) as
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
        },
    });

    revalidatePath(`/clients/${parsed.data.clientId}`);
}
