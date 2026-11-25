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
    loginOptions().then(setOptions);
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
    } catch {
      setError("Login blev afbrudt.");
    }
    setOptions(await loginOptions());
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={!options}>
        Log ind med passkey
      </button>
      {error && <p className="muted">{error}</p>}
    </>
  );
}
