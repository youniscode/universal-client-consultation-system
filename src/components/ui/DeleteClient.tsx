"use client";

import Button from "@/components/ui/button";
import { deleteClientAction } from "@/actions/clients";

type Props = {
  clientId: string;
  className?: string;
};

// Client-side wrapper so we can confirm() before calling the server action.
export default function DeleteClient({ clientId, className = "" }: Props) {
  return (
    <form
      action={deleteClientAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this client and all of its projects, answers, and proposals? This cannot be undone."
          )
        ) {
          e.preventDefault();
        }
      }}
      className={className}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <Button type="submit" variant="destructive" size="sm">
        Delete
      </Button>
    </form>
  );
}
