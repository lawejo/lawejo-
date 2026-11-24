import {
  Client,
  collectPaginatedAPI,
  isFullPage,
  type PageObjectResponse,
  type QueryDataSourceParameters,
} from "@notionhq/client";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

type QueryArgs = Omit<QueryDataSourceParameters, "data_source_id">;

export async function queryAll(dataSourceId: string, args: QueryArgs = {}) {
  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: dataSourceId,
    ...args,
  });
  return results.filter(isFullPage);
}

type Property = PageObjectResponse["properties"][string] | undefined;

export function readText(p: Property): string {
  if (p?.type === "title") return p.title.map((t) => t.plain_text).join("");
  if (p?.type === "rich_text") return p.rich_text.map((t) => t.plain_text).join("");
  return "";
}

export function readNumber(p: Property): number | null {
  if (p?.type === "number") return p.number;
  if (p?.type === "rollup" && p.rollup.type === "number") return p.rollup.number;
  return null;
}

export function readSelect(p: Property): string {
  return p?.type === "select" ? (p.select?.name ?? "") : "";
}

export function readMultiSelect(p: Property): string[] {
  return p?.type === "multi_select" ? p.multi_select.map((o) => o.name) : [];
}

export function readDate(p: Property): string {
  return p?.type === "date" ? (p.date?.start ?? "") : "";
}

export function readRelationIds(p: Property): string[] {
  return p?.type === "relation" ? p.relation.map((r) => r.id) : [];
}

// Hjælpere til at skrive formularfelter tilbage som Notion-properties.
export function richText(value: FormDataEntryValue | null) {
  const content = String(value ?? "").trim();
  return { rich_text: content ? [{ text: { content } }] : [] };
}

export function numberOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().replace(",", ".");
  return { number: raw === "" ? null : Number(raw) };
}
