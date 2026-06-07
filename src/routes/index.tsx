import { createFileRoute, Link } from "@tanstack/react-router";
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
  Compass,
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LatestAdditionsSection } from "@/components/LatestAdditions";
import { useSiteContent } from "@/lib/site-content";
import { SitePopup } from "@/components/SitePopup";
import {
  COUNTRIES as PHONE_COUNTRIES,
  findCountry as findDialCountry,
  sanitizeNationalNumber,
  validatePhoneForCountry,
} from "@/lib/countries";

import headshotAsset from "@/assets/portfolio/headshot.webp.asset.json";
const headshot = headshotAsset.url;
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
const brandLogo = brandLogoAsset.url;
import snap1Asset from "@/assets/snapshots/snap-1.jpg.asset.json";
const snap1 = snap1Asset.url;
import snap2Asset from "@/assets/snapshots/snap-2.jpg.asset.json";
const snap2 = snap2Asset.url;
import snap3Asset from "@/assets/snapshots/snap-3.jpg.asset.json";
const snap3 = snap3Asset.url;
import snap4Asset from "@/assets/snapshots/snap-4.jpg.asset.json";
const snap4 = snap4Asset.url;
import snap5Asset from "@/assets/snapshots/snap-5.jpg.asset.json";
const snap5 = snap5Asset.url;
import snap6Asset from "@/assets/snapshots/snap-6.jpg.asset.json";
const snap6 = snap6Asset.url;
import snap7Asset from "@/assets/snapshots/snap-7.jpg.asset.json";
const snap7 = snap7Asset.url;
import snap8Asset from "@/assets/snapshots/snap-8.jpg.asset.json";
const snap8 = snap8Asset.url;
import logoAramexAsset from "@/assets/clients/aramex.jpg.asset.json";
const logoAramex = logoAramexAsset.url;
import logoG4sAsset from "@/assets/clients/g4s.jpg.asset.json";
const logoG4s = logoG4sAsset.url;
import logoAllerAquaAsset from "@/assets/clients/aller-aqua.jpg.asset.json";
const logoAllerAqua = logoAllerAquaAsset.url;
import logoEvnoAsset from "@/assets/clients/evno.jpg.asset.json";
const logoEvno = logoEvnoAsset.url;
import logoBadreldinAsset from "@/assets/clients/badreldin.jpg.asset.json";
const logoBadreldin = logoBadreldinAsset.url;
import logoAmazonEgAsset from "@/assets/clients/amazon-eg.jpg.asset.json";
const logoAmazonEg = logoAmazonEgAsset.url;
import logoAlmajarahAsset from "@/assets/clients/almajarah.jpg.asset.json";
const logoAlmajarah = logoAlmajarahAsset.url;
import logoImtenanAsset from "@/assets/clients/imtenan.jpg.asset.json";
const logoImtenan = logoImtenanAsset.url;
import logoDaralnokbaAsset from "@/assets/clients/daralnokba.jpg.asset.json";
const logoDaralnokba = logoDaralnokbaAsset.url;
import logoMallOfEgyptAsset from "@/assets/clients/mall-of-egypt.jpg.asset.json";
const logoMallOfEgypt = logoMallOfEgyptAsset.url;
import logoNewBrandAsset from "@/assets/clients/new-brand.jpg.asset.json";
const logoNewBrand = logoNewBrandAsset.url;
const BRANDS: { src: string; name: string; nameAr: string; specEn: string; specAr: string }[] = [
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
    name: "Partner",
    nameAr: "شريك",
    specEn: "Strategic Partner",
    specAr: "شريك استراتيجي",
  },
];
import snap10Asset from "@/assets/snapshots/snap-10.jpg.asset.json";
const snap10 = snap10Asset.url;
import snap11Asset from "@/assets/snapshots/snap-11.jpg.asset.json";
const snap11 = snap11Asset.url;
import snap12Asset from "@/assets/snapshots/snap-12.jpg.asset.json";
const snap12 = snap12Asset.url;
import snap13Asset from "@/assets/snapshots/snap-13.jpg.asset.json";
const snap13 = snap13Asset.url;
import snap15Asset from "@/assets/snapshots/snap-15.jpg.asset.json";
const snap15 = snap15Asset.url;
import snap16Asset from "@/assets/snapshots/snap-16.jpg.asset.json";
const snap16 = snap16Asset.url;
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eslam Selmi — Head of L&D & Talent" },
      {
        name: "description",
        content:
          "Portfolio of Eslam Selmi: Learning & Development, Talent Management, and Performance expertise across 12 countries. Book a free 1:1.",
      },
      { property: "og:url", content: "https://eslam-selmi.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://eslam-selmi.lovable.app/" },
      { rel: "preload", as: "image", href: headshot, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              "@id": "https://eslam-selmi.lovable.app/#person",
              name: "Eslam Selmi",
              jobTitle: "Head of Learning & Development",
              url: "https://eslam-selmi.lovable.app/",
              image: "https://eslam-selmi.lovable.app/favicon.png",
              sameAs: ["https://www.linkedin.com/in/eslam-selmi/"],
              knowsAbout: [
                "Learning & Development",
                "Talent Management",
                "Performance Management",
                "KPIs",
                "Corporate Training",
              ],
            },
            {
              "@type": "WebSite",
              "@id": "https://eslam-selmi.lovable.app/#website",
              url: "https://eslam-selmi.lovable.app/",
              name: "Eslam Selmi — Head of L&D",
              inLanguage: ["en", "ar"],
              publisher: { "@id": "https://eslam-selmi.lovable.app/#person" },
            },
            {
              "@type": "Service",
              name: "Strategy Consulting & Corporate Training",
              serviceType: "Learning & Development consulting",
              provider: { "@id": "https://eslam-selmi.lovable.app/#person" },
              areaServed: ["Egypt", "Saudi Arabia", "MENA"],
              description:
                "L&D strategy, talent management, performance & KPIs design, and corporate training programs for enterprises across 12 countries.",
            },
          ],
        }),
      },
    ],
  }),
  component: Portfolio,
});

