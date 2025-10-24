// src/components/ui/AuthControls.tsx
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { isAuthed } from "@/lib/auth";

export default async function AuthControls() {
  const authed = await isAuthed();

  return (
    <nav className="flex items-center gap-2">
      <Link href="/clients" className="btn">
        Clients →
      </Link>
      {authed ? <LogoutButton /> : null}
    </nav>
  );
}
