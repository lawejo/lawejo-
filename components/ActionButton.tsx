"use client";

import { useState, useTransition, type ReactNode } from "react";

type Props = { action: () => Promise<void>; children: ReactNode; className?: string; disabled?: boolean };

// En knap, der kalder en server action og viser "…" imens.
// Fejler det, bliver knappen rød i stedet for at hele siden skifter til fejlsiden.
export function ActionButton({ action, children, className, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      try {
        await action();
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      className={[className, failed && "failed"].filter(Boolean).join(" ")}
      title={failed ? "Kunne ikke gemme. Prøv igen." : undefined}
    >
      {pending ? "…" : failed ? "Prøv igen" : children}
    </button>
  );
}
