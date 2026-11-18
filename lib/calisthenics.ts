import { isFullPage } from "@notionhq/client";
import { notion, queryAll, readDate, readNumber, readRelationIds, readSelect, readText } from "@/lib/notion";

// Notion: Workout → Library → Calisthenics
export const EXERCISES_DATA_SOURCE = "fb6c6c6e-749f-4f83-a733-3fcad60bec1b";
export const LOG_DATA_SOURCE = "cd48e940-16db-4ba1-be19-50e0f20794ab";

// Sæt datoen for uge 1, når programmet starter (efter testen i uge 0).
export const PROGRAM_START: string | null = null;

export const SESSIONS = [
  { key: "A", name: "A – Man" },
  { key: "B", name: "B – Ons" },
  { key: "C", name: "C – Fre" },
] as const;

export type SessionKey = (typeof SESSIONS)[number]["key"];

export type Exercise = {
  id: string;
  name: string;
  type: string;
  variation: string;
  dose: string;
  superset: string;
  nextStep: string;
  pr: number | null;
};

export type LogEntry = {
  exerciseIds: string[];
  sets: string;
  date: string;
};

export async function getExercises(session: string): Promise<Exercise[]> {
  const pages = await queryAll(EXERCISES_DATA_SOURCE, {
    filter: {
      and: [
        { property: "Pas", multi_select: { contains: session } },
        { property: "Status", select: { equals: "Aktiv" } },
      ],
    },
    sorts: [{ property: "#", direction: "ascending" }],
  });

  return pages.map(({ id, properties: p }) => ({
    id,
    name: readText(p["Øvelse"]),
    type: readSelect(p["Type"]),
    variation: readText(p["Nuværende variation"]),
    dose: readText(p["Dosis"]),
    superset: readText(p["Superset"]),
    nextStep: readText(p["Næste trin"]),
    pr: readNumber(p["PR"]),
  }));
}

// De seneste 100 log-rækker (ca. 3 uger) – nok til både "i dag" og "sidst" pr. øvelse.
export async function getRecentLog(): Promise<LogEntry[]> {
  const { results } = await notion.dataSources.query({
    data_source_id: LOG_DATA_SOURCE,
    sorts: [{ property: "Dato", direction: "descending" }],
    page_size: 100,
  });

  return results.filter(isFullPage).map(({ properties: p }) => ({
    exerciseIds: readRelationIds(p["Øvelse"]),
    sets: readText(p["Sæt × reps / s"]),
    date: readDate(p["Dato"]),
  }));
}

// Pas på selve træningsdagene (man/ons/fre), ellers null.
export function sessionOn(isoDate: string) {
  const day = new Date(`${isoDate}T12:00:00`).getDay();
  return SESSIONS.find((_, i) => [1, 3, 5][i] === day) ?? null;
}

// Man → A, tir/ons → B, tor/fre → C, weekend → A (næste pas er mandag).
export function defaultSession(isoDate: string): SessionKey {
  const day = new Date(`${isoDate}T12:00:00`).getDay();
  if (day === 2 || day === 3) return "B";
  if (day === 4 || day === 5) return "C";
  return "A";
}
