"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";

type Props = { action: (formData: FormData) => Promise<void>; label: string; children: ReactNode };

// Viser "Gemmer…" og så "Gemt ✓", og folder derefter kortet sammen.
// Fejler det (ingen forbindelse, udløbet login eller en ny deploy), forbliver kortet åbent
// med det, du har skrevet, og der kommer en fejlbesked ved knappen.
export function ActionForm({ action, label, children }: Props) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(async () => {
      try {
        await action(new FormData(form));
        setStatus("saved");
        form.reset();
        setTimeout(() => {
          form.closest("details")?.removeAttribute("open");
          setStatus("idle");
        }, 1200);
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {children}
      <button type="submit" disabled={pending} className={status === "saved" ? "saved" : undefined}>
        {pending ? "Gemmer…" : status === "saved" ? "Gemt ✓" : label}
      </button>
      {status === "error" && (
        <p className="error full">Kunne ikke gemme. Prøv igen, eller genindlæs siden.</p>
      )}
    </form>
  );
}
