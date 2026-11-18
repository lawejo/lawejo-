import { queryAll, readDate, readNumber, readSelect, readText } from "@/lib/notion";

// Notion: Workout → Løbeplan – Hegnet Half
export const RUNS_DATA_SOURCE = "41b922f7-7dbc-8139-bd46-000b21dc3e71";
export const RACE_DATE = "2027-03-07";

export type Run = {
  id: string;
  title: string;
  date: string;
  week: number;
  type: string;
  planKm: number | null;
  hrTarget: string;
  planNote: string;
  status: string;
  km: number | null;
  time: string;
  avgHr: number | null;
  maxHr: number | null;
  knee: number | null;
  note: string;
};

export async function getRuns(): Promise<Run[]> {
  const pages = await queryAll(RUNS_DATA_SOURCE, {
    sorts: [{ property: "Dato", direction: "ascending" }],
  });

  return pages.map(({ id, properties: p }) => ({
    id,
    // "Uge 2 · Let" → "Let": ugen vises allerede i overskriften.
    title: readText(p["Pas"]).replace(/^Uge \d+ · /, ""),
    date: readDate(p["Dato"]),
    week: readNumber(p["Uge"]) ?? 0,
    type: readSelect(p["Type"]),
    planKm: readNumber(p["Plan km"]),
    hrTarget: readText(p["Pulsmål"]),
    planNote: readText(p["Plan-note"]),
    status: readSelect(p["Status"]),
    km: readNumber(p["Faktisk km"]),
    time: readText(p["Tid"]),
    avgHr: readNumber(p["Snit-puls"]),
    maxHr: readNumber(p["Maks-puls"]),
    knee: readNumber(p["Knæsmerte"]),
    note: readText(p["Note"]),
  }));
}

// "27:30" eller "1:52:10" + km → "5:30/km"
export function pace(time: string, km: number | null): string {
  if (!time || !km) return "";
  const parts = time.split(":").map(Number);
  if (parts.some(Number.isNaN)) return "";
  const seconds = Math.round(parts.reduce((total, part) => total * 60 + part, 0) / km);
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}/km`;
}

// Første pas fra i dag og frem, som ikke er afsluttet.
export function nextRun(runs: Run[], today: string): Run | undefined {
  return runs.find((run) => run.date >= today && (run.status || "Planlagt") === "Planlagt");
}

// Tillader tid uden kolon (iPhones taltastatur har intet kolon): "2610" → "26:10", "10512" → "1:05:12".
export function normalizeTime(raw: string): string {
  const value = raw.trim();
  if (!/^\d{3,6}$/.test(value)) return value;
  const sec = value.slice(-2);
  const min = value.slice(-4, -2);
  const hours = value.slice(0, -4);
  return hours ? `${hours}:${min}:${sec}` : `${Number(min)}:${sec}`;
}
