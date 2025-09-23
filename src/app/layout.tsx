// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/ui/AppShell";
import Toaster from "@/components/ui/toast";
import FlashToast from "@/components/ui/FlashToast";

export const metadata: Metadata = {
  title: "UCCS",
  description: "Universal Client Consultation System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ink-50/60 text-ink-900 antialiased">
        <AppShell>{children}</AppShell>
        {/* Global toast layers */}
        <Toaster /> {/* floating bottom-right toasts (via window event) */}
        <FlashToast /> {/* top banner when ?toast=... is in the URL */}
      </body>
    </html>
  );
}
