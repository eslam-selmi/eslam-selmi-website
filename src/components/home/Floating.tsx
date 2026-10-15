import { BookingDialog } from "@/components/booking/BookingDialog";
import { TraineeReviews } from "@/components/TraineeReviews";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform, MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Globe2,
  Layers,
  MessageCircle,
  Mail,
  Linkedin,
  Phone,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Calendar,
  Target,
  Lightbulb,
  HeartHandshake,
  GraduationCap,
  Award,
  Users,
  TrendingUp,
  BarChart3,
  UserCheck,
  Languages,
  ArrowUp,
  Loader2,
  Briefcase,
  BadgeCheck,
  
  Presentation,
  Moon,
  Sun,
  Mic,
  BookOpen,
  Library as LibraryIcon,
  FileText,
  Download,
  ExternalLink,
  Rocket,
  Wand2,
  Mail as MailIcon,
  Palette,
  Trello,
  Table2,
  Bot,
  Quote,
  ShieldCheck,
  KeyRound,
  LogIn,
  Clock,
  User as UserIcon,
  MessageSquare,
  Check,
  Video,
  PlayCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LatestAdditionsSection } from "@/components/LatestAdditions";
import { useSiteContent } from "@/lib/site-content";
import { SitePopup } from "@/components/SitePopup";
import { UniversalEmbedModal } from "@/components/UniversalEmbedModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  COUNTRIES as PHONE_COUNTRIES,
  findCountry as findDialCountry,
  sanitizeNationalNumber,
  validatePhoneForCountry,
} from "@/lib/countries";
import headshotAsset from "@/assets/portfolio/headshot-cutout.png.asset.json";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import snap1Asset from "@/assets/snapshots/snap-1.jpg.asset.json";
import snap2Asset from "@/assets/snapshots/snap-2.jpg.asset.json";
import snap3Asset from "@/assets/snapshots/snap-3.jpg.asset.json";
import snap4Asset from "@/assets/snapshots/snap-4.jpg.asset.json";
import snap5Asset from "@/assets/snapshots/snap-5.jpg.asset.json";
import snap6Asset from "@/assets/snapshots/snap-6.jpg.asset.json";
import snap7Asset from "@/assets/snapshots/snap-7.jpg.asset.json";
import etecLicenseAsset from "@/assets/etec-license.png.asset.json";
import snap8Asset from "@/assets/snapshots/snap-8.jpg.asset.json";
import logoAramexAsset from "@/assets/clients/aramex.jpg.asset.json";
import logoG4sAsset from "@/assets/clients/g4s.jpg.asset.json";
import logoAllerAquaAsset from "@/assets/clients/aller-aqua.jpg.asset.json";
import logoEvnoAsset from "@/assets/clients/evno.jpg.asset.json";
import logoBadreldinAsset from "@/assets/clients/badreldin.jpg.asset.json";
import logoAmazonEgAsset from "@/assets/clients/amazon-eg.jpg.asset.json";
import logoAlmajarahAsset from "@/assets/clients/almajarah.jpg.asset.json";
import logoImtenanAsset from "@/assets/clients/imtenan.jpg.asset.json";
import logoDaralnokbaAsset from "@/assets/clients/daralnokba.jpg.asset.json";
import logoMallOfEgyptAsset from "@/assets/clients/mall-of-egypt.jpg.asset.json";
import logoNewBrandAsset from "@/assets/clients/new-brand.jpg.asset.json";
import snap10Asset from "@/assets/snapshots/snap-10.jpg.asset.json";
import snap11Asset from "@/assets/snapshots/snap-11.jpg.asset.json";
import snap12Asset from "@/assets/snapshots/snap-12.jpg.asset.json";
import snap13Asset from "@/assets/snapshots/snap-13.jpg.asset.json";
import snap15Asset from "@/assets/snapshots/snap-15.jpg.asset.json";
import snap16Asset from "@/assets/snapshots/snap-16.jpg.asset.json";


export function WhatsAppFloat() {
  return null;
}

/* ---------- ASK SELMI FLOATING (removed — kept as no-op for backward compat) ---------- */

export function AskSelmiFloat() {
  return null;
}

/* ---------- SCROLL TOP ---------- */

