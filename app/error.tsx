"use client";

export default function Error({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <>
      <h1>Noget gik galt</h1>
      <p className="muted">
        Tjek at NOTION_TOKEN er sat i Vercel, og at integrationen har adgang til Workout-siden.
      </p>
      <p className="muted">{error.message}</p>
      <button type="button" onClick={() => retry()}>
        Prøv igen
      </button>
    </>
  );
}
