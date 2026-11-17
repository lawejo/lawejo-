import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  PROGRAM_START,
  SESSIONS,
  defaultSession,
  getExercises,
  getLogForDate,
  type Exercise,
  type LogEntry,
} from "@/lib/calisthenics";
import { todayIso } from "@/lib/date";
import { logExercise } from "./actions";

export default function CalisthenicsPage({ searchParams }: PageProps<"/calisthenics">) {
  return (
    <>
      <h1>Calisthenics</h1>
      {!PROGRAM_START && (
        <p className="muted">Programmet er ikke startet. Start med testen i uge 0.</p>
      )}
      <Suspense fallback={<p className="muted">Henter pas…</p>}>
        <Session searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Session({ searchParams }: Pick<PageProps<"/calisthenics">, "searchParams">) {
  await connection();
  const today = todayIso();
  const { pas } = await searchParams;
  const session = SESSIONS.find((s) => s.key === pas) ?? SESSIONS.find((s) => s.key === defaultSession(today))!;

  const [exercises, todaysLog] = await Promise.all([getExercises(session.name), getLogForDate(today)]);

  return (
    <>
      <nav className="tabs">
        {SESSIONS.map((s) => (
          <Link key={s.key} href={`?pas=${s.key}`} aria-current={s.key === session.key ? "page" : undefined}>
            {s.name}
          </Link>
        ))}
      </nav>
      {exercises.map((exercise) => (
        <ExerciseItem
          key={exercise.id}
          exercise={exercise}
          session={session.name}
          logged={todaysLog.filter((entry) => entry.exerciseIds.includes(exercise.id))}
        />
      ))}
    </>
  );
}

function ExerciseItem({ exercise, session, logged }: { exercise: Exercise; session: string; logged: LogEntry[] }) {
  return (
    <details className={`card exercise ${logged.length ? "today" : ""}`}>
      <summary>
        <strong>{exercise.name}</strong>
        <span className="badge">{exercise.type}</span>
        <span className="muted">
          {exercise.variation}
          {exercise.dose && ` · ${exercise.dose}`}
        </span>
        <span className="muted">{exercise.pr != null && `PR ${exercise.pr}`}</span>
      </summary>

      {exercise.superset && <p className="muted">Superset: {exercise.superset}</p>}
      {exercise.nextStep && <p className="muted">Næste trin: {exercise.nextStep}</p>}
      {logged.map((entry, i) => (
        <p key={i}>✓ I dag: {entry.sets}</p>
      ))}

      <form action={logExercise.bind(null, exercise.id, session)}>
        <label>
          Sæt × reps / s
          <input name="sets" placeholder="8/8/7" required />
        </label>
        <label>
          RIR
          <input name="rir" inputMode="numeric" />
        </label>
        <label className="full">
          Variation
          <input name="variation" defaultValue={exercise.variation} />
        </label>
        <label className="full">
          Note
          <input name="note" />
        </label>
        <button type="submit">Log</button>
      </form>
    </details>
  );
}
