// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { verifySignedToken } from "@/lib/session"; // <- your working helper

// paths we allow without auth
const PUBLIC_PATHS = ["/login", "/_next", "/favicon.ico", "/assets", "/public"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // allow public assets and /login
    const isPublic =
        PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
        pathname.startsWith("/api/answers"); // allow autosave endpoint

    if (isPublic) return NextResponse.next();

    // check the session cookie
    const token = req.cookies.get("uc_session")?.value ?? "";
    const { valid } = await verifySignedToken(token);

    if (!valid) {
        const url = new URL("/login", req.url);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// apply to everything except static files via the regex
export const config = {
    matcher: ["/((?!_next|favicon.ico|assets|public).*)"],
};
