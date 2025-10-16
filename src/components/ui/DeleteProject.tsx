"use client";

import Button from "@/components/ui/button";
import { deleteProjectAction } from "@/actions/projects";

type Props = {
  projectId: string;
  clientId: string;
  name?: string;
  className?: string;
};

/**
 * Client-side wrapper so we can show confirm() before calling the server action.
 * Posts hidden fields (projectId, clientId) to deleteProjectAction which
 * redirects back to /clients/[id] with a toast (success/fail).
 */
export default function DeleteProject({
  projectId,
  clientId,
  name = "",
  className = "",
}: Props) {
  return (
    <form
      action={deleteProjectAction}
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
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="clientId" value={clientId} />
      <Button type="submit" variant="destructive" size="sm">
        Delete
      </Button>
    </form>
  );
}
