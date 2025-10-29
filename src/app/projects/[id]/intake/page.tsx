// src/app/login/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-server"; // uses your existing auth helper

export const dynamic = "force-dynamic";

// What we expect inside searchParams
type SearchParams = Record<string, string | string[] | undefined>;

/** Normalize Next’s searchParams (may be a Promise on some hosts). */
async function normalizeSearchParams(
  input?: Promise<SearchParams> | SearchParams
): Promise<SearchParams> {
  if (!input) return {};
  if (input instanceof Promise) {
    const resolved = await input;
    return (resolved ?? {}) as SearchParams;
  }
  return input as SearchParams;
}

// Server Action: handle submit
export async function doLogin(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Minimal guard
  if (!email || !password) {
    return redirect("/login?error=Missing+email+or+password");
  }

  // Your auth helper should set the session/cookie when successful
  const ok = await signIn({ email, password });
  if (!ok) {
    return redirect("/login?error=Invalid+credentials");
  }

  return redirect("/clients?toast=welcome");
}

export default async function LoginPage({
  searchParams,
}: {
  // IMPORTANT: Vercel’s typegen expects this to accept a Promise in some environments
  searchParams?: Promise<SearchParams>;
}) {
  const sp = await normalizeSearchParams(searchParams);
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  return (
    <main className="mx-auto max-w-md p-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-ink-600">
          Use your admin credentials to access UCCS.
        </p>

        {typeof error === "string" && error.length > 0 ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <form action={doLogin} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-800"
          >
            Sign in
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-ink-500">
          <Link href="/" className="underline underline-offset-4">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
