import {
  queryAll,
  readMultiSelect,
  readNumber,
  readRelationIds,
  readSelect,
  readText,
} from "@/lib/notion";

// Notion: Workout → Frokost og Workout → Byggeklodser
export const LUNCHES_DATA_SOURCE = "422922f7-7dbc-812a-92e1-000b23fdbfee";
export const BLOCKS_DATA_SOURCE = "422922f7-7dbc-8120-b0b9-000b1ed2d198";

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
  blockIds: string[];
};

// En vare til frokoster med næring pr. 100 g og søgeord til tilbudsaviserne.
export type Block = {
  id: string;
  name: string;
  category: string;
  keywords: string;
  kcalPer100: number;
  proteinPer100: number;
  portion: number;
  lunchIds: string[];
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
    blockIds: readRelationIds(p["Byggeklodser"]),
  }));
}

export async function getBlocks(): Promise<Block[]> {
  const pages = await queryAll(BLOCKS_DATA_SOURCE);

  return pages.map(({ id, properties: p }) => ({
    id,
    name: readText(p["Navn"]),
    category: readSelect(p["Kategori"]),
    keywords: readText(p["Søgeord"]),
    kcalPer100: readNumber(p["kcal pr 100 g"]) ?? 0,
    proteinPer100: readNumber(p["Protein pr 100 g"]) ?? 0,
    portion: readNumber(p["Standardportion g"]) ?? 0,
    lunchIds: readRelationIds(p["Frokoster"]),
  }));
}

export type Idea = { blocks: Block[]; kcal: number; protein: number };

// Tilbudsidé til en proteinvare, der ikke indgår i en fast frokost: proteinet med et kulhydrat
// (eller intet) og noget grønt, i standardportioner. Kombinationen vælges, så den rammer
// 400–520 kcal, helst med flest varer på tilbud, og ellers tættest på midten.
export function buildIdea(protein: Block, blocks: Block[], onOffer: Set<string>): Idea {
  const carbs = [null, ...blocks.filter((b) => b.category === "Kulhydrat")];
  const greens = blocks.filter((b) => b.category === "Grønt");

  const ideas = carbs.flatMap((carb) =>
    greens.map((green) => {
      const parts = [protein, ...(carb ? [carb] : []), green];
      const sum = (per100: (b: Block) => number) =>
        Math.round(parts.reduce((total, b) => total + (b.portion * per100(b)) / 100, 0));
      return { blocks: parts, kcal: sum((b) => b.kcalPer100), protein: sum((b) => b.proteinPer100) };
    }),
  );

  const score = (idea: Idea) => [
    idea.kcal >= 400 && idea.kcal <= 520 ? 0 : 1,
    -idea.blocks.filter((b) => onOffer.has(b.id)).length,
    Math.abs(idea.kcal - 460),
  ];
  return ideas.sort((a, b) => {
    const [sa, sb] = [score(a), score(b)];
    return sa[0] - sb[0] || sa[1] - sb[1] || sa[2] - sb[2];
  })[0];
}
