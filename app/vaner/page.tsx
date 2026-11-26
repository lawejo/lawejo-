import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { PRIVATE_COOKIE, PRIVATE_MINUTES, PRIVATE_SCOPE, isValidSession } from "@/lib/auth";
import { lockPrivate, unlockPrivate } from "@/app/login/actions";
import { PasskeyButton } from "@/components/PasskeyButton";
import { SUCCESS_RATE, getCheckIns, getHabits, habitStats, type Habit } from "@/lib/habits";
import { todayIso } from "@/lib/date";
import { ActionButton } from "@/components/ActionButton";
import { ActionForm } from "@/components/ActionForm";
import { createHabit, updateHabit } from "./actions";
import { HabitCard } from "./HabitCard";

export default function VanerPage() {
  return (
    <>
      <h1>Vaner</h1>
      <Suspense fallback={<p className="muted">Henter vaner…</p>}>
        <HabitList />
      </Suspense>
    </>
  );
}

async function HabitList() {
  await connection();
  const today = todayIso();
  const [habits, checkIns] = await Promise.all([getHabits(), getCheckIns()]);
  // Private vaner vises kun, når de er låst op med passkey inden for de sidste 15 minutter.
  const unlocked = isValidSession((await cookies()).get(PRIVATE_COOKIE)?.value, PRIVATE_SCOPE);
  const shown = habits.filter((habit) => unlocked || !habit.private);

  return (
    <>
      {shown.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          stats={habitStats(habit, checkIns, today)}
          entries={Object.fromEntries(
            checkIns.filter((c) => c.habitId === habit.id).map((c) => [c.date, { count: c.count, skip: c.skip }]),
          )}
          today={today}
        >
          <HabitDetails habit={habit} today={today} />
        </HabitCard>
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
  const extraFields = (
    <>
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
      {habit ? (
        extraFields
      ) : (
        <details className="full">
          <summary className="muted">Flere felter</summary>
          {extraFields}
        </details>
      )}
    </>
  );
}

// Protokol, plan og redigering under hvert vanekort.
function HabitDetails({ habit, today }: { habit: Habit; today: string }) {
  return (
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
          <HabitFields habit={habit} today={today} />
        </ActionForm>
      </details>
      <p className="muted">
        Succes: mindst {percent(SUCCESS_RATE)} af dagene klaret over {habit.goalDays} dage. En glemt dag gør ikke noget,
        bare kom tilbage dagen efter.
      </p>
    </details>
  );
}

function percent(value: number) {
  return `${Math.round(value * 100)} %`;
}
