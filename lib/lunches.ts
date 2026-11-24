import { queryAll, readMultiSelect, readNumber, readSelect, readText } from "@/lib/notion";

// Notion: Workout → Frokost
export const LUNCHES_DATA_SOURCE = "422922f7-7dbc-812a-92e1-000b23fdbfee";

export type Lunch = {
  id: string;
  name: string;
  protein: string;
  carb: string;
  types: string[];
  kcal: number | null;
  proteinGrams: number | null;
  minutes: number | null;
  ingredients: string;
  method: string;
};

export async function getLunches(): Promise<Lunch[]> {
  const pages = await queryAll(LUNCHES_DATA_SOURCE, {
    sorts: [{ property: "Protein g", direction: "descending" }],
  });

  return pages.map(({ id, properties: p }) => ({
    id,
    name: readText(p["Navn"]),
    protein: readSelect(p["Protein"]),
    carb: readSelect(p["Kulhydrat"]),
    types: readMultiSelect(p["Type"]),
    kcal: readNumber(p["kcal"]),
    proteinGrams: readNumber(p["Protein g"]),
    minutes: readNumber(p["Tid min"]),
    ingredients: readText(p["Ingredienser"]),
    method: readText(p["Tilberedning"]),
  }));
}
