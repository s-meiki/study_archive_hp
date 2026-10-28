export type AssetFilter = "all" | "recording" | "slides" | "notes" | "references";

export type ArchiveFilters = {
  search: string;
  themeId: string;
  asset: AssetFilter;
  year: string;
};

export const emptyArchiveFilters: ArchiveFilters = {
  search: "",
  themeId: "",
  asset: "all",
  year: "all"
};

const assetValues: readonly string[] = ["all", "recording", "slides", "notes", "references"];

export function readArchiveFilters(
  params: Pick<URLSearchParams, "get">,
  themeIds: readonly string[],
  years: readonly string[]
): ArchiveFilters {
  const themeId = params.get("theme") ?? "";
  const asset = params.get("asset") ?? "all";
  const year = params.get("year") ?? "all";
  return {
    search: params.get("q") ?? "",
    themeId: themeIds.includes(themeId) ? themeId : "",
    asset: assetValues.includes(asset) ? asset as AssetFilter : "all",
    year: years.includes(year) ? year : "all"
  };
}

/** Only replace archive filter keys; retain unrelated query parameters. */
export function writeArchiveFilters(params: URLSearchParams, filters: ArchiveFilters): URLSearchParams {
  const next = new URLSearchParams(params);
  const values = {
    q: filters.search,
    theme: filters.themeId,
    asset: filters.asset === "all" ? "" : filters.asset,
    year: filters.year === "all" ? "" : filters.year
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return next;
}
