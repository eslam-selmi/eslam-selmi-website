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
import { CourseReviewsButton, CourseReviewsModal, useCourseReviews } from "@/components/home/CourseReviews";
import { Programs } from "@/components/home/AboutSections";
import { PublicCourse } from "@/components/home/data";
import { Section, isEmpowermentCourse } from "@/components/home/shared";

export function CurrentCourses() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PublicCourse | null>(null);
  const [interest, setInterest] = useState<PublicCourse | null>(null);
  const [reviewsFor, setReviewsFor] = useState<PublicCourse | null>(null);
  const reviews = useCourseReviews().data ?? [];
  const reviewsOf = (id: string) => reviews.filter((r) => r.course_id === id);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select(
          "id,title,description,cover_emoji,price,currency,starts_at,ends_at,total_hours,online_url,brand_name,brand_tagline_ar,brand_tagline_en,course_goals,target_audience,is_upcoming",
        )
        .eq("active", true)
        .eq("is_archived", false)
        .order("starts_at", { ascending: true, nullsFirst: false });
      setCourses((data as PublicCourse[]) ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selected && !interest) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        setInterest(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, interest]);

  // Hide the Empowerment Tools course from the general public courses list — it lives on /graduates
  const visibleCourses = courses.filter((c) => !isEmpowermentCourse(c.title));
  const current = visibleCourses.filter((c) => !c.is_upcoming);
  const upcoming = visibleCourses.filter((c) => c.is_upcoming);

  return (
    <Section
      id="current-courses"
      eyebrow={tt("الكورسات", "Courses")}
      title={tt("الكورسات الحالية والقادمة", "Current & Upcoming Courses")}
    >
      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          {tt("جارٍ التحميل…", "Loading…")}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border border-dashed border-foreground/15 text-muted-foreground">
          {tt("لا توجد كورسات متاحة حالياً.", "No courses available right now.")}
        </div>
      ) : (
        <>
          {current.length > 0 && (
            <>
              <h3
                className="text-xs uppercase tracking-[0.3em] font-bold mb-4"
                style={{ color: "var(--accent)" }}
              >
                {tt("دورات مباشرة · سجل اليوم", "Live courses · enroll today")}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {current.map((c) => (
                  <div key={c.id} className="flex flex-col"><CourseCard c={c} onOpen={() => setSelected(c)} isAr={isAr} /><CourseReviewsButton reviews={reviewsOf(c.id)} isAr={isAr} onOpen={() => setReviewsFor(c)} /></div>
                ))}
              </div>
            </>
          )}

          {upcoming.length > 0 && (
            <div className="mt-12">
              <h3
                className="text-xs uppercase tracking-[0.3em] font-bold mb-4 flex items-center gap-2"
                style={{ color: "var(--accent)" }}
              >
                <Calendar className="size-3.5" />
                {tt("برامج قيد التجهيز: استثمر في تطوير مهاراتك", "Programs in preparation: invest in your skills")}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcoming.map((c) => (
                  <div key={c.id} className="flex flex-col"><CourseCard c={c} onOpen={() => setSelected(c)} isAr={isAr} upcoming /><CourseReviewsButton reviews={reviewsOf(c.id)} isAr={isAr} onOpen={() => setReviewsFor(c)} /></div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selected && (
        <CourseDetailsModal
          course={selected}
          isAr={isAr}
          dir={dir}
          onClose={() => setSelected(null)}
          onInterest={() => {
            setInterest(selected);
            setSelected(null);
          }}
        />
      )}

      {reviewsFor && (
        <CourseReviewsModal title={reviewsFor.title} reviews={reviewsOf(reviewsFor.id)} isAr={isAr} onClose={() => setReviewsFor(null)} />
      )}

      {interest && (
        <InterestFormModal
          course={interest}
          isAr={isAr}
          dir={dir}
          onClose={() => setInterest(null)}
        />
      )}
    </Section>
  );
}

export function CourseCard({
  c,
  onOpen,
  isAr,
  upcoming = false,
}: {
  c: PublicCourse;
  onOpen: () => void;
  isAr: boolean;
  upcoming?: boolean;
}) {
  const tt = (a: string, b: string) => (isAr ? a : b);
  const tagline = isAr ? c.brand_tagline_ar : c.brand_tagline_en;
  const date = c.starts_at
    ? new Date(c.starts_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
        day: "numeric",
        month: "short",
      })
    : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative text-start rounded-[2rem] border border-border bg-card backdrop-blur-xl p-0 overflow-hidden shadow-[0_20px_60px_-30px_rgba(0,0,0,0.45)] md:transition-all md:duration-300 md:hover:-translate-y-1.5 md:hover:scale-[1.02] md:hover:border-white/25 md:hover:shadow-[0_36px_80px_-30px_color-mix(in_oklab,var(--accent)_55%,transparent)]"
    >
      <div className="relative h-44 overflow-hidden"><img src={snap3Asset.url} alt={c.title} loading="lazy" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" /></div>
      <div
        className={`absolute inset-x-0 top-0 h-1.5 ${upcoming ? "bg-gradient-to-r from-[var(--accent)] via-[var(--lavender)] to-[var(--accent)]" : "bg-gradient-to-r from-[var(--accent)] via-[var(--accent)] to-[var(--accent)]"}`}
      />
      <div className="absolute -end-20 -top-20 size-44 rounded-full bg-[var(--accent)]/15 blur-3xl md:opacity-0 md:group-hover:opacity-100 md:transition" />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="relative size-16 rounded-2xl border border-white/20 bg-white/10 backdrop-blur grid place-items-center text-4xl shrink-0">
            <span>{c.cover_emoji || "🎓"}</span>
            <span className="absolute -bottom-1 -end-1 size-5 rounded-full border border-card bg-[var(--accent)]" />
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-bold rounded-full px-2.5 py-1 border backdrop-blur ${upcoming ? "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/40" : "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/40"}`}
          >
            {upcoming ? <Calendar className="size-3" /> : <Sparkles className="size-3" />}
            {upcoming ? tt("قريباً", "Soon") : tt("مباشر", "Live")}
          </span>
        </div>

        <h4 className="mt-5 font-display font-extrabold text-xl leading-tight text-foreground">
          {c.title}
        </h4>
        {tagline && (
          <p className="text-[11px] uppercase tracking-[0.15em] font-bold mt-1.5 text-muted-foreground">
            {tagline}
          </p>
        )}
        {c.description && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {c.description}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          {c.total_hours > 0 && (
            <CourseMiniMeta
              icon={Clock}
              label={tt("المدة", "Hours")}
              value={`${c.total_hours} ${tt("ساعة", "h")}`}
            />
          )}
          {date && <CourseMiniMeta icon={Calendar} label={tt("البداية", "Starts")} value={date} />}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="min-w-0">
            {!upcoming && c.price != null && c.price > 0 ? (
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
                  {tt("قيمة الاستثمار", "Investment value")}
                </div>
                <div className="font-display font-extrabold text-lg mt-0.5" style={{ color: "var(--accent)" }}>
                  {c.price} {c.currency}
                </div>
              </div>
            ) : !upcoming ? (
              <div className="text-xs font-bold text-muted-foreground">
                {tt("مجاني", "Free")}
              </div>
            ) : (
              <span />
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold md:transition-all md:duration-300 md:group-hover:px-5">
            {upcoming ? tt("سجّل اهتمامك", "Register interest") : tt("التفاصيل", "Details")}
            <ArrowRight className="size-3 rtl-flip md:group-hover:translate-x-1 md:transition" />
          </div>
        </div>
      </div>
    </button>
  );
}

export function CourseMiniMeta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.035] p-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="mt-1 font-semibold text-sm truncate">{value}</div>
    </div>
  );
}

export function CourseDetailsModal({
  course,
  isAr,
  dir,
  onClose,
  onInterest,
}: {
  course: PublicCourse;
  isAr: boolean;
  dir: string;
  onClose: () => void;
  onInterest: () => void;
}) {
  const tt = (a: string, b: string) => (isAr ? a : b);
  const tagline = isAr ? course.brand_tagline_ar : course.brand_tagline_en;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      dir={dir}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl bg-card shadow-2xl border border-foreground/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative p-7 sm:p-10"
          style={{
            background:
              "linear-gradient(135deg, var(--navy-deep) 0%, var(--lavender-deep) 70%, var(--accent) 100%)",
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 end-4 size-9 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white transition"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-4 text-white">
            <div className="text-5xl">{course.cover_emoji || "🎓"}</div>
            <div className="min-w-0">
              {tagline && (
                <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/80">
                  {tagline}
                </div>
              )}
              <h3 className="mt-1 font-display font-extrabold text-2xl sm:text-3xl leading-tight">
                {course.title}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-10 space-y-5">
          {course.description && (
            <p className="text-foreground/85 leading-[1.9] whitespace-pre-wrap">
              {course.description}
            </p>
          )}

          {(course.course_goals || course.target_audience) && (
            <div className="grid sm:grid-cols-2 gap-3">
              {course.course_goals && (
                <CourseInfoBlock
                  icon={Target}
                  title={tt("ماذا ستتقن؟", "What you'll master")}
                  body={course.course_goals}
                />
              )}
              {course.target_audience && (
                <CourseInfoBlock
                  icon={Users}
                  title={tt("مناسب لمن؟", "Best for")}
                  body={course.target_audience}
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {course.total_hours > 0 && (
              <DetailStat
                icon={Calendar}
                label={tt("الساعات", "Hours")}
                value={`${course.total_hours}`}
              />
            )}
            {course.starts_at && (
              <DetailStat
                icon={Calendar}
                label={tt("يبدأ", "Starts")}
                value={new Date(course.starts_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}
              />
            )}
            {course.ends_at && (
              <DetailStat
                icon={Calendar}
                label={tt("ينتهي", "Ends")}
                value={new Date(course.ends_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}
              />
            )}
            {!course.is_upcoming && course.price != null && course.price > 0 && (
              <DetailStat
                icon={BadgeCheck}
                label={tt("قيمة الاستثمار", "Investment value")}
                value={`${course.price} ${course.currency}`}
              />
            )}
          </div>

          <div className="rule" />

          <div className="flex flex-wrap items-center gap-3">
            {isEmpowermentCourse(course.title) ? (
              <Link
                to="/auth"
                search={{ role: "trainee" }}
                className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-bold hover:opacity-90 transition shadow-lg cursor-pointer"
              >
                <Sparkles className="size-4" />
                {tt("حابب أستثمر في الكورس", "I want to invest in this course")}
                <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
              </Link>
            ) : course.is_upcoming ? (
              <button
                onClick={onInterest}
                className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-bold hover:opacity-90 transition shadow-lg cursor-pointer"
              >
                <Sparkles className="size-4" />
                {tt("سجّل اهتمامك الآن", "Register your interest")}
                <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
              </button>
            ) : (
              <Link
                to="/auth"
                search={{ role: "trainee" }}
                className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-bold hover:opacity-90 transition shadow-lg cursor-pointer"
              >
                <LogIn className="size-4" />
                {tt("اشترك في الكورس", "Enroll now")}
                <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-5 py-3 text-sm font-semibold hover:bg-foreground/5 transition"
            >
              {tt("إغلاق", "Close")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export function DetailStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.04] border border-foreground/10 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1.5 font-display font-extrabold text-base">{value}</div>
    </div>
  );
}

export function CourseInfoBlock({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.04] border border-foreground/10 p-4">
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--accent)" }}>
        <Icon className="size-4" /> {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {body}
      </p>
    </div>
  );
}

export function InterestFormModal({
  course,
  isAr,
  dir,
  onClose,
}: {
  course: PublicCourse;
  isAr: boolean;
  dir: string;
  onClose: () => void;
}) {
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("EG");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const country = findDialCountry(countryCode) ?? PHONE_COUNTRIES[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!full_name.trim() || !email.trim()) return;
    const v = validatePhoneForCountry(phone, country);
    if (!v.ok) {
      const msg = tt(
        `رقم الهاتف لدولة ${country.name_ar} يجب أن يتكون من ${country.nsnLengths.join(" أو ")} أرقام بدون الصفر. مثال: ${v.example}`,
        `Phone number for ${country.name_en} must be ${country.nsnLengths.join(" or ")} digits without leading zero. Example: ${v.example}`,
      );
      setPhoneError(msg);
      return;
    }
    setPhoneError(null);
    setBusy(true);
    const { error } = await supabase.from("course_interests").insert({
      course_id: course.id || null,
      course_title: course.title,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: v.e164,
      country_code: country.code,
      notes: notes.trim() || null,
      language: isAr ? "ar" : "en",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
    });
    setBusy(false);
    if (error) {
      return;
    }
    setDone(true);
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      dir={dir}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-card shadow-2xl border border-foreground/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-foreground/10 flex items-start gap-3">
          <div className="size-11 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 grid place-items-center text-[var(--accent)] shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
              {tt("كورس قادم", "Upcoming course")}
            </div>
            <div className="font-display font-extrabold text-base truncate">{course.title}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-9 grid place-items-center rounded-full md:hover:bg-foreground/10 md:transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto size-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 grid place-items-center text-emerald-400">
              <CheckCircle2 className="size-7" />
            </div>
            <h4 className="mt-4 font-display font-extrabold text-lg">
              {tt("تم تسجيل اهتمامك ✓", "Interest registered ✓")}
            </h4>
            <p className="mt-2 text-sm text-muted-foreground">
              {tt(
                "سنتواصل معك فور فتح باب التسجيل لهذا الكورس.",
                "We'll reach out as soon as enrollment opens.",
              )}
            </p>
            <button
              onClick={onClose}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold"
            >
              {tt("تمام", "Done")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-3">
            <input
              required
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={tt("الاسم الكامل", "Full name")}
              className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-xl px-4 h-11 text-sm"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tt("البريد الإلكتروني", "Email")}
              className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-xl px-4 h-11 text-sm"
            />
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1.5 font-medium">
                {tt("الدولة", "Country")}
              </span>
              <select
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  setPhone("");
                  setPhoneError(null);
                }}
                required
                className="w-full h-11 px-4 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-foreground focus:outline-none focus:border-[var(--accent)]/60"
              >
                {PHONE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-background">
                    {c.flag} {isAr ? c.name_ar : c.name_en} ({c.dial})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1.5 font-medium">
                {tt("رقم الهاتف", "Phone")}
              </span>
              <div className="flex gap-2" dir="ltr">
                <span className="h-11 px-3 rounded-xl bg-foreground/[0.06] border border-foreground/10 text-muted-foreground inline-flex items-center text-sm font-mono">
                  {country.dial}
                </span>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(sanitizeNationalNumber(e.target.value, country));
                    setPhoneError(null);
                  }}
                  placeholder={
                    country.nsnLengths[0] ? "5".padEnd(country.nsnLengths[0], "x") : "1xxxxxxxxx"
                  }
                  dir="ltr"
                  className={`flex-1 bg-foreground/[0.04] border rounded-xl px-4 h-11 text-sm ${phoneError ? "border-rose-400/60" : "border-foreground/10"}`}
                />
              </div>
              {phoneError && (
                <p className="text-[11px] text-rose-400 mt-1.5 leading-relaxed">{phoneError}</p>
              )}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tt("ملاحظات (اختياري)", "Notes (optional)")}
              rows={3}
              className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-xl px-4 py-3 text-sm resize-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-bold disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {tt("إرسال اهتمامي", "Submit interest")}
            </button>
            <p className="text-[11px] text-muted-foreground text-center pt-1 leading-relaxed">
              {tt(
                "تم تسجيل اهتمامك بنجاح. سيتم إرسال إشعار على هاتفك وبريدك الإلكتروني المسجل فور فتح باب التسجيل في البرنامج.",
                "Your interest has been registered. You'll receive a notification on your phone and registered email as soon as enrollment opens.",
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------- KNOWLEDGE LIBRARY ---------- */
