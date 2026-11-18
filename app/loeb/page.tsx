import { Suspense } from "react";
import { connection } from "next/server";
import { RACE_DATE, getRuns, pace, type Run } from "@/lib/runs";
import { dayLabel, daysUntil, todayIso } from "@/lib/date";
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
  const currentWeek = runs.find((run) => run.date >= today)?.week ?? runs.at(-1)?.week;
  const weeks = Map.groupBy(runs, (run) => run.week);

  return (
    <>
      <p className="muted">7. marts 2027 · {daysUntil(RACE_DATE, today)} dage</p>
      {[...weeks].map(([week, weekRuns]) => (
        <Week key={week} week={week} runs={weekRuns} open={week === currentWeek} today={today} />
      ))}
    </>
  );
}

function Week({ week, runs, open, today }: { week: number; runs: Run[]; open: boolean; today: string }) {
  const planned = runs.reduce((sum, run) => sum + (run.planKm ?? 0), 0);
  const done = runs.reduce((sum, run) => sum + (run.km ?? 0), 0);

  return (
    <details className="week" open={open}>
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
        <RunItem key={run.id} run={run} isToday={run.date === today} />
      ))}
    </details>
  );
}

function RunItem({ run, isToday }: { run: Run; isToday: boolean }) {
  const runPace = pace(run.time, run.km);

  return (
    <details className={`card run ${isToday ? "today" : ""}`}>
      <summary>
        <strong className={run.type === "Tempo" ? "type-tempo" : undefined}>{run.title}</strong>
        <StatusBadge status={run.status} />
        <span className="muted">
          {dayLabel(run.date)} · {run.planKm} km
          {run.hrTarget && ` · puls ${run.hrTarget}`}
        </span>
        <span className="muted">{runPace}</span>
      </summary>

      {run.planNote && <p className="muted">{run.planNote}</p>}

      <form action={updateRun.bind(null, run.id)}>
        <label className="full">
          Status
          <select name="status" defaultValue={run.status || "Planlagt"}>
            <option>Planlagt</option>
            <option>Gennemført</option>
            <option>Sprunget over</option>
          </select>
        </label>
        <label>
          Km
          <input name="km" inputMode="decimal" defaultValue={run.km ?? ""} />
        </label>
        <label>
          Tid (mm:ss)
          <input name="time" defaultValue={run.time} placeholder="27:30" />
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
        <button type="submit">Gem</button>
      </form>
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
