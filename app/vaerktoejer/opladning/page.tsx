import { ChargingCalculator } from "./ChargingCalculator";

export default function ChargingPage() {
  return (
    <>
      <h1>Opladning af elbil</h1>
      <p className="muted">Udgangspunkt: Tesla Model 3 SR+ (2021), ca. 55 kWh brugbart batteri.</p>
      <ChargingCalculator />
    </>
  );
}
