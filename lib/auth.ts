export const AUTH_COOKIE = "lawejo_auth";

// Cookie-værdien er en hash af SITE_PASSWORD, så selve adgangskoden aldrig ligger i browseren.
// Skifter du adgangskoden i Vercel, bliver alle eksisterende logins ugyldige.
export async function authToken(): Promise<string | null> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;

  const data = new TextEncoder().encode(`lawejo:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
