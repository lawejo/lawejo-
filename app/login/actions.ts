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
export async function login(response: AuthenticationResponseJSON): Promise<string | null> {
  const expectedChallenge = await takeChallenge();
  const passkey = passkeys().find((p) => p.id === response.id);
  const session = createSession();
  if (!passkey) {
    return `Passkeyen ${response.id.slice(0, 8)}… er ikke i PASSKEYS (${passkeys().length} passkeys i denne deploy).`;
  }
  if (!session) return "AUTH_SECRET mangler i Vercel.";

  const { rpID, origin } = await relyingParty();
  try {
    const { verified } = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: { id: passkey.id, publicKey: isoBase64URL.toBuffer(passkey.publicKey), counter: 0 },
      requireUserVerification: true,
    });
    if (!verified) return "Login kunne ikke bekræftes.";
  } catch {
    return "Login kunne ikke bekræftes.";
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
    return `${registrationInfo.credential.id}:${isoBase64URL.fromBuffer(registrationInfo.credential.publicKey)}`;
  } catch {
    return null;
  }
}
