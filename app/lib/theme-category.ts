// カテゴリ色の固定順契約（globals.css の --cat-1〜6）:
// 1循環器 2脳神経 3感染症 4基礎レクチャー 5研究・認定 6AI活用
export type ThemeCat = 1 | 2 | 3 | 4 | 5 | 6;

const THEME_CAT_BY_ID: Record<string, ThemeCat> = {
  cardiology: 1,
  neurology: 2,
  infectious: 3,
  foundations: 4,
  "research-career": 5,
  "ai-utilization": 6
};

export function themeCatOf(themeId: string): ThemeCat | undefined {
  return THEME_CAT_BY_ID[themeId];
}

type NamedTheme = { id: string; name: string };

export function themeNameOf(themes: NamedTheme[], themeId: string): string {
  return themes.find((theme) => theme.id === themeId)?.name ?? themeId;
}
