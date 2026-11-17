"use server";

import { refresh } from "next/cache";
import { notion, numberOrNull, richText } from "@/lib/notion";
import { LOG_DATA_SOURCE } from "@/lib/calisthenics";
import { todayIso } from "@/lib/date";

export async function logExercise(exerciseId: string, session: string, formData: FormData) {
  await notion.pages.create({
    parent: { data_source_id: LOG_DATA_SOURCE },
    properties: {
      Note: { title: richText(formData.get("note")).rich_text },
      Øvelse: { relation: [{ id: exerciseId }] },
      Pas: { select: { name: session } },
      Dato: { date: { start: todayIso() } },
      "Sæt × reps / s": richText(formData.get("sets")),
      RIR: numberOrNull(formData.get("rir")),
      Variation: richText(formData.get("variation")),
    },
  });
  refresh();
}
