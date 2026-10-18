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
import { PILLARS, WHATSAPP, brandLogo, fadeUp } from "@/components/home/data";
import { useSiteProfile } from "@/lib/site-profile";

export function CalendlyDialog() {
  return <BookingDialog />;
}

/* ---------- BRAND MARK ---------- */

export function BrandMark({ size = 62 }: { size?: number }) {
  const { lang } = useI18n();
  const { profile } = useSiteProfile();
  const displayName = lang === "ar" ? "إسلام سلمي" : "Eslam Selmi";
  return (
    <div className="flex items-center gap-2">
      <img
        src={profile.logo}
        alt={displayName}
        width={size}
        height={size}
        className="shrink-0 object-contain drop-shadow-[0_1px_3px_rgba(80,120,255,0.2)] dark:[filter:drop-shadow(0_0_3px_rgba(255,255,255,0.25))_drop-shadow(0_0_8px_rgba(160,190,255,0.28))_brightness(1.08)]"
        style={{ width: size, height: size }}
        suppressHydrationWarning
      />
      <span className="flex items-center leading-none">
        <span
          className="font-display text-[15px] sm:text-[17px] font-bold tracking-tight text-foreground whitespace-nowrap"
          suppressHydrationWarning
        >
          {displayName}
        </span>
      </span>
    </div>
  );
}

export function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <div className="font-display text-3xl sm:text-4xl text-foreground">{n}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{l}</div>
    </div>
  );
}

export function CompactStat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-3 text-center min-w-0">
      <div
        className="font-display text-xl sm:text-2xl font-extrabold leading-none truncate"
        style={{ color: "var(--accent)" }}
      >
        {n}
      </div>
      <div className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground truncate">
        {l}
      </div>
    </div>
  );
}

/* ---------- PILLARS ---------- */

export function isEmpowermentCourse(title: string | null | undefined): boolean {
  if (!title) return false;
  const t = title.trim().toLowerCase();
  return t.includes("أدوات التمكين") || t.includes("empowerment tools");
}

export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="px-4 sm:px-6 py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <div className="absolute -end-40 top-20 size-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className={title ? "mb-12 lg:mb-16" : "mb-0"}>
          {eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full bg-foreground/[0.06] border border-foreground/10 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.28em] text-foreground font-bold mb-5">
              <span className="size-1.5 rounded-full bg-accent" />
              {eyebrow}
            </div>
          )}
          {title && (
            <h2 className="font-display leading-[1.05] tracking-tight text-foreground text-[clamp(1.9rem,4.4vw,3.75rem)] whitespace-normal lg:whitespace-nowrap">
              {title}
            </h2>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

/* ---------- WHATSAPP FLOAT ---------- */
