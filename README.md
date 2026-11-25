# lawejo

Personlig hub på lawejo.com. Next.js på Vercel med data i Notion.

- `/loeb` – løbeplanen (Notion: Workout → Løbeplan – Hegnet Half)
- `/calisthenics` – pas A/B/C og log (Notion: Workout → Library → Calisthenics)

Ny sektion: tilføj en linje i `sections` i `app/page.tsx` og en route under `app/`.

## Environment variables (Vercel)

| Navn            | Værdi                                      |
| --------------- | ------------------------------------------ |
| `NOTION_TOKEN`  | Token fra Notion-integrationen "lawejo"    |
| `AUTH_SECRET`   | Tilfældig nøgle, der signerer login-cookien |
| `PASSKEYS`      | Passkeys med adgang, `id:nøgle` adskilt af komma. Flere variabler med navnet `PASSKEYS_<enhed>` virker også |

Integrationen skal have adgang til Workout-siden i Notion (Content access).

## Login med passkey

Sitet har ingen adgangskode. Du logger ind med en passkey (Face ID via NordPass eller iCloud).

1. Lav en `AUTH_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
2. Åbn `/login/registrer` på det domæne, du vil logge ind på, og opret en passkey.
3. Læg linjen, du får, i `PASSKEYS` og redeploy. Flere passkeys adskilles med komma.

Mister du en enhed, så fjern dens linje fra `PASSKEYS`. Skifter du `AUTH_SECRET`, bliver alle logins ugyldige.

## Lokalt

```bash
cp .env.example .env.local   # udfyld værdierne
npm install
npm run dev
```
