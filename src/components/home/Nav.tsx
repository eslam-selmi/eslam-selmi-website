import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Linkedin, ArrowRight, Menu, X, Calendar, GraduationCap, Languages, Moon, Sun, Rocket, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSiteContent } from "@/lib/site-content";
import { NAV, NAV_FULL, ThemeMode, openCalendly } from "@/components/home/data";
import { useSiteProfile } from "@/lib/site-profile";
import { BrandMark } from "@/components/home/shared";
export function Nav({
  theme,
  onThemeToggle,
}: { theme?: ThemeMode; onThemeToggle?: () => void } = {}) {
  const { t, lang, setLang } = useI18n();
  const { links } = useSiteProfile();
  const { theme: ctxTheme, toggle: ctxToggle } = useTheme();
  const { isVisible } = useSiteContent();
  const [open, setOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (portalRef.current && !portalRef.current.contains(e.target as Node)) setPortalOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const activeTheme: ThemeMode = (theme ?? ctxTheme) as ThemeMode;
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const handleThemeToggle = onThemeToggle ?? ctxToggle;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const hashHref = (id: string) => (isHome ? `#${id}` : `/#${id}`);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "py-2" : "py-4"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={`bg-card/85 backdrop-blur-xl border border-foreground/10 rounded-full ps-3 pe-2 py-2 flex items-center justify-between gap-2 ${scrolled ? "shadow-[0_8px_30px_-12px_rgba(15,27,61,0.15)]" : ""}`}
        >
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <BrandMark />
          </Link>
          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV.map((n) => {
              const baseCls =
                "px-2.5 py-1.5 text-[13px] font-bold text-foreground/85 hover:text-foreground transition-colors rounded-full hover:bg-foreground/5";
              const highlightCls =
                "group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-extrabold rounded-full transition-all hover:-translate-y-0.5 cursor-pointer";
              const highlightStyle = {
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--gold) 22%, transparent), color-mix(in oklab, var(--gold) 8%, transparent))",
                border: "1.5px solid color-mix(in oklab, var(--gold) 55%, transparent)",
                color: "var(--accent)",
                boxShadow: "0 0 0 3px color-mix(in oklab, var(--gold) 10%, transparent)",
              } as const;
              if (n.action === "book") {
                return (
                  <button key={n.id} type="button" onClick={openCalendly} className={highlightCls} style={highlightStyle}>
                    <Calendar className="size-3.5" />
                    {signedIn ? t("nav_manage_booking") : t("nav_book_consult")}
                  </button>
                );
              }
              if (n.to) {
                return n.highlight ? (
                  <Link key={n.id} to={n.to} className={highlightCls} style={highlightStyle}>
                    <Sparkles className="size-3.5" />
                    {t(n.key)}
                  </Link>
                ) : (
                  <Link key={n.id} to={n.to} className={baseCls}>
                    {t(n.key)}
                  </Link>
                );
              }
              return (
                <a key={n.id} href={hashHref(n.id)} className={baseCls}>
                  {t(n.key)}
                </a>
              );
            })}
            <Link
              to="/graduates"
              className="ms-2 group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-extrabold tracking-tight border-2 transition-all hover:-translate-y-0.5"
              style={{
                borderColor: "var(--accent)",
                color: "var(--accent)",
                background:
                  "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.10), oklch(0.75 0.13 85 / 0.02))",
                boxShadow: "0 0 0 3px oklch(0.75 0.13 85 / 0.08)",
              }}
            >
              <Rocket className="size-3.5" />
              {t("nav_empowerment")}
            </Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : ("en" as Lang))}
              aria-label="Toggle language"
              className="group inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1.5 hover:bg-foreground/5 hover:border-foreground/30 transition"
            >
              <Languages className="size-3.5 opacity-70" />
              <span
                className={`font-bold leading-none ${lang === "en" ? "text-[15px] font-display" : "text-[12px] tracking-wider"}`}
              >
                {lang === "en" ? "ع" : "En"}
              </span>
            </button>
            <button
              onClick={handleThemeToggle}
              aria-label="Toggle theme"
              className="relative inline-flex size-9 items-center justify-center rounded-full border border-foreground/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden group glass"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 to-lavender/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.div
                key={activeTheme}
                initial={{ y: 12, rotate: 45, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative z-10 flex items-center justify-center"
              >
                {activeTheme === "dark" ? (
                  <Sun className="size-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                ) : (
                  <Moon className="size-4 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                )}
              </motion.div>
            </button>
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hidden sm:inline-flex size-9 items-center justify-center rounded-full border border-foreground/10 hover:bg-foreground/5 transition"
            >
              <Linkedin className="size-4" />
            </a>
            {/* Portal access — elegant gold-ringed dropdown */}
            <div className="relative" ref={portalRef}>
              <button
                onClick={() => setPortalOpen((v) => !v)}
                aria-label={lang === "ar" ? "بوابة الدخول" : "Portal access"}
                aria-expanded={portalOpen}
                className="relative inline-flex size-9 items-center justify-center rounded-full transition-all group"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.18), oklch(0.75 0.13 85 / 0.04))",
                  border: "1.5px solid oklch(0.75 0.13 85 / 0.55)",
                  boxShadow: portalOpen
                    ? "0 0 0 4px oklch(0.75 0.13 85 / 0.18), 0 6px 20px -8px oklch(0.75 0.13 85 / 0.55)"
                    : "0 0 0 0 transparent",
                }}
              >
                <KeyRound className="size-[15px]" style={{ color: "var(--accent)" }} />
                <span
                  className="absolute -top-0.5 -end-0.5 size-2 rounded-full"
                  style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }}
                />
              </button>
              <AnimatePresence>
                {portalOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute end-0 mt-3 w-64 rounded-2xl overflow-hidden z-50"
                    style={{
                      background: "rgba(11,23,54,0.96)",
                      border: "1px solid oklch(0.75 0.13 85 / 0.35)",
                      boxShadow:
                        "0 20px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px oklch(0.75 0.13 85 / 0.12)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div
                      className="px-4 py-3 border-b text-[11px] font-bold tracking-[0.18em] uppercase"
                      style={{
                        borderColor: "oklch(0.75 0.13 85 / 0.18)",
                        color: "oklch(0.75 0.13 85)",
                        background:
                          "linear-gradient(90deg, oklch(0.75 0.13 85 / 0.10), transparent)",
                      }}
                    >
                      {lang === "ar" ? "بوابة الدخول" : "Access Portal"}
                    </div>
                    <Link
                      to="/auth"
                      search={{ role: "admin" }}
                      onClick={() => setPortalOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors group"
                      style={{ color: "white" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "oklch(0.75 0.13 85 / 0.10)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span
                        className="size-9 grid place-items-center rounded-xl shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.25), oklch(0.75 0.13 85 / 0.08))",
                          border: "1px solid oklch(0.75 0.13 85 / 0.40)",
                        }}
                      >
                        <ShieldCheck className="size-4" style={{ color: "var(--accent)" }} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold leading-tight">
                          {lang === "ar" ? "دخول الإدارة" : "Admin Login"}
                        </div>
                        <div className="text-[11px] opacity-60 leading-tight mt-0.5">
                          {lang === "ar" ? "لوحة تحكم المسؤول" : "Administrator dashboard"}
                        </div>
                      </div>
                      <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 rtl-flip transition-all" />
                    </Link>
                    <Link
                      to="/auth"
                      search={{ role: "trainee" }}
                      onClick={() => setPortalOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors group border-t"
                      style={{ color: "white", borderColor: "oklch(0.75 0.13 85 / 0.12)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "oklch(0.75 0.13 85 / 0.10)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span
                        className="size-9 grid place-items-center rounded-xl shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.25), oklch(0.75 0.13 85 / 0.08))",
                          border: "1px solid oklch(0.75 0.13 85 / 0.40)",
                        }}
                      >
                        <GraduationCap className="size-4" style={{ color: "var(--accent)" }} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold leading-tight">
                          {lang === "ar" ? "دخول المتدربين" : "Trainee Login"}
                        </div>
                        <div className="text-[11px] opacity-60 leading-tight mt-0.5">
                          {lang === "ar" ? "بوابة المتدربين والشهادات" : "Trainees & certificates"}
                        </div>
                      </div>
                      <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 rtl-flip transition-all" />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="xl:hidden p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="xl:hidden mt-2 glass-strong rounded-2xl p-3 grid gap-1">
            {NAV_FULL.map((n) => {
              if (n.action === "book") {
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={(e) => {
                      setOpen(false);
                      openCalendly(e);
                    }}
                    className="my-1 inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold tracking-tight transition-all"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in oklab, var(--gold) 22%, transparent), color-mix(in oklab, var(--gold) 6%, transparent))",
                      border: "1.5px solid color-mix(in oklab, var(--gold) 55%, transparent)",
                      color: "var(--accent)",
                      boxShadow: "0 0 0 3px color-mix(in oklab, var(--gold) 10%, transparent)",
                    }}
                  >
                    <span
                      className="size-7 grid place-items-center rounded-lg"
                      style={{
                        background: "color-mix(in oklab, var(--gold) 18%, transparent)",
                        border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)",
                      }}
                    >
                      <Calendar className="size-3.5" />
                    </span>
                    <span className="flex-1 text-start">{signedIn ? t("nav_manage_booking") : t("nav_book_consult")}</span>
                    <ArrowRight className="size-4 rtl-flip opacity-70" />
                  </button>
                );
              }
              if (n.id === "empowerment") {
                return (
                  <Link
                    key={n.id}
                    to={n.to!}
                    onClick={() => setOpen(false)}
                    className="my-1 inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold tracking-tight border-2 transition-all"
                    style={{
                      borderColor: "var(--accent)",
                      color: "var(--accent)",
                      background:
                        "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.12), oklch(0.75 0.13 85 / 0.03))",
                      boxShadow: "0 0 0 3px oklch(0.75 0.13 85 / 0.08)",
                    }}
                  >
                    <span className="size-7 grid place-items-center rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30">
                      <Rocket className="size-3.5" />
                    </span>
                    <span className="flex-1">{t(n.key)}</span>
                    <ArrowRight className="size-4 rtl-flip opacity-70" />
                  </Link>
                );
              }
              if (n.highlight && n.to) {
                return (
                  <Link
                    key={n.id}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="my-1 inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold tracking-tight transition-all"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in oklab, var(--gold) 22%, transparent), color-mix(in oklab, var(--gold) 6%, transparent))",
                      border: "1.5px solid color-mix(in oklab, var(--gold) 55%, transparent)",
                      color: "var(--accent)",
                      boxShadow: "0 0 0 3px color-mix(in oklab, var(--gold) 10%, transparent)",
                    }}
                  >
                    <span
                      className="size-7 grid place-items-center rounded-lg"
                      style={{
                        background: "color-mix(in oklab, var(--gold) 18%, transparent)",
                        border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)",
                      }}
                    >
                      <Sparkles className="size-3.5" />
                    </span>
                    <span className="flex-1">{t(n.key)}</span>
                    <ArrowRight className="size-4 rtl-flip opacity-70" />
                  </Link>
                );
              }
              return n.to ? (
                <Link
                  key={n.id}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-foreground/5 text-sm font-bold text-foreground/85"
                >
                  {t(n.key)}
                </Link>
              ) : (
                <a
                  key={n.id}
                  href={hashHref(n.id)}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-foreground/5 text-sm font-bold text-foreground/85"
                >
                  {t(n.key)}
                </a>
              );
            })}
            <button
              onClick={(e) => {
                setOpen(false);
                openCalendly(e);
              }}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold cursor-pointer"
            >
              <Calendar className="size-4" /> {t("book_cta")}
            </button>
            <div className="mt-2 pt-2 border-t border-foreground/10 grid grid-cols-2 gap-2">
              <Link
                to="/auth"
                search={{ role: "admin" }}
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.18), oklch(0.75 0.13 85 / 0.05))",
                  border: "1px solid oklch(0.75 0.13 85 / 0.45)",
                  color: "var(--accent)",
                }}
              >
                <ShieldCheck className="size-4" />
                {lang === "ar" ? "دخول الإدارة" : "Admin"}
              </Link>
              <Link
                to="/auth"
                search={{ role: "trainee" }}
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.18), oklch(0.75 0.13 85 / 0.05))",
                  border: "1px solid oklch(0.75 0.13 85 / 0.45)",
                  color: "var(--accent)",
                }}
              >
                <GraduationCap className="size-4" />
                {lang === "ar" ? "المتدربين" : "Trainees"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
/* ---------- HERO ---------- */
