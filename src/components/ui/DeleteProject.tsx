"use client";

import Button from "@/components/ui/button";
import { deleteProjectAndRedirect } from "@/actions/projects";

export default function DeleteProject({
  projectId,
  clientId,
  name,
}: {
  projectId: string;
  clientId: string;
  name: string;
}) {
  return (
    <form
      action={deleteProjectAndRedirect}
      onSubmit={(e) => {
        if (!confirm(`Delete project “${name}”? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="clientId" value={clientId} />
      <Button type="submit" variant="destructive" size="sm">
        Delete project
      </Button>
    </form>
  );
}
