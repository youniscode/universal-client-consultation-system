// src/app/login/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { FlashToastOnLoad } from "@/components/ui/toast";
import { signInWithPassphrase } from "@/lib/auth";

export const dynamic = "force-dynamic";

// what Next can hand us
type SearchParams = Record<string, string | string[] | undefined>;

/** grab first string from "string | string[] | undefined" */
function firstOf(
  v: string | string[] | undefined,
  fb: string | null = null
): string | null {
  return Array.isArray(v) ? v[0] ?? fb : v ?? fb;
}

/** narrow "unknown promise-or-not" without using any */
function isPromise<T>(v: unknown): v is Promise<T> {
  return (
    typeof v === "object" &&
    v !== null &&
    "then" in (v as Record<string, unknown>)
  );
}

/** Accepts plain or promised searchParams and returns a plain object. */
async function readSearchParams(
  input?: SearchParams | Promise<SearchParams>
): Promise<SearchParams> {
  if (!input) return {};
  if (isPromise<SearchParams>(input)) {
    const resolved = await input;
    return resolved ?? {};
  }
  return input;
}

/** Server action: handle login submit */
export async function doLogin(formData: FormData) {
  "use server";
  const pass = String(formData.get("pass") ?? "").trim();
  const ok = await signInWithPassphrase(pass);
  if (!ok) {
    // bounce back to login with error flag
    return redirect("/login?error=invalid");
  }
  return redirect("/clients");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const sp = await readSearchParams(searchParams);

  // flags for one-shot toast (e.g. after logout redirect)
  const err = firstOf(sp.error);
  const loggedOut = firstOf(sp.loggedout);

  const toastMessage =
    err === "invalid"
      ? "Invalid passphrase."
      : loggedOut
      ? "Signed out successfully."
      : undefined;

  const toastVariant: "error" | "success" = err ? "error" : "success";

  return (
    <main className="min-h-[70vh] grid place-items-center p-6">
      {/* one-shot toast if redirected with ?loggedout=1 or ?error=... */}
      <FlashToastOnLoad
        message={toastMessage ?? undefined}
        variant={toastVariant}
      />

      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
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
              className="input mt-1 w-full rounded-md border px-3 py-2 text-sm"
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
