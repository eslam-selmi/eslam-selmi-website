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
import { Footer } from "@/components/home/Footer";
import { JOURNEY, JourneyItem, PILLARS, PROGRAMS, SERVICES, fadeUp, waServiceLink } from "@/components/home/data";
import { Section } from "@/components/home/shared";
import { useSiteProfile } from "@/lib/site-profile";
import { useSiteMedia } from "@/lib/site-media";
import { programMedia, mediaImage } from "@/lib/site-media-data";
import { CoverReflection } from "@/components/CoverReflection";

export function Pillars() {
  const { t } = useI18n();
  return (
    <Section id="pillars" eyebrow={t("pillars_eyebrow")} title={t("pillars_title")}>
      <div className="grid md:grid-cols-3 gap-5">
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.key}
            {...fadeUp}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="relative glass-panel rounded-[2rem] p-7 overflow-hidden group hover:-translate-y-1 transition"
          >
            <div
              className={`absolute -top-20 -end-20 size-48 rounded-full bg-gradient-to-br ${p.color} blur-3xl opacity-60 group-hover:opacity-100 transition`}
            />
            <div className="relative">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-soft)] grid place-items-center text-accent-foreground shadow-lg">
                <p.icon className="size-7" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold">{t(`pillar_${p.key}`)}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {t(`pillar_${p.key}_desc`)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- JOURNEY ---------- */

export function Journey() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<JourneyItem[]>([]);
  useEffect(() => {
    supabase
      .from("contracts" as any)
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error || !data) return;
        setItems(
          (data as any[]).map((r) => ({
            year: { en: r.year || "", ar: r.year || "" },
            role: { en: r.role_en || r.role_ar || "", ar: r.role_ar || "" },
            company: { en: r.org_en || r.org_ar, ar: r.org_ar },
            industry: { en: r.industry_en || r.industry_ar || "", ar: r.industry_ar || "" },
            country: r.country_code,
            logo: "",
            current: r.is_current,
            countryName: r.country_ar || r.country_en ? { en: r.country_en || r.country_ar, ar: r.country_ar || r.country_en } : undefined,
          })),
        );
      });
  }, []);
  return (
    <Section id="journey" eyebrow={t("journey_eyebrow")} title={t("journey_title")}>
      {(() => {
        const renderCard = (j: JourneyItem, i: number) => {
          const base =
            j.country === "SA"
              ? { flag: "sa", name: { en: "Saudi Arabia", ar: "السعودية" } }
              : j.country === "EG"
                ? { flag: "eg", name: { en: "Egypt", ar: "مصر" } }
                : { flag: String(j.country).toLowerCase(), name: { en: String(j.country), ar: String(j.country) } };
          const country = { flag: base.flag, name: j.countryName || base.name };
          return (
            <motion.div
              key={j.year.en + j.company.en + i}
              {...fadeUp}
              transition={{ delay: i * 0.07, duration: 0.55 }}
              className="group relative rounded-3xl bg-card border border-foreground/10 p-6 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_oklch(0.22_0.06_252/0.35)] transition-all overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/40 to-transparent opacity-70" />
              <div className="flex items-center justify-between mb-5">
                <span
                  className="font-display text-3xl font-extrabold tracking-tight"
                  style={{ color: "var(--accent)" }}
                >
                  {j.current ? (lang === "ar" ? "حالياً" : "Present") : j.year[lang]}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground bg-foreground/[0.04] rounded-full px-2.5 py-1">
                  <img
                    src={`https://flagcdn.com/${country.flag}.svg`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-4 h-3 rounded-[2px] object-cover"
                  />
                  {country.name[lang]}
                </span>
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-xl leading-tight">
                  {j.company[lang]}
                </div>
                <div
                  className="text-[11px] uppercase tracking-[0.18em] font-bold mt-1.5"
                  style={{ color: "var(--gold)" }}
                >
                  {j.industry[lang]}
                </div>
                <div className="text-sm text-muted-foreground mt-1.5 leading-snug">
                  {j.role[lang]}
                </div>
              </div>
            </motion.div>
          );
        };
        if (items.length === 0) return null;
        const firstRow = items.slice(0, 3);
        const secondRow = items.slice(3);
        return (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {firstRow.map((j, i) => renderCard(j, i))}
            </div>
            {secondRow.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-5 lg:max-w-[66.5%] lg:mx-auto">
                {secondRow.map((j, i) => renderCard(j, i + firstRow.length))}
              </div>
            )}
          </div>
        );
      })()}
    </Section>
  );
}

