"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

// Viser "Gemmer…" mens der gemmes, og folder kortet sammen bagefter.
// Det opdaterede status-badge i kortets overskrift er så bekræftelsen.
export function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending) {
      ref.current?.closest("details")?.removeAttribute("open");
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <button ref={ref} type="submit" disabled={pending}>
      {pending ? "Gemmer…" : label}
    </button>
  );
}
