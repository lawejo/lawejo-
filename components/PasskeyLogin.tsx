"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication, type PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { login, loginOptions } from "@/app/login/actions";

// Options hentes på forhånd, så Face ID starter direkte i klikket. Safari kræver det.
export function PasskeyLogin() {
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
      const loginError = await login(response);
      if (!loginError) return router.push("/");
      setError(loginError);
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
      <button type="button" onClick={handleClick} disabled={!options}>
        {options ? "Log ind med passkey" : "Vent…"}
      </button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
