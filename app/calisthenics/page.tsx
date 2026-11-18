import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  PROGRAM_START,
  SESSIONS,
  defaultSession,
  getExercises,
  getRecentLog,
  type Exercise,
  type LogEntry,
} from "@/lib/calisthenics";
import { dayLabel, todayIso } from "@/lib/date";
import { SaveButton } from "@/components/SaveButton";
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

  const [exercises, log] = await Promise.all([getExercises(session.name), getRecentLog()]);

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
          today={today}
          entries={log.filter((entry) => entry.exerciseIds.includes(exercise.id))}
        />
      ))}
    </>
  );
}

type ExerciseItemProps = { exercise: Exercise; session: string; today: string; entries: LogEntry[] };

function ExerciseItem({ exercise, session, today, entries }: ExerciseItemProps) {
  const logged = entries.filter((entry) => entry.date === today);
  // Seneste gang før i dag – det er den, progressionsreglen (3×8 rent) skal sammenlignes med.
  const last = entries.find((entry) => entry.date < today);

  return (
    <details className={`card exercise ${logged.length ? "today" : ""}`}>
      <summary>
        <strong>{exercise.name}</strong>
        <span className="badge">{exercise.type}</span>
        <span className="muted">
          {exercise.variation}
          {exercise.dose && ` · ${exercise.dose}`}
        </span>
        <span className="muted">{last && `Sidst ${last.sets}`}</span>
      </summary>

      {last && (
        <p className="muted">
          Sidst: <strong>{last.sets}</strong> · {dayLabel(last.date, today)}
        </p>
      )}
      {exercise.pr != null && <p className="muted">PR: {exercise.pr}</p>}
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
        <SaveButton label="Log" />
      </form>
    </details>
  );
}
