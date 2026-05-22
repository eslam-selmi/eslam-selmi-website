import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Globe2, Layers, MessageCircle, Mail, Linkedin, Phone, ArrowRight,
  CheckCircle2, Menu, X, Calendar, Target, Lightbulb, HeartHandshake,
  GraduationCap, Award, Users, TrendingUp, BarChart3, UserCheck, Languages,
  ArrowUp, Loader2, Briefcase, BadgeCheck, Compass, Presentation, Moon, Sun,
  Mic,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";

import headshot from "@/assets/portfolio/headshot.png";

import snap1 from "@/assets/snapshots/snap-1.jpg";
import snap2 from "@/assets/snapshots/snap-2.jpg";
import snap3 from "@/assets/snapshots/snap-3.jpg";
import snap4 from "@/assets/snapshots/snap-4.jpg";
import snap5 from "@/assets/snapshots/snap-5.jpg";
import snap6 from "@/assets/snapshots/snap-6.jpg";
import snap7 from "@/assets/snapshots/snap-7.jpg";
import snap8 from "@/assets/snapshots/snap-8.jpg";
import snap9 from "@/assets/snapshots/snap-9.jpg";

export const Route = createFileRoute("/")({ component: Portfolio });

const WHATSAPP = "https://wa.me/966555376228?text=Hi%20Eslam%2C%20I%27d%20like%20to%20book%20a%20free%201%3A1%20session.";
const LINKEDIN = "https://www.linkedin.com/in/eslam-selmi/";

const NAV = [
  { id: "home", key: "nav_home" },
  { id: "about", key: "nav_about" },
  { id: "pillars", key: "nav_pillars" },
  { id: "journey", key: "nav_journey" },
  { id: "services", key: "nav_services" },
  { id: "programs", key: "nav_programs" },
  { id: "clients", key: "nav_clients" },
  { id: "snapshots", key: "nav_snapshots" },
  { id: "podcast", key: "nav_podcast" },
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
  { year: "2017", role: { en: "Senior L&D / L&D Specialist", ar: "أخصائي أول / أخصائي تعلم وتطوير" }, company: "G4S", country: "EG", logo: "https://logo.clearbit.com/g4s.com" },
  { year: "2022", role: { en: "L&D Specialist", ar: "أخصائي تعلم وتطوير" }, company: "Aramex", country: "EG", logo: "https://logo.clearbit.com/aramex.com" },
  { year: "2023", role: { en: "Control Supervisor", ar: "مشرف رقابة" }, company: "Badreldin Developments", country: "EG", logo: "https://logo.clearbit.com/badreldin.com" },
  { year: "2024", role: { en: "Head of L&D", ar: "رئيس التعلم والتطوير" }, company: "Imtenan", country: "EG", logo: "https://logo.clearbit.com/imtenan.com" },
  { year: "NOW", role: { en: "Head of L&D", ar: "رئيس التعلم والتطوير" }, company: "KnowledgeCity", country: "SA", logo: "https://logo.clearbit.com/knowledgecity.com" },
];

const CREDENTIALS = [
  { name: { en: "PMP", ar: "إدارة المشاريع PMP" }, issuer: { en: "London College", ar: "كلية لندن" }, icon: BadgeCheck },
  { name: { en: "PMI® Kick-Off Predictive", ar: "PMI® Kick-Off Predictive" }, issuer: { en: "Project Management Institute", ar: "معهد إدارة المشاريع" }, icon: BadgeCheck },
  { name: { en: "TOT — Training of Trainers", ar: "تدريب المدربين TOT" }, issuer: { en: "Certified Program", ar: "برنامج معتمد" }, icon: Presentation },
  { name: { en: "Performance & KPIs", ar: "إدارة الأداء والمؤشرات" }, issuer: { en: "ESLSCA University", ar: "جامعة ESLSCA" }, icon: BarChart3 },
  { name: { en: "Workplace Learning with Coaching & Mentoring", ar: "التعلم في بيئة العمل بالكوتشينج والإرشاد" }, issuer: { en: "The Open University", ar: "الجامعة المفتوحة" }, icon: HeartHandshake },
  { name: { en: "Risk Management Workshop", ar: "ورشة إدارة المخاطر" }, issuer: { en: "Masar Academy", ar: "أكاديمية مسار" }, icon: Target },
  { name: { en: "Design Thinking", ar: "التفكير التصميمي" }, issuer: { en: "HP LIFE", ar: "HP LIFE" }, icon: Lightbulb },
  { name: { en: "Instructional Design", ar: "التصميم التعليمي" }, issuer: { en: "Mentarcise", ar: "Mentarcise" }, icon: Layers },
  { name: { en: "IDPCC Certified", ar: "شهادة IDPCC" }, issuer: { en: "IDPCC", ar: "IDPCC" }, icon: Award },
  { name: { en: "Leaders of Learning", ar: "قادة التعلم" }, issuer: { en: "HarvardX", ar: "HarvardX" }, icon: GraduationCap },
];

