"use client";

import { useState } from "react";

// Model 3 SR+ (2021) har ca. 55 kWh brugbart batteri og lader højst med 11 kW på AC.
// Ca. 10 % af strømmen går tabt som varme, så der betales for lidt mere, end bilen får.
const CHARGING_LOSS = 0.1;
const CHARGERS = [
  { label: "Normallader (11 kW)", kw: 11 },
  { label: "Lynlader (gns. ca. 75 kW)", kw: 75 },
];

const number = (value: string) => Number(value.replace(",", ".")) || 0;
const da = (value: number, digits = 0) => value.toLocaleString("da-DK", { maximumFractionDigits: digits });

export function ChargingCalculator() {
  const [from, setFrom] = useState("20");
  const [to, setTo] = useState("80");
  const [battery, setBattery] = useState("55");
  const [kw, setKw] = useState("11");
  const [price, setPrice] = useState("3,95");

  const toCar = (Math.max(number(to) - number(from), 0) / 100) * number(battery);
  const paid = toCar * (1 + CHARGING_LOSS);
  const minutes = number(kw) ? (paid / number(kw)) * 60 : 0;

  return (
    <section className="card">
      <form onSubmit={(e) => e.preventDefault()}>
        <label>
          Fra (%)
          <input value={from} onChange={(e) => setFrom(e.target.value)} inputMode="numeric" />
        </label>
        <label>
          Til (%)
          <input value={to} onChange={(e) => setTo(e.target.value)} inputMode="numeric" />
        </label>
        <label>
          Batteri (kWh)
          <input value={battery} onChange={(e) => setBattery(e.target.value)} inputMode="decimal" />
        </label>
        <label>
          Pris (kr./kWh)
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
        </label>
        <label className="full">
          Ladeeffekt (kW)
          <input value={kw} onChange={(e) => setKw(e.target.value)} inputMode="decimal" />
        </label>
        <nav className="chips full">
          {CHARGERS.map(({ label, kw: value }) => (
            <button key={label} type="button" aria-pressed={number(kw) === value} onClick={() => setKw(String(value))}>
              {label}
            </button>
          ))}
        </nav>
      </form>

      <p className="result">{da(paid * number(price))} kr.</p>
      <p className="muted">
        {da(toCar, 1)} kWh til bilen · {da(paid, 1)} kWh betalt · ca.{" "}
        {Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} t ` : ""}
        {Math.round(minutes % 60)} min
      </p>
      <p className="muted">
        Prisen hos Clever varierer med sted og tidspunkt, så tjek den aktuelle pris i Clever-appen. På lynlader falder
        effekten over ca. 80 %, så det sidste stykke tager længere tid.
      </p>
    </section>
  );
}
