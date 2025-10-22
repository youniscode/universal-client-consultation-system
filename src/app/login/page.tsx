// src/app/login/page.tsx
import { FlashToastOnLoad } from "@/components/ui/toast";
import { loginAction } from "@/actions/auth";

type SearchParams = Record<string, string | string[] | undefined>;

/** Normalize Next’s searchParams (can be an object or a Promise on some hosts) */
async function normalizeSearchParams(input: unknown): Promise<SearchParams> {
  if (input instanceof Promise) {
    const resolved = await input;
    return (resolved ?? {}) as SearchParams;
  }
  if (typeof input === "object" && input !== null) {
    return input as SearchParams;
  }
  return {};
}

export const dynamic = "force-dynamic";

export default async function LoginPage({
  // keep this loose; we’ll normalize it
  searchParams,
}: {
  searchParams?: unknown;
}) {
  const sp = await normalizeSearchParams(searchParams);

  // read query flags for toast
  const loggedOut = Array.isArray(sp.loggedout)
    ? sp.loggedout[0]
    : sp.loggedout;
  const err = Array.isArray(sp.err) ? sp.err[0] : sp.err;

  const toastMessage = loggedOut
    ? "Signed out successfully."
    : err === "1"
    ? "Invalid passphrase."
    : null;
  const toastVariant = loggedOut ? "success" : err === "1" ? "error" : "info";

  return (
    <main className="min-h-dvh grid place-items-center bg-ink-50/40">
      {/* one-shot toast if redirected with ?loggedout=1 or ?err=1 */}
      <FlashToastOnLoad
        message={toastMessage ?? undefined}
        variant={toastVariant}
      />

      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-ink-600">
          Enter your passphrase to access the console.
        </p>

        <form action={loginAction} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="passphrase" className="block text-sm font-medium">
              Passphrase
            </label>
            <input
              id="passphrase"
              name="passphrase"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            Sign in
          </button>
        </form>

        <p className="mt-3 text-[12px] text-ink-500">
          Access is restricted. Contact the owner if you need an account.
        </p>
      </div>
    </main>
  );
}
