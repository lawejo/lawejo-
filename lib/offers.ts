import { cacheLife } from "next/cache";

// Ugens tilbud fra eTilbudsavis (Tjek). API'et er uofficielt og uden nøgle, så det hentes
// højst én gang i timen, og kun til privat brug. Fejler en kæde, giver den bare ingen tilbud.
export const STORES = [
  { key: "netto", name: "Netto", dealerId: "9ba51" },
  { key: "spar", name: "Spar", dealerId: "88ddE" },
  { key: "365", name: "365discount", dealerId: "DWZE1w" },
] as const;

export type StoreKey = (typeof STORES)[number]["key"];

export type Offer = {
  store: StoreKey;
  title: string;
  price: number;
  validFrom: string;
  validTo: string;
};

type TjekOffer = {
  heading: string;
  pricing: { price: number };
  run_from: string;
  run_till: string;
};

export async function getOffers(): Promise<Offer[]> {
  "use cache";
  cacheLife("hours");

  const perStore = await Promise.all(
    STORES.map(({ key, dealerId }) => fetchStore(key, dealerId).catch(() => [])),
  );
  return perStore.flat();
}

async function fetchStore(store: StoreKey, dealerId: string): Promise<Offer[]> {
  const offers: Offer[] = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const res = await fetch(
      `https://api.etilbudsavis.dk/v2/offers?dealer_ids=${dealerId}&limit=100&offset=${offset}`,
    );
    if (!res.ok) throw new Error(`Tjek svarede ${res.status}`);

    const page: TjekOffer[] = await res.json();
    offers.push(
      ...page.map((o) => ({
        store,
        title: o.heading,
        price: o.pricing.price,
        validFrom: o.run_from,
        validTo: o.run_till,
      })),
    );
    if (page.length < 100) break;
  }
  return offers;
}

// Kun tilbud, der gælder nu, i de valgte butikker. Næste uges avis er ofte synlig i forvejen.
export function currentOffers(offers: Offer[], stores: StoreKey[], now = new Date()): Offer[] {
  return offers.filter(
    (o) => stores.includes(o.store) && new Date(o.validFrom) <= now && now <= new Date(o.validTo),
  );
}

// Søgeord fra Notion, kommasepareret. Et ord matcher, når et ord i tilbuddets overskrift
// starter eller slutter med det ("æg" → "skrabeæg", "ris" → "jasminris").
// Søgeord med mellemrum ("hakket oksekød") skal stå i overskriften som de er.
// Et søgeord med minus foran udelukker tilbud ("ost, -frost" springer "Frost grøntsager" over).
export function matchOffers(keywords: string, offers: Offer[]): Offer[] {
  const terms = keywords
    .toLowerCase()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const include = terms.filter((t) => !t.startsWith("-"));
  const exclude = terms.filter((t) => t.startsWith("-")).map((t) => t.slice(1));

  return offers.filter((offer) => {
    const title = offer.title.toLowerCase();
    const words = title.split(/[^a-zæøåéü]+/);
    const matches = (term: string) =>
      term.includes(" ")
        ? title.includes(term)
        : words.some((w) => w.startsWith(term) || w.endsWith(term));
    return include.some(matches) && !exclude.some(matches);
  });
}

export function storeName(key: StoreKey): string {
  return STORES.find((s) => s.key === key)?.name ?? key;
}
