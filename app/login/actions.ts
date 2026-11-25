"use server";

import { cookies, headers } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { AUTH_COOKIE, SESSION_DAYS, createSession, passkeys } from "@/lib/auth";

const CHALLENGE_COOKIE = "lawejo_challenge";

// Passkeys er bundet til domænet, så en passkey fra lawejo.com virker ikke på en vercel.app-adresse.
async function relyingParty() {
  const host = (await headers()).get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return { rpID: host.split(":")[0], origin: `${protocol}://${host}` };
}

// Challengen gemmes i en kortlivet cookie og kan kun bruges én gang.
async function saveChallenge(challenge: string) {
  (await cookies()).set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 10 * 60,
  });
}

async function takeChallenge(): Promise<string> {
  const cookieStore = await cookies();
  const challenge = cookieStore.get(CHALLENGE_COOKIE)?.value ?? "";
  cookieStore.delete(CHALLENGE_COOKIE);
  return challenge;
}

export async function loginOptions() {
  const { rpID } = await relyingParty();
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
  await saveChallenge(options.challenge);
  return options;
}

// Returnerer en fejltekst, eller null når du er logget ind.
// Passkeyen findes på signaturen og ikke på id'et, fordi NordPass ikke altid
// melder samme id ved login som ved oprettelse. Det er signaturen, der beviser adgang.
export async function login(response: AuthenticationResponseJSON): Promise<string | null> {
  const expectedChallenge = await takeChallenge();
  const session = createSession();
  if (!session) return "AUTH_SECRET mangler i Vercel.";

  const { rpID, origin } = await relyingParty();
  const verified = await Promise.all(
    passkeys().map(({ publicKey }) =>
      verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: { id: response.id, publicKey: isoBase64URL.toBuffer(publicKey), counter: 0 },
        requireUserVerification: true,
      }).then(
        (result) => (result.verified ? true : "ikke verificeret"),
        (error: Error) => error.message,
      ),
    ),
  );

  if (!verified.includes(true)) {
    const known = passkeys().map((p) => `${p.id.slice(0, 8)}…`).join(", ") || "ingen";
    console.warn(`Passkey ${response.id} afvist. PASSKEYS: ${known}. Fejl: ${verified.join(" | ")}`);
    return `Passkeyen ${response.id.slice(0, 8)}… blev afvist (${known}): ${verified.join(" | ") || "ingen passkeys"}`;
  }

  (await cookies()).set(AUTH_COOKIE, session, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return null;
}

export async function registerOptions() {
  const { rpID } = await relyingParty();
  const options = await generateRegistrationOptions({
    rpName: "lawejo",
    rpID,
    userName: "lasse",
    userID: new TextEncoder().encode("lasse"),
    attestationType: "none",
    excludeCredentials: passkeys().map(({ id }) => ({ id })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  await saveChallenge(options.challenge);
  return options;
}

// Gemmer ikke noget. Linjen skal selv lægges i PASSKEYS i Vercel,
// så en fremmed kan oprette en passkey her, men ikke bruge den.
export async function register(response: RegistrationResponseJSON): Promise<string | null> {
  const { rpID, origin } = await relyingParty();
  try {
    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response,
      expectedChallenge: await takeChallenge(),
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!verified) return null;
    // Gem det id, browseren selv melder. Nogle passkey-apps (fx NordPass) melder et andet
    // id end det i authenticator-data, og det er browserens id, der kommer igen ved login.
    return `${response.id}:${isoBase64URL.fromBuffer(registrationInfo.credential.publicKey)}`;
  } catch {
    return null;
  }
}