/* ---------- SERVICES ---------- */

export function Services() {
  const { t, lang } = useI18n();
  const { links } = useSiteProfile();
  return (
    <Section id="services" eyebrow={t("services_eyebrow")} title={t("services_title")}>
      <p className="-mt-6 mb-10 text-center text-base text-muted-foreground max-w-2xl mx-auto">
        {t("services_subtitle")}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map((s, i) => (
          <motion.div
            key={s.key}
            {...fadeUp}
            transition={{ delay: i * 0.08, duration: 0.6 }}
            className="relative glass-panel rounded-3xl p-6 group overflow-hidden transition hover:-translate-y-1 flex flex-col"
          >
            <div className="absolute -top-12 -end-12 size-32 rounded-full bg-[var(--gold)]/20 blur-2xl opacity-0 group-hover:opacity-100 transition" />
            <s.icon className="size-7 text-gold" />
            <div className="mt-4 text-xs text-muted-foreground font-mono">0{i + 1}</div>
            <h3 className="mt-1 font-semibold text-lg leading-tight">{s.title[lang]}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc[lang]}</p>
            <div className="mt-auto pt-5">
              <a
                href={`${links.whatsapp}?text=${encodeURIComponent(lang === "ar" ? `مرحبًا إسلام، أرغب في طلب خدمة: ${s.title.ar}. هل يمكننا التحدث؟` : `Hi Eslam, I'd like to request the "${s.title.en}" service. Can we chat?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn relative inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold overflow-hidden transition-all duration-300 hover:translate-y-[-1px]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(11,23,54,0.95) 0%, rgba(20,35,80,0.95) 100%)",
                  color: "var(--gold)",
                  border: "1px solid color-mix(in oklab, var(--gold) 45%, transparent)",
                  boxShadow:
                    "0 10px 30px -14px color-mix(in oklab, var(--gold) 60%, transparent), inset 0 1px 0 color-mix(in oklab, var(--gold) 20%, transparent)",
                }}
                aria-label={`${t("svc_request_btn")} — ${s.title[lang]}`}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, var(--gold) 18%, transparent), transparent 60%)",
                  }}
                />
                <span
                  className="absolute -inset-px rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(120px 40px at 50% 0%, color-mix(in oklab, var(--gold) 35%, transparent), transparent 70%)",
                  }}
                />
                <Rocket className="relative size-4" />
                <span className="relative tracking-wide">{t("svc_request_btn")}</span>
                <ArrowRight className="relative size-4 group-hover/btn:translate-x-1 rtl-flip transition" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- PROGRAMS ---------- */