export function ScrollTop() {
  const { dir } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const side = dir === "rtl" ? "left-5" : "right-5";
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          key="scroll-top"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className={`fixed bottom-12 ${side} z-40 size-10 grid place-items-center rounded-full text-primary-foreground shadow-lg hover:scale-110 transition`}
          style={{
            background:
              "linear-gradient(135deg, var(--lavender), var(--gold))",
          }}
        >
          <ArrowUp className="size-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ---------- LANGUAGE HINT TOAST ---------- */

export function LanguageHint() {
  const { lang, setLang, t, dir } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("lang-hint-seen")) return;
    const showTimer = setTimeout(() => setShow(true), 1500);
    const hideTimer = setTimeout(() => {
      setShow(false);
      window.localStorage.setItem("lang-hint-seen", "1");
    }, 6500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    if (typeof window !== "undefined") window.localStorage.setItem("lang-hint-seen", "1");
  };

  const switchLang = () => {
    setLang(lang === "en" ? "ar" : "en");
    dismiss();
  };

  // Suggest the OTHER language
  const suggestAr = lang === "en";
  const title = suggestAr ? t("lang_hint_title_ar") : t("lang_hint_title_en");
  const desc = suggestAr ? t("lang_hint_desc_ar") : t("lang_hint_desc_en");
  const switchLabel = suggestAr ? t("lang_hint_switch_ar") : t("lang_hint_switch_en");
  const toastDir = suggestAr ? "rtl" : "ltr";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ duration: 0.5, ease: [0.21, 0.5, 0.3, 1] }}
          className={`fixed top-24 z-[60] max-w-[92vw] w-[360px] ${dir === "rtl" ? "left-5" : "right-5"}`}
          role="status"
          aria-live="polite"
          dir={toastDir}
        >
          {/* outer glow */}
          <div
            className="absolute -inset-1 rounded-[1.5rem] opacity-70 blur-2xl pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--gold) 40%, transparent), color-mix(in oklab, var(--accent) 35%, transparent))",
            }}
          />
          <div
            className="relative rounded-2xl overflow-hidden backdrop-blur-2xl text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            style={{
              background:
                "linear-gradient(160deg, rgba(11,23,54,0.92) 0%, rgba(8,16,40,0.96) 100%)",
              border: "1px solid color-mix(in oklab, var(--gold) 25%, rgba(255,255,255,0.08))",
            }}
          >
            {/* decorative gradient orbs */}
            <div
              className="absolute inset-0 opacity-80 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 100% 0%, color-mix(in oklab, var(--gold) 30%, transparent), transparent 60%), radial-gradient(ellipse 60% 50% at 0% 100%, color-mix(in oklab, var(--accent) 30%, transparent), transparent 65%)",
              }}
            />
            {/* subtle grain border highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <div className="relative p-5 flex items-start gap-3.5">
              <span className="relative shrink-0 mt-0.5">
                <span
                  className="absolute inset-0 rounded-full blur-md animate-pulse"
                  style={{ background: "color-mix(in oklab, var(--gold) 55%, transparent)" }}
                />
                <span
                  className="relative grid place-items-center size-10 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, var(--gold) 25%, transparent), color-mix(in oklab, var(--accent) 25%, transparent))",
                    border: "1px solid color-mix(in oklab, var(--gold) 50%, transparent)",
                  }}
                >
                  <Languages className="size-[18px]" style={{ color: "var(--gold)" }} />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-[15px] leading-tight">{title}</div>
                <p className="text-[12.5px] text-white/75 mt-1.5 leading-relaxed">{desc}</p>
                <button
                  onClick={switchLang}
                  className="group/lng mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-300 hover:translate-y-[-1px]"
                  style={{
                    background: "linear-gradient(135deg, var(--gold) 0%, #f4d98a 100%)",
                    color: "#0a0f2c",
                    boxShadow:
                      "0 10px 24px -10px color-mix(in oklab, var(--gold) 70%, transparent)",
                  }}
                >
                  <Languages className="size-3.5" /> {switchLabel}
                  <ArrowRight className="size-3.5 rtl-flip group-hover/lng:translate-x-0.5 transition" />
                </button>
              </div>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="shrink-0 size-7 grid place-items-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 6.5, ease: "linear" }}
              className="h-[2px] origin-left"
              style={{
                background:
                  "linear-gradient(90deg, var(--gold), color-mix(in oklab, var(--accent) 80%, transparent))",
                transformOrigin: toastDir === "rtl" ? "right" : "left",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- EMPOWERMENT TOOLS (for new graduates) ---------- */
