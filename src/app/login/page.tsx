// src/app/login/page.tsx
import Link from "next/link";
import { doLogin } from "./actions";
import FlashToastOnLoad from "@/components/ui/toast";
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

/** Promise type guard without using `any` */
function isPromise<T>(v: unknown): v is Promise<T> {
  return (
    typeof v === "object" &&
    v !== null &&
    "then" in (v as Record<string, unknown>)
  );
}

/** Accepts plain or promised searchParams and returns a plain object. */
async function readSP(
  input?: SearchParams | Promise<SearchParams>
): Promise<SearchParams> {
  if (!input) return {};
  if (isPromise<SearchParams>(input)) {
    return await input;
  }
  return input;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const sp = await readSP(searchParams);

  const err = Array.isArray(sp.error) ? sp.error[0] : sp.error ?? null;
  const loggedout =
    (Array.isArray(sp.loggedout) ? sp.loggedout[0] : sp.loggedout) ?? null;

  const toastMessage =
    err === "invalid"
      ? "Invalid passphrase."
      : loggedout
      ? "Signed out successfully."
      : undefined;

  const toastVariant = err ? "error" : "success";

  return (
    <main className="min-h-[70vh] grid place-items-center p-6">
      {/* one-shot toast if redirected with ?loggedout=1 or ?error=... */}
      <FlashToastOnLoad
        message={toastMessage ?? undefined}
        variant={toastVariant as "error" | "success"}
      />

      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-ink-600">
          Enter your passphrase to access the console.
        </p>

        <form action={doLogin} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="font-medium">Passphrase</span>
            <input
              name="pass"
              type="password"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <button type="submit" className="btn btn-primary w-full">
            Sign in
          </button>
        </form>

        <p className="mt-3 text-[12px] text-ink-600">
          Access is restricted. Contact the owner if you need an account.
        </p>

        <div className="mt-2 text-right">
          <Link
            href="/clients"
            className="text-sm text-blue-600 hover:underline"
          >
            Clients →
          </Link>
        </div>
      </div>
    </main>
  );
}
