// src/actions/clients.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { ClientType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// NOTE: do NOT export non-async values from a "use server" file.
const createClientSchema = z.object({
    name: z.string().min(2, 'Name is too short'),
    clientType: z.nativeEnum(ClientType),
    industry: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
});

// Demo owner for now (we seeded this user)
const DEMO_USER_EMAIL = 'demo@uccs.local';

export async function createClient(formData: FormData) {
    const data = {
        name: String(formData.get('name') ?? ''),
        clientType: String(formData.get('clientType') ?? 'SMALL_BUSINESS') as ClientType,
        industry: String(formData.get('industry') ?? ''),
        contactName: String(formData.get('contactName') ?? ''),
        contactEmail: String(formData.get('contactEmail') ?? ''),
    };

    const parsed = createClientSchema.safeParse(data);
    if (!parsed.success) {
        // For now just log; we’ll add UI messages later
        console.error(parsed.error.flatten().fieldErrors);
        return;
    }

    const owner = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
    if (!owner) {
        console.error('Seed user not found. Run `npm run db:seed`.');
        return;
    }

    await prisma.client.create({
        data: {
            ownerId: owner.id,
            name: parsed.data.name,
            clientType: parsed.data.clientType,
            industry: parsed.data.industry || null,
            contactName: parsed.data.contactName || null,
            contactEmail: parsed.data.contactEmail || null,
        },
    });

    // Refresh the /clients page after submission
    revalidatePath('/clients');
}
