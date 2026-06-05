"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}>({ theme: "light", toggleTheme: () => {}, setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start from whatever the no-flash script already set on <html> (avoids hydration mismatch).
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const initial: Theme =
      document.documentElement.classList.contains("dark") ? "dark" : "light";
    setThemeState(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    apply(t);
    try {
      localStorage.setItem("tdc-theme", t);
    } catch {
      /* ignore (private mode etc.) */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
