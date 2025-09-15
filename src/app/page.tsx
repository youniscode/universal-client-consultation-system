// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container max-w-5xl p-8">
      <h1 className="text-3xl font-semibold">
        Universal Client Consultation System
      </h1>
      <p className="mt-2 text-ink-600">
        Welcome back. Jump to your clients to create a project and fill the
        intake.
      </p>

      <div className="mt-6">
        <Link
          href="/clients"
          className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          Open Clients →
        </Link>
      </div>
    </main>
  );
}
