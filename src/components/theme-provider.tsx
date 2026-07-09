import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  caribbeanThemes,
  defaultThemeId,
  THEME_STORAGE_KEY,
  type CaribbeanTheme,
  type CaribbeanThemeId,
} from "@/lib/themes";

type ThemeContextValue = {
  themeId: CaribbeanThemeId;
  theme: CaribbeanTheme;
  themes: CaribbeanTheme[];
  setThemeId: (id: CaribbeanThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): CaribbeanThemeId {
  if (typeof window === "undefined") return defaultThemeId;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored !== defaultThemeId) {
      localStorage.setItem(THEME_STORAGE_KEY, defaultThemeId);
    }
  } catch {
    // Ignore storage failures (private browsing, etc.)
  }
  return defaultThemeId;
}

function applyThemeToDocument(themeId: CaribbeanThemeId) {
  document.documentElement.setAttribute("data-theme", themeId);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<CaribbeanThemeId>(readStoredTheme);

  useEffect(() => {
    applyThemeToDocument(themeId);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // Ignore storage failures (private browsing, etc.)
    }
  }, [themeId]);

  const setThemeId = useCallback((_id: CaribbeanThemeId) => {
    setThemeIdState(defaultThemeId);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = caribbeanThemes.find((item) => item.id === themeId) ?? caribbeanThemes[0];
    return { themeId, theme, themes: caribbeanThemes, setThemeId };
  }, [themeId, setThemeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
