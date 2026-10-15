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
import { BRANDS, COUNTRIES, SNAPSHOTS, fadeUp } from "@/components/home/data";
import { CompactStat, Section } from "@/components/home/shared";

export function Clients() {
  const { t, lang } = useI18n();
  return (
    <Section id="clients" eyebrow={t("clients_eyebrow")} title={t("clients_title")}>
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <motion.div {...fadeUp}>
          <div className="font-display text-[8rem] lg:text-[10rem] leading-none font-bold text-gradient-gold">
            12
          </div>
          <p className="text-xl font-medium mt-2">{t("clients_sub")}</p>
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
            <CompactStat n="3000+" l={t("stat_trainees")} />
            <CompactStat n="12+" l={t("nav_clients")} />
            <CompactStat n="15+" l={t("stat_programs")} />
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Globe2 className="size-4 text-gold" />
            Egypt · KSA · UAE · Levant · North Africa
          </div>
        </motion.div>
        <div className="grid grid-cols-4 gap-3">
          {COUNTRIES.map((c, i) => (
            <motion.div
              key={c.code}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="glass-panel aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition hover:-translate-y-1 group p-2"
            >
              <img
                src={`https://flagcdn.com/${c.code}.svg`}
                alt={c.name[lang]}
                loading="lazy"
                className="w-10 h-7 object-cover rounded-sm shadow-md group-hover:scale-110 transition"
              />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {c.name[lang]}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------- BRANDS / LOGO MARQUEE ---------- */

export function Brands() {
  const { t, lang } = useI18n();
  const [brands, setBrands] = useState<typeof BRANDS>([]);
  useEffect(() => {
    supabase
      .from("partners" as any)
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error || !data) return;
        setBrands(
          (data as any[])
            .filter((r) => r.logo_url)
            .map((r) => ({
              src: r.logo_url,
              name: r.name_en || r.name_ar,
              nameAr: r.name_ar,
              specEn: r.industry_en || r.industry_ar || "",
              specAr: r.industry_ar || "",
            })),
        );
      });
  }, []);
  const row1 = brands;
  const row2 = [...brands].reverse();

  const Chip = ({
    b,
  }: {
    b: { src: string; name: string; nameAr: string; specEn: string; specAr: string };
  }) => (
    <div className="shrink-0 group">
      <div
        className="relative h-24 w-44 md:h-28 md:w-52 rounded-2xl bg-white border border-border/30 overflow-hidden flex items-center justify-center px-5 py-3 transition-all duration-500 group-hover:-translate-y-1.5"
        style={{
          boxShadow:
            "0 18px 40px -12px color-mix(in oklab, var(--primary) 35%, transparent), 0 6px 16px -6px rgba(0,0,0,0.25)",
        }}
      >
        <img
          src={b.src}
          alt={lang === "ar" ? b.nameAr : b.name}
          loading="lazy"
          decoding="async"
          width={180}
          height={90}
          className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <p className="mt-3 text-center text-[12px] font-semibold tracking-wide text-foreground/85">
        {lang === "ar" ? b.nameAr : b.name}
      </p>
      <p className="text-center text-[10px] tracking-widest uppercase text-muted-foreground/70 mt-0.5">
        {lang === "ar" ? b.specAr : b.specEn}
      </p>
    </div>
  );

  return (
    <Section id="brands" eyebrow={t("brands_eyebrow")} title={t("brands_title")}>
      <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end mb-10">
        <p className="text-muted-foreground max-w-2xl">{t("brands_desc")}</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-display text-4xl font-bold text-gradient-gold leading-none">
            {brands.length}+
          </span>
          <span className="text-muted-foreground uppercase tracking-widest text-xs leading-tight">
            {t("brands_meta")}
          </span>
        </div>
      </div>

      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 py-2">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

        {/* row 1 */}
        <div className="overflow-hidden" dir="ltr">
          <div className="flex w-max gap-8 marquee-track py-2" style={{ animationDuration: "45s" }}>
            {[0, 1, 2].map((copy) => (
              <div key={`r1-copy-${copy}`} className="flex shrink-0 gap-8" aria-hidden={copy > 0}>
                {row1.map((b) => (
                  <Chip key={`r1-${copy}-${b.name}`} b={b} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* row 2 — opposite direction */}
        <div className="overflow-hidden mt-4" dir="ltr">
          <div
            className="flex w-max gap-8 marquee-track-reverse py-2"
            style={{ animationDuration: "55s" }}
          >
            {[0, 1, 2].map((copy) => (
              <div key={`r2-copy-${copy}`} className="flex shrink-0 gap-8" aria-hidden={copy > 0}>
                {row2.map((b) => (
                  <Chip key={`r2-${copy}-${b.name}`} b={b} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- SNAPSHOTS w/ LIGHTBOX ---------- */

export function Snapshots() {
  const [dbShots, setDbShots] = useState<string[] | null>(null);
  useEffect(() => {
    let alive = true;
    supabase
      .from("snapshots" as any)
      .select("image_url,display_order,created_at,is_visible")
      .eq("is_visible", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!alive) return;
        const rows = (data as any[]) || [];
        if (rows.length > 0) setDbShots(rows.map((r) => r.image_url).filter(Boolean));
        else setDbShots([]);
      });
    return () => { alive = false; };
  }, []);
  const shots = dbShots && dbShots.length > 0 ? dbShots : SNAPSHOTS;
  const { t, dir } = useI18n();
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (active === null) return;
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight")
        setActive((a) => (a === null ? null : (a + 1) % shots.length));
      if (e.key === "ArrowLeft")
        setActive((a) => (a === null ? null : (a - 1 + shots.length) % shots.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Split snapshots across two tracks so the rows don't show the same images
  const half = Math.ceil(shots.length / 2);
  const setA = shots.slice(0, half);
  const setB = shots.slice(half);
  const trackA = [setA, setA, setA];
  const trackBSet = setB.slice().reverse();
  const trackB = [trackBSet, trackBSet, trackBSet];
  const marqueeClass = dir === "rtl" ? "marquee-track-rtl" : "marquee-track";
  const marqueeSlowClass = dir === "rtl" ? "marquee-track-rtl" : "marquee-track";

  const Card = ({ src, i, originalIndex }: { src: string; i: number; originalIndex: number }) => (
    <button
      type="button"
      onClick={() => setActive(originalIndex)}
      className="group relative shrink-0 w-[200px] sm:w-[240px] lg:w-[260px] aspect-[4/5] overflow-hidden rounded-2xl border border-foreground/10 cursor-zoom-in shadow-[0_18px_50px_-30px_var(--foreground)] bg-foreground/[0.04]"
      aria-label={`Open snapshot ${originalIndex + 1}`}
    >
      <img
        src={src}
        alt={`Snapshot ${originalIndex + 1}`}
        loading="lazy"
        decoding="async"
        width={260}
        height={325}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
      />
      <div className="image-scrim absolute inset-0 opacity-0 group-hover:opacity-100 transition" />
      <div className="absolute bottom-3 start-3 text-xs text-primary-foreground opacity-0 group-hover:opacity-100 transition font-semibold tracking-wider uppercase">
        View →
      </div>
    </button>
  );

  return (
    <Section id="snapshots" eyebrow={t("snapshots_eyebrow")} title={t("snapshots_title")}>
      <div className="space-y-6 marquee-mask">
        <div className="overflow-hidden" dir="ltr">
          <div
            className={`flex gap-7 w-max ${marqueeClass} hover:[animation-play-state:paused]`}
            style={{ animationDuration: "34s" }}
          >
            {trackA.map((set, copy) => (
              <div key={`a-copy-${copy}`} className="flex shrink-0 gap-7" aria-hidden={copy > 0}>
                {set.map((src, idx) => (
                  <Card
                    key={`a-${copy}-${idx}`}
                    src={src}
                    i={idx}
                    originalIndex={shots.indexOf(src)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden" dir="ltr">
          <div
            className={`flex gap-7 w-max ${marqueeSlowClass} hover:[animation-play-state:paused]`}
            style={{ animationDuration: "44s" }}
          >
            {trackB.map((set, copy) => (
              <div key={`b-copy-${copy}`} className="flex shrink-0 gap-7" aria-hidden={copy > 0}>
                {set.map((src, idx) => (
                  <Card
                    key={`b-${copy}-${idx}`}
                    src={src}
                    i={idx}
                    originalIndex={shots.indexOf(src)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop fixed inset-0 z-[100] backdrop-blur-md grid place-items-center p-4"
            onClick={() => setActive(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActive(null);
              }}
              className="absolute top-5 end-5 size-10 grid place-items-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <motion.img
              key={active}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={shots[active]}
              alt=""
              className="max-h-[88vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-5 inset-x-0 flex justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) =>
                    a === null ? null : (a - 1 + shots.length) % shots.length,
                  );
                }}
                className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm">
                {active + 1} / {shots.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a === null ? null : (a + 1) % shots.length));
                }}
                className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

/* ---------- TESTIMONIALS (admin-managed) ---------- */
