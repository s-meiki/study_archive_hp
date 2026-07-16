"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { themeStorageKey } from "./theme-script";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const darkMediaQuery = "(prefers-color-scheme: dark)";

function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const saved = window.localStorage.getItem(themeStorageKey);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    /* localStorage 不可なら OS 追従にフォールバック */
  }

  return "system";
}

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(darkMediaQuery).matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystemTheme);

  useEffect(() => {
    const media = window.matchMedia(darkMediaQuery);
    const syncSystemTheme = () => {
      setSystemTheme(media.matches ? "dark" : "light");
    };

    syncSystemTheme();
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    try {
      if (theme === "system") {
        window.localStorage.removeItem(themeStorageKey);
      } else {
        window.localStorage.setItem(themeStorageKey, theme);
      }
    } catch {
      /* 保存不可でも切替自体は有効 */
    }
  }, [theme]);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const effective = current === "system" ? readSystemTheme() : current;
      return effective === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
