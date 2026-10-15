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
import { TrainingRow } from "@/components/home/data";
import { Section } from "@/components/home/shared";

export function TrainingsTeaser() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("trainings")
        .select("id,title_ar,title_en,role_ar,role_en,cover_url,tags,is_featured")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(3);
      if (!cancelled) {
        setRows(
          ((data as any) ?? []).map((r: any) => ({
            ...r,
            gallery: [],
            tags: Array.isArray(r.tags) ? r.tags : [],
          })),
        );
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && rows.length === 0) return null;

  return (
    <Section id="trainings" eyebrow="">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5" dir={dir}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent/90">
            <GraduationCap className="w-4 h-4" />
            {tt("التدريبات والممارسات", "Trainings & practice")}
          </div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
            {tt("حالات تدريبية مختارة", "Selected training case studies")}
          </h2>
          <p className="mt-3 text-foreground/65 max-w-4xl mx-auto text-sm sm:text-base leading-relaxed">
            {tt(
              "لمحة سريعة من برامج تدريبية صمّمتها وقُدتها — استعرض القائمة الكاملة في صفحة التدريبات.",
              "A quick glance of programs I designed and led — browse the full list on the trainings page.",
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(loading ? [null, null, null] : rows).map((r, i) => {
            if (!r) {
              return (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-foreground/[0.04] animate-pulse" />
              );
            }
            const title = isAr ? r.title_ar : r.title_en || r.title_ar;
            const role = isAr ? r.role_ar : r.role_en || r.role_ar;
            return (
              <Link
                key={r.id}
                to="/trainings"
                className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] hover:border-accent/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_60px_-30px_var(--accent)] aspect-[4/3]"
              >
                {r.cover_url ? (
                  <img
                    src={r.cover_url}
                    alt={title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-foreground/[0.04] to-transparent" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end gap-2">
                  <h3 className="text-white font-extrabold text-lg sm:text-xl leading-snug drop-shadow line-clamp-3">
                    {title}
                  </h3>
                  {role && <div className="text-xs text-white/80 line-clamp-1">{role}</div>}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/trainings"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-[var(--navy)] font-bold hover:opacity-90 transition"
          >
            {tt("استعرض كل التدريبات", "View all trainings")}
            <ArrowRight className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </div>
    </Section>
  );
}

export function Trainings() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<TrainingRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("trainings")
        .select(
          "id,title_ar,title_en,role_ar,role_en,period_ar,period_en,cover_url,challenge_ar,challenge_en,solution_ar,solution_en,result_ar,result_en,gallery,tags,is_featured",
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setRows(
          ((data as any) ?? []).map((r: any) => ({
            ...r,
            gallery: Array.isArray(r.gallery) ? r.gallery : [],
            tags: Array.isArray(r.tags) ? r.tags : [],
          })),
        );
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && rows.length === 0) return null;

  return (
    <Section id="trainings" eyebrow="">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5" dir={dir}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent/90">
            <GraduationCap className="w-4 h-4" />
            {tt("التدريبات والممارسات", "Trainings & practice")}
          </div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
            {tt("حالات تدريبية مختارة", "Selected training case studies")}
          </h2>
          <p className="mt-3 text-foreground/65 max-w-4xl mx-auto text-sm sm:text-base leading-relaxed">
            {tt(
              "نماذج من برامج تدريبية صمّمتها وقُدتها — التحدي، المنهجية، والأثر.",
              "Examples of training programs I designed and led — the challenge, the methodology, and the impact.",
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-foreground/[0.04] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[260px] gap-5">
            {rows.map((r, i) => {
              const title = isAr ? r.title_ar : r.title_en || r.title_ar;
              const role = isAr ? r.role_ar : r.role_en || r.role_ar;
              const span =
                r.is_featured && i % 5 === 0
                  ? "sm:col-span-2 sm:row-span-2"
                  : r.is_featured
                    ? "lg:row-span-2"
                    : "";
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActive(r)}
                  className={`group relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] hover:border-accent/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_60px_-30px_var(--accent)] text-start ${span}`}
                >
                  {r.cover_url ? (
                    <img
                      src={r.cover_url}
                      alt={title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-foreground/[0.04] to-transparent" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end gap-2">
                    {r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {r.tags.slice(0, 3).map((tag, j) => (
                          <span
                            key={j}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 border border-white/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3 className="text-white font-extrabold text-lg sm:text-xl leading-snug drop-shadow line-clamp-3">
                      {title}
                    </h3>
                    {role && (
                      <div className="text-xs text-white/80 line-clamp-1">{role}</div>
                    )}
                    <div className="pt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--gold)]">
                      {tt("استعرض الحالة الكاملة", "View full case study")} →
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <TrainingModal training={active} onClose={() => setActive(null)} />
      </div>
    </Section>
  );
}

export function TrainingModal({ training, onClose }: { training: TrainingRow | null; onClose: () => void }) {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!training) return null;
  const title = isAr ? training.title_ar : training.title_en || training.title_ar;
  const role = isAr ? training.role_ar : training.role_en || training.role_ar;
  const period = isAr ? training.period_ar : training.period_en || training.period_ar;
  const challenge = isAr ? training.challenge_ar : training.challenge_en || training.challenge_ar;
  const solution = isAr ? training.solution_ar : training.solution_en || training.solution_ar;
  const result = isAr ? training.result_ar : training.result_en || training.result_ar;

  const Block = ({
    icon: Icon,
    label,
    body,
    tint,
  }: {
    icon: any;
    label: string;
    body: string | null;
    tint: string;
  }) => {
    if (!body) return null;
    return (
      <div
        className={`rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 relative overflow-hidden`}
      >
        <div
          className={`absolute -top-12 -end-12 w-32 h-32 rounded-full blur-3xl opacity-40`}
          style={{ background: tint }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)] mb-2">
            <Icon className="w-4 h-4" />
            {label}
          </div>
          <p className="text-sm sm:text-base text-foreground/85 leading-relaxed whitespace-pre-wrap">
            {body}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={!!training} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="!max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
          <div className="relative h-44 sm:h-56 flex-shrink-0 overflow-hidden bg-black/40">
            {training.cover_url ? (
              <img src={training.cover_url} className="w-full h-full object-cover" alt={title} />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-transparent" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6" dir={dir}>
              {training.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {training.tags.map((tag, j) => (
                    <span
                      key={j}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/90 border border-white/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h2 className="text-white font-extrabold text-xl sm:text-3xl leading-tight drop-shadow">
                {title}
              </h2>
              <div className="mt-1.5 text-xs sm:text-sm text-white/80 flex flex-wrap gap-x-3 gap-y-1">
                {role && <span>{role}</span>}
                {period && <span>· {period}</span>}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-5" dir={dir}>
            <Block
              icon={Target}
              label={tt("التحدي", "The Challenge")}
              body={challenge}
              tint="rgba(239,68,68,0.35)"
            />
            <Block
              icon={Lightbulb}
              label={tt("الحل / المنهجية", "The Solution")}
              body={solution}
              tint="rgba(212,175,55,0.35)"
            />
            <Block
              icon={TrendingUp}
              label={tt("النتائج والأثر", "Results & Impact")}
              body={result}
              tint="rgba(34,197,94,0.35)"
            />

            {training.gallery.length > 0 && (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
                  <Award className="w-4 h-4" />
                  {tt("من معرض البرنامج", "Program gallery")}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {training.gallery.map((url, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setLightbox(url)}
                      className="aspect-square rounded-xl overflow-hidden border border-foreground/10 hover:border-accent/40 transition group"
                    >
                      <img
                        src={url}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        alt=""
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!lightbox} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="!max-w-4xl w-[95vw] p-0 overflow-hidden bg-black/95">
          {lightbox && <img src={lightbox} className="w-full h-auto max-h-[85vh] object-contain" alt="" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
