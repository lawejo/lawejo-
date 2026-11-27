import { RiceCalculator } from "./RiceCalculator";

export default function RicePage() {
  return (
    <>
      <h1>Vand til ris</h1>
      <p className="muted">Jasminris i gryde: ca. 1,5 ml vand pr. gram ris.</p>
      <RiceCalculator />
    </>
  );
}
