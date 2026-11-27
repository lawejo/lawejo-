"use client";

import { useState } from "react";
import { normalizeTime } from "@/lib/runs";

const DISTANCES = [
  { label: "5 km", km: 5 },
  { label: "10 km", km: 10 },
  { label: "Halvmaraton", km: 21.0975 },
  { label: "Maraton", km: 42.195 },
];

// "1:45:00", "45:00" og "4500" (som i løbeloggen) bliver alle til sekunder.
function toSeconds(raw: string): number {
  const parts = normalizeTime(raw).split(":").map(Number);
  if (!raw.trim() || parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function format(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${rest}` : `${m}:${rest}`;
}

export function PaceCalculator() {
  const [mode, setMode] = useState<"pace" | "time">("pace");
  const [distance, setDistance] = useState("21,0975");
  const [time, setTime] = useState("1:45:00");
  const [pace, setPace] = useState("5:00");

  const km = Number(distance.replace(",", ".")) || 0;
  const paceSeconds = mode === "pace" ? (km ? toSeconds(time) / km : 0) : toSeconds(pace);
  const totalSeconds = mode === "time" ? paceSeconds * km : toSeconds(time);
  const kmh = paceSeconds ? 3600 / paceSeconds : 0;

  return (
    <section className="card">
      <form onSubmit={(e) => e.preventDefault()}>
        <label className="full">
          Beregn
          <select value={mode} onChange={(e) => setMode(e.target.value as "pace" | "time")}>
            <option value="pace">Pace ud fra distance og tid</option>
            <option value="time">Sluttid ud fra distance og pace</option>
          </select>
        </label>
        <label className="full">
          Distance (km)
          <input value={distance} onChange={(e) => setDistance(e.target.value)} inputMode="decimal" />
        </label>
        <nav className="chips full">
          {DISTANCES.map(({ label, km: value }) => (
            <button
              key={label}
              type="button"
              aria-pressed={km === value}
              onClick={() => setDistance(String(value).replace(".", ","))}
            >
              {label}
            </button>
          ))}
        </nav>
        {mode === "pace" ? (
          <label className="full">
            Tid
            <input value={time} onChange={(e) => setTime(e.target.value)} inputMode="numeric" placeholder="1:45:00" />
          </label>
        ) : (
          <label className="full">
            Pace (min/km)
            <input value={pace} onChange={(e) => setPace(e.target.value)} inputMode="numeric" placeholder="5:00" />
          </label>
        )}
      </form>

      <p className="result">
        {mode === "pace"
          ? paceSeconds
            ? `${format(paceSeconds)}/km`
            : "–"
          : totalSeconds
            ? format(totalSeconds)
            : "–"}
      </p>
      <p className="muted">
        {kmh ? `${kmh.toLocaleString("da-DK", { maximumFractionDigits: 1 })} km/t` : ""}
        {mode === "time" && km > 0 && paceSeconds > 0 && ` · ${format(paceSeconds)}/km over ${distance} km`}
      </p>
      <p className="muted">Tid og pace kan skrives som 1:45:00, 45:00 eller bare 4500.</p>
    </section>
  );
}
