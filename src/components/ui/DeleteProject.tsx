"use client";

import Button from "@/components/ui/button";
import { deleteProject } from "@/actions/projects";

type Props = {
  projectId: string;
  clientId: string;
};

export default function DeleteProject({ projectId, clientId }: Props) {
  return (
    <form
      action={deleteProject}
      onSubmit={(e) => {
        if (!confirm("Delete this project? This cannot be undone.")) {
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