const SERVICES = [
  { icon: Target, key: "svc_strategy", title: { en: "L&D Strategy Consulting", ar: "استشارات استراتيجية L&D" }, desc: { en: "Tailored strategies that align training initiatives with business goals.", ar: "استراتيجيات مخصصة تربط مبادرات التدريب بأهداف العمل." } },
  { icon: Layers, key: "svc_hybrid", title: { en: "Hybrid Corporate Training", ar: "تدريب مؤسسي هجين" }, desc: { en: "Flexible sessions for companies — online and on-site.", ar: "جلسات مرنة للشركات — أونلاين وحضوريًا." } },
  { icon: Lightbulb, key: "svc_id", title: { en: "Instructional Design", ar: "تصميم تعليمي" }, desc: { en: "Engaging learning experiences crafted with innovative methods.", ar: "تجارب تعلم جذابة بأساليب مبتكرة." } },
  { icon: HeartHandshake, key: "svc_coach", title: { en: "One-on-One Coaching", ar: "تدريب فردي" }, desc: { en: "Personalized sessions to unlock individual potential and growth.", ar: "جلسات مخصصة لإطلاق الإمكانات والنمو." } },
];

const PROGRAMS = [
  {
    track: { en: "Talent Management", ar: "إدارة المواهب" },
    intro: { en: "Real-world strategies for talent acquisition, employee development, and strategic planning.", ar: "استراتيجيات عملية لاستقطاب وتطوير المواهب والتخطيط الاستراتيجي." },
    items: [
      { name: { en: "Instructional Design | ID", ar: "تصميم تعليمي" }, desc: { en: "Impactful training through expertly crafted, engaging learning experiences.", ar: "تدريب مؤثر بتجارب تعلم مصممة باحتراف." } },
      { name: { en: "Recruitment Excellence", ar: "تميز التوظيف" }, desc: { en: "Practical strategies to secure top talent.", ar: "استراتيجيات عملية لاستقطاب أفضل المواهب." } },
      { name: { en: "TOT Mastery", ar: "تدريب المدربين" }, desc: { en: "Advanced facilitation and innovative teaching strategies.", ar: "تيسير متقدم واستراتيجيات تدريس مبتكرة." } },
    ],
  },
  {
    track: { en: "Learning & Development", ar: "التعلم والتطوير" },
    intro: { en: "Dynamic L&D program — nurture talent, foster improvement and build a culture of learning.", ar: "برنامج تعلم وتطوير ديناميكي يبني ثقافة التعلم." },
    items: [
      { name: { en: "L&D From Scratch", ar: "L&D من الصفر" }, desc: { en: "TNA, annual plans, training kits, ROI analysis and budget management.", ar: "تحليل الاحتياج، خطط سنوية، أدوات تدريب، تحليل العائد وإدارة الميزانية." } },
    ],
  },
  {
    track: { en: "Soft Skills", ar: "المهارات الناعمة" },
    intro: { en: "Workshops that transform how you connect, lead, and grow.", ar: "ورش تحوّل طريقة التواصل والقيادة والنمو." },
    items: [
      { name: { en: "Communication Skills", ar: "مهارات التواصل" }, desc: { en: "Clear, persuasive, empathetic communication.", ar: "تواصل واضح ومُقنع ومتعاطف." } },
      { name: { en: "Leadership Skills", ar: "مهارات القيادة" }, desc: { en: "Inspire and guide teams toward success.", ar: "ألهم وقُد الفرق نحو النجاح." } },
      { name: { en: "Problem Solving", ar: "حل المشكلات" }, desc: { en: "Analytical and strategic thinking for confident decisions.", ar: "تفكير تحليلي واستراتيجي لقرارات واثقة." } },
      { name: { en: "Negotiation Skills", ar: "مهارات التفاوض" }, desc: { en: "Practical strategies for win-win solutions.", ar: "استراتيجيات عملية لحلول رابحة للجميع." } },
    ],
  },
];

