"use client";

import { useEffect, useState } from "react";
import { startRegistration, type PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { register, registerOptions } from "@/app/login/actions";

export function PasskeyRegister() {
  const [options, setOptions] = useState<PublicKeyCredentialCreationOptionsJSON | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    registerOptions().then(setOptions, () => setError("Kunne ikke starte oprettelsen. Genindlæs siden."));
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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(line!);
      setCopied(true);
      setError(null);
    } catch {
      setError("Kunne ikke kopiere. Markér teksten og kopiér den selv.");
    }
  }

  if (line) {
    return (
      <>
        <p>
          Passkey oprettet. Id’et starter med <strong>{line.slice(0, 8)}</strong>.
        </p>
        <p className="muted">
          Tilføj linjen til <code>PASSKEYS</code> i Vercel og redeploy. Har du flere passkeys, adskilles de med komma.
        </p>
        <textarea readOnly rows={4} value={line} onFocus={(e) => e.target.select()} />
        <button type="button" onClick={handleCopy} className={copied ? "saved" : undefined}>
          {copied ? "Kopieret ✓" : "Kopiér"}
        </button>
        {error && <p className="error">{error}</p>}
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={!options}>
        {options ? "Opret passkey" : "Vent…"}
      </button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
