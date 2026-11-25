"use client";

import { useEffect, useState } from "react";
import { startRegistration, type PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { register, registerOptions } from "@/app/login/actions";

export function PasskeyRegister() {
  const [options, setOptions] = useState<PublicKeyCredentialCreationOptionsJSON | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerOptions().then(setOptions);
  }, []);

  async function handleClick() {
    if (!options) return;
    setOptions(null);
    setError(null);
    try {
      const result = await register(await startRegistration({ optionsJSON: options }));
      if (result) return setLine(result);
      setError("Passkeyen kunne ikke bekræftes.");
    } catch {
      setError("Oprettelsen blev afbrudt, eller passkeyen findes allerede.");
    }
    setOptions(await registerOptions());
  }

  if (line) {
    return (
      <>
        <p>Tilføj linjen til <code>PASSKEYS</code> i Vercel og redeploy. Har du flere passkeys, adskilles de med komma.</p>
        <textarea readOnly rows={4} value={line} onFocus={(e) => e.target.select()} />
        <button type="button" onClick={() => navigator.clipboard.writeText(line)}>
          Kopiér
        </button>
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={!options}>
        Opret passkey
      </button>
      {error && <p className="muted">{error}</p>}
    </>
  );
}