const PILLARS = [
  { icon: UserCheck, key: "talent", color: "from-accent/35 to-primary/10" },
  { icon: TrendingUp, key: "perf", color: "from-gold/35 to-accent/10" },
  { icon: BarChart3, key: "kpi", color: "from-lavender/35 to-primary/10" },
];

const SNAPSHOTS = [snap1, snap2, snap5, snap3, snap8, snap4, snap7, snap9, snap6];

type ThemeMode = "dark" | "light";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.21, 0.5, 0.3, 1] as const },
};

function Portfolio() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("theme-mode") : null;
    const next: ThemeMode = saved === "dark" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next: ThemeMode = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      if (typeof window !== "undefined") window.localStorage.setItem("theme-mode", next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent/25">
      <Nav theme={theme} onThemeToggle={toggleTheme} />
      <Hero />
      <About />
      <Pillars />
      <Journey />
      <Services />
      <Programs />
      <Clients />
      <Snapshots />
      <Podcast />
      <BookCTA />
      <LeadForm />
      <Contact />
      <Footer />
      <WhatsAppFloat />
      <ScrollTop />
    </div>
  );
}

/* ---------- BRAND MARK ---------- */
function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0" aria-label="Eslam Selmi">
        <defs>
          <linearGradient id="bmg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--navy)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="none" stroke="url(#bmg)" strokeWidth="2" opacity="0.35" />
        <path
          d="M12 30 C 16 22, 20 22, 24 24 C 28 26, 32 26, 36 18"
          stroke="url(#bmg)" strokeWidth="2.8" strokeLinecap="round" fill="none"
        />
        <circle cx="36" cy="18" r="3" fill="url(#bmg)" />
        <circle cx="12" cy="30" r="2" fill="url(#bmg)" opacity="0.6" />
      </svg>
      <span className="hidden sm:flex flex-col leading-none">
        <span className="font-display text-[13px] font-bold tracking-[0.14em] text-foreground">Eslam Selmi</span>
        <span className="text-[9px] tracking-[0.28em] uppercase text-muted-foreground mt-1">Head of L&amp;D</span>
      </span>
    </div>
  );
}
function Nav({ theme, onThemeToggle }: { theme: ThemeMode; onThemeToggle: () => void }) {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "py-2" : "py-4"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className={`bg-card/85 backdrop-blur-xl border border-foreground/10 rounded-full ps-3 pe-2 py-2 flex items-center justify-between gap-2 ${scrolled ? "shadow-[0_8px_30px_-12px_rgba(15,27,61,0.15)]" : ""}`}>
          <a href="#home" className="flex items-center gap-2.5 group shrink-0">
            <BrandMark />
          </a>
          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} className="px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-foreground/5">
                {t(n.key)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en" as Lang)}
              aria-label="Toggle language"
              className="group inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1.5 hover:bg-foreground/5 hover:border-foreground/30 transition"
            >
              <Languages className="size-3.5 opacity-70" />
              <span className={`font-bold leading-none ${lang === "en" ? "text-[15px] font-display" : "text-[12px] tracking-wider"}`}>
                {lang === "en" ? "ع" : "En"}
              </span>
            </button>
            <button
              onClick={onThemeToggle}
              aria-label="Toggle theme"
              className="inline-flex size-9 items-center justify-center rounded-full border border-foreground/10 hover:bg-foreground/5 transition"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <a
              href={LINKEDIN} target="_blank" rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hidden sm:inline-flex size-9 items-center justify-center rounded-full border border-foreground/10 hover:bg-foreground/5 transition"
            >
              <Linkedin className="size-4" />
            </a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 transition">
              <Calendar className="size-4" /> {t("book_cta")}
            </a>
            <button className="xl:hidden p-2" onClick={() => setOpen(v => !v)} aria-label="Menu">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="xl:hidden mt-2 glass-strong rounded-2xl p-3 grid gap-1">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-foreground/5 text-sm">{t(n.key)}</a>
            ))}
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">
              <Calendar className="size-4" /> {t("book_cta")}
            </a>
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
    <section id="home" ref={ref} className="relative min-h-screen pt-28 pb-16 lg:pt-32 overflow-hidden">
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
        style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)", opacity: 0.4 }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left: Copy */}
        <motion.div style={{ y }} className="lg:col-span-7 order-2 lg:order-1 space-y-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em]"
            style={{ color: "var(--accent)" }}
          >
            <span className="h-px w-8" style={{ background: "var(--accent)" }} />
            {lang === "ar" ? "حلول مبتكرة لبناء القدرات" : "Innovative Solutions for Building"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
            className="font-display font-extrabold text-balance leading-[1.05] text-[clamp(2rem,4.6vw,4.25rem)] text-foreground"
          >
            {lang === "ar" ? (
              <>
                إطلاق إمكانات المواهب مع{" "}
                <span style={{ color: "var(--accent)" }}>{nameAr}</span>
              </>
            ) : (
              <>
                Unlocking Talent Potential With{" "}
                <span style={{ color: "var(--accent)" }}>{nameEn}</span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground"
          >
            {t("hero_intro")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="flex flex-wrap gap-3 pt-2"
          >
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-sm font-bold text-primary-foreground shadow-[0_18px_40px_-14px_oklch(0.22_0.06_252/0.5)] hover:translate-y-[-2px] transition">
              <Calendar className="size-4" /> {t("hero_btn_book")}
              <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
            </a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 bg-card px-7 py-4 text-sm font-bold text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] transition">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a
              href="#podcast"
              aria-label="Listen to the L&D Podcast"
              className="group relative inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white overflow-hidden shadow-[0_18px_40px_-14px_oklch(0.55_0.2_290/0.55)] hover:translate-y-[-2px] transition"
              style={{ background: "linear-gradient(135deg, oklch(0.32 0.13 280), oklch(0.55 0.18 200))" }}
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center gap-3 pt-3"
          >
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
              className="size-10 rounded-full border border-foreground/15 grid place-items-center text-foreground/70 hover:text-foreground hover:border-foreground/30 transition">
              <Linkedin className="size-4" />
            </a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="size-10 rounded-full border border-foreground/15 grid place-items-center text-foreground/70 hover:text-foreground hover:border-foreground/30 transition">
              <MessageCircle className="size-4" />
            </a>
            <a href="mailto:eslam.selmi@example.com" aria-label="Email"
              className="size-10 rounded-full border border-foreground/15 grid place-items-center text-foreground/70 hover:text-foreground hover:border-foreground/30 transition">
              <Mail className="size-4" />
            </a>
          </motion.div>
        </motion.div>

        {/* Right: Portrait + floating cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="lg:col-span-5 order-1 lg:order-2 relative"
        >
          <div className="relative w-full aspect-[4/5] max-w-md mx-auto rounded-[2rem] overflow-hidden"
               style={{
                 background: "linear-gradient(180deg, oklch(0.94 0.018 200) 0%, oklch(0.92 0.025 195) 100%)",
                 boxShadow: "0 40px 80px -30px oklch(0.22 0.06 252 / 0.28)"
               }}>
            <img
              src={headshot}
              alt="Eslam Selmi"
              className="absolute inset-x-0 bottom-0 h-[98%] w-full object-contain object-bottom"
            />
          </div>

          {/* Top floating stat — Years */}
          <motion.div
            animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-2 sm:-right-6 top-6 rounded-2xl px-5 py-4 bg-card border border-foreground/10 shadow-xl min-w-[140px]"
          >
            <div className="text-2xl sm:text-3xl font-extrabold font-display" style={{ color: "var(--accent)" }}>8+</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">{lang === "ar" ? "سنوات خبرة" : "Years experience"}</div>
          </motion.div>

          {/* Bottom floating stat */}
          <motion.div
            animate={{ y: [0, 12, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-2 sm:-left-6 bottom-8 rounded-2xl px-5 py-4 bg-card border border-foreground/10 shadow-xl min-w-[140px]"
          >
            <div className="text-2xl sm:text-3xl font-extrabold font-display" style={{ color: "var(--accent)" }}>12+</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">{lang === "ar" ? "دولة" : "Countries"}</div>
          </motion.div>

          {/* Side badge — Sectors */}
          <motion.div
            animate={{ x: [0, -6, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-2 sm:-left-8 top-1/2 -translate-y-1/2 rounded-2xl px-4 py-3 bg-primary text-primary-foreground shadow-xl"
          >
            <div className="text-xl font-extrabold font-display leading-none">4</div>
            <div className="text-[10px] uppercase tracking-wider mt-1 opacity-80 font-semibold">{lang === "ar" ? "قطاعات" : "Sectors"}</div>
          </motion.div>
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
      <div className="font-display text-xl sm:text-2xl font-extrabold leading-none truncate" style={{ color: "var(--accent)" }}>{n}</div>
      <div className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground truncate">{l}</div>
    </div>
  );
}


/* ---------- ABOUT ---------- */
function About() {
  const { t, lang } = useI18n();
  const strengths = [
    { t: { en: "Corporate Training Management", ar: "إدارة التدريب المؤسسي" }, d: { en: "End-to-end training operations within large-scale environments.", ar: "عمليات تدريب متكاملة في بيئات واسعة." } },
    { t: { en: "Project Management", ar: "إدارة المشاريع" }, d: { en: "PMP methodologies for complex training projects across regions.", ar: "منهجيات PMP لمشاريع التدريب المعقدة." } },
    { t: { en: "Performance Excellence", ar: "تميز الأداء" }, d: { en: "Robust KPIs and frameworks that drive organizational growth.", ar: "مؤشرات أداء وأطُر تقود نمو المنظمات." } },
    { t: { en: "Strategic Development", ar: "التطوير الاستراتيجي" }, d: { en: "Competency models and dynamic training plans optimizing ROI.", ar: "نماذج جدارات وخطط تدريب تُحسّن العائد." } },
  ];
  return (
    <Section id="about" eyebrow={t("about_eyebrow")} title={t("about_title")}>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <motion.div {...fadeUp} className="glass-panel sticky top-28 rounded-[2rem] p-7">
          <p className="text-lg leading-relaxed text-foreground/75">
            {t("about_intro")}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Stat n="8+" l={lang === "ar" ? "سنوات" : "Years"} />
            <Stat n="4" l={lang === "ar" ? "قطاعات" : "Sectors"} />
          </div>
        </motion.div>
      <div className="grid sm:grid-cols-2 gap-4">
        {strengths.map((s, i) => (
          <motion.div key={s.t.en} {...fadeUp} transition={{ duration: 0.6, delay: i * 0.08 }}
            className="glass-panel rounded-3xl p-5 transition hover:-translate-y-1 group">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-gold mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold">{s.t[lang]}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.d[lang]}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      </div>

      <motion.div {...fadeUp} className="mt-12">
        <h3 className="text-sm uppercase tracking-wider text-gold mb-5 flex items-center gap-2 font-semibold">
          <GraduationCap className="size-4" /> {t("about_credentials")}
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CREDENTIALS.map((c, i) => (
            <motion.div
              key={c.name.en}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-3xl p-4 group hover:-translate-y-1 transition relative overflow-hidden"
            >
              <div className="absolute -top-10 -end-10 size-24 rounded-full bg-[var(--lavender)]/20 blur-2xl opacity-0 group-hover:opacity-100 transition" />
              <div className="relative flex items-start gap-3">
                <div className="size-11 rounded-xl bg-gradient-to-br from-[var(--lavender)]/30 via-[var(--lavender-deep)]/20 to-[var(--gold)]/20 grid place-items-center text-lavender shrink-0 border border-foreground/10">
                  <c.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm leading-tight">{c.name[lang]}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">{c.issuer[lang]}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Section>
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
            key={p.key} {...fadeUp} transition={{ duration: 0.6, delay: i * 0.1 }}
            className="relative glass-panel rounded-[2rem] p-7 overflow-hidden group hover:-translate-y-1 transition"
          >
            <div className={`absolute -top-20 -end-20 size-48 rounded-full bg-gradient-to-br ${p.color} blur-3xl opacity-60 group-hover:opacity-100 transition`} />
            <div className="relative">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-soft)] grid place-items-center text-accent-foreground shadow-lg">
                <p.icon className="size-7" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold">{t(`pillar_${p.key}`)}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t(`pillar_${p.key}_desc`)}</p>
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
          const country = j.country === "SA"
            ? { flag: "sa", name: { en: "Saudi Arabia", ar: "السعودية" } }
            : { flag: "eg", name: { en: "Egypt", ar: "مصر" } };
          
          return (
            <motion.div
              key={j.year + j.company + i}
              {...fadeUp}
              transition={{ delay: i * 0.07, duration: 0.55 }}
              className="group relative rounded-3xl bg-card border border-foreground/10 p-6 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_oklch(0.22_0.06_252/0.35)] transition-all overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/40 to-transparent opacity-70" />

              {/* Top row: year + country flag */}
              <div className="flex items-center justify-between mb-5">
                <span className="font-display text-3xl font-extrabold tracking-tight" style={{ color: "var(--accent)" }}>
                  {j.year}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground bg-foreground/[0.04] rounded-full px-2.5 py-1">
                  <img src={`https://flagcdn.com/${country.flag}.svg`} alt="" className="w-4 h-3 rounded-[2px] object-cover" />
                  {country.name[lang]}
                </span>
              </div>

              {/* Company */}
              <div className="min-w-0">
                <div className="font-display font-bold text-xl leading-tight">{j.company}</div>
                <div className="text-sm text-muted-foreground mt-1.5 leading-snug">{j.role[lang]}</div>
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map((s, i) => (
          <motion.div key={s.key} {...fadeUp} transition={{ delay: i * 0.08, duration: 0.6 }}
            className="relative glass-panel rounded-3xl p-6 group overflow-hidden transition hover:-translate-y-1">
            <div className="absolute -top-12 -end-12 size-32 rounded-full bg-[var(--gold)]/20 blur-2xl opacity-0 group-hover:opacity-100 transition" />
            <s.icon className="size-7 text-gold" />
            <div className="mt-4 text-xs text-muted-foreground font-mono">0{i + 1}</div>
            <h3 className="mt-1 font-semibold text-lg leading-tight">{s.title[lang]}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc[lang]}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- PROGRAMS ---------- */
function Programs() {
  const { t, lang } = useI18n();
  return (
    <Section id="programs" eyebrow={t("programs_eyebrow")} title={t("programs_title")}>
      <div className="grid lg:grid-cols-3 gap-6">
        {PROGRAMS.map((p, i) => (
          <motion.div key={p.track.en} {...fadeUp} transition={{ delay: i * 0.08, duration: 0.6 }}
            className="glass-panel rounded-[2rem] p-6 flex flex-col overflow-hidden relative group transition hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/0 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 self-start glass rounded-full px-3 py-1 text-xs text-gold font-semibold">
                <Sparkles className="size-3.5" /> {t("programs_track")} {i + 1}
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{p.track[lang]}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.intro[lang]}</p>
              <div className="mt-5 space-y-3">
                {p.items.map(it => (
                  <div key={it.name.en} className="rounded-xl bg-foreground/[0.03] border border-foreground/10 p-3 hover:border-[var(--gold)]/30 transition">
                    <div className="font-medium text-sm">{it.name[lang]}</div>
                    <div className="text-xs text-muted-foreground mt-1">{it.desc[lang]}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
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
          <div className="font-display text-[8rem] lg:text-[10rem] leading-none font-bold text-gradient-gold">12</div>
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
            <motion.div key={c.code}
              initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.04 }}
            className="glass-panel aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition hover:-translate-y-1 group p-2">
              <img
                src={`https://flagcdn.com/${c.code}.svg`}
                alt={c.name[lang]}
                loading="lazy"
                className="w-10 h-7 object-cover rounded-sm shadow-md group-hover:scale-110 transition"
              />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{c.name[lang]}</span>
            </motion.div>
          ))}
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
      if (e.key === "ArrowRight") setActive((a) => (a === null ? null : (a + 1) % SNAPSHOTS.length));
      if (e.key === "ArrowLeft") setActive((a) => (a === null ? null : (a - 1 + SNAPSHOTS.length) % SNAPSHOTS.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Split snapshots across two tracks so the rows don't show the same images
  const half = Math.ceil(SNAPSHOTS.length / 2);
  const setA = SNAPSHOTS.slice(0, half);
  const setB = SNAPSHOTS.slice(half);
  const trackA = [...setA, ...setA, ...setA];
  const trackB = [...setB.slice().reverse(), ...setB.slice().reverse(), ...setB.slice().reverse()];
  const marqueeClass = dir === "rtl" ? "animate-marquee-rtl" : "animate-marquee";
  const marqueeSlowClass = dir === "rtl" ? "animate-marquee-rtl" : "animate-marquee-slow";

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
        <div className="overflow-hidden">
          <div className={`flex gap-7 w-max ${marqueeClass} hover:[animation-play-state:paused]`}>
            {trackA.map((src, idx) => (
              <Card key={`a-${idx}`} src={src} i={idx} originalIndex={SNAPSHOTS.indexOf(src)} />
            ))}
          </div>
        </div>
        <div className="overflow-hidden">
          <div className={`flex gap-7 w-max ${marqueeSlowClass} hover:[animation-play-state:paused]`}>
            {trackB.map((src, idx) => (
              <Card key={`b-${idx}`} src={src} i={idx} originalIndex={SNAPSHOTS.indexOf(src)} />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-backdrop fixed inset-0 z-[100] backdrop-blur-md grid place-items-center p-4"
            onClick={() => setActive(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setActive(null); }}
              className="absolute top-5 end-5 size-10 grid place-items-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <motion.img
              key={active}
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              src={SNAPSHOTS[active]} alt=""
              className="max-h-[88vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-5 inset-x-0 flex justify-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setActive((a) => a === null ? null : (a - 1 + SNAPSHOTS.length) % SNAPSHOTS.length); }}
                className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm"
              >← Prev</button>
              <span className="px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm">{active + 1} / {SNAPSHOTS.length}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((a) => a === null ? null : (a + 1) % SNAPSHOTS.length); }}
                className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm"
              >Next →</button>
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
      <motion.div {...fadeUp}
        className="relative mx-auto max-w-6xl rounded-[2.25rem] p-8 sm:p-12 lg:p-16 overflow-hidden bg-[#0b1736] text-white shadow-[0_40px_80px_-40px_rgba(11,23,54,0.6)]">
        <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse 60% 50% at 85% 10%, oklch(0.72 0.13 180 / 0.55), transparent 60%), radial-gradient(ellipse 50% 50% at 10% 90%, oklch(0.55 0.2 290 / 0.35), transparent 65%)" }} />
        <div className="absolute inset-0 grain opacity-30" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white">
              <Sparkles className="size-3.5" /> {t("book_badge")}
            </div>
            <h2 className="mt-5 font-display font-extrabold text-balance leading-[1.05] text-white text-[clamp(2.25rem,5vw,3.75rem)]">
              {t("book_title_1")} <span style={{ color: "var(--accent)" }}>{t("book_title_2")}</span> {t("book_title_3")}
            </h2>
            <p className="mt-5 text-white/90 max-w-xl leading-relaxed text-base">{t("book_desc")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-white text-[#0b1736] px-6 py-3.5 text-sm font-bold hover:bg-white/95 transition shadow-lg">
                <MessageCircle className="size-4" /> {t("book_btn_whatsapp")}
                <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
              </a>
              <a href="tel:+966555376228" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 text-white px-6 py-3.5 text-sm font-bold hover:bg-white/20 transition">
                <Phone className="size-4" /> +966 555 376 228
              </a>
            </div>
          </div>
          <div className="grid gap-3">
            {steps.map(({ i: Icon, t: tt, d }, idx) => (
              <div key={tt} className="rounded-2xl border border-white/25 bg-white/10 p-4 flex items-start gap-3 backdrop-blur-xl">
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
              onChange={(e) => { setEmail(e.target.value); if (state !== "idle" && state !== "loading") setState("idle"); }}
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
              {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {t("lead_btn")}
            </button>
          </form>
          <div className="mt-3 min-h-[1.5rem] text-sm">
            {state === "success" && <span className="text-gold">✓ {t("lead_success")}</span>}
            {state === "error" && <span className="text-destructive">{t("lead_error")}</span>}
            {state === "invalid" && <span className="text-amber-400">{t("lead_invalid")}</span>}
          </div>
        </motion.div>
        <motion.div {...fadeUp} className="relative rounded-[2rem] bg-primary text-primary-foreground p-8 overflow-hidden">
          <div className="absolute inset-0 bg-aurora opacity-40" />
          <div className="relative">
            <Sparkles className="size-6" style={{ color: "var(--accent)" }} />
            <div className="mt-4 font-display text-2xl font-bold leading-tight">
              {lang === "ar" ? "كن أول من يعرف عن الدورات الجديدة" : "Be the first to know about new cohorts"}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <CompactStat n="15+" l={lang === "ar" ? "برنامج" : "Programs"} />
              <CompactStat n="12+" l={lang === "ar" ? "دولة" : "Countries"} />
              <CompactStat n="8+" l={lang === "ar" ? "سنوات" : "Years"} />
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
        <ContactCard icon={Phone} label={t("contact_mobile")} lines={["🇸🇦 +966 555 376 228", "🇪🇬 +20 10 9727 9900"]} href="tel:+966555376228" />
        <ContactCard icon={Mail} label={t("contact_email")} lines={["eslam.m.selmi@gmail.com"]} href="mailto:eslam.m.selmi@gmail.com" />
        <ContactCard icon={Linkedin} label={t("contact_linkedin")} lines={[t("contact_linkedin_line")]} href={LINKEDIN} />
      </div>
    </Section>
  );
}

function ContactCard({ icon: Icon, label, lines, href }: { icon: any; label: string; lines: string[]; href: string }) {
  return (
    <motion.a {...fadeUp} href={href} target="_blank" rel="noopener noreferrer"
      className="glass-panel rounded-3xl p-6 transition hover:-translate-y-1 group block">
      <Icon className="size-6 text-gold" />
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
      {lines.map(l => <div key={l} className="font-medium mt-1">{l}</div>)}
      <div className="mt-4 inline-flex items-center gap-1 text-xs text-gold group-hover:gap-2 transition-all">
        Open <ArrowRight className="size-3 rtl-flip" />
      </div>
    </motion.a>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-foreground/10 mt-10 bg-foreground/[0.025] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <div className="hidden md:block text-xs text-muted-foreground max-w-xs">{t("footer_tag")}</div>
        </div>
        <div className="flex items-center gap-3">
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
            className="size-9 grid place-items-center rounded-full border border-foreground/15 hover:bg-foreground/5 transition">
            <Linkedin className="size-4" />
          </a>
          <a href="mailto:eslam.m.selmi@gmail.com" aria-label="Email"
            className="size-9 grid place-items-center rounded-full border border-foreground/15 hover:bg-foreground/5 transition">
            <Mail className="size-4" />
          </a>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
            className="size-9 grid place-items-center rounded-full border border-foreground/15 hover:bg-foreground/5 transition">
            <MessageCircle className="size-4" />
          </a>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Eslam Selmi. {t("footer_rights")}</div>
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
        <motion.div {...fadeUp} className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/25 via-accent/5 to-transparent blur-2xl" />
          <div className="glass-panel rounded-3xl overflow-hidden border border-foreground/10">
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
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${active.id}/hqdefault.jpg`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <span className="absolute inset-0 rounded-full bg-accent/40 blur-2xl scale-150 animate-pulse" />
                      <div className="relative size-20 lg:size-24 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <svg viewBox="0 0 24 24" className="size-8 lg:size-10 text-[var(--navy)] ms-1" fill="currentColor">
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
                    <h3 className="text-white font-display text-xl lg:text-2xl leading-tight">{t(active.titleKey)}</h3>
                  </div>
                </button>
              )}
            </div>
            <div className="p-5 lg:p-6 flex items-center justify-between gap-4 border-t border-foreground/10">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.28em] text-accent font-semibold">{t("podcast_now_playing")}</div>
                <div className="font-display text-base lg:text-lg truncate">{t(active.titleKey)}</div>
              </div>
              <a
                href={`https://youtu.be/${active.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-foreground/15 hover:bg-foreground/5 transition-colors"
              >
                YouTube
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M9 7h8v8"/></svg>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Episodes list */}
        <motion.div {...fadeUp} className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-2">{t("podcast_episodes")}</div>
          {PODCAST_EPISODES.map((ep) => {
            const isActive = ep.id === active.id;
            return (
              <button
                key={ep.id}
                onClick={() => { setActive(ep); setPlaying(false); }}
                className={`w-full text-start group glass rounded-2xl p-4 lg:p-5 border transition-all duration-300 ${isActive ? "border-accent/60 shadow-lg shadow-accent/10" : "border-foreground/10 hover:border-foreground/25"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 size-12 rounded-xl flex items-center justify-center font-display text-sm transition-colors ${isActive ? "bg-accent text-[var(--navy)]" : "bg-foreground/5 text-foreground"}`}>
                    {ep.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm lg:text-base leading-tight truncate">{t(ep.titleKey)}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t(ep.descKey)}</div>
                  </div>
                  <div className={`shrink-0 size-9 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-accent text-[var(--navy)]" : "bg-foreground/5 text-foreground group-hover:bg-foreground/10"}`}>
                    <svg viewBox="0 0 24 24" className="size-3.5 ms-0.5" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
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
function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-4 sm:px-6 py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <div className="absolute -end-40 top-20 size-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-accent font-semibold mb-5">
            <span className="size-1 rounded-full bg-accent" />
            {eyebrow}
            <span className="h-px w-12 bg-accent/40" />
          </div>
          <h2 className="font-display leading-[1.05] tracking-tight text-foreground text-[clamp(1.9rem,4.4vw,3.75rem)] whitespace-normal lg:whitespace-nowrap">
            {title}
          </h2>
        </motion.div>
        {children}
      </div>
    </section>
  );
}

/* ---------- WHATSAPP FLOAT ---------- */
function WhatsAppFloat() {
  const { t, dir } = useI18n();
  return (
    <a
      href={WHATSAPP} target="_blank" rel="noopener noreferrer"
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
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
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
