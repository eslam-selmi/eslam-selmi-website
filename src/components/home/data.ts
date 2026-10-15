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

export const headshot = headshotAsset.url;

export const brandLogo = brandLogoAsset.url;

export const snap1 = snap1Asset.url;

export const snap2 = snap2Asset.url;

export const snap3 = snap3Asset.url;

export const snap4 = snap4Asset.url;

export const snap5 = snap5Asset.url;

export const snap6 = snap6Asset.url;

export const snap7 = snap7Asset.url;

export const snap8 = snap8Asset.url;

export const logoAramex = logoAramexAsset.url;

export const logoG4s = logoG4sAsset.url;

export const logoAllerAqua = logoAllerAquaAsset.url;

export const logoEvno = logoEvnoAsset.url;

export const logoBadreldin = logoBadreldinAsset.url;

export const logoAmazonEg = logoAmazonEgAsset.url;

export const logoAlmajarah = logoAlmajarahAsset.url;

export const logoImtenan = logoImtenanAsset.url;

export const logoDaralnokba = logoDaralnokbaAsset.url;

export const logoMallOfEgypt = logoMallOfEgyptAsset.url;

export const logoNewBrand = logoNewBrandAsset.url;

export const BRANDS: { src: string; name: string; nameAr: string; specEn: string; specAr: string }[] = [
  {
    src: logoAramex,
    name: "Aramex",
    nameAr: "أرامكس",
    specEn: "Transport & Logistics",
    specAr: "حلول النقل والخدمات اللوجستية",
  },
  {
    src: logoG4s,
    name: "G4S",
    nameAr: "جي فور إس",
    specEn: "Advanced Security Solutions",
    specAr: "الحلول الأمنية المتكاملة",
  },
  {
    src: logoAmazonEg,
    name: "Amazon.eg",
    nameAr: "أمازون مصر",
    specEn: "E-commerce",
    specAr: "تجارة إلكترونية",
  },
  {
    src: logoImtenan,
    name: "Imtenan",
    nameAr: "إمتنان",
    specEn: "FMCG",
    specAr: "قطاع السلع الاستهلاكية (FMCG)",
  },
  {
    src: logoMallOfEgypt,
    name: "Mall of Egypt",
    nameAr: "مول مصر",
    specEn: "Retail & Malls",
    specAr: "تجزئة ومراكز تسوق",
  },
  {
    src: logoBadreldin,
    name: "Badreldin Developments",
    nameAr: "بدر الدين",
    specEn: "Real Estate & Retail",
    specAr: "القطاع العقاري والتجزئة",
  },
  {
    src: logoAllerAqua,
    name: "Aller Aqua Egypt",
    nameAr: "ألر أكوا مصر",
    specEn: "Aquaculture Feed",
    specAr: "أعلاف الاستزراع السمكي",
  },
  {
    src: logoEvno,
    name: "Evno",
    nameAr: "إيفنو",
    specEn: "Tech & Innovation",
    specAr: "تكنولوجيا وابتكار",
  },
  {
    src: logoAlmajarah,
    name: "Al Majarah",
    nameAr: "المجرة",
    specEn: "Training & Consulting",
    specAr: "تدريب واستشارات",
  },
  {
    src: logoDaralnokba,
    name: "Daralnokba Recruitment",
    nameAr: "دار النخبة للتوظيف",
    specEn: "Recruitment",
    specAr: "استقطاب وتوظيف",
  },
  {
    src: logoNewBrand,
    name: "Knowledge City Holding",
    nameAr: "مدينة المعرفة القابضة",
    specEn: "Global Education & Training Sector",
    specAr: "قطاع التعليم العالمي والتدريب",
  },
];

export const snap10 = snap10Asset.url;

export const snap11 = snap11Asset.url;

export const snap12 = snap12Asset.url;

export const snap13 = snap13Asset.url;

export const snap15 = snap15Asset.url;

export const snap16 = snap16Asset.url;

export const WHATSAPP_BASE = "https://wa.me/966555376228";