export function Programs() {
  const { t, lang } = useI18n();
  const { data: media } = useSiteMedia();
  const trackIcons = [GraduationCap, UserCheck, Sparkles];
  return (
    <Section id="programs" eyebrow={t("programs_eyebrow")} title={t("programs_title")}>
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-7">
        {PROGRAMS.map((p, i) => {
          const Icon = trackIcons[i] || Sparkles;
          const isFeatured = true;
          return (
            <motion.article
              key={p.track.en}
              {...fadeUp}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={`group relative flex flex-col rounded-[2.25rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2
                ${
                  isFeatured
                    ? "lg:row-span-1 border-[#CD853F]/55 bg-gradient-to-br from-[#CD853F]/[0.14] via-[#8B4513]/[0.05] to-background shadow-[0_24px_70px_-30px_rgba(205,133,63,0.55)]"
                    : "border-foreground/10 bg-gradient-to-br from-background to-foreground/[0.025] hover:border-[var(--gold)]/30"
                }`}
            >
              {/* Top accent bar — peru tones for the Educational Tracks flagship */}
              <div className="group/cover clear-glass-cover relative overflow-hidden">
                <img src={mediaImage(media?.media ?? {}, `program:${programMedia[i]?.key}`, programMedia[i]?.image ?? programMedia[0].image)} alt={p.track[lang]} width={1280} height={720} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
                <CoverReflection />
              </div>
              <div
                className={`h-1.5 w-full ${isFeatured ? "bg-gradient-to-r from-[#CD853F] via-[#E8A87C] to-[#8B4513]" : "bg-gradient-to-r from-foreground/10 via-[var(--gold)]/40 to-foreground/10"}`}
              />

              {/* Decorative glow */}
              <div
                className={`pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-700 ${isFeatured ? "bg-[#CD853F]/20" : "bg-[var(--gold)]/10"}`}
              />

              <div className="relative p-7 lg:p-8 flex flex-col flex-1">
                {/* Header: icon + track number */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`size-14 grid place-items-center rounded-2xl border ${isFeatured ? "bg-gradient-to-br from-[#CD853F]/35 to-[#8B4513]/25 border-[#CD853F]/50 text-[#E8A87C]" : "bg-foreground/[0.04] border-foreground/10 text-foreground/70"}`}
                  >
                    <Icon className="size-7" strokeWidth={1.6} />
                  </div>
                  <div className="text-right rtl:text-left">
                    <div
                      className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isFeatured ? "text-[#CD853F]" : "text-muted-foreground"}`}
                    >
                      {t("programs_track")}
                    </div>
                    <div
                      className={`font-display text-3xl font-extrabold leading-none mt-1 ${isFeatured ? "" : "text-gradient-gold"}`}
                      style={
                        isFeatured
                          ? {
                              background: "linear-gradient(110deg, #CD853F, #E8A87C, #8B4513)",
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              color: "transparent",
                            }
                          : undefined
                      }
                    >
                      0{i + 1}
                    </div>
                  </div>
                </div>

                <h3 className="mt-6 font-display text-[1.45rem] lg:text-2xl font-bold leading-tight">
                  {p.track[lang]}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {p.intro[lang]}
                </p>

                {/* Items as a vertical journey */}
                <ol className="relative mt-7 space-y-4 flex-1">
                  {/* connector line */}
                  {p.items.length > 1 && (
                    <span
                      className={`absolute top-3 bottom-3 start-[14px] w-px bg-gradient-to-b ${isFeatured ? "from-[#CD853F]/65 via-[#8B4513]/25" : "from-[var(--gold)]/50 via-foreground/15"} to-transparent`}
                      aria-hidden
                    />
                  )}
                  {p.items.map((it, idx) => (
                    <li key={it.name.en} className="relative ps-10">
                      <span
                        className={`absolute start-0 top-1 size-7 grid place-items-center rounded-full text-[11px] font-extrabold ring-4 ring-background
                        ${isFeatured ? "bg-[#CD853F] text-background shadow-[0_6px_18px_-6px_rgba(205,133,63,0.85)]" : "bg-foreground/10 text-foreground/80"}`}
                      >
                        {idx + 1}
                      </span>
                      <div className="font-semibold text-[0.95rem] leading-snug">
                        {it.name[lang]}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {it.desc[lang]}
                      </div>
                    </li>
                  ))}
                </ol>

                {/* Footer meta */}
                <div className="mt-7 pt-5 border-t border-foreground/10 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em]">
                  <span className="text-muted-foreground">
                    {p.items.length} {lang === "ar" ? "محاور" : "modules"}
                  </span>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------- CLIENTS ---------- */
