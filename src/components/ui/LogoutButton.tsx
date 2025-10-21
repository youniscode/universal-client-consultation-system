// src/components/ui/LogoutButton.tsx
import { logoutAction } from "@/actions/auth";

export default function LogoutButton({
  label = "Log out",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ||
          "inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-ink-50"
        }
      >
        {label}
      </button>
    </form>
  );
}
