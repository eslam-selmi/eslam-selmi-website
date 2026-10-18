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
import { Trainings } from "@/components/home/Trainings";
import { InterviewRow, PODCAST_EPISODES, fadeUp } from "@/components/home/data";
import { Section } from "@/components/home/shared";

export function Podcast() {
  const { t } = useI18n();
  const [active, setActive] = useState(PODCAST_EPISODES[0]);
  const [playing, setPlaying] = useState(false);

  return (
    <Section id="podcast" eyebrow={t("podcast_eyebrow")} title={t("podcast_title")}>
      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 lg:gap-8 items-start">
        {/* Player card */}
        <motion.div {...fadeUp} className="relative min-w-0 w-full">
          <div className="absolute -inset-2 sm:-inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/25 via-accent/5 to-transparent blur-2xl" />
          <div className="glass-panel rounded-2xl sm:rounded-3xl overflow-hidden border border-foreground/10">
            <div className="relative aspect-video bg-black">
              {playing ? (
                <iframe
                  key={active.id}
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${active.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={t(active.titleKey)}
                  allow="accelerated-2d-canvas; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  onClick={() => setPlaying(true)}
                  className="group absolute inset-0 w-full h-full cursor-pointer"
                  aria-label={t("podcast_play")}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${active.id}/maxresdefault.jpg`}
                    alt={t(active.titleKey)}
                    width={1280}
                    height={720}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        `https://i.ytimg.com/vi/${active.id}/hqdefault.jpg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <span className="absolute inset-0 rounded-full bg-accent/40 blur-2xl scale-150 animate-pulse" />
                      <div className="relative size-20 lg:size-24 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <svg
                          viewBox="0 0 24 24"
                          className="size-8 lg:size-10 text-[var(--navy)] ms-1"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-5 lg:p-7 text-start">
                    <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/80 font-semibold mb-2">
                      <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                      {t("podcast_eyebrow")} · {active.number}
                    </div>
                    <h3 className="text-white font-display text-xl lg:text-2xl leading-tight">
                      {t(active.titleKey)}
                    </h3>
                  </div>
                </button>
              )}
            </div>
            <div className="p-5 lg:p-6 flex items-center justify-between gap-4 border-t border-foreground/10">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.28em] text-accent font-semibold">
                  {t("podcast_now_playing")}
                </div>
                <div className="font-display text-base lg:text-lg truncate">
                  {t(active.titleKey)}
                </div>
              </div>
              <a
                href={`https://youtu.be/${active.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-foreground/15 hover:bg-foreground/5 transition-colors"
              >
                YouTube
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Episodes list */}
        <motion.div {...fadeUp} className="space-y-3 min-w-0 w-full">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-2">
            {t("podcast_episodes")}
          </div>
          {PODCAST_EPISODES.map((ep) => {
            const isActive = ep.id === active.id;
            return (
              <button
                key={ep.id}
                onClick={() => {
                  setActive(ep);
                  setPlaying(false);
                }}
                className={`w-full text-start group glass rounded-2xl p-4 lg:p-5 border transition-all duration-300 ${isActive ? "border-accent/60 shadow-lg shadow-accent/10" : "border-foreground/10 hover:border-foreground/25"}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`shrink-0 size-12 rounded-xl flex items-center justify-center font-display text-sm transition-colors ${isActive ? "bg-accent text-[var(--navy)]" : "bg-foreground/5 text-foreground"}`}
                  >
                    {ep.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm lg:text-base leading-tight truncate">
                      {t(ep.titleKey)}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {t(ep.descKey)}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 size-9 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-accent text-[var(--navy)]" : "bg-foreground/5 text-foreground group-hover:bg-foreground/10"}`}
                  >
                    <svg viewBox="0 0 24 24" className="size-3.5 ms-0.5" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
          <div className="glass rounded-2xl p-4 lg:p-5 border border-dashed border-foreground/15 text-xs text-muted-foreground">
            {t("podcast_more_soon")}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ---------- SECTION WRAPPER ---------- */

export function Interviews() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [rows, setRows] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<InterviewRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("interviews")
        .select("id,title_ar,title_en,description_ar,description_en,cover_url,resource_url")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setRows((data as InterviewRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && rows.length === 0) return null;

  return (
    <Section id="interviews" eyebrow="">
      <div className="max-w-7xl mx-auto px-4 sm:px-5" dir={dir}>


        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-video rounded-2xl bg-foreground/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rows.map((r) => {
              const title = isAr ? r.title_ar : r.title_en || r.title_ar;
              const desc = isAr ? r.description_ar : r.description_en || r.description_ar;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActive(r)}
                  className="group text-start relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_-30px_var(--accent)]"
                >
                  <div className="relative aspect-video overflow-hidden bg-foreground/[0.05]">
                    {r.cover_url ? (
                      <img
                        src={r.cover_url}
                        alt={title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-foreground/30">
                        <Video className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                    <div className="absolute inset-0 grid place-items-center opacity-90 group-hover:opacity-100 transition">
                      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 group-hover:scale-110 transition">
                        <PlayCircle className="w-8 h-8 text-white" />
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-base sm:text-lg leading-snug line-clamp-2">
                      {title}
                    </h3>
                    {desc && (
                      <p className="text-sm text-foreground/65 line-clamp-2">{desc}</p>
                    )}
                    <div className="pt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                      <PlayCircle className="w-4 h-4" />
                      {tt("شاهد الآن", "Watch now")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <UniversalEmbedModal
          open={!!active}
          onOpenChange={(v) => !v && setActive(null)}
          url={active?.resource_url || ""}
          title={active ? (isAr ? active.title_ar : active.title_en || active.title_ar) : undefined}
        />
      </div>
    </Section>
  );
}


// ============================================================================
// Trainings — bento grid of training case studies with in-page modal
// ============================================================================

// Compact teaser shown on the homepage — links to the dedicated /trainings page.
