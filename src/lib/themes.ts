export const THEME_STORAGE_KEY = "qkr-theme";

export type CaribbeanThemeId =
  | "lagoon"
  | "golden-shore"
  | "pacific-mist"
  | "sunrise-clay"
  | "curacao-fiesta"
  | "quick-key-metallic";

export type CaribbeanTheme = {
  id: CaribbeanThemeId;
  name: string;
  tagline: string;
  swatches: [string, string, string, string];
};

export const caribbeanThemes: CaribbeanTheme[] = [
  {
    id: "lagoon",
    name: "Lagoon Breeze",
    tagline: "Turquoise sea · warm sand · sunset coral",
    swatches: ["#3BB5C8", "#F4A261", "#F8F3EA", "#2D6A6A"],
  },
  {
    id: "golden-shore",
    name: "Golden Shore",
    tagline: "Mango sunset · golden sand · shallow aqua",
    swatches: ["#E8954A", "#5BB5C9", "#FBF4E6", "#1E3A5F"],
  },
  {
    id: "pacific-mist",
    name: "Pacific Mist",
    tagline: "Apple cool light · system teal · porcelain gray",
    swatches: ["#2BA8B8", "#7AD4C8", "#F4F5F7", "#2C2C2E"],
  },
  {
    id: "sunrise-clay",
    name: "Sunrise Clay",
    tagline: "Apple warm light · clay rose · soft periwinkle",
    swatches: ["#C4795A", "#8B9FD4", "#FAF7F2", "#3D342B"],
  },
  {
    id: "curacao-fiesta",
    name: "Curaçao Fiesta",
    tagline: "Island blue · sunshine gold · palm green · beach sand",
    swatches: ["#1F8ECF", "#F5B942", "#FFF8E8", "#2E9B6A"],
  },
  {
    id: "quick-key-metallic",
    name: "Quick Key Metallic",
    tagline: "Logo red · charcoal · silver · warm paper",
    swatches: ["#E8282E", "#101010", "#E5E7EB", "#F5F4F1"],
  },
];

export const themeIds = caribbeanThemes.map((theme) => theme.id);

export const defaultThemeId: CaribbeanThemeId = "quick-key-metallic";

export function isCaribbeanThemeId(value: string | null | undefined): value is CaribbeanThemeId {
  return themeIds.includes(value as CaribbeanThemeId);
}
