// src/components/ui/DeleteProject.tsx
"use client";

import * as React from "react";
import Button from "@/components/ui/button";

type Props = {
  projectId: string;
  clientId: string;
  name?: string;
  className?: string;
  /** Server Action passed from the server page (receives FormData) */
  action: (formData: FormData) => Promise<void>;
};

export default function DeleteProject({
  projectId,
  clientId,
  name,
  className = "",
  action,
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete the project "${
              name ?? "Untitled"
            }" and all its related data? This cannot be undone.`
          )
        ) {
          e.preventDefault();
        }
      }}
      className={className}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="clientId" value={clientId} />
      <Button type="submit" size="sm" variant="destructive">
        Delete
      </Button>
    </form>
  );
}
