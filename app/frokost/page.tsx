import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getLunches, type Lunch } from "@/lib/lunches";

type Filters = { protein?: string; kulhydrat?: string; type?: string };

export default function FrokostPage({ searchParams }: PageProps<"/frokost">) {
  return (
    <>
      <h1>Frokost</h1>
      <p className="muted">Ca. 400–520 kcal pr. måltid</p>
      <Suspense fallback={<p className="muted">Henter frokoster…</p>}>
        <LunchList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function LunchList({ searchParams }: Pick<PageProps<"/frokost">, "searchParams">) {
  await connection();
  const lunches = await getLunches();
  const filters = (await searchParams) as Filters;

  const shown = lunches.filter(
    (lunch) =>
      (!filters.protein || lunch.protein === filters.protein) &&
      (!filters.kulhydrat || lunch.carb === filters.kulhydrat) &&
      (!filters.type || lunch.types.includes(filters.type)),
  );

  return (
    <>
      <FilterRow name="protein" values={unique(lunches.map((l) => l.protein))} filters={filters} />
      <FilterRow name="kulhydrat" values={unique(lunches.map((l) => l.carb))} filters={filters} />
      <FilterRow name="type" values={unique(lunches.flatMap((l) => l.types))} filters={filters} />

      {shown.length === 0 && <p className="muted">Ingen frokoster matcher.</p>}
      {shown.map((lunch) => (
        <LunchItem key={lunch.id} lunch={lunch} />
      ))}
    </>
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

function LunchItem({ lunch }: { lunch: Lunch }) {
  return (
    <details className="card run">
      <summary>
        <strong>{lunch.name}</strong>
        <span className="badge">{lunch.kcal} kcal</span>
        <span className="muted">
          {lunch.proteinGrams} g protein · {lunch.minutes} min
        </span>
        <span className="muted">{lunch.types.join(" · ")}</span>
      </summary>
      <p>{lunch.ingredients}</p>
      <p className="muted">{lunch.method}</p>
    </details>
  );
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "da"));
}
