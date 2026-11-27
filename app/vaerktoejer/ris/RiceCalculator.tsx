"use client";

import { useState } from "react";

// Jasminris i gryde: 1 g ris til ca. 1,5 ml vand. I riskoger fordamper mindre, så ca. 10 % mindre vand.
const WATER_PER_GRAM = 1.5;
const RICE_COOKER_FACTOR = 0.9;
// Tør ris bliver cirka tre gange så tung kogt og har ca. 79 g kulhydrat pr. 100 g.
const COOKED_FACTOR = 3;
const CARBS_PER_GRAM = 0.79;

export function RiceCalculator() {
  const [grams, setGrams] = useState("300");
  const [riceCooker, setRiceCooker] = useState(false);

  const rice = Number(grams.replace(",", ".")) || 0;
  const water = Math.round((rice * WATER_PER_GRAM * (riceCooker ? RICE_COOKER_FACTOR : 1)) / 10) * 10;

  return (
    <section className="card">
      <form onSubmit={(e) => e.preventDefault()}>
        <label className="full">
          Ris (gram, tør vægt)
          <input value={grams} onChange={(e) => setGrams(e.target.value)} inputMode="decimal" autoFocus />
        </label>
        <label className="full">
          Kogemetode
          <select value={riceCooker ? "riskoger" : "gryde"} onChange={(e) => setRiceCooker(e.target.value === "riskoger")}>
            <option value="gryde">Gryde</option>
            <option value="riskoger">Riskoger</option>
          </select>
        </label>
      </form>

      <p className="result">
        {(water / 100).toLocaleString("da-DK")} dl vand <span className="muted">({water} ml)</span>
      </p>
      <p className="muted">
        Giver ca. {Math.round(rice * COOKED_FACTOR)} g kogt ris · ca. {Math.round(rice * CARBS_PER_GRAM)} g kulhydrat
      </p>

      <details>
        <summary className="muted">Sådan koger du dem</summary>
        <ol>
          <li>Skyl risene 2–3 gange, til vandet er nogenlunde klart.</li>
          <li>Kom ris og vand i gryden og bring det i kog.</li>
          <li>Skru ned på laveste blus, læg låg på og lad dem simre i 12–15 minutter.</li>
          <li>Lad dem hvile 10 minutter med låg, og luft dem med en gaffel.</li>
        </ol>
      </details>
    </section>
  );
}
