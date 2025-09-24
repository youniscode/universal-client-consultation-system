// src/app/page.tsx  (Server Component)
import Link from "next/link";
import { FlashToastOnLoad } from "@/components/ui/toast";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const code = Array.isArray(sp.toast) ? sp.toast[0] : sp.toast;

  const message =
    code === "created"
      ? "Client created."
      : code === "deleted"
      ? "Client deleted."
      : code === "project_created"
      ? "Project created."
      : code === "submitted"
      ? "Intake marked as submitted."
      : code === "reopened"
      ? "Intake reopened (back to Draft)."
      : undefined;

  return (
    <main className="p-8 space-y-6">
      <FlashToastOnLoad message={message} />
      <h1 className="text-3xl font-semibold">
        Universal Client Consultation System
      </h1>
      <p>
        Welcome back. Jump to your clients to create a project and fill the
        intake.
      </p>
      <Link href="/clients" className="btn">
        Open Clients →
      </Link>
    </main>
  );
}