const WHATSAPP_BASE = "https://wa.me/966555376228";
const WHATSAPP = `${WHATSAPP_BASE}?text=${encodeURIComponent("Hi Eslam, I'd like to book a free 1:1 session.")}`;
const CALENDLY_URL = "https://calendly.com/eslam-m-selmi/30min";
const LINKEDIN = "https://www.linkedin.com/in/eslam-selmi/";

const openCalendly = (e?: React.MouseEvent) => {
  if (e) e.preventDefault();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("open-calendly"));
};

const waServiceLink = (serviceEn: string, lang: "en" | "ar") => {
  const msg =
    lang === "ar"
      ? `مرحبًا إسلام، أرغب في طلب خدمة: ${serviceEn}. هل يمكننا التحدث؟`
      : `Hi Eslam, I'd like to request the "${serviceEn}" service. Can we chat?`;
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(msg)}`;
};

// Primary nav — kept short and focused. The full set lives in the mobile menu.
const NAV: { id: string; key: string; to?: string }[] = [
  { id: "about", key: "nav_about" },
  { id: "journey", key: "nav_journey" },
  { id: "services", key: "nav_services" },
  { id: "programs", key: "nav_programs" },
  { id: "current-courses", key: "nav_courses" },
  { id: "library", key: "nav_library", to: "/library" },
  { id: "podcast", key: "nav_podcast" },
  { id: "contact", key: "nav_contact" },
];
const NAV_FULL: { id: string; key: string; to?: string }[] = [
  { id: "home", key: "nav_home" },
  { id: "about", key: "nav_about" },
  { id: "pillars", key: "nav_pillars" },
  { id: "journey", key: "nav_journey" },
  { id: "services", key: "nav_services" },
  { id: "programs", key: "nav_programs" },
  { id: "empowerment", key: "nav_empowerment", to: "/graduates" },
  { id: "current-courses", key: "nav_courses" },
  { id: "library", key: "nav_library", to: "/library" },
  { id: "podcast", key: "nav_podcast" },
  { id: "clients", key: "nav_clients" },
  { id: "snapshots", key: "nav_snapshots" },
  { id: "contact", key: "nav_contact" },
];

const COUNTRIES = [
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

const JOURNEY = [
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
    role: { en: "Head of L&D", ar: "رئيس التعلم والتطوير" },
    company: { en: "Imtenan", ar: "إمتنان" },
    industry: { en: "FMCG", ar: "قطاع السلع الاستهلاكية (FMCG)" },
    country: "EG",
    logo: "https://logo.clearbit.com/imtenan.com",
  },
  {
    year: { en: "NOW", ar: "حاليًا" },
    role: { en: "Head of L&D", ar: "رئيس التعلم والتطوير" },
    company: { en: "KnowledgeCity", ar: "مدينة المعرفة" },
    industry: { en: "Schools & Training", ar: "قطاع التعليم والتدريب" },
    country: "SA",
    logo: "https://logo.clearbit.com/knowledgecity.com",
  },
];

const CREDENTIALS = [
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
    issuer: { en: "Masar Academy", ar: "أكاديمية مسار" },
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

const SERVICES = [
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

const PROGRAMS = [
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

const PILLARS = [
  { icon: UserCheck, key: "talent", color: "from-accent/35 to-primary/10" },
  { icon: TrendingUp, key: "perf", color: "from-gold/35 to-accent/10" },
  { icon: BarChart3, key: "kpi", color: "from-lavender/35 to-primary/10" },
];
const SNAPSHOTS = [
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

type ThemeMode = "dark" | "light";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.21, 0.5, 0.3, 1] as const },
};

function Portfolio() {
  const { theme, toggle } = useTheme();
  const { isVisible } = useSiteContent();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  return (
    <MotionConfig reducedMotion={isMobile ? "always" : "never"}>
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent/25">
      <Nav theme={theme as ThemeMode} onThemeToggle={toggle} />
      {isVisible("home.hero") && <Hero />}
      {isVisible("home.about") && <About />}
      {isVisible("home.pillars") && <Pillars />}
      {isVisible("home.journey") && <Journey />}
      {isVisible("home.brands") && <Brands />}
      {isVisible("home.services") && <Services />}
      {isVisible("home.programs") && <Programs />}

      {isVisible("home.latest_additions") && (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-12">
          <LatestAdditionsSection />
        </div>
      )}

      {isVisible("home.current_courses") && <CurrentCourses />}

      {isVisible("home.podcast") && <Podcast />}
      {isVisible("home.clients") && <Clients />}
      {isVisible("home.snapshots") && <Snapshots />}
      {isVisible("home.cta") && <BookCTA />}
      {isVisible("home.contact") && <Contact />}
      {isVisible("home.footer") && <Footer />}
      <WhatsAppFloat />
      <ScrollTop />
      <CalendlyDialog />
      <SitePopup />
    </div>
    </MotionConfig>
  );
}

/* ---------- CALENDLY DIALOG ---------- */
export function CalendlyDialog() {
  const { t, dir } = useI18n();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-calendly", handler);
    return () => window.removeEventListener("open-calendly", handler);
  }, []);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      dir={dir}
    >
      <div
        className="relative w-full max-w-3xl h-[85vh] rounded-2xl overflow-hidden bg-card shadow-2xl border border-foreground/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/10 bg-card">
          <div className="min-w-0">
            <div className="font-display font-bold text-sm sm:text-base truncate">
              {t("calendly_title")}
            </div>
            <div className="text-xs text-muted-foreground truncate">{t("calendly_desc")}</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="size-9 grid place-items-center rounded-full hover:bg-foreground/10 transition shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
        <iframe
          src={CALENDLY_URL}
          title="Calendly booking"
          className="w-full h-[calc(85vh-56px)] border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
}

/* ---------- BRAND MARK ---------- */
function BrandMark({ size = 62 }: { size?: number }) {
  const { lang } = useI18n();
  const displayName = lang === "ar" ? "إسلام سلمي" : "Eslam Selmi";
  return (
    <div className="flex items-center gap-2">
      <img
        src={brandLogo}
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

export function Nav({
  theme,
  onThemeToggle,
}: { theme?: ThemeMode; onThemeToggle?: () => void } = {}) {
  const { t, lang, setLang } = useI18n();
  const { theme: ctxTheme, toggle: ctxToggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (portalRef.current && !portalRef.current.contains(e.target as Node)) setPortalOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const activeTheme: ThemeMode = (theme ?? ctxTheme) as ThemeMode;
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const handleThemeToggle = onThemeToggle ?? ctxToggle;
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const isHome = pathname === "/";
  const hashHref = (id: string) => (isHome ? `#${id}` : `/#${id}`);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "py-2" : "py-4"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={`bg-card/85 backdrop-blur-xl border border-foreground/10 rounded-full ps-3 pe-2 py-2 flex items-center justify-between gap-2 ${scrolled ? "shadow-[0_8px_30px_-12px_rgba(15,27,61,0.15)]" : ""}`}
        >
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <BrandMark />
          </Link>
          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV.map((n) =>
              n.to ? (
                <Link
                  key={n.id}
                  to={n.to}
                  className="px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-foreground/5"
                >
                  {t(n.key)}
                </Link>
              ) : (
                <a
                  key={n.id}
                  href={hashHref(n.id)}
                  className="px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-foreground/5"
                >
                  {t(n.key)}
                </a>
              ),
            )}
            <Link
              to="/graduates"
              className="ms-2 group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-extrabold tracking-tight border-2 transition-all hover:-translate-y-0.5"
              style={{
                borderColor: "var(--accent)",
                color: "var(--accent)",
                background:
                  "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.10), oklch(0.75 0.13 85 / 0.02))",
                boxShadow: "0 0 0 3px oklch(0.75 0.13 85 / 0.08)",
              }}
            >
              <Rocket className="size-3.5" />
              {t("nav_empowerment")}
            </Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : ("en" as Lang))}
              aria-label="Toggle language"
              className="group inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1.5 hover:bg-foreground/5 hover:border-foreground/30 transition"
            >
              <Languages className="size-3.5 opacity-70" />
              <span
                className={`font-bold leading-none ${lang === "en" ? "text-[15px] font-display" : "text-[12px] tracking-wider"}`}
              >
                {lang === "en" ? "ع" : "En"}
              </span>
            </button>
            <button
              onClick={handleThemeToggle}
              aria-label="Toggle theme"
              className="relative inline-flex size-9 items-center justify-center rounded-full border border-foreground/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-foreground/20 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden group glass"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 to-lavender/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.div
                key={activeTheme}
                initial={{ y: 12, rotate: 45, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative z-10 flex items-center justify-center"
              >
                {activeTheme === "dark" ? (
                  <Sun className="size-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                ) : (
                  <Moon className="size-4 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                )}
              </motion.div>
            </button>
            <a
              href={LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hidden sm:inline-flex size-9 items-center justify-center rounded-full border border-foreground/10 hover:bg-foreground/5 transition"
            >
              <Linkedin className="size-4" />
            </a>

            {/* Portal access — elegant gold-ringed dropdown */}
            <div className="relative" ref={portalRef}>
              <button
                onClick={() => setPortalOpen((v) => !v)}
                aria-label={lang === "ar" ? "بوابة الدخول" : "Portal access"}
                aria-expanded={portalOpen}
                className="relative inline-flex size-9 items-center justify-center rounded-full transition-all group"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.18), oklch(0.75 0.13 85 / 0.04))",
                  border: "1.5px solid oklch(0.75 0.13 85 / 0.55)",
                  boxShadow: portalOpen
                    ? "0 0 0 4px oklch(0.75 0.13 85 / 0.18), 0 6px 20px -8px oklch(0.75 0.13 85 / 0.55)"
                    : "0 0 0 0 transparent",
                }}
              >
                <KeyRound className="size-[15px]" style={{ color: "var(--accent)" }} />
                <span
                  className="absolute -top-0.5 -end-0.5 size-2 rounded-full"
                  style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }}
                />
              </button>
              <AnimatePresence>
                {portalOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute end-0 mt-3 w-64 rounded-2xl overflow-hidden z-50"
                    style={{
                      background: "rgba(11,23,54,0.96)",
                      border: "1px solid oklch(0.75 0.13 85 / 0.35)",
                      boxShadow:
                        "0 20px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px oklch(0.75 0.13 85 / 0.12)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div
                      className="px-4 py-3 border-b text-[11px] font-bold tracking-[0.18em] uppercase"
                      style={{
                        borderColor: "oklch(0.75 0.13 85 / 0.18)",
                        color: "oklch(0.75 0.13 85)",
                        background:
                          "linear-gradient(90deg, oklch(0.75 0.13 85 / 0.10), transparent)",
                      }}
                    >
                      {lang === "ar" ? "بوابة الدخول" : "Access Portal"}
                    </div>
                    <Link
                      to="/auth"
                      search={{ role: "admin" }}
                      onClick={() => setPortalOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors group"
                      style={{ color: "white" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "oklch(0.75 0.13 85 / 0.10)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span
                        className="size-9 grid place-items-center rounded-xl shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.25), oklch(0.75 0.13 85 / 0.08))",
                          border: "1px solid oklch(0.75 0.13 85 / 0.40)",
                        }}
                      >
                        <ShieldCheck className="size-4" style={{ color: "var(--accent)" }} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold leading-tight">
                          {lang === "ar" ? "دخول الإدارة" : "Admin Login"}
                        </div>
                        <div className="text-[11px] opacity-60 leading-tight mt-0.5">
                          {lang === "ar" ? "لوحة تحكم المسؤول" : "Administrator dashboard"}
                        </div>
                      </div>
                      <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 rtl-flip transition-all" />
                    </Link>
                    <Link
                      to="/auth"
                      search={{ role: "trainee" }}
                      onClick={() => setPortalOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors group border-t"
                      style={{ color: "white", borderColor: "oklch(0.75 0.13 85 / 0.12)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "oklch(0.75 0.13 85 / 0.10)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span
                        className="size-9 grid place-items-center rounded-xl shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.25), oklch(0.75 0.13 85 / 0.08))",
                          border: "1px solid oklch(0.75 0.13 85 / 0.40)",
                        }}
                      >
                        <GraduationCap className="size-4" style={{ color: "var(--accent)" }} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold leading-tight">
                          {lang === "ar" ? "دخول المتدربين" : "Trainee Login"}
                        </div>
                        <div className="text-[11px] opacity-60 leading-tight mt-0.5">
                          {lang === "ar" ? "بوابة المتدربين والشهادات" : "Trainees & certificates"}
                        </div>
                      </div>
                      <ArrowRight className="size-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 rtl-flip transition-all" />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={openCalendly}
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 transition cursor-pointer"
            >
              <Calendar className="size-4" /> {t("book_cta")}
            </button>
            <button className="xl:hidden p-2" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="xl:hidden mt-2 glass-strong rounded-2xl p-3 grid gap-1">
            {NAV_FULL.map((n) => {
              if (n.id === "empowerment") {
                return (
                  <Link
                    key={n.id}
                    to={n.to!}
                    onClick={() => setOpen(false)}
                    className="my-1 inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold tracking-tight border-2 transition-all"
                    style={{
                      borderColor: "var(--accent)",
                      color: "var(--accent)",
                      background:
                        "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.12), oklch(0.75 0.13 85 / 0.03))",
                      boxShadow: "0 0 0 3px oklch(0.75 0.13 85 / 0.08)",
                    }}
                  >
                    <span className="size-7 grid place-items-center rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30">
                      <Rocket className="size-3.5" />
                    </span>
                    <span className="flex-1">{t(n.key)}</span>
                    <ArrowRight className="size-4 rtl-flip opacity-70" />
                  </Link>
                );
              }
              return n.to ? (
                <Link
                  key={n.id}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-foreground/5 text-sm"
                >
                  {t(n.key)}
                </Link>
              ) : (
                <a
                  key={n.id}
                  href={hashHref(n.id)}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-foreground/5 text-sm"
                >
                  {t(n.key)}
                </a>
              );
            })}
            <button
              onClick={(e) => {
                setOpen(false);
                openCalendly(e);
              }}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold cursor-pointer"
            >
              <Calendar className="size-4" /> {t("book_cta")}
            </button>
            <div className="mt-2 pt-2 border-t border-foreground/10 grid grid-cols-2 gap-2">
              <Link
                to="/auth"
                search={{ role: "admin" }}
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.18), oklch(0.75 0.13 85 / 0.05))",
                  border: "1px solid oklch(0.75 0.13 85 / 0.45)",
                  color: "var(--accent)",
                }}
              >
                <ShieldCheck className="size-4" />
                {lang === "ar" ? "دخول الإدارة" : "Admin"}
              </Link>
              <Link
                to="/auth"
                search={{ role: "trainee" }}
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.75 0.13 85 / 0.18), oklch(0.75 0.13 85 / 0.05))",
                  border: "1px solid oklch(0.75 0.13 85 / 0.45)",
                  color: "var(--accent)",
                }}
              >
                <GraduationCap className="size-4" />
                {lang === "ar" ? "المتدربين" : "Trainees"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const nameEn = "Eslam Selmi";
  const nameAr = "إسلام سلمي";

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen pt-28 pb-16 lg:pt-32 overflow-hidden"
    >
      {/* Soft background wash */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 85% 12%, oklch(0.72 0.13 180 / 0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 5% 90%, oklch(0.22 0.06 252 / 0.10), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          opacity: 0.4,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left: Copy */}
        <motion.div style={{ y }} className="lg:col-span-7 order-2 lg:order-1 space-y-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em]"
            style={{ color: "var(--accent)" }}
          >
            <span className="h-px w-8" style={{ background: "var(--accent)" }} />
            {lang === "ar" ? "حلول مبتكرة لبناء القدرات" : "Innovative Solutions for Building"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="font-display font-extrabold text-balance leading-[1.05] text-[clamp(2rem,4.6vw,4.25rem)] text-foreground"
          >
            {lang === "ar" ? (
              <>
                إطلاق إمكانات المواهب مع <span style={{ color: "var(--accent)" }}>{nameAr}</span>
              </>
            ) : (
              <>
                Unlocking Talent Potential With{" "}
                <span style={{ color: "var(--accent)" }}>{nameEn}</span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground"
          >
            {t("hero_intro")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap gap-3 pt-2"
          >
            <button
              onClick={openCalendly}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-sm font-bold text-primary-foreground shadow-[0_18px_40px_-14px_oklch(0.22_0.06_252/0.5)] hover:translate-y-[-2px] transition cursor-pointer"
            >
              <Calendar className="size-4" /> {t("hero_btn_book")}
              <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
            </button>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 bg-card px-7 py-4 text-sm font-bold text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] transition"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a
              href="#podcast"
              aria-label="Listen to the L&D Podcast"
              className="group relative inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white overflow-hidden shadow-[0_18px_40px_-14px_oklch(0.55_0.2_290/0.55)] hover:translate-y-[-2px] transition"
              style={{
                background: "linear-gradient(135deg, oklch(0.32 0.13 280), oklch(0.55 0.18 200))",
              }}
            >
              <span className="relative grid place-items-center size-6 rounded-full bg-white/15 backdrop-blur-sm">
                <Mic className="size-3.5" />
                <span className="absolute inset-0 rounded-full ring-2 ring-white/40 animate-ping" />
              </span>
              <span className="relative">{t("listen_podcast")}</span>
              <ArrowRight className="relative size-4 group-hover:translate-x-1 rtl-flip transition" />
            </a>
          </motion.div>

          {/* Social row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-3 pt-3"
          >
            <a
              href={LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="size-10 rounded-full border border-foreground/15 grid place-items-center text-foreground/70 hover:text-foreground hover:border-foreground/30 transition"
            >
              <Linkedin className="size-4" />
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="size-10 rounded-full border border-foreground/15 grid place-items-center text-foreground/70 hover:text-foreground hover:border-foreground/30 transition"
            >
              <MessageCircle className="size-4" />
            </a>
            <a
              href="mailto:eslam.selmi@example.com"
              aria-label="Email"
              className="size-10 rounded-full border border-foreground/15 grid place-items-center text-foreground/70 hover:text-foreground hover:border-foreground/30 transition"
            >
              <Mail className="size-4" />
            </a>
          </motion.div>
        </motion.div>

        {/* Right: Portrait — editorial squircle with offset accents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-5 order-1 lg:order-2 relative"
        >
          <div className="relative w-full max-w-[360px] sm:max-w-[400px] mx-auto aspect-[4/5]">
            {/* Aurora backdrop */}
            <div
              className="absolute -inset-8 blur-3xl opacity-70"
              style={{
                background:
                  "radial-gradient(60% 50% at 30% 20%, oklch(0.74 0.10 295 / 0.45), transparent 70%), radial-gradient(50% 50% at 80% 80%, oklch(0.72 0.13 180 / 0.40), transparent 70%)",
              }}
            />
            {/* Offset gold geometric accent (behind) */}
            <div
              className="absolute -right-3 -bottom-3 w-[70%] h-[70%] -z-0"
              style={{
                background: "linear-gradient(135deg, var(--accent), oklch(0.78 0.10 85))",
                borderRadius: "2.5rem 0.5rem 2.5rem 0.5rem",
                transform: "rotate(-6deg)",
                opacity: 0.95,
                boxShadow: "0 30px 60px -25px oklch(0.55 0.13 85 / 0.45)",
              }}
            />
            {/* Offset navy plate (behind, opposite corner) */}
            <div
              className="absolute -left-4 -top-4 w-[55%] h-[55%] -z-0"
              style={{
                background: "linear-gradient(135deg, var(--navy-deep), var(--lavender-deep))",
                borderRadius: "0.5rem 2rem 0.5rem 2rem",
                transform: "rotate(5deg)",
                opacity: 0.85,
              }}
            />
            {/* Main portrait — squircle with double frame */}
            <div
              className="relative h-full w-full p-[3px]"
              style={{
                borderRadius: "2.25rem",
                background:
                  "linear-gradient(160deg, var(--accent) 0%, oklch(0.96 0.04 90) 35%, var(--lavender-deep) 70%, var(--navy) 100%)",
                boxShadow: "0 40px 90px -35px oklch(0.22 0.06 252 / 0.55)",
              }}
            >
              <div
                className="relative h-full w-full overflow-hidden"
                style={{
                  borderRadius: "2.1rem",
                  background:
                    "linear-gradient(170deg, oklch(0.96 0.015 200) 0%, oklch(0.90 0.03 195) 60%, oklch(0.82 0.05 260) 100%)",
                }}
              >
                <img
                  src={headshot}
                  alt="Eslam Selmi"
                  width={800}
                  height={1000}
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-x-0 bottom-0 h-[120%] w-full object-contain object-bottom"
                />
                {/* Thin inner stroke */}
                <div
                  className="pointer-events-none absolute inset-1.5"
                  style={{
                    borderRadius: "1.95rem",
                    boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.35)",
                  }}
                />
                {/* Bottom gradient wash */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 55%, oklch(0.22 0.06 252 / 0.35) 100%)",
                  }}
                />
                {/* Corner monogram */}
                <div className="absolute top-3 left-3 size-9 grid place-items-center rounded-xl backdrop-blur bg-white/15 border border-white/30 text-white font-display text-[13px] font-extrabold tracking-tight">
                  ES
                </div>
              </div>
            </div>

            {/* Floating chip — Years */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-1 sm:-right-4 top-4 rounded-2xl px-4 py-2.5 bg-card/95 backdrop-blur border border-foreground/10 shadow-lg"
            >
              <div
                className="text-xl sm:text-2xl font-extrabold font-display leading-none"
                style={{ color: "var(--accent)" }}
              >
                9+
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 font-medium tracking-wide">
                {lang === "ar" ? "سنوات خبرة" : "Years"}
              </div>
            </motion.div>

            {/* Floating chip — Countries */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-1 sm:-left-4 bottom-10 rounded-2xl px-4 py-2.5 bg-card/95 backdrop-blur border border-foreground/10 shadow-lg"
            >
              <div
                className="text-xl sm:text-2xl font-extrabold font-display leading-none"
                style={{ color: "var(--accent)" }}
              >
                12+
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 font-medium tracking-wide">
                {lang === "ar" ? "دولة" : "Countries"}
              </div>
            </motion.div>

            {/* Side pill — Sectors */}
            <motion.div
              animate={{ x: [0, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-2 sm:-left-6 top-[18%] rounded-full px-3.5 py-2 bg-primary text-primary-foreground shadow-lg flex items-center gap-2"
            >
              <span className="text-lg font-extrabold font-display leading-none">4</span>
              <span className="text-[10px] uppercase tracking-wider opacity-85 font-semibold">
                {lang === "ar" ? "قطاعات" : "Sectors"}
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <div className="font-display text-3xl sm:text-4xl text-foreground">{n}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{l}</div>
    </div>
  );
}

function CompactStat({ n, l }: { n: string; l: string }) {
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

/* ---------- ABOUT (Minimal Premium Edition) ---------- */
function About() {
  const { t } = useI18n();

  return (
    <section id="about" className="px-4 sm:px-6 py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <div className="absolute -start-20 top-1/2 -translate-y-1/2 size-72 rounded-full bg-accent/[0.07] blur-3xl" />
      <div className="absolute -end-20 top-1/2 -translate-y-1/2 size-72 rounded-full bg-gold/[0.05] blur-3xl" />

      <div className="mx-auto max-w-4xl relative">
        <div className="text-center">
          <Quote className="size-8 text-gold/60 mx-auto mb-8 rtl-flip" />
          <p className="text-xl sm:text-2xl lg:text-[1.75rem] font-medium leading-[2.2] text-foreground/90 tracking-wide">
            {t("about_intro")}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- PILLARS ---------- */
function Pillars() {
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
function Journey() {
  const { t, lang } = useI18n();
  return (
    <Section id="journey" eyebrow={t("journey_eyebrow")} title={t("journey_title")}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {JOURNEY.map((j, i) => {
          const country =
            j.country === "SA"
              ? { flag: "sa", name: { en: "Saudi Arabia", ar: "السعودية" } }
              : { flag: "eg", name: { en: "Egypt", ar: "مصر" } };

          return (
            <motion.div
              key={j.year.en + j.company.en + i}
              {...fadeUp}
              transition={{ delay: i * 0.07, duration: 0.55 }}
              className="group relative rounded-3xl bg-card border border-foreground/10 p-6 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_oklch(0.22_0.06_252/0.35)] transition-all overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/40 to-transparent opacity-70" />

              {/* Top row: year + country flag */}
              <div className="flex items-center justify-between mb-5">
                <span
                  className="font-display text-3xl font-extrabold tracking-tight"
                  style={{ color: "var(--accent)" }}
                >
                  {j.year[lang]}
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

              {/* Company */}
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
        })}
      </div>
    </Section>
  );
}

/* ---------- SERVICES ---------- */
function Services() {
  const { t, lang } = useI18n();
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
                href={waServiceLink(s.title.en, lang)}
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
function Programs() {
  const { t, lang } = useI18n();
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
function Clients() {
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
function Brands() {
  const { t, lang } = useI18n();
  const row1 = BRANDS;
  const row2 = [...BRANDS].reverse();

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
            {BRANDS.length}+
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
function Snapshots() {
  const { t, dir } = useI18n();
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (active === null) return;
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight")
        setActive((a) => (a === null ? null : (a + 1) % SNAPSHOTS.length));
      if (e.key === "ArrowLeft")
        setActive((a) => (a === null ? null : (a - 1 + SNAPSHOTS.length) % SNAPSHOTS.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Split snapshots across two tracks so the rows don't show the same images
  const half = Math.ceil(SNAPSHOTS.length / 2);
  const setA = SNAPSHOTS.slice(0, half);
  const setB = SNAPSHOTS.slice(half);
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
                    originalIndex={SNAPSHOTS.indexOf(src)}
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
                    originalIndex={SNAPSHOTS.indexOf(src)}
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
              src={SNAPSHOTS[active]}
              alt=""
              className="max-h-[88vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-5 inset-x-0 flex justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) =>
                    a === null ? null : (a - 1 + SNAPSHOTS.length) % SNAPSHOTS.length,
                  );
                }}
                className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm">
                {active + 1} / {SNAPSHOTS.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a === null ? null : (a + 1) % SNAPSHOTS.length));
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

/* ---------- BOOK CTA ---------- */
function BookCTA() {
  const { t } = useI18n();
  const steps = [
    { i: Target, t: t("book_step_1_t"), d: t("book_step_1_d") },
    { i: Lightbulb, t: t("book_step_2_t"), d: t("book_step_2_d") },
    { i: HeartHandshake, t: t("book_step_3_t"), d: t("book_step_3_d") },
  ];
  return (
    <section id="book" className="px-4 sm:px-6 py-16">
      <motion.div
        {...fadeUp}
        className="relative mx-auto max-w-6xl rounded-[2.25rem] p-8 sm:p-12 lg:p-16 overflow-hidden bg-[#0b1736] text-white shadow-[0_40px_80px_-40px_rgba(11,23,54,0.6)]"
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 85% 10%, oklch(0.72 0.13 180 / 0.55), transparent 60%), radial-gradient(ellipse 50% 50% at 10% 90%, oklch(0.55 0.2 290 / 0.35), transparent 65%)",
          }}
        />
        <div className="absolute inset-0 grain opacity-30" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white">
              <Sparkles className="size-3.5" /> {t("book_badge")}
            </div>
            <h2 className="mt-5 font-display font-extrabold text-balance leading-[1.05] text-white text-[clamp(2.25rem,5vw,3.75rem)]">
              {t("book_title_1")}{" "}
              <span style={{ color: "var(--accent)" }}>{t("book_title_2")}</span>{" "}
              {t("book_title_3")}
            </h2>
            <p className="mt-5 text-white/90 max-w-xl leading-relaxed text-base">
              {t("book_desc")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={openCalendly}
                className="group inline-flex items-center gap-2 rounded-full bg-white text-[#0b1736] px-6 py-3.5 text-sm font-bold hover:bg-white/95 transition shadow-lg cursor-pointer"
              >
                <Calendar className="size-4" /> {t("book_cta")}
                <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
              </button>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 text-white px-6 py-3.5 text-sm font-bold hover:bg-white/20 transition"
              >
                <MessageCircle className="size-4" /> {t("book_btn_whatsapp")}
              </a>
              <a
                href="tel:+966555376228"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 text-white px-6 py-3.5 text-sm font-bold hover:bg-white/20 transition"
              >
                <Phone className="size-4" /> +966 555 376 228
              </a>
            </div>
          </div>
          <div className="grid gap-3">
            {steps.map(({ i: Icon, t: tt, d }, idx) => (
              <div
                key={tt}
                className="rounded-2xl border border-white/25 bg-white/10 p-4 flex items-start gap-3 backdrop-blur-xl"
              >
                <span className="size-10 rounded-xl bg-white text-[#0b1736] grid place-items-center shrink-0 font-display font-extrabold text-sm">
                  0{idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-2 text-white">
                    <Icon className="size-3.5" /> {tt}
                  </div>
                  <div className="text-xs text-white/85 mt-1 leading-relaxed">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- CURRENT COURSES (live from DB) ---------- */
const COURSES_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSePiL3_X7XaxWa6oAMlUc0TgT80z1mozFSExDzZnqvfmP4nRA/viewform?embedded=true";

type PublicCourse = {
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

function CurrentCourses() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PublicCourse | null>(null);
  const [interest, setInterest] = useState<PublicCourse | null>(null);

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

  const current = courses.filter((c) => !c.is_upcoming);
  const upcoming = courses.filter((c) => c.is_upcoming);

  return (
    <Section
      id="current-courses"
      eyebrow={tt("الكورسات", "Courses")}
      title={tt("دورات مباشرة واهتمامات قادمة", "Live courses and upcoming interests")}
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
                style={{ color: "var(--gold)" }}
              >
                {tt("دورات مباشرة · سجل اليوم", "Live courses · enroll today")}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {current.map((c) => (
                  <CourseCard key={c.id} c={c} onOpen={() => setSelected(c)} isAr={isAr} />
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
                {tt("كورسات قد تهمك قريباً", "Courses you may be interested in")}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcoming.map((c) => (
                  <CourseCard key={c.id} c={c} onOpen={() => setSelected(c)} isAr={isAr} upcoming />
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

function CourseCard({
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
      className="group relative text-start rounded-[2rem] border border-foreground/10 bg-card p-0 overflow-hidden md:transition-all md:hover:-translate-y-1.5 md:hover:shadow-[0_36px_80px_-44px_color-mix(in_oklab,var(--accent)_65%,transparent)]"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1.5 ${upcoming ? "bg-gradient-to-r from-[var(--accent)] via-[var(--lavender)] to-[var(--gold)]" : "bg-gradient-to-r from-[var(--gold)] via-[var(--accent)] to-[var(--gold)]"}`}
      />
      <div className="absolute -end-20 -top-20 size-44 rounded-full bg-[var(--gold)]/10 blur-3xl md:opacity-0 md:group-hover:opacity-100 md:transition" />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="relative size-16 rounded-2xl border border-foreground/10 bg-foreground/[0.04] grid place-items-center text-4xl shrink-0">
            <span>{c.cover_emoji || "🎓"}</span>
            <span className="absolute -bottom-1 -end-1 size-5 rounded-full border border-card bg-[var(--gold)]" />
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-bold rounded-full px-2.5 py-1 border ${upcoming ? "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30" : "bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold)]/30"}`}
          >
            {upcoming ? <Calendar className="size-3" /> : <Sparkles className="size-3" />}
            {upcoming ? tt("اهتمام", "Interest") : tt("مباشر", "Live")}
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

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-foreground/10 pt-4">
          <div className="min-w-0">
            {!upcoming && c.price != null && c.price > 0 ? (
              <div className="font-display font-extrabold text-lg" style={{ color: "var(--gold)" }}>
                {c.price} {c.currency}
              </div>
            ) : (
              <div className="text-xs font-bold text-muted-foreground">
                {upcoming ? tt("بدون حساب متدرب", "No trainee account") : tt("مجاني", "Free")}
              </div>
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold">
            {upcoming ? tt("سجّل اهتمامك", "Register interest") : tt("التفاصيل", "Details")}
            <ArrowRight className="size-3 rtl-flip md:group-hover:translate-x-1 md:transition" />
          </div>
        </div>
      </div>
    </button>
  );
}

function CourseMiniMeta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.035] p-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="mt-1 font-semibold text-sm truncate">{value}</div>
    </div>
  );
}

function CourseDetailsModal({
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
                label={tt("السعر", "Price")}
                value={`${course.price} ${course.currency}`}
              />
            )}
          </div>

          <div className="rule" />

          <div className="flex flex-wrap items-center gap-3">
            {course.is_upcoming ? (
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

function DetailStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.04] border border-foreground/10 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1.5 font-display font-extrabold text-base">{value}</div>
    </div>
  );
}

function CourseInfoBlock({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-foreground/[0.04] border border-foreground/10 p-4">
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--gold)" }}>
        <Icon className="size-4" /> {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {body}
      </p>
    </div>
  );
}

function InterestFormModal({
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
      course_id: course.id,
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
                className="w-full h-11 px-4 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-foreground focus:outline-none focus:border-[var(--gold)]/60"
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
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              {tt(
                "لن يتم إنشاء حساب لك. سنتواصل معك يدوياً.",
                "No account will be created. We'll reach out manually.",
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------- KNOWLEDGE LIBRARY ---------- */
const LIBRARY_DRIVE_ID = "1dhtjAdvchdH6DEIyT-VoDAWd2itLsnZq";
const LIBRARY_EMBED_URL = `https://drive.google.com/embeddedfolderview?id=${LIBRARY_DRIVE_ID}#grid`;
const LIBRARY_OPEN_URL = `https://drive.google.com/drive/folders/${LIBRARY_DRIVE_ID}?usp=sharing`;

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
function LeadForm() {
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
              className="flex-1 rounded-full glass-panel px-5 py-3 text-sm outline-none focus:border-[var(--gold)] transition placeholder:text-muted-foreground"
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
            {state === "success" && <span className="text-gold">✓ {t("lead_success")}</span>}
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
function Contact() {
  const { t } = useI18n();
  return (
    <Section id="contact" eyebrow={t("contact_eyebrow")} title={t("contact_title")}>
      <div className="grid sm:grid-cols-3 gap-4">
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
              <span dir="ltr">+966 555 376 228</span>
            </span>,
            <span key="eg" className="inline-flex items-center gap-2.5">
              <img
                src="https://flagcdn.com/w40/eg.png"
                srcSet="https://flagcdn.com/w80/eg.png 2x"
                width={22}
                height={16}
                alt="Egypt"
                className="rounded-[3px] ring-1 ring-foreground/15 shadow-sm shrink-0"
              />
              <span dir="ltr">+20 10 9727 9900</span>
            </span>,
          ]}
          href="tel:+966555376228"
        />
        <ContactCard
          icon={Mail}
          label={t("contact_email")}
          lines={["eslam.m.selmi@gmail.com"]}
          href="mailto:eslam.m.selmi@gmail.com"
        />
        <ContactCard
          icon={Linkedin}
          label={t("contact_linkedin")}
          lines={[t("contact_linkedin_line")]}
          href={LINKEDIN}
        />
      </div>
    </Section>
  );
}

function ContactCard({
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
      <Icon className="size-6 text-gold" />
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
      {lines.map((l, i) => (
        <div key={i} className="font-medium mt-1">
          {l}
        </div>
      ))}
      <div className="mt-4 inline-flex items-center gap-1 text-xs text-gold group-hover:gap-2 transition-all">
        Open <ArrowRight className="size-3 rtl-flip" />
      </div>
    </motion.a>
  );
}

/* ---------- FOOTER ---------- */
export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-foreground/10 mt-10 bg-foreground/[0.025] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <div className="hidden md:block text-xs text-muted-foreground max-w-xs">
            {t("footer_tag")}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="size-9 grid place-items-center rounded-full border border-foreground/15 hover:bg-foreground/5 transition"
          >
            <Linkedin className="size-4" />
          </a>
          <a
            href="mailto:eslam.m.selmi@gmail.com"
            aria-label="Email"
            className="size-9 grid place-items-center rounded-full border border-foreground/15 hover:bg-foreground/5 transition"
          >
            <Mail className="size-4" />
          </a>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="size-9 grid place-items-center rounded-full border border-foreground/15 hover:bg-foreground/5 transition"
          >
            <MessageCircle className="size-4" />
          </a>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} · {t("footer_rights")}
        </div>
      </div>
    </footer>
  );
}

/* ---------- PODCAST ---------- */
const PODCAST_EPISODES = [
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

function Podcast() {
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
function Section({
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
export function WhatsAppFloat() {
  const { t, dir } = useI18n();
  return (
    <a
      href={WHATSAPP}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("book_cta")}
      className={`fixed bottom-5 ${dir === "rtl" ? "left-5" : "right-5"} z-40 inline-flex items-center gap-2 rounded-full bg-primary hover:opacity-90 text-primary-foreground px-4 py-3 font-semibold shadow-[0_10px_40px_-10px_var(--foreground)] transition`}
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">{t("book_cta")}</span>
    </a>
  );
}

/* ---------- SCROLL TOP ---------- */
function ScrollTop() {
  const { dir } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className={`fixed bottom-20 ${dir === "rtl" ? "left-5" : "right-5"} z-40 size-11 grid place-items-center rounded-full bg-gradient-to-br from-[var(--lavender)] to-[var(--gold)] text-primary-foreground shadow-lg hover:scale-110 transition`}
        >
          <ArrowUp className="size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ---------- LANGUAGE HINT TOAST ---------- */
export function LanguageHint() {
  const { lang, setLang, t, dir } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("lang-hint-seen")) return;
    const showTimer = setTimeout(() => setShow(true), 1500);
    const hideTimer = setTimeout(() => {
      setShow(false);
      window.localStorage.setItem("lang-hint-seen", "1");
    }, 6500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    if (typeof window !== "undefined") window.localStorage.setItem("lang-hint-seen", "1");
  };

  const switchLang = () => {
    setLang(lang === "en" ? "ar" : "en");
    dismiss();
  };

  // Suggest the OTHER language
  const suggestAr = lang === "en";
  const title = suggestAr ? t("lang_hint_title_ar") : t("lang_hint_title_en");
  const desc = suggestAr ? t("lang_hint_desc_ar") : t("lang_hint_desc_en");
  const switchLabel = suggestAr ? t("lang_hint_switch_ar") : t("lang_hint_switch_en");
  const toastDir = suggestAr ? "rtl" : "ltr";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ duration: 0.5, ease: [0.21, 0.5, 0.3, 1] }}
          className={`fixed top-24 z-[60] max-w-[92vw] w-[360px] ${dir === "rtl" ? "left-5" : "right-5"}`}
          role="status"
          aria-live="polite"
          dir={toastDir}
        >
          {/* outer glow */}
          <div
            className="absolute -inset-1 rounded-[1.5rem] opacity-70 blur-2xl pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--gold) 40%, transparent), color-mix(in oklab, var(--accent) 35%, transparent))",
            }}
          />
          <div
            className="relative rounded-2xl overflow-hidden backdrop-blur-2xl text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            style={{
              background:
                "linear-gradient(160deg, rgba(11,23,54,0.92) 0%, rgba(8,16,40,0.96) 100%)",
              border: "1px solid color-mix(in oklab, var(--gold) 25%, rgba(255,255,255,0.08))",
            }}
          >
            {/* decorative gradient orbs */}
            <div
              className="absolute inset-0 opacity-80 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 100% 0%, color-mix(in oklab, var(--gold) 30%, transparent), transparent 60%), radial-gradient(ellipse 60% 50% at 0% 100%, color-mix(in oklab, var(--accent) 30%, transparent), transparent 65%)",
              }}
            />
            {/* subtle grain border highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <div className="relative p-5 flex items-start gap-3.5">
              <span className="relative shrink-0 mt-0.5">
                <span
                  className="absolute inset-0 rounded-full blur-md animate-pulse"
                  style={{ background: "color-mix(in oklab, var(--gold) 55%, transparent)" }}
                />
                <span
                  className="relative grid place-items-center size-10 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, var(--gold) 25%, transparent), color-mix(in oklab, var(--accent) 25%, transparent))",
                    border: "1px solid color-mix(in oklab, var(--gold) 50%, transparent)",
                  }}
                >
                  <Languages className="size-[18px]" style={{ color: "var(--gold)" }} />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-[15px] leading-tight">{title}</div>
                <p className="text-[12.5px] text-white/75 mt-1.5 leading-relaxed">{desc}</p>
                <button
                  onClick={switchLang}
                  className="group/lng mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-300 hover:translate-y-[-1px]"
                  style={{
                    background: "linear-gradient(135deg, var(--gold) 0%, #f4d98a 100%)",
                    color: "#0a0f2c",
                    boxShadow:
                      "0 10px 24px -10px color-mix(in oklab, var(--gold) 70%, transparent)",
                  }}
                >
                  <Languages className="size-3.5" /> {switchLabel}
                  <ArrowRight className="size-3.5 rtl-flip group-hover/lng:translate-x-0.5 transition" />
                </button>
              </div>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="shrink-0 size-7 grid place-items-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 6.5, ease: "linear" }}
              className="h-[2px] origin-left"
              style={{
                background:
                  "linear-gradient(90deg, var(--gold), color-mix(in oklab, var(--accent) 80%, transparent))",
                transformOrigin: toastDir === "rtl" ? "right" : "left",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- EMPOWERMENT TOOLS (for new graduates) ---------- */
export function EmpowermentTools() {
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
                onClick={() => setOpen(true)}
                className="group inline-flex items-center gap-2.5 rounded-full bg-white text-[#0b1736] px-6 py-3.5 text-sm font-bold hover:bg-white/95 transition shadow-lg cursor-pointer"
              >
                <Rocket className="size-4" />
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

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          dir={dir}
        >
          <div
            className="relative w-full max-w-2xl h-[90vh] rounded-2xl overflow-hidden bg-card shadow-2xl border border-foreground/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/10 bg-card shrink-0">
              <div className="min-w-0">
                <div className="font-display font-bold text-sm sm:text-base truncate">
                  {t("emp_title")}
                </div>
                <div className="text-xs text-muted-foreground truncate">{t("emp_tagline")}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="size-9 grid place-items-center rounded-full hover:bg-foreground/10 transition shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>
            <iframe
              src={COURSES_FORM_URL}
              title="Empowerment Tools enrollment"
              className="w-full flex-1 border-0 bg-white"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </Section>
  );
}
