// src/components/ui/AutosaveForm.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  projectId: string;
  children: React.ReactNode;
};

export default function AutosaveForm({ projectId, children }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Build a unique list of all input names that start with "q_"
  const collectQuestionNames = (form: HTMLFormElement): string[] => {
    const els = Array.from(
      form.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("[name^='q_']")
    );
    return Array.from(new Set(els.map((el) => el.name))).sort();
  };

  const save = useCallback(async () => {
    if (!formRef.current) return;
    const form = formRef.current;

    setStatus("saving");

    // Build fresh FormData from the form
    const fd = new FormData(form);

    // Ensure required hidden fields are present & correct
    fd.set("projectId", projectId);

    // Freshly compute the full list of field names to save
    const names = collectQuestionNames(form);
    fd.set("__allNames", names.join(" "));

    const res = await fetch("/api/answers/bulk", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      setStatus("idle");
      throw new Error(`HTTP ${res.status}`);
    }

    setStatus("saved");
    setTimeout(() => setStatus("idle"), 800);
  }, [projectId]);

  // Save on change/blur/typing (debounced a bit)
  useEffect(() => {
    if (!formRef.current) return;
    const form = formRef.current;

    let t: number | undefined;

    const queueSave = () => {
      if (t) window.clearTimeout(t);
      // small debounce to batch quick edits
      t = window.setTimeout(() => {
        save().catch(console.error);
      }, 250);
    };

    const onChange = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLSelectElement ||
          target instanceof HTMLTextAreaElement
        )
      )
        return;
      // Only care about our questionnaire fields
      if (!target.name?.startsWith("q_")) return;
      queueSave();
    };

    form.addEventListener("change", onChange, true);
    form.addEventListener("input", onChange, true);
    form.addEventListener("blur", onChange, true);

    return () => {
      if (t) window.clearTimeout(t);
      form.removeEventListener("change", onChange, true);
      form.removeEventListener("input", onChange, true);
      form.removeEventListener("blur", onChange, true);
    };
  }, [save]);

  return (
    <div className="relative">
      <form ref={formRef}>
        {/* These can be present or not; we'll overwrite their values in save() anyway */}
        <input type="hidden" name="projectId" defaultValue={projectId} />
        <input type="hidden" name="__allNames" defaultValue="" />
        {children}
      </form>

      <div className="absolute right-0 -top-8 text-xs opacity-60">
        {status === "saving" && "Saving…"}
        {status === "saved" && "Saved!"}
      </div>
    </div>
  );
}
