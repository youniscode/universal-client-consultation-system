// scripts/fix-status.ts
import { prisma } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";

async function main() {
    const res = await prisma.project.updateMany({
        where: { status: ProjectStatus.ACTIVE }, // legacy value
        data: { status: ProjectStatus.SUBMITTED },
    });

    console.log(`Updated ${res.count} projects from ACTIVE -> SUBMITTED`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
