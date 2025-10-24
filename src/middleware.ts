// src/middleware.ts
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { verifySignedToken } from "@/lib/session";

const SESSION_COOKIE = "uc_session";
const PUBLIC = ["/login", "/_next", "/favicon.ico", "/api"];

export async function middleware(req: NextRequest, _ev: NextFetchEvent) {
    const { pathname } = req.nextUrl;

    // allow public paths
    if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next();
    }

    const token = req.cookies.get(SESSION_COOKIE)?.value ?? "";
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    const { valid } = await verifySignedToken(token);
    if (!valid) return NextResponse.redirect(new URL("/login", req.url));

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|favicon.ico).*)"],
};
