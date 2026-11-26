import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { PRIVATE_COOKIE, PRIVATE_MINUTES, PRIVATE_SCOPE, isValidSession } from "@/lib/auth";
import { lockPrivate, unlockPrivate } from "@/app/login/actions";
import { PasskeyButton } from "@/components/PasskeyButton";
import { SUCCESS_RATE, addDays, getCheckIns, getHabits, habitStats, type Habit, type HabitStats } from "@/lib/habits";
import { daysUntil, todayIso } from "@/lib/date";
import { ActionButton } from "@/components/ActionButton";
import { ActionForm } from "@/components/ActionForm";
import { createHabit, setCount, setSkip, updateHabit } from "./actions";

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
  // Private vaner vises kun, når de er låst op med passkey inden for de sidste 15 minutter.
  const unlocked = isValidSession((await cookies()).get(PRIVATE_COOKIE)?.value, PRIVATE_SCOPE);
  const shown = habits.filter((habit) => unlocked || !habit.private);

  return (
    <>
      <nav className="tabs">
        <Link href="?" aria-current={dag !== "igaar" ? "page" : undefined}>I dag</Link>
        <Link href="?dag=igaar" aria-current={dag === "igaar" ? "page" : undefined}>I går</Link>
      </nav>

      {shown.map((habit) => (
        <HabitCard key={habit.id} habit={habit} stats={habitStats(habit, checkIns, date)} date={date} />
      ))}

      <details className="card">
        <summary>
          <strong>Ny vane</strong>
        </summary>
        <ActionForm action={createHabit} label="Opret">
          <HabitFields today={today} />
        </ActionForm>
      </details>

      <div className="private-toggle">
        {unlocked ? (
          <ActionButton action={lockPrivate} className="secondary">
            🔓 Lås ({PRIVATE_MINUTES} min)
          </ActionButton>
        ) : (
          <PasskeyButton action={unlockPrivate} label="🔒" className="secondary" />
        )}
      </div>
    </>
  );
}

// Felterne til en vane. Med `habit` er de udfyldt til redigering og har også Status.
function HabitFields({ habit, today }: { habit?: Habit; today: string }) {
  return (
    <>
      <label className="full">
        Navn
        <input name="name" defaultValue={habit?.name} required />
      </label>
      <label>
        Mål (dage)
        <input name="goalDays" inputMode="numeric" defaultValue={habit?.goalDays ?? 66} />
      </label>
      <label>
        Gange pr. dag
        <input name="perDay" inputMode="numeric" defaultValue={habit?.perDay ?? 1} />
      </label>
      <label>
        Startdato
        <input name="start" type="date" defaultValue={habit?.start || today} required />
      </label>
      {habit && (
        <label>
          Status
          <select name="status" defaultValue={habit.status}>
            <option>Aktiv</option>
            <option>Vedligehold</option>
            <option>Pause</option>
            <option>Arkiveret</option>
          </select>
        </label>
      )}
      <label className={habit ? "full" : undefined}>
        Synlighed
        <select name="private" defaultValue={habit?.private ? "ja" : "nej"}>
          <option value="nej">Synlig</option>
          <option value="ja">Privat (kræver passkey)</option>
        </select>
      </label>
      <label className="full">
        Hvornår tæller dagen som klaret?
        <input name="check" defaultValue={habit?.check} />
      </label>
      <label className="full">
        Hvornår og hvor
        <input name="when" defaultValue={habit?.when} placeholder="Efter tandbørstning om morgenen" />
      </label>
      <label className="full">
        Hvis-så-plan
        <input name="ifThen" defaultValue={habit?.ifThen} placeholder="Hvis jeg får trang, så …" />
      </label>
      <label className="full">
        Protokol
        <textarea name="protocol" rows={habit ? 10 : 5} maxLength={2000} defaultValue={habit?.protocol} />
      </label>
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

      <div className="chain">
        {stats.days.map(({ date, state }) => (
          <span key={date} className={state} title={date}>
            {Number(date.slice(8))}
          </span>
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
        <details>
          <summary className="muted">Redigér</summary>
          <ActionForm action={updateHabit.bind(null, habit.id)} label="Gem">
            <HabitFields habit={habit} today={date} />
          </ActionForm>
        </details>
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
