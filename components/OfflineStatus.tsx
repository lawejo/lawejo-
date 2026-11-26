"use client";

import { useEffect } from "react";
import { useOffline } from "next/offline";

// Registrerer service workeren og viser en linje, når der ikke er net.
// Check-ins, der laves offline, venter og sendes, når nettet er tilbage.
export function OfflineStatus() {
  const offline = useOffline();

  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js", { updateViaCache: "none" });
  }, []);

  if (!offline) return null;
  return (
    <p className="offline" role="status">
      Offline · viser senest hentede data. Det, du registrerer, gemmes, når du er online igen.
    </p>
  );
}
