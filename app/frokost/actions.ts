"use server";

import { cookies } from "next/headers";
import type { StoreKey } from "@/lib/offers";
import { STORE_COOKIE, selectedStores } from "./stores";

// Slår en butik til eller fra. Valget huskes i et år.
export async function toggleStore(formData: FormData) {
  const store = String(formData.get("store"));
  const cookieStore = await cookies();
  const current = selectedStores(cookieStore.get(STORE_COOKIE)?.value);
  const next = current.includes(store as StoreKey)
    ? current.filter((s) => s !== store)
    : [...current, store];

  cookieStore.set(STORE_COOKIE, next.join(",") || "ingen", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}
