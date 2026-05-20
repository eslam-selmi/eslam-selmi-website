import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Globe2, Layers, MessageCircle, Mail, Linkedin, Phone, ArrowRight,
  CheckCircle2, Menu, X, Calendar, Target, Lightbulb, HeartHandshake,
  GraduationCap, Award, Users, TrendingUp, BarChart3, UserCheck, Languages,
  ArrowUp, Loader2, Briefcase, BadgeCheck, Compass, Presentation, MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";

import headshot from "@/assets/portfolio/headshot.png";
import logo from "@/assets/portfolio/logo.png";
import trainingCollage from "@/assets/portfolio/training-collage.webp";
import snap1 from "@/assets/portfolio/snap-1.jpg";
import snap2 from "@/assets/portfolio/snap-2.jpg";
import snap3 from "@/assets/portfolio/snap-3.jpg";
import snap4 from "@/assets/portfolio/snap-4.jpg";
import snap5 from "@/assets/portfolio/snap-5.jpg";
import snap6 from "@/assets/portfolio/snap-6.jpg";
import snap7 from "@/assets/portfolio/snap-7.jpg";

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
  { year: "2017", role: { en: "L&D Specialist", ar: "أخصائي تعلم وتطوير" }, company: "Imtenan", country: "EG" },
  { year: "2022", role: { en: "Senior L&D Specialist", ar: "أخصائي أول تعلم وتطوير" }, company: "Aramex", country: "EG" },
  { year: "2023", role: { en: "Control Supervisor", ar: "مشرف رقابة" }, company: "G4S", country: "EG" },
  { year: "2024", role: { en: "L&D Supervisor", ar: "مشرف التعلم والتطوير" }, company: "KnowledgeCity", country: "SA" },
  { year: "2025", role: { en: "Head of L&D", ar: "رئيس التعلم والتطوير" }, company: "Imtenan", country: "EG" },
  { year: "2026", role: { en: "Head of L&D", ar: "رئيس التعلم والتطوير" }, company: "KnowledgeCity", country: "SA" },
];

const CREDENTIALS = [
  { name: { en: "PMP", ar: "إدارة المشاريع PMP" }, issuer: { en: "London College", ar: "كلية لندن" }, icon: BadgeCheck },
  { name: { en: "TOT — Training of Trainers", ar: "تدريب المدربين TOT" }, issuer: { en: "Certified Program", ar: "برنامج معتمد" }, icon: Presentation },
  { name: { en: "Performance & KPIs", ar: "إدارة الأداء والمؤشرات" }, issuer: { en: "ESLSCA University", ar: "جامعة ESLSCA" }, icon: BarChart3 },
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
  { icon: UserCheck, key: "talent", color: "from-blue-500/40 to-indigo-500/20" },
  { icon: TrendingUp, key: "perf", color: "from-amber-500/40 to-orange-500/20" },
  { icon: BarChart3, key: "kpi", color: "from-emerald-500/40 to-teal-500/20" },
];

const SNAPSHOTS = [trainingCollage, snap1, snap2, snap3, snap4, snap5, snap6, snap7];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.21, 0.5, 0.3, 1] as const },
};

function Portfolio() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <About />
      <Pillars />
      <Journey />
      <Services />
      <Programs />
      <Clients />
      <Snapshots />
      <BookCTA />
      <LeadForm />
      <Contact />
      <Footer />
      <WhatsAppFloat />
      <ScrollTop />
    </div>
  );
}

