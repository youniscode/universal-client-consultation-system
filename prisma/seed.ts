// prisma/seed.ts
import { PrismaClient, Phase, QuestionType, ProjectType, ClientType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // A single user for now (we’ll replace with real auth later)
    const user = await prisma.user.upsert({
        where: { email: 'demo@uccs.local' },
        update: {},
        create: { email: 'demo@uccs.local', name: 'Demo User' }
    });

    const client = await prisma.client.create({
        data: {
            ownerId: user.id,
            name: 'Acme Retail',
            clientType: ClientType.SMALL_BUSINESS,
            industry: 'Retail',
            contactName: 'Jane Doe',
            contactEmail: 'jane@acme.com'
        }
    });

    const project = await prisma.project.create({
        data: {
            clientId: client.id,
            name: 'Acme E-commerce Launch',
            projectType: ProjectType.ECOMMERCE
        }
    });

    const questionnaire = await prisma.questionnaire.create({
        data: {
            name: 'Universal v1',
            version: 1,
            description: 'Core discovery across phases',
            questions: {
                create: [
                    {
                        phase: Phase.DISCOVERY,
                        order: 1,
                        questionText: "What problem does this project need to solve for your users?",
                        type: QuestionType.TEXTAREA
                    },
                    {
                        phase: Phase.DISCOVERY,
                        order: 2,
                        questionText: "Who is your target audience?",
                        type: QuestionType.TEXT
                    },
                    {
                        phase: Phase.FUNCTIONAL,
                        order: 3,
                        questionText: "What is the primary project type?",
                        type: QuestionType.DROPDOWN,
                        options: {
                            choices: ["WEBSITE", "ECOMMERCE", "WEB_APP"]
                        },
                        // Give the renderer a stable id to reference in showIf
                        // (We’ll map by text in MVP; later we’ll add explicit stable keys.)
                    },
                    {
                        phase: Phase.FUNCTIONAL,
                        order: 4,
                        questionText: "Which payment methods should be supported?",
                        type: QuestionType.CHECKBOX,
                        options: { choices: ["Card", "PayPal", "Apple Pay", "Google Pay", "Bank transfer"] },
                        showIf: {
                            any: [
                                { questionTextEquals: "What is the primary project type?", op: "equals", value: "ECOMMERCE" }
                            ]
                        }
                    },
                    {
                        phase: Phase.TECH,
                        order: 5,
                        questionText: "List any third-party tools or systems we must integrate (CRM, email, analytics, etc.)",
                        type: QuestionType.TEXTAREA
                    },
                    {
                        phase: Phase.DESIGN,
                        order: 6,
                        questionText: "Share 2–3 reference sites you like and why",
                        type: QuestionType.TEXTAREA
                    }
                ]
            }
        }
    });

    console.log({ user, client, project, questionnaire });
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
