import { STORES, type StoreKey } from "@/lib/offers";

export const STORE_COOKIE = "lawejo_butikker";

// Uden cookie tæller alle butikker med. "ingen" betyder, at alle er slået fra.
export function selectedStores(value: string | undefined): StoreKey[] {
  if (!value) return STORES.map((s) => s.key);
  return STORES.map((s) => s.key).filter((key) => value.split(",").includes(key));
}
