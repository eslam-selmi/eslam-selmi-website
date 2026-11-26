import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

// Trainee and admin panels have their own theme (default light, easier on the eyes). The public site keeps its own (default dark).
const isPanelPath = (p: string) => p === "/portal" || p.startsWith("/portal/") || p === "/admin" || p.startsWith("/admin/");

function readKey(key: string, fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  return v === "light" || v === "dark" ? v : fallback;
}

function applyTheme(t: Theme) {
  const el = document.documentElement;
  el.classList.toggle("dark", t === "dark");
  el.style.removeProperty("background-color");
  el.style.colorScheme = t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const panel = isPanelPath(pathname);
  const [siteTheme, setSiteTheme] = useState<Theme>(() => readKey("theme", "dark"));
  const [panelTheme, setPanelTheme] = useState<Theme>(() => readKey("panelTheme", "light"));
  const theme = panel ? panelTheme : siteTheme;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => { try { localStorage.setItem("theme", siteTheme); } catch {} }, [siteTheme]);
  // The panel choice is saved only after the user picks one, so the default stays light until then.

  const toggle = useCallback(() => {
    if (panel) setPanelTheme((t) => { const n = t === "dark" ? "light" : "dark"; try { localStorage.setItem("panelTheme", n); } catch {} return n; });
    else setSiteTheme((t) => (t === "dark" ? "light" : "dark"));
  }, [panel]);

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-foreground/90 backdrop-blur transition hover:bg-white/10 hover:text-foreground ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
