import { queryAll, readCheckbox, readDate, readNumber, readRelationIds, readSelect, readText } from "@/lib/notion";
import { daysUntil } from "@/lib/date";

// Notion: Workout → Vaner og Workout → Vane-check-ins
export const HABITS_DATA_SOURCE = "423922f7-7dbc-8156-98e3-000bd4c30cec";
export const CHECKINS_DATA_SOURCE = "423922f7-7dbc-815b-95f9-000b7e2507c4";

// En vane er en succes, når målperioden er gået, og mindst 85 % af dagene er klaret.
export const SUCCESS_RATE = 0.85;
// Vanestyrke som i Loop Habit Tracker: nye dage vægter mest, og en glemt dag
// trækker ned uden at nulstille. Efter ca. 66 perfekte dage er styrken ca. 97 %.
const ALPHA = 0.052;

export type Habit = {
  id: string;
  name: string;
  status: string;
  start: string;
  goalDays: number;
  perDay: number;
  check: string;
  when: string;
  ifThen: string;
  protocol: string;
};

export type CheckIn = {
  id: string;
  habitId: string;
  date: string;
  count: number;
  skip: boolean;
};

export async function getHabits(): Promise<Habit[]> {
  const pages = await queryAll(HABITS_DATA_SOURCE, {
    filter: { property: "Status", select: { does_not_equal: "Arkiveret" } },
    sorts: [{ property: "Startdato", direction: "ascending" }],
  });

  return pages.map(({ id, properties: p }) => ({
    id,
    name: readText(p["Navn"]),
    status: readSelect(p["Status"]),
    start: readDate(p["Startdato"]),
    goalDays: readNumber(p["Mål dage"]) ?? 66,
    perDay: readNumber(p["Pr. dag"]) || 1,
    check: readText(p["Check"]),
    when: readText(p["Hvornår"]),
    ifThen: readText(p["Hvis-så"]),
    protocol: readText(p["Protokol"]),
  }));
}

export async function getCheckIns(): Promise<CheckIn[]> {
  const pages = await queryAll(CHECKINS_DATA_SOURCE, {
    sorts: [{ property: "Dato", direction: "ascending" }],
  });

  return pages.map(({ id, properties: p }) => ({
    id,
    habitId: readRelationIds(p["Vane"])[0] ?? "",
    date: readDate(p["Dato"]),
    count: readNumber(p["Antal"]) ?? 0,
    skip: readCheckbox(p["Skip"]),
  }));
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// "done" = alle sessioner, "partial" = nogle, "miss" = ingen, "skip" = fridag,
// "open" = i dag og ikke klaret endnu, "future" = efter i dag.
export type DayState = "done" | "partial" | "miss" | "skip" | "open" | "future";

export type HabitStats = {
  day: number; // dag i forløbet, 0 hvis vanen ikke er startet
  todayCount: number;
  todaySkip: boolean;
  rate: number | null; // andel klarede dage, uden fridage og uden dagen i dag, hvis den ikke er klaret
  strength: number;
  succeeded: boolean;
  days: DayState[]; // én pr. dag i målperioden (eller frem til i dag, hvis den er længere)
};

export function habitStats(habit: Habit, checkIns: CheckIn[], today: string): HabitStats {
  const byDate = new Map(checkIns.filter((c) => c.habitId === habit.id).map((c) => [c.date, c]));
  const start = habit.start || today;
  const day = daysUntil(today, start) + 1;
  const length = Math.max(habit.goalDays, day);

  let counted = 0;
  let sum = 0;
  let strength = 0;
  const days: DayState[] = [];

  for (let i = 0; i < length; i++) {
    const date = addDays(start, i);
    const checkIn = byDate.get(date);
    const value = Math.min((checkIn?.count ?? 0) / habit.perDay, 1);

    if (i >= day) {
      days.push("future");
    } else if (checkIn?.skip) {
      days.push("skip");
    } else if (date === today && value < 1) {
      days.push("open");
    } else {
      days.push(value === 1 ? "done" : value > 0 ? "partial" : "miss");
      counted++;
      sum += value;
      strength = strength * (1 - ALPHA) + ALPHA * value;
    }
  }

  const todayCheckIn = byDate.get(today);
  const rate = counted ? sum / counted : null;
  return {
    day: Math.max(day, 0),
    todayCount: todayCheckIn?.count ?? 0,
    todaySkip: todayCheckIn?.skip ?? false,
    rate,
    strength,
    succeeded: day >= habit.goalDays && (rate ?? 0) >= SUCCESS_RATE,
    days,
  };
}
