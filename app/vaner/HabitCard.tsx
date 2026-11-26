"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import type { DayState, Habit, HabitStats } from "@/lib/habits";
import { daysUntil } from "@/lib/date";
import { setCount, setSkip } from "./actions";

type Entry = { count: number; skip: boolean };

type Props = {
  habit: Habit;
  stats: HabitStats;
  entries: Record<string, Entry>; // vanens check-ins pr. dato
  today: string;
  children: ReactNode; // protokol og redigering
};

const RECENT_DAYS = 21;

const LEGEND: [DayState, string][] = [
  ["done", "Klaret"],
  ["partial", "Delvist"],
  ["miss", "Glemt"],
  ["skip", "Fridag"],
  ["open", "I dag"],
  ["future", "Kommende"],
];

export function HabitCard({ habit, stats, entries, today, children }: Props) {
  const [selected, setSelected] = useState(today);
  const [showAll, setShowAll] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();
  // Knapper og kæde opdateres med det samme. Fejler det, falder de tilbage til det gemte.
  const [optimistic, update] = useOptimistic(entries, (current, next: Entry & { date: string }) => ({
    ...current,
    [next.date]: { count: next.count, skip: next.skip },
  }));

  function save(date: string, entry: Entry, action: () => Promise<void>) {
    setFailed(false);
    startTransition(async () => {
      update({ date, ...entry });
      try {
        await action();
      } catch {
        setFailed(true);
      }
    });
  }

  // Serverens tilstand for dagen, medmindre den lige er ændret og endnu ikke gemt.
  const days = stats.days.map(({ date, state }) => {
    const entry = optimistic[date];
    if (entry === entries[date] || state === "future") return { date, state };
    const value = entry.count / habit.perDay;
    const next: DayState = entry.skip
      ? "skip"
      : value >= 1
        ? "done"
        : value > 0
          ? "partial"
          : date === today
            ? "open"
            : "miss";
    return { date, state: next };
  });

  const todayIndex = days.findIndex((d) => d.date === today);
  const end = Math.max(todayIndex + 1, RECENT_DAYS);
  const visible = showAll ? days : days.slice(Math.max(end - RECENT_DAYS, 0), end);

  const entry = optimistic[selected] ?? { count: 0, skip: false };
  const todayDone = (optimistic[today]?.count ?? 0) >= habit.perDay;
  const notStarted = stats.day < 1;
  const current = streak(days);

  const saveCount = (count: number) =>
    save(selected, { count, skip: false }, () => setCount(habit.id, habit.name, selected, count));
  const toggleSkip = () =>
    save(selected, { count: entry.skip ? entry.count : 0, skip: !entry.skip }, () =>
      setSkip(habit.id, habit.name, selected, !entry.skip),
    );

  return (
    <section className={`card habit ${todayDone ? "done-today" : ""}`}>
      <header>
        <strong>{habit.name}</strong>
        <span className={`badge ${stats.succeeded ? "done" : ""}`}>
          {stats.succeeded ? "Mål nået" : habit.status === "Aktiv" ? `${habit.goalDays} dage` : habit.status}
        </span>
      </header>

      <p className="muted">
        {notStarted
          ? `Starter om ${daysUntil(habit.start, today)} dage`
          : [
              `Dag ${stats.day} af ${habit.goalDays}`,
              current > 0 && `🔥 ${current} ${current === 1 ? "dag" : "dage"} i træk`,
              stats.rate !== null && `${percent(stats.rate)} klaret`,
              `vanestyrke ${percent(stats.strength)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
      </p>

      <div className="chain">
        {visible.map(({ date, state }) =>
          state === "future" ? (
            <span key={date} className={state} title={date}>
              {Number(date.slice(8))}
            </span>
          ) : (
            <button
              key={date}
              type="button"
              className={`${state} ${date === selected && date !== today ? "selected" : ""}`}
              title={date}
              aria-label={`Registrér for ${dayName(date)}`}
              aria-pressed={date === selected}
              onClick={() => setSelected(date)}
            >
              {Number(date.slice(8))}
            </button>
          ),
        )}
      </div>

      <div className="chain-tools">
        <details>
          <summary className="muted">ⓘ Forklaring</summary>
          <ul className="legend">
            {LEGEND.map(([state, label]) => (
              <li key={state}>
                <span className={state} /> {label}
              </li>
            ))}
          </ul>
          <p className="muted">Tryk på en tidligere dag for at registrere den.</p>
          <p className="muted">
            Fridag tæller hverken med eller imod: den springes over i procent og vanestyrke og bryder ikke streaken.
          </p>
          <p className="muted">Vanestyrke vægter de seneste dage mest. En glemt dag trækker ned uden at nulstille.</p>
        </details>
        {days.length > RECENT_DAYS && (
          <button type="button" className="link" onClick={() => setShowAll(!showAll)}>
            {showAll ? `Vis kun ${RECENT_DAYS} dage` : "Vis hele perioden"}
          </button>
        )}
      </div>

      {!notStarted && (
        <>
          {selected !== today && (
            <p className="selected-day">Registrerer for {dayName(selected)} · tryk på i dag for at gå tilbage</p>
          )}
          <div className="check-buttons">
            {habit.perDay === 1 ? (
              <button
                type="button"
                className={`main ${entry.count ? "saved" : "secondary"}`}
                onClick={() => saveCount(entry.count ? 0 : 1)}
              >
                {entry.count ? "Klaret ✓" : "Klaret"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="secondary"
                  disabled={entry.count === 0}
                  onClick={() => saveCount(entry.count - 1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className={`main ${entry.count >= habit.perDay ? "saved" : "secondary"}`}
                  disabled={entry.count >= habit.perDay}
                  onClick={() => saveCount(entry.count + 1)}
                >
                  {entry.count >= habit.perDay
                    ? `${entry.count}/${habit.perDay} ✓`
                    : `${entry.count}/${habit.perDay} · +1`}
                </button>
              </>
            )}
            <button
              type="button"
              className={`secondary ${entry.skip ? "active" : ""}`}
              title="Fridag tæller hverken med eller imod"
              onClick={toggleSkip}
            >
              Fridag
            </button>
          </div>
          {failed && <p className="error">Kunne ikke gemme. Prøv igen.</p>}
        </>
      )}

      {children}
    </section>
  );
}

// Klarede dage i træk frem til i dag. Fridage springes over, og i dag tæller først, når den er klaret.
function streak(days: { state: DayState }[]) {
  let count = 0;
  for (const { state } of days.filter((d) => d.state !== "future").reverse()) {
    if (state === "open" || state === "skip") continue;
    if (state !== "done") break;
    count++;
  }
  return count;
}

function dayName(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`)
    .toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })
    .replace(/\.$/, "");
}

function percent(value: number) {
  return `${Math.round(value * 100)} %`;
}
