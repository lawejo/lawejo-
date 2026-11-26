import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "lawejo_auth";
export const SESSION_DAYS = 30;

// Private vaner låses op med passkey igen og låses automatisk efter 15 minutter.
export const PRIVATE_COOKIE = "lawejo_private";
export const PRIVATE_SCOPE = "private.";
export const PRIVATE_MINUTES = 15;

// Login-cookien er "<udløbstid>.<signatur>", signeret med AUTH_SECRET.
// Den kan ikke forfalskes, og den holder op med at virke efter SESSION_DAYS.
// Skifter du AUTH_SECRET i Vercel, bliver alle eksisterende logins ugyldige.
function sign(value: string): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(value).digest("base64url");
}

// `scope` adskiller cookies med forskellige formål, så en login-cookie ikke kan
// bruges som private-cookie og omvendt.
export function createSession(lifetimeMs = SESSION_DAYS * 24 * 60 * 60 * 1000, scope = ""): string | null {
  const expires = String(Date.now() + lifetimeMs);
  const signature = sign(scope + expires);
  return signature && `${expires}.${signature}`;
}

export function isValidSession(value: string | undefined, scope = ""): boolean {
  const [expires, signature] = value?.split(".") ?? [];
  const expected = expires && sign(scope + expires);
  if (!expected || !signature || !(Number(expires) > Date.now())) return false;

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Passkeys ligger i Vercel som "id:offentlig-nøgle" i PASSKEYS eller i variabler, der starter
// med PASSKEYS_ (fx PASSKEYS_IPHONE). Så kan en ny enhed få sin egen variabel, selvom en
// hemmelig værdi ikke kan læses igen. Flere i samme variabel adskilles med komma.
// Linjen til en ny passkey får du på /login/registrer.
export function passkeys(): { id: string; publicKey: string }[] {
  return Object.entries(process.env)
    .filter(([name]) => name === "PASSKEYS" || name.startsWith("PASSKEYS_"))
    .flatMap(([, value]) => (value ?? "").split(","))
    .map((entry) => entry.trim().split(":"))
    .filter(([id, publicKey]) => id && publicKey)
    .map(([id, publicKey]) => ({ id, publicKey }));
}