/* ---------- NAV ---------- */
function Nav() {
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
        <div className="glass-strong rounded-full ps-3 pe-2 py-2 flex items-center justify-between gap-2">
          <a href="#home" className="flex items-center gap-2 group shrink-0">
            <img src={logo} alt="Eslam Selmi" className="size-9 object-contain" />
            <span className="font-display font-semibold tracking-tight hidden sm:inline text-base">
              Eslam Selmi
            </span>
          </a>
          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} className="px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5">
                {t(n.key)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en" as Lang)}
              aria-label="Toggle language"
              className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-semibold hover:bg-white/10 transition"
            >
              <Languages className="size-3.5" />
              {lang === "en" ? "AR" : "EN"}
            </button>
            <a
              href={LINKEDIN} target="_blank" rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hidden sm:inline-flex size-9 items-center justify-center rounded-full glass hover:bg-white/10 transition"
            >
              <Linkedin className="size-4" />
            </a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-gold text-accent-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition">
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
              <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/5 text-sm">{t(n.key)}</a>
            ))}
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gold text-accent-foreground px-4 py-2 text-sm font-semibold">
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
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section id="home" ref={ref} className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-aurora animate-float-slow" />
      <div className="absolute inset-0 grain" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
        <motion.div style={{ y }} className="order-2 lg:order-1">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-gold font-medium tracking-wider uppercase text-sm">
            ✦ {t("hero_hello")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
            className="mt-3 font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.05]">
            {t("hero_meet")} <span className="text-gradient-gold">Eslam Selmi</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="mt-5 text-lg text-muted-foreground max-w-xl text-balance leading-relaxed">
            {t("hero_intro")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap gap-3">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-gold text-accent-foreground px-6 py-3 font-semibold hover:shadow-[0_0_40px_-8px] hover:shadow-[var(--gold)] transition">
              <MessageCircle className="size-5" /> {t("hero_btn_book")}
              <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
            </a>
            <a href="#programs" className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 font-medium hover:bg-white/10 transition">
              {t("hero_btn_programs")}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <Stat n="3000+" l={t("stat_trainees")} />
            <Stat n="12" l={t("stat_countries")} />
            <Stat n="15+" l={t("stat_programs")} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
          className="order-1 lg:order-2 relative">
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="size-[420px] rounded-full bg-gradient-to-tr from-[var(--gold)]/30 via-primary/30 to-transparent blur-3xl animate-float-slow" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] size-[360px] sm:size-[440px] rounded-full border border-[var(--gold)]/20 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] size-[300px] sm:size-[380px] rounded-full border border-white/5" />

          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto max-w-sm">
            <img
              src={headshot}
              alt="Eslam Selmi, Head of L&D"
              className="relative w-full h-auto object-contain drop-shadow-[0_30px_50px_rgba(214,158,46,0.35)]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 whitespace-nowrap">
            <span className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400" />
            <div className="text-start">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("status_current")}</div>
              <div className="text-sm font-semibold">{t("status_role")}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-2xl sm:text-3xl font-bold text-gradient-gold">{n}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{l}</div>
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
      <motion.p {...fadeUp} className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
        {t("about_intro")}
      </motion.p>
      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {strengths.map((s, i) => (
          <motion.div key={s.t.en} {...fadeUp} transition={{ duration: 0.6, delay: i * 0.08 }}
            className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition group">
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
              className="glass rounded-2xl p-4 group hover:border-[var(--lavender)]/40 hover:bg-white/[0.06] transition relative overflow-hidden"
            >
              <div className="absolute -top-10 -end-10 size-24 rounded-full bg-[var(--lavender)]/20 blur-2xl opacity-0 group-hover:opacity-100 transition" />
              <div className="relative flex items-start gap-3">
                <div className="size-11 rounded-xl bg-gradient-to-br from-[var(--lavender)]/30 via-[var(--lavender-deep)]/20 to-[var(--gold)]/20 grid place-items-center text-lavender shrink-0 border border-white/10">
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
            className="relative glass rounded-3xl p-7 overflow-hidden group hover:border-[var(--gold)]/30 transition"
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
      <div className="relative">
        <div className="absolute start-4 sm:start-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--gold)]/40 to-transparent" />
        <div className="space-y-6">
          {JOURNEY.map((j, i) => (
            <motion.div
              key={j.year + j.company}
              {...fadeUp} transition={{ delay: i * 0.08, duration: 0.6 }}
              className={`relative grid sm:grid-cols-2 gap-4 sm:gap-12 items-center`}
            >
              <div className={`${i % 2 === 0 ? "sm:order-1 sm:text-end" : "sm:order-2"} ps-12 sm:ps-0`}>
                <div className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition group">
                  <div className="flex items-center gap-3 mb-3 sm:justify-start">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 grid place-items-center text-gold font-display font-bold text-sm">
                      {j.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold leading-tight">{j.company}</div>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        {j.country === "SA" ? "🇸🇦 Saudi Arabia" : "🇪🇬 Egypt"}
                      </div>
                    </div>
                  </div>
                  <div className="font-medium text-sm">{j.role[lang]}</div>
                </div>
              </div>
              <div className={`${i % 2 === 0 ? "sm:order-2" : "sm:order-1 sm:text-end"} hidden sm:block`}>
                <div className="font-display text-3xl font-bold text-gradient-gold">{j.year}</div>
              </div>
              <div className="absolute start-4 sm:start-1/2 top-6 -translate-x-1/2 size-3 rounded-full bg-gold shadow-[0_0_18px] shadow-[var(--gold)] z-10" />
              <div className="sm:hidden absolute start-12 top-0 text-xs font-semibold text-gold">{j.year}</div>
            </motion.div>
          ))}
        </div>
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
            className="relative glass rounded-2xl p-6 group overflow-hidden hover:bg-white/[0.06] hover:border-[var(--gold)]/30 transition">
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
            className="glass rounded-3xl p-6 flex flex-col overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/0 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 self-start glass rounded-full px-3 py-1 text-xs text-gold font-semibold">
                <Sparkles className="size-3.5" /> {t("programs_track")} {i + 1}
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{p.track[lang]}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.intro[lang]}</p>
              <div className="mt-5 space-y-3">
                {p.items.map(it => (
                  <div key={it.name.en} className="rounded-xl bg-white/[0.03] border border-white/5 p-3 hover:border-[var(--gold)]/30 transition">
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
          <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm">
            <Stat n="3000+" l={t("stat_trainees")} />
            <Stat n="12+" l={t("nav_clients")} />
            <Stat n="15+" l={t("stat_programs")} />
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
              className="glass aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 hover:border-[var(--gold)]/40 transition group p-2">
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
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const spans = ["md:col-span-2 row-span-2", "", "", "row-span-2", "", "md:col-span-2", "", ""];

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

  return (
    <Section id="snapshots" eyebrow={t("snapshots_eyebrow")} title={t("snapshots_title")}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[180px] md:auto-rows-[220px]">
        {SNAPSHOTS.map((src, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.6 }}
            className={`relative overflow-hidden rounded-2xl group cursor-zoom-in ${spans[i] || ""}`}
          >
            <img src={src} alt={`Snapshot ${i + 1}`} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="absolute bottom-3 start-3 text-xs text-white/90 opacity-0 group-hover:opacity-100 transition font-semibold">
              View →
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md grid place-items-center p-4"
            onClick={() => setActive(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setActive(null); }}
              className="absolute top-5 end-5 size-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white"
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
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm"
              >← Prev</button>
              <span className="px-4 py-2 rounded-full bg-white/10 text-white text-sm">{active + 1} / {SNAPSHOTS.length}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setActive((a) => a === null ? null : (a + 1) % SNAPSHOTS.length); }}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm"
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
        className="relative mx-auto max-w-6xl rounded-[2rem] p-8 sm:p-12 lg:p-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-[var(--gold)]/20 to-primary/10" />
        <div className="absolute inset-0 bg-aurora opacity-60" />
        <div className="absolute inset-0 grain" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs font-semibold text-gold">
              <Sparkles className="size-3.5" /> {t("book_badge")}
            </div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-balance leading-[1.1]">
              {t("book_title_1")} <span className="text-gradient-gold">{t("book_title_2")}</span> {t("book_title_3")}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl leading-relaxed">{t("book_desc")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-6 py-3 font-semibold hover:bg-emerald-400 transition shadow-[0_0_40px_-10px] shadow-emerald-500">
                <MessageCircle className="size-5" /> {t("book_btn_whatsapp")}
                <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
              </a>
              <a href="tel:+966555376228" className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 font-medium hover:bg-white/10 transition">
                <Phone className="size-4" /> +966 555 376 228
              </a>
            </div>
          </div>
          <div className="grid gap-3">
            {steps.map(({ i: Icon, t: tt, d }) => (
              <div key={tt} className="glass rounded-2xl p-4 flex items-start gap-3">
                <span className="size-9 rounded-xl bg-[var(--gold)]/20 grid place-items-center text-gold shrink-0"><Icon className="size-5" /></span>
                <div>
                  <div className="font-semibold text-sm">{tt}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d}</div>
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
              className="flex-1 rounded-full glass px-5 py-3 text-sm outline-none focus:border-[var(--gold)] transition placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold text-accent-foreground px-6 py-3 font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {t("lead_btn")}
            </button>
          </form>
          <div className="mt-3 min-h-[1.5rem] text-sm">
            {state === "success" && <span className="text-emerald-400">✓ {t("lead_success")}</span>}
            {state === "error" && <span className="text-destructive">{t("lead_error")}</span>}
            {state === "invalid" && <span className="text-amber-400">{t("lead_invalid")}</span>}
          </div>
        </motion.div>
        <motion.div {...fadeUp} className="glass rounded-3xl p-6 grid grid-cols-3 gap-3">
          {[Briefcase, Award, GraduationCap, Users, TrendingUp, BarChart3].map((Icon, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-[var(--gold)]/20 to-primary/20 grid place-items-center text-gold">
              <Icon className="size-7" />
            </div>
          ))}
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
      className="glass rounded-2xl p-6 hover:bg-white/[0.06] hover:border-[var(--gold)]/30 transition group block">
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
    <footer className="border-t border-white/5 mt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Eslam Selmi" className="size-10 object-contain" />
          <div>
            <div className="font-display font-semibold leading-none">Eslam Selmi</div>
            <div className="text-xs text-muted-foreground mt-1">{t("footer_tag")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
            className="size-9 grid place-items-center rounded-full glass hover:bg-white/10 transition">
            <Linkedin className="size-4" />
          </a>
          <a href="mailto:eslam.m.selmi@gmail.com" aria-label="Email"
            className="size-9 grid place-items-center rounded-full glass hover:bg-white/10 transition">
            <Mail className="size-4" />
          </a>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
            className="size-9 grid place-items-center rounded-full glass hover:bg-white/10 transition">
            <MessageCircle className="size-4" />
          </a>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Eslam Selmi. {t("footer_rights")}</div>
      </div>
    </footer>
  );
}

/* ---------- SECTION WRAPPER ---------- */
function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-4 sm:px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-gold text-sm uppercase tracking-[0.2em] font-semibold">
            <span className="h-px w-8 bg-gold" /> {eyebrow}
          </div>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight text-balance leading-[1.1]">
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
      className={`fixed bottom-5 ${dir === "rtl" ? "left-5" : "right-5"} z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-3 font-semibold shadow-[0_10px_40px_-10px] shadow-emerald-500 transition`}
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
          className={`fixed bottom-20 ${dir === "rtl" ? "left-5" : "right-5"} z-40 size-11 grid place-items-center rounded-full bg-gold text-accent-foreground shadow-lg hover:scale-110 transition`}
        >
          <ArrowUp className="size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
