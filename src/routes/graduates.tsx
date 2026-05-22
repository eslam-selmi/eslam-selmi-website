import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, Languages, Moon, Sun } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import brandLogo from "@/assets/brand-logo.png";
import {
  EmpowermentTools,
  Footer,
  WhatsAppFloat,
  CalendlyDialog,
  LanguageHint,
} from "./index";

export const Route = createFileRoute("/graduates")({
  head: () => ({
    meta: [
      { title: "خريج جديد؟ — Eslam Selmi" },
      {
        name: "description",
        content:
          "برنامج عملي للخريجين الجدد لإتقان أدوات بيئة العمل: الذكاء الاصطناعي، Outlook، Canva، Trello، Google Sheets و Forms.",
      },
      { property: "og:title", content: "Empowerment Tools for New Graduates — Eslam Selmi" },
      {
        property: "og:description",
        content:
          "Hands-on program preparing fresh graduates to master AI, Outlook, Canva, Trello and Google Sheets & Forms.",
      },
    ],
  }),
  component: GraduatesPage,
});

function GraduatesPage() {
  const { t, lang, setLang, dir } = useI18n();

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("theme-mode") : null;
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    if (typeof window !== "undefined") window.localStorage.setItem("theme-mode", isDark ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent/25" dir={dir}>
      <header className="sticky top-0 inset-x-0 z-50 py-3 bg-background/85 backdrop-blur-xl border-b border-foreground/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition">
            <ArrowLeft className="size-4 rtl-flip" />
            {lang === "ar" ? "العودة للرئيسية" : "Back to home"}
          </Link>
          <Link to="/" className="flex items-center gap-1.5 group">
            <img
              src={brandLogo}
              alt="Eslam Selmi"
              width={40}
              height={40}
              className="shrink-0 object-contain drop-shadow-[0_4px_18px_rgba(80,120,255,0.35)]"
            />
            <span className="hidden sm:inline font-sans text-[14px] font-semibold tracking-tight text-foreground">
              Eslam Selmi
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : ("en" as Lang))}
              aria-label="Toggle language"
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1.5 hover:bg-foreground/5 transition"
            >
              <Languages className="size-3.5 opacity-70" />
              <span className={`font-bold leading-none ${lang === "en" ? "text-[15px] font-display" : "text-[12px] tracking-wider"}`}>
                {lang === "en" ? "ع" : "En"}
              </span>
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="size-9 grid place-items-center rounded-full border border-foreground/15 hover:bg-foreground/5 transition"
            >
              <Sun className="size-4 hidden dark:block" />
              <Moon className="size-4 dark:hidden" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-6">
        <EmpowermentTools />
      </main>

      <Footer />
      <WhatsAppFloat />
      <CalendlyDialog />
      <LanguageHint />
    </div>
  );
}
