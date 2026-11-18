import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getRuns, nextRun } from "@/lib/runs";
import { PROGRAM_START, sessionOn } from "@/lib/calisthenics";
import { dayLabel, todayIso } from "@/lib/date";

// Tilføj en linje her og en route under app/ for at få en ny sektion.
// `Today` er valgfri: den viser dagens status på forsiden.
const sections = [
  { href: "/loeb", title: "Løb", description: "Hegnet Half – plan og log", Today: RunToday },
  { href: "/calisthenics", title: "Calisthenics", description: "Dagens pas og log", Today: CalisthenicsToday },
];

export default function Home() {
  return (
    <ul className="section-list">
      {sections.map(({ href, title, description, Today }) => (
        <li key={href}>
          <Link href={href} className="card">
            <h2>{title}</h2>
            <Suspense fallback={<span className="muted">{description}</span>}>
              <Today />
            </Suspense>
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
