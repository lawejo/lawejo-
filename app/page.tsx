import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getRuns, nextRun } from "@/lib/runs";
import { PROGRAM_START, sessionOn } from "@/lib/calisthenics";
import { dayLabel, todayIso } from "@/lib/date";
import { getCheckIns, getHabits, habitStats } from "@/lib/habits";

// Tilføj en linje her og en route under app/ for at få en ny sektion.
// `Today` er valgfri: den viser dagens status på forsiden.
const sections = [
  { href: "/loeb", title: "Løb", description: "Hegnet Half – plan og log", Today: RunToday },
  { href: "/calisthenics", title: "Calisthenics", description: "Dagens pas og log", Today: CalisthenicsToday },
  { href: "/frokost", title: "Frokost", description: "Idéer til ca. 500 kcal" },
  { href: "/vaner", title: "Vaner", description: "Daglige vaner og protokoller", Today: HabitsToday },
  { href: "/vaerktoejer", title: "Værktøjer", description: "Små beregnere" },
];

export default function Home() {
  return (
    <ul className="section-list">
      {sections.map(({ href, title, description, Today }) => (
        <li key={href}>
          <Link href={href} className="card">
            <h2>{title}</h2>
            {Today ? (
              <Suspense fallback={<span className="muted">{description}</span>}>
                <Today />
              </Suspense>
            ) : (
              <span className="muted">{description}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function RunToday() {
  await connection();
  const today = todayIso();
  const run = nextRun(await getRuns(), today);
  if (!run) return <span className="muted">Planen er færdig</span>;

  return (
    <span className={run.date === today ? "today-line" : "muted"}>
      {dayLabel(run.date, today)}: {run.title} · {run.planKm} km
    </span>
  );
}

async function CalisthenicsToday() {
  await connection();
  if (!PROGRAM_START) return <span className="muted">Ikke startet – start med testen i uge 0</span>;

  const session = sessionOn(todayIso());
  return session ? (
    <span className="today-line">I dag: Pas {session.name}</span>
  ) : (
    <span className="muted">Hviledag</span>
  );
}

async function HabitsToday() {
  await connection();
  const today = todayIso();
  const [habits, checkIns] = await Promise.all([getHabits(), getCheckIns()]);
  // Private vaner tælles ikke med på forsiden.
  const started = habits.filter((h) => !h.private && habitStats(h, checkIns, today).day >= 1);
  if (!started.length) return <span className="muted">Ingen vaner i gang</span>;

  const done = started.filter((h) => habitStats(h, checkIns, today).todayCount >= h.perDay).length;
  return (
    <span className={done === started.length ? "muted" : "today-line"}>
      I dag: {done} af {started.length} klaret
    </span>
  );
}
