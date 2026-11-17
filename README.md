# lawejo

Personlig hub på lawejo.com. Next.js på Vercel med data i Notion.

- `/loeb` – løbeplanen (Notion: Workout → Løbeplan – Hegnet Half)
- `/calisthenics` – pas A/B/C og log (Notion: Workout → Library → Calisthenics)

Ny sektion: tilføj en linje i `sections` i `app/page.tsx` og en route under `app/`.

## Environment variables (Vercel)

| Navn            | Værdi                                      |
| --------------- | ------------------------------------------ |
| `NOTION_TOKEN`  | Token fra Notion-integrationen "lawejo"    |
| `SITE_PASSWORD` | Adgangskoden til sitet                     |

Integrationen skal have adgang til Workout-siden i Notion (Content access).

## Lokalt

```bash
cp .env.example .env.local   # udfyld værdierne
npm install
npm run dev
```
