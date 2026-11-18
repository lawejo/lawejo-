// Vercel kører i UTC, så "i dag" regnes altid ud i dansk tid.
export function todayIso(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Copenhagen" });
}

export function dayLabel(isoDate: string, today = todayIso()): string {
  const diff = daysUntil(isoDate, today);
  if (diff === 0) return "I dag";
  if (diff === 1) return "I morgen";
  if (diff === -1) return "I går";

  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  });
}

export function daysUntil(isoDate: string, from = todayIso()): number {
  const ms = Date.parse(`${isoDate}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`);
  return Math.round(ms / 86_400_000);
}
