"use client";

import Button from "@/components/ui/button";
import { deleteProjectAndRedirect } from "@/actions/projects";

type Props = {
  projectId: string;
  clientId: string;
  className?: string;
  name?: string;
};

/** Client-side wrapper so we can confirm() before calling the server action. */
export default function DeleteProject({
  projectId,
  clientId,
  className = "",
  name = "",
}: Props) {
  return (
    <form
      action={deleteProjectAndRedirect.bind(null, projectId, clientId)}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete this project${
              name ? ` “${name}”` : ""
            } and all of its related data? This cannot be undone.`
          )
        ) {
          e.preventDefault();
        }
      }}
      className={className}
    >
      <Button type="submit" variant="destructive" size="sm">
        Delete
      </Button>
    </form>
  );
}
