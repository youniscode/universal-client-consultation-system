import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { isAuthed } from "@/lib/auth-server";

export default async function AuthControls() {
  const authed = await isAuthed();

  return (
    <nav className="flex items-center gap-3">
      <Link href="/clients" className="btn btn-ghost">
        Clients →
      </Link>
      {authed ? (
        <LogoutButton />
      ) : (
        <Link href="/login" className="btn">
          Login
        </Link>
      )}
    </nav>
  );
}
