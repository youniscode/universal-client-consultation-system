// scripts/predev.mjs
import kill from 'kill-port';
import { rm } from 'fs/promises';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

async function safeRm(path) {
    try {
        await rm(path, { recursive: true, force: true });
    } catch {
        // ignore
    }
}

async function main() {
    // Free the dev port if something is stuck
    try {
        await kill(port);
    } catch {
        // no process on that port — ignore
    }

    // Clear Next/Turbo cache which can be locked by OneDrive
    await Promise.all([safeRm('.next'), safeRm('.turbo')]);

    console.log(`[predev] Freed port ${port} and cleaned caches.`);
}

main();
