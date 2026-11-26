"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  startAuthentication,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { loginOptions } from "@/app/login/actions";

type Props = {
  action: (response: AuthenticationResponseJSON) => Promise<string | null>;
  label: string;
  redirectTo?: string; // ellers genindlæses siden
  className?: string;
};

// Beder om passkey (Face ID) og sender svaret til `action`, fx login eller oplåsning af private vaner.
// Options hentes på forhånd, så Face ID starter direkte i klikket. Safari kræver det.
export function PasskeyButton({ action, label, redirectTo, className }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<PublicKeyCredentialRequestOptionsJSON | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loginOptions().then(setOptions, () => setError("Kunne ikke starte login. Genindlæs siden."));
  }, []);

  async function handleClick() {
    if (!options) return;
    setOptions(null);
    setError(null);
    try {
      const response = await startAuthentication({ optionsJSON: options });
      const actionError = await action(response);
      if (!actionError) return redirectTo ? router.push(redirectTo) : router.refresh();
      setError(actionError);
    } catch (error) {
      setError(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Annulleret, eller der er ingen passkey til denne adresse."
          : "Kunne ikke kontakte serveren. Genindlæs siden.",
      );
    }
    loginOptions().then(setOptions, () => setError("Kunne ikke kontakte serveren. Genindlæs siden."));
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={!options} className={className}>
        {options ? label : "Vent…"}
      </button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
