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
import { CourseDetailsModal, InterestFormModal } from "@/components/home/Courses";
import { Interviews } from "@/components/home/Media";
import { PublicCourse, fadeUp } from "@/components/home/data";
import { Section, isEmpowermentCourse } from "@/components/home/shared";

export function EmpowermentTools() {
  const { t, lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [open, setOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);

  // Stub used for the "Future Course Interest" form when no live course exists yet
  const empowermentStub: PublicCourse = {
    id: "",
    title: t("emp_title"),
    description: t("emp_desc"),
    cover_emoji: "🚀",
    price: null,
    currency: "",
    starts_at: null,
    ends_at: null,
    total_hours: 0,
    online_url: null,
    brand_name: null,
    brand_tagline_ar: null,
    brand_tagline_en: null,
    course_goals: null,
    target_audience: null,
    is_upcoming: true,
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select(
          "id,title,description,cover_emoji,price,currency,starts_at,ends_at,total_hours,online_url,brand_name,brand_tagline_ar,brand_tagline_en,course_goals,target_audience,is_upcoming",
        )
        .eq("active", true)
        .eq("is_archived", false);
      const list = (data as PublicCourse[]) ?? [];
      const match = list.find((c) => isEmpowermentCourse(c.title)) ?? null;
      setCourse(match);
    })();
  }, []);

  async function handleRegister() {
    if (course) {
      setOpen(true);
      return;
    }
    // Fallback: try to refetch on click
    setLoadingCourse(true);
    const { data } = await supabase
      .from("courses")
      .select(
        "id,title,description,cover_emoji,price,currency,starts_at,ends_at,total_hours,online_url,brand_name,brand_tagline_ar,brand_tagline_en,course_goals,target_audience,is_upcoming",
      )
      .eq("active", true)
      .eq("is_archived", false);
    const list = (data as PublicCourse[]) ?? [];
    const match = list.find((c) => isEmpowermentCourse(c.title)) ?? null;
    setCourse(match);
    setLoadingCourse(false);
    if (match) {
      setOpen(true);
    } else {
      // Course not yet available — capture interest like an upcoming course
      setInterestOpen(true);
    }
  }

  const tools = [
    { icon: Bot, key: "emp_tool_ai" },
    { icon: MailIcon, key: "emp_tool_outlook" },
    { icon: Palette, key: "emp_tool_canva" },
    { icon: Trello, key: "emp_tool_trello" },
    { icon: Table2, key: "emp_tool_sheets" },
    { icon: Wand2, key: "emp_tool_more" },
  ];

  return (
    <Section id="empowerment" eyebrow={t("emp_eyebrow")} title={t("emp_title")}>
      <motion.div
        {...fadeUp}
        className="relative mx-auto max-w-6xl rounded-[2rem] overflow-hidden border border-foreground/10 shadow-[0_30px_80px_-40px_oklch(0.22_0.06_252/0.35)]"
        style={{ background: "linear-gradient(135deg, #0b1736 0%, #14224d 50%, #1f2a5a 100%)" }}
      >
        <div className="absolute inset-0 grain opacity-20 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 55% at 88% 8%, oklch(0.78 0.13 85 / 0.28), transparent 60%)",
          }}
        />
        <div className="relative p-7 sm:p-10 lg:p-14 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em]">
              <Rocket className="size-3.5" /> {t("emp_tagline")}
            </div>
            <h3 className="mt-5 font-display font-extrabold leading-[1.05] text-[clamp(1.75rem,3.4vw,2.75rem)]">
              {t("emp_title")}
            </h3>
            <p className="mt-5 text-white/85 leading-relaxed max-w-xl">{t("emp_desc")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={handleRegister}
                disabled={loadingCourse}
                className="group inline-flex items-center gap-2.5 rounded-full bg-white text-[#0b1736] px-6 py-3.5 text-sm font-bold hover:bg-white/95 transition shadow-lg cursor-pointer disabled:opacity-70"
              >
                {loadingCourse ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                {t("emp_btn")}
                <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
              </button>
              <div className="inline-flex items-center text-[11px] uppercase tracking-[0.25em] font-bold text-white/80">
                {t("emp_meta")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.key}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-white/15 bg-white text-[#0b1736] p-4 flex flex-col items-start gap-2.5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]"
              >
                <span
                  className="size-10 grid place-items-center rounded-xl text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--navy-deep), var(--lavender-deep))",
                  }}
                >
                  <tool.icon className="size-5" />
                </span>
                <div className="text-xs font-bold leading-tight text-[#0b1736]">{t(tool.key)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {open && course && (
        <CourseDetailsModal
          course={course}
          isAr={isAr}
          dir={dir}
          onClose={() => setOpen(false)}
          onInterest={() => setOpen(false)}
        />
      )}

      {interestOpen && (
        <InterestFormModal
          course={empowermentStub}
          isAr={isAr}
          dir={dir}
          onClose={() => setInterestOpen(false)}
        />
      )}
    </Section>
  );
}

// ============================================================================
// Interviews — public showcase grid, opens resources inside the site
// ============================================================================
