import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem("theme");
  return v === "light" ? "light" : "dark";
}

function applyTheme(t: Theme) {
  const el = document.documentElement;
  el.classList.toggle("dark", t === "dark");
  el.style.backgroundColor = t === "dark" ? "#0b1736" : "#f5f7fb";
  el.style.colorScheme = t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

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
