import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { buildIdea, getBlocks, getLunches, type Block, type Lunch } from "@/lib/lunches";
import { STORES, currentOffers, getOffers, matchOffers, storeName, type Offer } from "@/lib/offers";
import { toggleStore } from "./actions";
import { STORE_COOKIE, selectedStores } from "./stores";

type Filters = { protein?: string; kulhydrat?: string; type?: string };

export default function FrokostPage({ searchParams }: PageProps<"/frokost">) {
  return (
    <>
      <h1>Frokost</h1>
      <p className="muted">Ca. 400–520 kcal pr. måltid</p>
      <Suspense fallback={<p className="muted">Henter frokoster og tilbud…</p>}>
        <LunchList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function LunchList({ searchParams }: Pick<PageProps<"/frokost">, "searchParams">) {
  await connection();
  const stores = selectedStores((await cookies()).get(STORE_COOKIE)?.value);
  const [lunches, blocks, allOffers] = await Promise.all([getLunches(), getBlocks(), getOffers()]);
  const filters = (await searchParams) as Filters;

  // Tilbud pr. byggeklods i de valgte butikker.
  const offers = currentOffers(allOffers, stores);
  const offersByBlock = new Map(
    blocks.map((block) => [block.id, block.keywords ? matchOffers(block.keywords, offers) : []]),
  );
  const onOffer = new Set([...offersByBlock].filter(([, o]) => o.length).map(([id]) => id));
  const proteinsOnOffer = blocks.filter((b) => b.category === "Protein" && onOffer.has(b.id));

  // Frokoster med varer på tilbud kommer først.
  const shown = lunches
    .filter(
      (lunch) =>
        (!filters.protein || lunch.protein === filters.protein) &&
        (!filters.kulhydrat || lunch.carb === filters.kulhydrat) &&
        (!filters.type || lunch.types.includes(filters.type)),
    )
    .sort(
      (a, b) =>
        Number(b.blockIds.some((id) => onOffer.has(id))) - Number(a.blockIds.some((id) => onOffer.has(id))),
    );

  return (
    <>
      <form action={toggleStore} className="chips">
        {STORES.map(({ key, name }) => (
          <button key={key} name="store" value={key} aria-pressed={stores.includes(key)}>
            {name}
          </button>
        ))}
      </form>

      {stores.length > 0 && (
        <section className="hero">
          <p className="eyebrow">På tilbud nu</p>
          {allOffers.length === 0 && <p className="muted">Tilbuddene kunne ikke hentes lige nu.</p>}
          {allOffers.length > 0 && proteinsOnOffer.length === 0 && (
            <p className="muted">Ingen proteinvarer fra listen er på tilbud i de valgte butikker.</p>
          )}
          {proteinsOnOffer.map((protein) => (
            <ProteinOffer
              key={protein.id}
              protein={protein}
              offers={offersByBlock.get(protein.id) ?? []}
              lunches={lunches.filter((l) => l.blockIds.includes(protein.id))}
              blocks={blocks}
              onOffer={onOffer}
            />
          ))}
        </section>
      )}

      <FilterRow name="protein" values={unique(lunches.map((l) => l.protein))} filters={filters} />
      <FilterRow name="kulhydrat" values={unique(lunches.map((l) => l.carb))} filters={filters} />
      <FilterRow name="type" values={unique(lunches.flatMap((l) => l.types))} filters={filters} />

      {shown.length === 0 && <p className="muted">Ingen frokoster matcher.</p>}
      {shown.map((lunch) => (
        <LunchItem
          key={lunch.id}
          lunch={lunch}
          offers={blocks
            .filter((b) => lunch.blockIds.includes(b.id) && onOffer.has(b.id))
            .map((b) => ({ block: b, offers: offersByBlock.get(b.id) ?? [] }))}
        />
      ))}
    </>
  );
}

type ProteinOfferProps = {
  protein: Block;
  offers: Offer[];
  lunches: Lunch[];
  blocks: Block[];
  onOffer: Set<string>;
};

// En proteinvare på tilbud: de faste frokoster, den indgår i, eller en tilbudsidé, hvis der ingen er.
function ProteinOffer({ protein, offers, lunches, blocks, onOffer }: ProteinOfferProps) {
  const idea = lunches.length === 0 ? buildIdea(protein, blocks, onOffer) : null;

  return (
    <details className="card run">
      <summary>
        <strong>{protein.name}</strong>
        <span className="badge done">Tilbud</span>
        <span className="muted">
          {idea ? "Tilbudsidé" : lunches.map((l) => l.name).join(" · ")}
        </span>
      </summary>
      <OfferLines offers={offers} />
      {idea && (
        <p>
          {idea.blocks.map((b) => `${b.portion} g ${b.name.toLowerCase()}`).join(" + ")}
          <br />
          <span className="muted">
            {idea.kcal} kcal · {idea.protein} g protein
          </span>
        </p>
      )}
    </details>
  );
}

// De fem billigste, så et bredt søgeord ikke fylder hele kortet.
function OfferLines({ offers }: { offers: Offer[] }) {
  return (
    <ul className="offers">
      {offers.toSorted((a, b) => a.price - b.price).slice(0, 5).map((o, i) => (
        <li key={i}>
          {o.title} <span className="muted">· {o.price.toLocaleString("da-DK")} kr · {storeName(o.store)}</span>
        </li>
      ))}
    </ul>
  );
}

// Et klik vælger en værdi, et klik mere på samme værdi fjerner filteret igen.
function FilterRow({ name, values, filters }: { name: keyof Filters; values: string[]; filters: Filters }) {
  return (
    <nav className="chips">
      {values.map((value) => {
        const active = filters[name] === value;
        const params = new URLSearchParams({ ...filters, [name]: value });
        if (active) params.delete(name);
        return (
          <Link key={value} href={`?${params}`} aria-current={active ? "page" : undefined}>
            {value}
          </Link>
        );
      })}
    </nav>
  );
}

type LunchItemProps = { lunch: Lunch; offers: { block: Block; offers: Offer[] }[] };

function LunchItem({ lunch, offers }: LunchItemProps) {
  return (
    <details className="card run">
      <summary>
        <strong>{lunch.name}</strong>
        <span className={`badge ${offers.length ? "done" : ""}`}>
          {offers.length ? "Tilbud" : `${lunch.kcal} kcal`}
        </span>
        <span className="muted">
          {lunch.kcal} kcal · {lunch.proteinGrams} g protein · {lunch.minutes} min
        </span>
        <span className="muted">{lunch.types.join(" · ")}</span>
      </summary>
      {offers.map(({ block, offers }) => (
        <div key={block.id}>
          <p className="eyebrow">{block.name} på tilbud</p>
          <OfferLines offers={offers} />
        </div>
      ))}
      <p>{lunch.ingredients}</p>
      <p className="muted">{lunch.method}</p>
    </details>
  );
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "da"));
}
