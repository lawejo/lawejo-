"use server";

import { refresh } from "next/cache";
import { notion, numberOrNull, richText } from "@/lib/notion";

export async function updateRun(pageId: string, formData: FormData) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: { select: { name: String(formData.get("status")) } },
      "Faktisk km": numberOrNull(formData.get("km")),
      Tid: richText(formData.get("time")),
      "Snit-puls": numberOrNull(formData.get("avgHr")),
      "Maks-puls": numberOrNull(formData.get("maxHr")),
      Knæsmerte: numberOrNull(formData.get("knee")),
      Note: richText(formData.get("note")),
    },
  });
  refresh();
}
