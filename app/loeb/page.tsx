import { Suspense } from "react";
import { connection } from "next/server";
import { RACE_DATE, getRuns, nextRun, pace, type Run } from "@/lib/runs";
import { dayLabel, daysUntil, todayIso } from "@/lib/date";
import { ActionForm } from "@/components/ActionForm";
import { updateRun } from "./actions";

export default function LoebPage() {
  return (
    <>
      <h1>Hegnet Half</h1>
      <Suspense fallback={<p className="muted">Henter plan…</p>}>
        <RunPlan />
      </Suspense>
    </>
  );
}

async function RunPlan() {
  await connection();
  const runs = await getRuns();
  const today = todayIso();
  const next = nextRun(runs, today);
  const currentWeek = next?.week ?? runs.at(-1)?.week;
  const weeks = Map.groupBy(runs, (run) => run.week);

  return (
    <>
      <p className="muted">7. marts 2027 · {daysUntil(RACE_DATE, today)} dage</p>

      {next && (
        <section className="hero">
          <p className="eyebrow">
            {next.date === today ? "Dagens pas" : "Næste pas"} · Uge {next.week}
          </p>
          <RunItem key={next.id} run={next} today={today} open />
        </section>
      )}

      {[...weeks].map(([week, weekRuns]) => (
        <Week
          key={week}
          week={week}
          runs={weekRuns}
          today={today}
          open={week === currentWeek}
          past={weekRuns.every((run) => run.date < today)}
        />
      ))}
    </>
  );
}

type WeekProps = { week: number; runs: Run[]; today: string; open: boolean; past: boolean };

function Week({ week, runs, today, open, past }: WeekProps) {
  const planned = runs.reduce((sum, run) => sum + (run.planKm ?? 0), 0);
  const done = runs.reduce((sum, run) => sum + (run.km ?? 0), 0);

  return (
    <details className={`week ${past ? "past" : ""}`} open={open}>
      <summary>
        <h2>Uge {week}</h2>
        <span className="muted">
          {done > 0 && `${round(done)} / `}
          {round(planned)} km
        </span>
        <div className="progress">
          <span style={{ width: `${Math.min(100, (done / planned) * 100 || 0)}%` }} />
        </div>
      </summary>
      {runs.map((run) => (
        <RunItem key={run.id} run={run} today={today} />
      ))}
    </details>
  );
}

function RunItem({ run, today, open = false }: { run: Run; today: string; open?: boolean }) {
  const runPace = pace(run.time, run.km);

  return (
    <details className={`card run ${run.date === today ? "today" : ""}`} open={open}>
      <summary>
        <strong className={run.type === "Tempo" ? "type-tempo" : undefined}>{run.title}</strong>
        <StatusBadge status={run.status} />
        <span className="muted">
          {dayLabel(run.date, today)} · {run.planKm} km
          {run.hrTarget && ` · puls ${run.hrTarget}`}
        </span>
        <span className="muted">{runPace}</span>
      </summary>

      {run.planNote && <p className="muted">{run.planNote}</p>}

      <ActionForm action={updateRun.bind(null, run.id)} label="Gem">
        <label>
          Dato
          <input name="date" type="date" defaultValue={run.date} required />
        </label>
        <label>
          Status
          <select name="status" defaultValue={run.status || "Planlagt"}>
            <option>Planlagt</option>
            <option>Gennemført</option>
            <option>Sprunget over</option>
          </select>
        </label>
        <label>
          Km
          <input name="km" inputMode="decimal" defaultValue={run.km ?? run.planKm ?? ""} />
        </label>
        <label>
          Tid
          <input name="time" inputMode="numeric" defaultValue={run.time} placeholder="2610 = 26:10" />
        </label>
        <label>
          Snitpuls
          <input name="avgHr" inputMode="numeric" defaultValue={run.avgHr ?? ""} />
        </label>
        <label>
          Makspuls
          <input name="maxHr" inputMode="numeric" defaultValue={run.maxHr ?? ""} />
        </label>
        <label className="full">
          Knæsmerte (0–10)
          <input name="knee" inputMode="numeric" defaultValue={run.knee ?? ""} />
        </label>
        <label className="full">
          Note
          <textarea name="note" rows={2} defaultValue={run.note} />
        </label>
      </ActionForm>
    </details>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className = status === "Gennemført" ? "done" : status === "Sprunget over" ? "skipped" : "";
  return <span className={`badge ${className}`}>{status || "Planlagt"}</span>;
}

function round(km: number) {
  return Math.round(km * 10) / 10;
}
