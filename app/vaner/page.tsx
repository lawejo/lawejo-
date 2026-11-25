import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { SUCCESS_RATE, addDays, getCheckIns, getHabits, habitStats, type Habit, type HabitStats } from "@/lib/habits";
import { daysUntil, todayIso } from "@/lib/date";
import { ActionButton } from "@/components/ActionButton";
import { ActionForm } from "@/components/ActionForm";
import { createHabit, setCount, setSkip } from "./actions";

export default function VanerPage({ searchParams }: PageProps<"/vaner">) {
  return (
    <>
      <h1>Vaner</h1>
      <Suspense fallback={<p className="muted">Henter vaner…</p>}>
        <HabitList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function HabitList({ searchParams }: Pick<PageProps<"/vaner">, "searchParams">) {
  await connection();
  const today = todayIso();
  // Afholdsvaner tjekkes tit om aftenen eller næste morgen, så i går kan også registreres.
  const { dag } = await searchParams;
  const date = dag === "igaar" ? addDays(today, -1) : today;
  const [habits, checkIns] = await Promise.all([getHabits(), getCheckIns()]);

  return (
    <>
      <nav className="tabs">
        <Link href="?" aria-current={dag !== "igaar" ? "page" : undefined}>I dag</Link>
        <Link href="?dag=igaar" aria-current={dag === "igaar" ? "page" : undefined}>I går</Link>
      </nav>

      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} stats={habitStats(habit, checkIns, date)} date={date} />
      ))}

      <details className="card">
        <summary>
          <strong>Ny vane</strong>
        </summary>
        <ActionForm action={createHabit} label="Opret">
          <label className="full">
            Navn
            <input name="name" required />
          </label>
          <label>
            Mål (dage)
            <input name="goalDays" inputMode="numeric" defaultValue={66} />
          </label>
          <label>
            Gange pr. dag
            <input name="perDay" inputMode="numeric" defaultValue={1} />
          </label>
          <label className="full">
            Startdato
            <input name="start" type="date" defaultValue={today} required />
          </label>
          <label className="full">
            Hvornår tæller dagen som klaret?
            <input name="check" />
          </label>
          <label className="full">
            Hvornår og hvor
            <input name="when" placeholder="Efter tandbørstning om morgenen" />
          </label>
          <label className="full">
            Hvis-så-plan
            <input name="ifThen" placeholder="Hvis jeg får trang, så …" />
          </label>
          <label className="full">
            Protokol
            <textarea name="protocol" rows={5} maxLength={2000} />
          </label>
        </ActionForm>
      </details>
    </>
  );
}

function HabitCard({ habit, stats, date }: { habit: Habit; stats: HabitStats; date: string }) {
  const notStarted = stats.day < 1;
  const done = stats.todayCount >= habit.perDay;

  return (
    <section className={`card habit ${done ? "today" : ""}`}>
      <header>
        <strong>{habit.name}</strong>
        <span className={`badge ${stats.succeeded ? "done" : ""}`}>
          {stats.succeeded ? "Mål nået" : habit.status === "Aktiv" ? `${habit.goalDays} dage` : habit.status}
        </span>
      </header>

      <p className="muted">
        {notStarted
          ? `Starter om ${daysUntil(habit.start, date)} dage`
          : [
              `Dag ${stats.day} af ${habit.goalDays}`,
              stats.rate !== null && `${percent(stats.rate)} klaret`,
              `styrke ${percent(stats.strength)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
      </p>

      <div className="chain" aria-hidden>
        {stats.days.map((state, i) => (
          <span key={i} className={state} />
        ))}
      </div>

      {!notStarted && <CheckButtons habit={habit} stats={stats} date={date} />}

      <details>
        <summary className="muted">Protokol og plan</summary>
        {habit.check && (
          <p>
            <strong>Klaret når:</strong> {habit.check}
          </p>
        )}
        {habit.when && (
          <p>
            <strong>Hvornår:</strong> {habit.when}
          </p>
        )}
        {habit.ifThen && (
          <p>
            <strong>Hvis-så:</strong> {habit.ifThen}
          </p>
        )}
        {habit.protocol && <p className="protocol">{habit.protocol}</p>}
        <p className="muted">
          Succes: mindst {percent(SUCCESS_RATE)} af dagene klaret over {habit.goalDays} dage. En glemt dag gør
          ikke noget, bare kom tilbage dagen efter.
        </p>
      </details>
    </section>
  );
}

function CheckButtons({ habit, stats, date }: { habit: Habit; stats: HabitStats; date: string }) {
  const count = stats.todayCount;
  const save = (n: number) => setCount.bind(null, habit.id, habit.name, date, n);

  return (
    <div className="check-buttons">
      {habit.perDay === 1 ? (
        <ActionButton action={save(count ? 0 : 1)} className={count ? "saved" : undefined}>
          {count ? "Klaret ✓" : "Klaret"}
        </ActionButton>
      ) : (
        <>
          <ActionButton action={save(count - 1)} className="secondary" disabled={count === 0}>
            −
          </ActionButton>
          <ActionButton
            action={save(count + 1)}
            className={count >= habit.perDay ? "saved" : undefined}
            disabled={count >= habit.perDay}
          >
            {count >= habit.perDay ? `${count}/${habit.perDay} ✓` : `${count}/${habit.perDay} · +1`}
          </ActionButton>
        </>
      )}
      <ActionButton
        action={setSkip.bind(null, habit.id, habit.name, date, !stats.todaySkip)}
        className={`secondary ${stats.todaySkip ? "active" : ""}`}
      >
        Fridag
      </ActionButton>
    </div>
  );
}

function percent(value: number) {
  return `${Math.round(value * 100)} %`;
}
