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
import { Programs } from "@/components/home/AboutSections";
import { LINKEDIN, fadeUp } from "@/components/home/data";
import { CompactStat, Section } from "@/components/home/shared";
import { useSiteProfile } from "@/lib/site-profile";

export function LeadForm() {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "invalid">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    const valid = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmed);
    if (!valid || trimmed.length > 320) {
      setState("invalid");
      return;
    }
    setState("loading");
    const { error } = await supabase.from("course_leads").insert({
      email: trimmed,
      language: lang,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    });
    if (error) {
      console.error(error);
      setState("error");
      return;
    }
    setState("success");
    setEmail("");
    setTimeout(() => setState("idle"), 5000);
  };

  return (
    <Section id="lead" eyebrow={t("lead_eyebrow")} title={t("lead_title")}>
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
        <motion.div {...fadeUp}>
          <p className="text-muted-foreground max-w-xl leading-relaxed">{t("lead_desc")}</p>
          <form onSubmit={submit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state !== "idle" && state !== "loading") setState("idle");
              }}
              placeholder={t("lead_placeholder")}
              maxLength={320}
              required
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="flex-1 rounded-full glass-panel px-5 py-3 text-sm outline-none focus:border-[var(--accent)] transition placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-bold hover:opacity-90 transition disabled:opacity-60"
            >
              {state === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              {t("lead_btn")}
            </button>
          </form>
          <div className="mt-3 min-h-[1.5rem] text-sm">
            {state === "success" && <span className="text-accent">✓ {t("lead_success")}</span>}
            {state === "error" && <span className="text-destructive">{t("lead_error")}</span>}
            {state === "invalid" && <span className="text-amber-400">{t("lead_invalid")}</span>}
          </div>
        </motion.div>
        <motion.div
          {...fadeUp}
          className="relative rounded-[2rem] bg-primary text-primary-foreground p-8 overflow-hidden"
        >
          <div className="absolute inset-0 bg-aurora opacity-40" />
          <div className="relative">
            <Sparkles className="size-6" style={{ color: "var(--accent)" }} />
            <div className="mt-4 font-display text-2xl font-bold leading-tight">
              {lang === "ar"
                ? "كن أول من يعرف عن الدورات الجديدة"
                : "Be the first to know about new cohorts"}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <CompactStat n="15+" l={lang === "ar" ? "برنامج" : "Programs"} />
              <CompactStat n="12+" l={lang === "ar" ? "دولة" : "Countries"} />
              <CompactStat n="9+" l={lang === "ar" ? "سنوات" : "Years"} />
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ---------- CONTACT ---------- */

export function Contact() {
  const { t } = useI18n();
  const { profile, links } = useSiteProfile();
  return (
    <Section id="contact" eyebrow={t("contact_eyebrow")} title={t("contact_title")}>
      <div className="contact-grid grid gap-5 sm:grid-cols-2">
        <ContactCard
          icon={Phone}
          label={t("contact_mobile")}
          lines={[
            <span key="sa" className="inline-flex items-center gap-2.5">
              <img
                src="https://flagcdn.com/w40/sa.png"
                srcSet="https://flagcdn.com/w80/sa.png 2x"
                width={22}
                height={16}
                alt="Saudi Arabia"
                className="rounded-[3px] ring-1 ring-foreground/15 shadow-sm shrink-0"
              />
              <span dir="ltr">{profile.phone}</span>
            </span>,
            profile.secondary_phone ? <span key="eg" className="inline-flex items-center gap-2.5">
              <img
                src="https://flagcdn.com/w40/eg.png"
                srcSet="https://flagcdn.com/w80/eg.png 2x"
                width={22}
                height={16}
                alt="Egypt"
                className="rounded-[3px] ring-1 ring-foreground/15 shadow-sm shrink-0"
              />
              <span dir="ltr">{profile.secondary_phone}</span>
            </span> : null,
          ]}
          href={links.phone}
        />
        <ContactCard
          icon={Linkedin}
          label={t("contact_linkedin")}
          lines={[t("contact_linkedin_line")]}
          href={links.linkedin}
        />
      </div>
    </Section>
  );
}

export function ContactCard({
  icon: Icon,
  label,
  lines,
  href,
}: {
  icon: any;
  label: string;
  lines: React.ReactNode[];
  href: string;
}) {
  return (
    <motion.a
      {...fadeUp}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-panel rounded-3xl p-6 transition hover:-translate-y-1 group block"
    >
      <Icon className="size-6 text-accent" />
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
      {lines.map((l, i) => (
        <div key={i} className="font-medium mt-1">
          {l}
        </div>
      ))}
      <div className="mt-4 inline-flex items-center gap-1 text-xs text-accent group-hover:gap-2 transition-all">
        Open <ArrowRight className="size-3 rtl-flip" />
      </div>
    </motion.a>
  );
}

/* ---------- FOOTER ---------- */