export const WHATSAPP = `${WHATSAPP_BASE}?text=${encodeURIComponent("Hi Eslam, I'd like to book a free 1:1 session.")}`;

export const CALENDLY_URL = "https://calendly.com/eslam-m-selmi/30min";

export const LINKEDIN = "https://www.linkedin.com/in/eslam-selmi/";

export const openCalendly = (e?: React.MouseEvent) => {
  if (e) e.preventDefault();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("open-calendly"));
};

export const waServiceLink = (serviceEn: string, lang: "en" | "ar") => {
  const msg =
    lang === "ar"
      ? `مرحبًا إسلام، أرغب في طلب خدمة: ${serviceEn}. هل يمكننا التحدث؟`
      : `Hi Eslam, I'd like to request the "${serviceEn}" service. Can we chat?`;
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(msg)}`;
};

// Primary nav — kept short and focused. The full set lives in the mobile menu.

export const NAV: { id: string; key: string; to?: string; highlight?: boolean; action?: "book" }[] = [
  { id: "services", key: "nav_services" },
  { id: "current-courses", key: "nav_courses" },
  { id: "trainings", key: "nav_trainings", to: "/trainings" },
  { id: "success-cases", key: "nav_success_cases", to: "/success-cases" },
  { id: "library", key: "nav_library", to: "/library" },
  { id: "contact", key: "nav_contact" },
  { id: "book", key: "nav_book", action: "book", highlight: true },
];
// Mobile menu mirrors the desktop top-bar exactly (same labels, same order).

export const NAV_FULL: { id: string; key: string; to?: string; highlight?: boolean; action?: "book" }[] = [
  { id: "services", key: "nav_services" },
  { id: "current-courses", key: "nav_courses" },
  { id: "trainings", key: "nav_trainings", to: "/trainings" },
  { id: "success-cases", key: "nav_success_cases", to: "/success-cases" },
  { id: "library", key: "nav_library", to: "/library" },
  { id: "contact", key: "nav_contact" },
  { id: "book", key: "nav_book", action: "book", highlight: true },
  { id: "empowerment", key: "nav_empowerment", to: "/graduates" },
];

export const COUNTRIES = [
  { code: "eg", name: { en: "Egypt", ar: "مصر" } },
  { code: "sa", name: { en: "Saudi Arabia", ar: "السعودية" } },
  { code: "ae", name: { en: "UAE", ar: "الإمارات" } },
  { code: "dz", name: { en: "Algeria", ar: "الجزائر" } },
  { code: "ps", name: { en: "Palestine", ar: "فلسطين" } },
  { code: "om", name: { en: "Oman", ar: "عُمان" } },
  { code: "lb", name: { en: "Lebanon", ar: "لبنان" } },
  { code: "qa", name: { en: "Qatar", ar: "قطر" } },
  { code: "ma", name: { en: "Morocco", ar: "المغرب" } },
  { code: "tn", name: { en: "Tunisia", ar: "تونس" } },
  { code: "jo", name: { en: "Jordan", ar: "الأردن" } },
  { code: "ye", name: { en: "Yemen", ar: "اليمن" } },
];

export const JOURNEY = [
  {
    year: { en: "2017", ar: "2017" },
    role: { en: "Senior L&D / L&D Specialist", ar: "أخصائي أول / أخصائي تعلم وتطوير" },
    company: { en: "G4S", ar: "جي فور إس" },
    industry: { en: "Advanced Security Solutions", ar: "الحلول الأمنية المتكاملة" },
    country: "EG",
    logo: "https://logo.clearbit.com/g4s.com",
  },
  {
    year: { en: "2022", ar: "2022" },
    role: { en: "L&D Specialist", ar: "أخصائي تعلم وتطوير" },
    company: { en: "Aramex", ar: "أرامكس" },
    industry: { en: "Transport & Logistics", ar: "حلول النقل والخدمات اللوجستية" },
    country: "EG",
    logo: "https://logo.clearbit.com/aramex.com",
  },
  {
    year: { en: "2023", ar: "2023" },
    role: {
      en: "Department Supervisor & Learning Liaison",
      ar: "مشرف إدارة ومنسّق التعلم والتطوير",
    },
    company: { en: "Badreldin Developments", ar: "بدر الدين" },
    industry: { en: "Real Estate & Retail", ar: "القطاع العقاري والتجزئة" },
    country: "EG",
    logo: "https://logo.clearbit.com/badreldin.com",
  },
  {
    year: { en: "2025", ar: "2025" },
    role: { en: "Head of L&D & Talent Management", ar: "رئيس قسم التعلم والتطوير وإدارة المواهب" },
    company: { en: "Imtenan", ar: "إمتنان" },
    industry: { en: "FMCG", ar: "قطاع السلع الاستهلاكية (FMCG)" },
    country: "EG",
    logo: "https://logo.clearbit.com/imtenan.com",
  },
  {
    year: { en: "NOW", ar: "حاليًا" },
    role: { en: "Head of L&D", ar: "رئيس قسم التعلم والتطوير" },
    company: { en: "KnowledgeCity", ar: "مدينة المعرفة" },
    industry: { en: "Schools & Training", ar: "قطاع التعليم والتدريب" },
    country: "SA",
    logo: "https://logo.clearbit.com/knowledgecity.com",
  },
];

export const CREDENTIALS = [
  {
    name: { en: "PMP", ar: "إدارة المشاريع PMP" },
    issuer: { en: "London College", ar: "كلية لندن" },
    icon: BadgeCheck,
  },
  {
    name: { en: "PMI® Kick-Off Predictive", ar: "PMI® Kick-Off Predictive" },
    issuer: { en: "Project Management Institute", ar: "معهد إدارة المشاريع" },
    icon: BadgeCheck,
  },
  {
    name: { en: "TOT, Training of Trainers", ar: "تدريب المدربين TOT" },
    issuer: { en: "Certified Program", ar: "برنامج معتمد" },
    icon: Presentation,
  },
  {
    name: { en: "Performance & KPIs", ar: "إدارة الأداء والمؤشرات" },
    issuer: { en: "ESLSCA University", ar: "جامعة ESLSCA" },
    icon: BarChart3,
  },
  {
    name: {
      en: "Workplace Learning with Coaching & Mentoring",
      ar: "التعلم في بيئة العمل بالكوتشينج والإرشاد",
    },
    issuer: { en: "The Open University", ar: "الجامعة المفتوحة" },
    icon: HeartHandshake,
  },
  {
    name: { en: "Risk Management Workshop", ar: "ورشة إدارة المخاطر" },
    issuer: { en: "Masar Academy", ar: "مسار" },
    icon: Target,
  },
  {
    name: { en: "Design Thinking", ar: "التفكير التصميمي" },
    issuer: { en: "HP LIFE", ar: "HP LIFE" },
    icon: Lightbulb,
  },
  {
    name: { en: "Instructional Design", ar: "التصميم التعليمي" },
    issuer: { en: "Mentarcise", ar: "Mentarcise" },
    icon: Layers,
  },
  {
    name: { en: "IDPCC Certified", ar: "شهادة IDPCC" },
    issuer: { en: "IDPCC", ar: "IDPCC" },
    icon: Award,
  },
  {
    name: { en: "Leaders of Learning", ar: "قادة التعلم" },
    issuer: { en: "HarvardX", ar: "HarvardX" },
    icon: GraduationCap,
  },
];

export const SERVICES = [
  {
    icon: Target,
    key: "svc_strategy",
    title: { en: "L&D Strategy Consulting", ar: "الاستشارات الاستراتيجية للتعلم والتطوير" },
    desc: {
      en: "Tailored strategies that align training initiatives with business goals.",
      ar: "استراتيجيات مخصصة تربط مبادرات التدريب بأهداف العمل.",
    },
  },
  {
    icon: Layers,
    key: "svc_hybrid",
    title: { en: "Hybrid Corporate Training", ar: "تدريب مؤسسي هجين" },
    desc: {
      en: "Flexible sessions for companies, online and on-site.",
      ar: "جلسات مرنة للشركات، أونلاين وحضوريًا.",
    },
  },
  {
    icon: Lightbulb,
    key: "svc_id",
    title: { en: "Instructional Design", ar: "تصميم تعليمي" },
    desc: {
      en: "Engaging learning experiences crafted with innovative methods.",
      ar: "تجارب تعلم جذابة بأساليب مبتكرة.",
    },
  },
  {
    icon: HeartHandshake,
    key: "svc_coach",
    title: { en: "One-on-One Coaching", ar: "تدريب فردي" },
    desc: {
      en: "Personalized sessions to unlock individual potential and growth.",
      ar: "جلسات مخصصة لإطلاق الإمكانات والنمو.",
    },
  },
];

export const PROGRAMS = [
  {
    track: {
      en: "Training & Development Programs",
      ar: "إدارة التدريب والتطوير",
    },
    intro: {
      en: "A unified journey under the Training & Development Programs taxonomy: build foundational L&D and instructional design competencies, then graduate into advanced facilitation and TOT delivery mastery.",
      ar: 'مسار موحّد ضمن تصنيف "إدارة التدريب والتطوير": تبدأ بأسس التعلم والتطوير وتصميم التعليم، ثم تتدرّج لإتقان تيسير التدريب وتقديمه (TOT) على مستوى المدربين المعتمدين.',
    },
    items: [
      {
        name: { en: "L&D From Scratch", ar: "L&D من الصفر" },
        desc: {
          en: "TNA, annual plans, training kits, ROI analysis and budget management — the operating foundation of any L&D function.",
          ar: "تحليل الاحتياج، الخطط السنوية، أدوات التدريب، تحليل العائد وإدارة الميزانية — الأساس التشغيلي لأي إدارة تعلم وتطوير.",
        },
      },
      {
        name: { en: "Instructional Design | ID", ar: "التصميم التعليمي" },
        desc: {
          en: "Impactful training through expertly crafted, engaging learning experiences and modern ID frameworks (ADDIE, SAM).",
          ar: "تدريب مؤثر بتجارب تعلم مصممة باحتراف وأطر تصميم تعليمي حديثة (ADDIE وSAM).",
        },
      },
      {
        name: { en: "TOT Mastery (Training of Trainers)", ar: "إتقان تدريب المدربين TOT" },
        desc: {
          en: "Advanced facilitation, presentation craft, classroom dynamics and innovative delivery strategies — the natural graduation.",
          ar: "تيسير متقدم، حِرفية العرض، إدارة القاعة، واستراتيجيات تقديم مبتكرة.",
        },
      },
    ],
  },
  {
    track: { en: "Talent Management", ar: "إدارة المواهب" },
    intro: {
      en: "Real-world strategies for talent acquisition, employee development, and strategic planning.",
      ar: "استراتيجيات عملية لاستقطاب وتطوير المواهب والتخطيط الاستراتيجي.",
    },
    items: [
      {
        name: { en: "Recruitment Excellence", ar: "تميز التوظيف" },
        desc: {
          en: "Practical strategies to secure top talent.",
          ar: "استراتيجيات عملية لاستقطاب أفضل المواهب.",
        },
      },
    ],
  },
  {
    track: { en: "Soft Skills Management", ar: "إدارة المهارات الناعمة" },
    intro: {
      en: "Workshops that transform how you connect, lead, and grow.",
      ar: "ورش تحوّل طريقة التواصل والقيادة والنمو.",
    },
    items: [
      {
        name: { en: "Communication Skills", ar: "مهارات التواصل" },
        desc: {
          en: "Clear, persuasive, empathetic communication.",
          ar: "تواصل واضح ومُقنع ومتعاطف.",
        },
      },
      {
        name: { en: "Leadership Skills", ar: "مهارات القيادة" },
        desc: { en: "Inspire and guide teams toward success.", ar: "ألهم وقُد الفرق نحو النجاح." },
      },
      {
        name: { en: "Problem Solving", ar: "حل المشكلات" },
        desc: {
          en: "Analytical and strategic thinking for confident decisions.",
          ar: "تفكير تحليلي واستراتيجي لقرارات واثقة.",
        },
      },
      {
        name: { en: "Negotiation Skills", ar: "مهارات التفاوض" },
        desc: {
          en: "Practical strategies for win-win solutions.",
          ar: "استراتيجيات عملية لحلول رابحة للجميع.",
        },
      },
    ],
  },
];

export const PILLARS = [
  { icon: UserCheck, key: "talent", color: "from-accent/35 to-primary/10" },
  { icon: TrendingUp, key: "perf", color: "from-gold/35 to-accent/10" },
  { icon: BarChart3, key: "kpi", color: "from-lavender/35 to-primary/10" },
];

export const SNAPSHOTS = [
  snap1,
  snap15,
  snap10,
  snap2,
  snap16,
  snap11,
  snap5,
  snap12,
  snap3,
  snap13,
  snap8,
  snap4,
  snap7,
  snap6,
];

export type ThemeMode = "dark" | "light";

export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.21, 0.5, 0.3, 1] as const },
};

export type BookingSlot = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  booked_by: string | null;
};

export type JourneyItem = (typeof JOURNEY)[number] & { current?: boolean; countryName?: { en: string; ar: string } };

export type TestimonialRow = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  quote: string;
  avatar_url: string | null;
  rating: number | null;
};

export const COURSES_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSePiL3_X7XaxWa6oAMlUc0TgT80z1mozFSExDzZnqvfmP4nRA/viewform?embedded=true";

export type PublicCourse = {
  id: string;
  title: string;
  description: string | null;
  cover_emoji: string | null;
  price: number | null;
  currency: string;
  starts_at: string | null;
  ends_at: string | null;
  total_hours: number;
  online_url: string | null;
  brand_name: string | null;
  brand_tagline_ar: string | null;
  brand_tagline_en: string | null;
  course_goals: string | null;
  target_audience: string | null;
  is_upcoming: boolean;
};

export const LIBRARY_DRIVE_ID = "1dhtjAdvchdH6DEIyT-VoDAWd2itLsnZq";

export const LIBRARY_EMBED_URL = `https://drive.google.com/embeddedfolderview?id=${LIBRARY_DRIVE_ID}#grid`;

