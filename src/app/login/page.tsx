// src/app/login/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySignedToken } from "@/lib/session";
import { loginAction, logoutAction } from "@/actions/auth";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

/** pick the first string if it's an array; otherwise the string; or a fallback. */
function firstOf(
  v: string | string[] | undefined | null,
  fallback: string | null = null
): string | null {
  if (Array.isArray(v)) return v[0] ?? fallback;
  return (v ?? fallback) as string | null;
}

/** Narrower, type-safe Promise detector (no `any`). */
function isPromise<T>(val: unknown): val is Promise<T> {
  if (typeof val !== "object" || val === null) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybe = val as { then?: unknown };
  return typeof maybe.then === "function";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  // works whether Next gives us a plain object or a promise
  const sp: SearchParams = isPromise<SearchParams>(searchParams)
    ? await searchParams
    : searchParams ?? {};

  const err = firstOf(sp.error); // "invalid" | "server-config" | null
  const loggedOut = firstOf(sp.loggedout); // "1" | null

  // If already logged in, send to /clients
  const jar = await cookies();
  const token = jar.get("uc_session")?.value ?? "";
  if (token && (await verifySignedToken(token)).valid) {
    redirect("/clients");
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-xs text-ink-600/80">Private access only.</p>

        {err === "invalid" && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Invalid credentials.
          </div>
        )}

        {err === "server-config" && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Server is missing <strong>ADMIN_EMAIL</strong> /{" "}
            <strong>ADMIN_PASSWORD</strong> / <strong>AUTH_SECRET</strong>.
          </div>
        )}

        {loggedOut && (
          <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            You’ve been signed out.
          </div>
        )}

        <form action={loginAction} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label htmlFor="email" className="ui-label">
              Email
            </label>
            <input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="ui-label">
              Password
            </label>
            <input id="password" name="password" type="password" required />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
          >
            Sign in
          </button>
        </form>

        <form action={logoutAction} className="mt-4">
          <button type="submit" className="text-xs text-ink-500 underline">
            Sign out (clear cookie)
          </button>
        </form>
      </div>
    </main>
  );
}
