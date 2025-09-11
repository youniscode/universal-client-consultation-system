// prisma/seed.ts
/**
 * Seeds:
 * - Demo user
 * - Demo client + project
 * - “Universal v1” questionnaire with a rich question bank
 *
 * Run:  npm run db:seed
 */

import {
    PrismaClient,
    Phase,
    QuestionType,
    ClientType,
    ProjectType,
} from "@prisma/client";

const prisma = new PrismaClient();

/** Helper to add a question with optional options list (stored as JSON). */
const addQ = (
    questionnaireId: string,
    phase: Phase,
    order: number,
    questionText: string,
    type: QuestionType,
    options?: string[] | null
) =>
    prisma.question.create({
        data: {
            questionnaireId,
            phase,
            order,
            questionText,
            type,
            options: options ?? undefined,
        },
    });

async function main() {
    // 1) Demo user (safe to re-run)
    const user = await prisma.user.upsert({
        where: { email: "demo@uccs.local" },
        update: {},
        create: { email: "demo@uccs.local", name: "Demo User" },
    });

    // 2) Demo client (find or create)
    let client = await prisma.client.findFirst({
        where: { name: "Acme Retail", ownerId: user.id },
    });

    if (!client) {
        client = await prisma.client.create({
            data: {
                ownerId: user.id,
                name: "Acme Retail",
                clientType: ClientType.SMALL_BUSINESS,
                industry: "Retail",
                contactName: "Jane Doe",
                contactEmail: "jane@acme.com",
            },
        });
    }

    // 3) Demo project (find or create)
    let project = await prisma.project.findFirst({
        where: { clientId: client.id },
    });

    if (!project) {
        project = await prisma.project.create({
            data: {
                clientId: client.id,
                name: "Acme E-commerce Launch",
                projectType: ProjectType.ECOMMERCE, // <- enum from your schema
            },
        });
    }

    // 4) Questionnaire (find or create by name)
    let questionnaire = await prisma.questionnaire.findFirst({
        where: { name: "Universal v1" },
    });

    if (!questionnaire) {
        questionnaire = await prisma.questionnaire.create({
            data: {
                name: "Universal v1",
                version: 1,
                description: "Core discovery across phases with presets",
                isActive: true,
            },
        });
    } else {
        // keep it active if re-running the seed
        if (!questionnaire.isActive) {
            questionnaire = await prisma.questionnaire.update({
                where: { id: questionnaire.id },
                data: { isActive: true },
            });
        }
    }

    // Clear existing questions for this questionnaire so the list is idempotent.
    await prisma.question.deleteMany({ where: { questionnaireId: questionnaire.id } });

    // --- Phase 1: Discovery ---
    await addQ(
        questionnaire.id,
        Phase.DISCOVERY,
        1,
        "What problem does this project need to solve for your users?",
        QuestionType.TEXTAREA
    );
    await addQ(
        questionnaire.id,
        Phase.DISCOVERY,
        2,
        "Who is your target audience?",
        QuestionType.TEXT
    );
    await addQ(
        questionnaire.id,
        Phase.DISCOVERY,
        3,
        "Primary business goals",
        QuestionType.CHECKBOX,
        [
            "Generate leads",
            "Increase online sales",
            "Online bookings/appointments",
            "Build brand credibility",
            "Publish content regularly",
            "Self-serve support (FAQ/Help Center)",
            "Internal workflow/tooling",
            "Community/membership",
            "Other",
        ]
    );

    // --- Phase 2: Audience & UX ---
    await addQ(
        questionnaire.id,
        Phase.AUDIENCE,
        1,
        "Primary device usage",
        QuestionType.DROPDOWN,
        ["Mobile first", "Desktop focused", "Mixed usage"]
    );
    await addQ(
        questionnaire.id,
        Phase.AUDIENCE,
        2,
        "Key actions you want users to take",
        QuestionType.CHECKBOX,
        [
            "Contact via form",
            "Book a meeting",
            "Start free trial",
            "Request a quote",
            "Purchase",
            "Join newsletter",
            "Sign up / Create account",
            "Download asset",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.AUDIENCE,
        3,
        "Accessibility target",
        QuestionType.DROPDOWN,
        ["WCAG 2.1 A", "WCAG 2.1 AA", "WCAG 2.2 AA", "Best effort"]
    );

    // --- Phase 3: Functional Requirements ---
    await addQ(
        questionnaire.id,
        Phase.FUNCTIONAL,
        1,
        "What is the primary project type?",
        QuestionType.DROPDOWN,
        ["Website", "E-commerce", "Web application / SaaS", "Blog/Content", "Portfolio", "Landing page"]
    );
    await addQ(
        questionnaire.id,
        Phase.FUNCTIONAL,
        2,
        "Pages/sections needed",
        QuestionType.CHECKBOX,
        [
            "Home",
            "About",
            "Services",
            "Pricing",
            "Portfolio/Case studies",
            "Blog/Resources",
            "FAQ/Help Center",
            "Contact",
            "Careers",
            "Legal (Privacy / Terms)",
            "Docs/Knowledge base",
            "Status page",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.FUNCTIONAL,
        3,
        "Account & authentication",
        QuestionType.CHECKBOX,
        [
            "Guest (no account)",
            "Email/password",
            "Social login (Google/Apple/etc.)",
            "SSO (SAML/OIDC)",
            "2FA/MFA",
            "Role-based access (RBAC)",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.FUNCTIONAL,
        4,
        "Which payment methods should be supported?",
        QuestionType.CHECKBOX,
        [
            "Credit/Debit cards",
            "Apple Pay",
            "Google Pay",
            "PayPal",
            "Bank transfer",
            "Cash on delivery",
            "Buy Now Pay Later (Klarna/Affirm)",
            "Invoicing",
            "Multi-currency",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.FUNCTIONAL,
        5,
        "Shipping & fulfillment",
        QuestionType.CHECKBOX,
        [
            "Flat rate",
            "Real-time carrier rates",
            "Free shipping rules",
            "In-store pickup",
            "International zones",
            "Returns & RMA",
            "Label printing",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.FUNCTIONAL,
        6,
        "Content management needs",
        QuestionType.CHECKBOX,
        [
            "Client can edit all pages",
            "Blog publishing",
            "Media library",
            "Scheduling & drafts",
            "Custom content types",
            "Multi-language",
            "Other",
        ]
    );

    // --- Phase 4: Technical Requirements ---
    await addQ(
        questionnaire.id,
        Phase.TECH,
        1,
        "List any third-party tools or systems we must integrate (CRM, email, analytics, etc.)",
        QuestionType.TEXTAREA
    );
    await addQ(
        questionnaire.id,
        Phase.TECH,
        2,
        "Preferred integrations",
        QuestionType.CHECKBOX,
        [
            "CRM (HubSpot/Salesforce)",
            "Email marketing (Mailchimp/Brevo/Klaviyo)",
            "Analytics (GA4/Matomo)",
            "Chat/Support (Intercom/Drift/Zendesk)",
            "Payments (Stripe/Adyen)",
            "CMS (Headless/WordPress)",
            "LMS/LRS",
            "ERP/Inventory",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.TECH,
        3,
        "Performance targets",
        QuestionType.CHECKBOX,
        [
            "LCP < 2.5s",
            "CLS < 0.1",
            "TTFB < 0.5s",
            "Core Web Vitals green",
            "Image optimization & CDN",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.TECH,
        4,
        "Compliance & policies",
        QuestionType.CHECKBOX,
        [
            "GDPR / cookie consent",
            "CCPA",
            "PCI-DSS (payments)",
            "HIPAA (PHI)",
            "Data retention policy",
            "DPA (Data Processing Addendum)",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.TECH,
        5,
        "Operational requirements",
        QuestionType.CHECKBOX,
        [
            "Staging environment",
            "Uptime monitoring",
            "Error tracking",
            "Daily backups",
            "Audit logs",
            "SLA / Support plan",
            "Other",
        ]
    );

    // --- Phase 5: Design & UI ---
    await addQ(
        questionnaire.id,
        Phase.DESIGN,
        1,
        "Design tone/style",
        QuestionType.CHECKBOX,
        [
            "Minimal & modern",
            "Corporate & formal",
            "Friendly & playful",
            "Bold & expressive",
            "Editorial",
            "Dark mode",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.DESIGN,
        2,
        "Do you have brand assets?",
        QuestionType.DROPDOWN,
        ["Logo only", "Logo + colors", "Full brand guidelines", "No assets yet"]
    );

    // --- Phase 6: Content & SEO ---
    await addQ(
        questionnaire.id,
        Phase.CONTENT,
        1,
        "Content readiness",
        QuestionType.DROPDOWN,
        ["All content ready", "Some content ready", "Need help creating content"]
    );
    await addQ(
        questionnaire.id,
        Phase.CONTENT,
        2,
        "SEO priorities",
        QuestionType.CHECKBOX,
        [
            "Keyword strategy",
            "On-page SEO (titles/meta)",
            "Technical SEO (sitemap/robots/schema)",
            "Redirects/migrations",
            "Content plan",
            "Other",
        ]
    );

    // --- Phase 7: Stack & Hosting ---
    await addQ(
        questionnaire.id,
        Phase.STACK,
        1,
        "Preferred platform/stack (if any)",
        QuestionType.CHECKBOX,
        [
            "Next.js (recommended)",
            "React (SPA)",
            "WordPress",
            "Shopify",
            "Headless CMS",
            "No preference",
            "Other",
        ]
    );
    await addQ(
        questionnaire.id,
        Phase.STACK,
        2,
        "Hosting preference",
        QuestionType.DROPDOWN,
        ["Vercel (recommended)", "AWS", "Azure", "GCP", "Self-hosted", "No preference"]
    );

    console.log("\nSeed complete:");
    console.log({ user, client, project, questionnaire });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
