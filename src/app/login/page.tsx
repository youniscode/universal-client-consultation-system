// src/app/login/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed, signInWithPassphrase, signOut } from "@/lib/auth";
import { FlashToastOnLoad } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function firstOf(sp: SearchParams | undefined, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v ?? undefined;
}

/** Server action: handle submit */
async function doLogin(formData: FormData) {
  "use server";
  const pass = String(formData.get("pass") ?? "");
  const ok = await signInWithPassphrase(pass);
  if (!ok) {
    return redirect("/login?error=invalid");
  }
  return redirect("/clients");
}

/** Optional: /login?logout=1 → clear cookie then show message */
async function doLogout() {
  "use server";
  await signOut();
  return redirect("/login?loggedout=1");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  if (await isAuthed()) {
    redirect("/clients");
  }

  const err = firstOf(searchParams, "error");
  const loggedout = firstOf(searchParams, "loggedout");
  const toastMessage =
    err === "invalid"
      ? "Invalid passphrase."
      : loggedout
      ? "Signed out."
      : undefined;

  return (
    <main className="min-h-[75vh] grid place-items-center p-6">
      {/* one-shot toast if redirected with ?loggedout=1 or ?error=... */}
      <FlashToastOnLoad
        message={toastMessage}
        variant={err ? "error" : "success"}
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
              className="input mt-1 w-full"
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="btn btn-primary w-full">
            Sign in
          </button>
        </form>

        <div className="mt-3 text-[12px] text-ink-600">
          Access is restricted. Contact the owner if you need an account.
        </div>

        <div className="mt-2 text-right">
          <Link
            href="/clients"
            className="text-sm text-blue-600 hover:underline"
          >
            Clients →
          </Link>
        </div>

        {/* Hidden form to support /login?logout=1 links in the future if needed */}
        <form action={doLogout} />
      </div>
    </main>
  );
}