export const LIBRARY_OPEN_URL = `https://drive.google.com/drive/folders/${LIBRARY_DRIVE_ID}?usp=sharing`;

export const PODCAST_EPISODES = [
  {
    id: "f0cDZYSbrCU",
    number: "01",
    titleKey: "podcast_ep1_title",
    descKey: "podcast_ep1_desc",
    duration: "—",
  },
  {
    id: "XAOMhy9vyOI",
    number: "02",
    titleKey: "podcast_ep2_title",
    descKey: "podcast_ep2_desc",
    duration: "—",
  },
  {
    id: "yOYL9R84yyE",
    number: "03",
    titleKey: "podcast_ep3_title",
    descKey: "podcast_ep3_desc",
    duration: "—",
  },
  {
    id: "IGlDz6mCcU0",
    number: "04",
    titleKey: "podcast_ep4_title",
    descKey: "podcast_ep4_desc",
    duration: "—",
  },
];

export type InterviewRow = {
  id: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  cover_url: string | null;
  resource_url: string;
};

export type TrainingRow = {
  id: string;
  title_ar: string;
  title_en: string | null;
  role_ar: string | null;
  role_en: string | null;
  period_ar: string | null;
  period_en: string | null;
  cover_url: string | null;
  challenge_ar: string | null;
  challenge_en: string | null;
  solution_ar: string | null;
  solution_en: string | null;
  result_ar: string | null;
  result_en: string | null;
  gallery: string[];
  tags: string[];
  is_featured: boolean;
};
