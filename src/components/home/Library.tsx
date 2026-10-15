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
import { LIBRARY_EMBED_URL, LIBRARY_OPEN_URL } from "@/components/home/data";
import { Section } from "@/components/home/shared";

export function Library() {
  const { t, dir } = useI18n();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <Section id="library" eyebrow={t("library_eyebrow")} title={t("library_title")}>
      <motion.div
        {...fadeUp}
        className="relative mx-auto max-w-5xl rounded-[2rem] overflow-hidden bg-card border border-foreground/10 shadow-[0_30px_80px_-40px_oklch(0.22_0.06_252/0.35)]"
      >
        <div className="grid md:grid-cols-[1.2fr_1fr]">
          {/* Content */}
          <div className="p-7 sm:p-10 flex flex-col gap-5 order-2 md:order-1">
            <div className="inline-flex md:hidden items-center gap-2 self-start rounded-full bg-[var(--lavender-deep)]/10 text-[var(--lavender-deep)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]">
              <LibraryIcon className="size-3.5" /> {t("library_eyebrow")}
            </div>
            <h3 className="font-display font-extrabold text-foreground leading-[1.15] text-[clamp(1.5rem,2.6vw,2rem)]">
              {t("library_title")}
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-xl">{t("library_desc")}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.04] px-3 py-1.5">
                <FileText className="size-3.5" /> E-books
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.04] px-3 py-1.5">
                <Layers className="size-3.5" /> Templates
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.04] px-3 py-1.5">
                <Target className="size-3.5" /> Frameworks
              </span>
            </div>
            <div className="rule" />
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="group inline-flex items-center gap-2.5 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-bold hover:opacity-90 transition shadow-lg cursor-pointer"
              >
                <LibraryIcon className="size-4" />
                {t("library_btn")}
                <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
              </button>
              <a
                href={LIBRARY_OPEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-5 py-3 text-sm font-semibold hover:bg-foreground/5 transition"
              >
                <ExternalLink className="size-4" /> {t("library_open_drive")}
              </a>
            </div>
          </div>
          {/* Accent panel */}
          <div
            className="relative hidden md:block p-10 overflow-hidden order-1 md:order-2"
            style={{
              background:
                "linear-gradient(135deg, var(--lavender-deep) 0%, var(--navy-deep) 55%, var(--navy) 100%)",
            }}
          >
            <div className="absolute inset-0 grain opacity-25 pointer-events-none" />
            <div className="relative h-full flex flex-col justify-between text-white">
              <div className="flex items-start justify-between">
                <div className="size-14 grid place-items-center rounded-2xl bg-white/15 backdrop-blur border border-white/25">
                  <LibraryIcon className="size-7" />
                </div>
                <Download className="size-5 opacity-70" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80">
                  {t("library_meta")}
                </div>
                <div className="mt-3 font-display text-3xl font-extrabold leading-tight">
                  {t("library_eyebrow")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          dir={dir}
        >
          <div
            className="relative w-full max-w-4xl h-[90vh] rounded-2xl overflow-hidden bg-card shadow-2xl border border-foreground/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/10 bg-card shrink-0 gap-3">
              <div className="min-w-0">
                <div className="font-display font-bold text-sm sm:text-base truncate">
                  {t("library_modal_title")}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {t("library_modal_desc")}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={LIBRARY_OPEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-semibold hover:bg-foreground/5 transition"
                >
                  <ExternalLink className="size-3.5" /> {t("library_open_drive")}
                </a>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="size-9 grid place-items-center rounded-full hover:bg-foreground/10 transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <iframe
              src={LIBRARY_EMBED_URL}
              title="Knowledge Library"
              className="w-full flex-1 border-0 bg-white"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </Section>
  );
}

/* ---------- LEAD FORM ---------- */
