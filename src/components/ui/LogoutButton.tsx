// src/components/ui/LogoutButton.tsx
import { doLogout } from "@/actions";

export default function LogoutButton() {
  return (
    <form action={doLogout}>
      <button type="submit" className="btn btn-outline">
        Logout
      </button>
    </form>
  );
}
