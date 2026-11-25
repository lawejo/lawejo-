"use server";

import { refresh } from "next/cache";
import { isFullPage } from "@notionhq/client";
import { notion, numberOrNull, richText } from "@/lib/notion";
import { CHECKINS_DATA_SOURCE, HABITS_DATA_SOURCE } from "@/lib/habits";

// Én række pr. vane pr. dag: findes den, opdateres den, ellers oprettes den.
async function saveCheckIn(habitId: string, habitName: string, date: string, values: { count?: number; skip?: boolean }) {
  const properties = {
    ...(values.count !== undefined && { Antal: { number: values.count } }),
    ...(values.skip !== undefined && { Skip: { checkbox: values.skip } }),
  };

  const { results } = await notion.dataSources.query({
    data_source_id: CHECKINS_DATA_SOURCE,
    filter: {
      and: [
        { property: "Vane", relation: { contains: habitId } },
        { property: "Dato", date: { equals: date } },
      ],
    },
  });
  const existing = results.find(isFullPage);

  if (existing) {
    await notion.pages.update({ page_id: existing.id, properties });
  } else {
    await notion.pages.create({
      parent: { data_source_id: CHECKINS_DATA_SOURCE },
      properties: {
        Titel: { title: [{ text: { content: `${date} · ${habitName}` } }] },
        Vane: { relation: [{ id: habitId }] },
        Dato: { date: { start: date } },
        ...properties,
      },
    });
  }
  refresh();
}

export async function setCount(habitId: string, habitName: string, date: string, count: number) {
  await saveCheckIn(habitId, habitName, date, { count: Math.max(count, 0), skip: false });
}

export async function setSkip(habitId: string, habitName: string, date: string, skip: boolean) {
  await saveCheckIn(habitId, habitName, date, { skip, ...(skip && { count: 0 }) });
}

function habitProperties(formData: FormData) {
  return {
    Navn: { title: richText(formData.get("name")).rich_text },
    Startdato: { date: { start: String(formData.get("start")) } },
    "Mål dage": numberOrNull(formData.get("goalDays")),
    "Pr. dag": numberOrNull(formData.get("perDay")),
    Check: richText(formData.get("check")),
    Hvornår: richText(formData.get("when")),
    "Hvis-så": richText(formData.get("ifThen")),
    Protokol: richText(formData.get("protocol")),
  };
}

export async function createHabit(formData: FormData) {
  await notion.pages.create({
    parent: { data_source_id: HABITS_DATA_SOURCE },
    properties: { ...habitProperties(formData), Status: { select: { name: "Aktiv" } } },
  });
  refresh();
}

export async function updateHabit(habitId: string, formData: FormData) {
  await notion.pages.update({
    page_id: habitId,
    properties: {
      ...habitProperties(formData),
      Status: { select: { name: String(formData.get("status")) } },
    },
  });
  refresh();
}
