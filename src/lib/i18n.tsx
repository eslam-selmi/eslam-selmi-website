import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

type Dict = Record<string, string | string[]>;

const en: Dict = {
  // nav
  nav_home: "Home",
  nav_about: "About",
  nav_journey: "Journey",
  nav_services: "Services",
  nav_pillars: "Expertise",
  nav_programs: "Programs",
  nav_clients: "Clients",
  nav_snapshots: "Snapshots",
  nav_contact: "Contact",
  book_cta: "Book free 1:1",

  // hero
  hero_hello: "Hello,",
  hero_meet: "Meet",
  hero_intro:
    "Head of L&D, Talent Management & Performance leader with 8+ years driving human capital excellence across 12 countries.",
  hero_btn_book: "Book free 1:1 session",
  hero_btn_programs: "Explore programs",
  stat_trainees: "Trainees",
  stat_countries: "Countries",
  stat_programs: "Programs",
  status_current: "Currently",
  status_role: "Head of L&D · KSA",

  // about
  about_eyebrow: "About me",
  about_title: "Driving human capital excellence",
  about_intro:
    "L&D Head, Talent & Performance Management Leader with 8+ years across Egypt, Saudi Arabia and 12 other countries. Expertise spans Education, Retail, FMCG and Logistics — partnering with global leaders like KnowledgeCity, G4S, Aramex and Imtenan.",
  about_credentials: "Educational credentials",

  // pillars
  pillars_eyebrow: "Three pillars",
  pillars_title: "Talent · Performance · KPIs",
  pillar_talent: "Talent Management",
  pillar_talent_desc:
    "Succession planning, workforce capability mapping, talent acquisition architecture, high-potential (HiPo) identification, and employee retention strategies.",
  pillar_perf: "Performance Management",
  pillar_perf_desc:
    "Continuous feedback frameworks, appraisal system modernization, performance alignment, and structural workplace behavioral optimization.",
  pillar_kpi: "Key Performance Indicators (KPIs)",
  pillar_kpi_desc:
    "Balanced scorecard design, quantitative metrics engineering, performance dashboarding, data-driven L&D alignment, and ROI measurement.",

  // journey
  journey_eyebrow: "My journey",
  journey_title: "From specialist to head of L&D",

  // services
  services_eyebrow: "Services",
  services_title: "How I can help",

  // programs
  programs_eyebrow: "Programs",
  programs_title: "Curated learning tracks",
  programs_track: "Track",

  // clients
  clients_eyebrow: "Clients",
  clients_title: "Borders don't stop us",
  clients_sub: "Worldwide learning, delivered online & on-site.",

  // snapshots
  snapshots_eyebrow: "Snapshots",
  snapshots_title: "Executive moments",

  // book
  book_badge: "Free 30-minute session",
  book_title_1: "Book a free",
  book_title_2: "1‑to‑1",
  book_title_3: "with me.",
  book_desc:
    "Tell me about your L&D challenge or coaching goal. I'll reply on WhatsApp and we'll schedule a call that fits your timezone.",
  book_btn_whatsapp: "Chat on WhatsApp",
  book_step_1_t: "Clarify your goal",
  book_step_1_d: "We define the outcome in the first 10 minutes.",
  book_step_2_t: "Get a tailored plan",
  book_step_2_d: "Walk away with concrete next steps.",
  book_step_3_t: "No strings attached",
  book_step_3_d: "Free, no obligations — just value.",

  // lead form
  lead_eyebrow: "Stay in the loop",
  lead_title: "Subscribe to upcoming courses",
  lead_desc:
    "Be the first to know when new cohorts open — leadership, L&D, instructional design and performance management.",
  lead_placeholder: "Your email address",
  lead_btn: "Subscribe",
  lead_success: "You're in. I'll be in touch.",
  lead_error: "Something went wrong. Please try again.",
  lead_invalid: "Please enter a valid email.",

  // contact
  contact_eyebrow: "Get in touch",
  contact_title: "Let's collaborate",
  contact_mobile: "Mobile",
  contact_email: "Email",
  contact_linkedin: "LinkedIn",
  contact_linkedin_line: "Connect with Eslam",

  // footer
  footer_tag: "Portfolio 2026 — Head of L&D, Talent & Performance",
  footer_rights: "All rights reserved.",
};

const ar: Dict = {
  nav_home: "الرئيسية",
  nav_about: "عني",
  nav_journey: "المسيرة",
  nav_services: "الخدمات",
  nav_pillars: "التخصصات",
  nav_programs: "البرامج",
  nav_clients: "العملاء",
  nav_snapshots: "لقطات",
  nav_contact: "تواصل",
  book_cta: "احجز جلسة مجانية",

  hero_hello: "مرحبًا،",
  hero_meet: "تعرّف على",
  hero_intro:
    "رئيس التعلم والتطوير، وخبير إدارة المواهب والأداء بخبرة تتجاوز 8 سنوات في تطوير رأس المال البشري عبر 12 دولة.",
  hero_btn_book: "احجز جلسة فردية مجانية",
  hero_btn_programs: "استكشف البرامج",
  stat_trainees: "متدرب",
  stat_countries: "دولة",
  stat_programs: "برنامج",
  status_current: "حاليًا",
  status_role: "رئيس L&D · السعودية",

  about_eyebrow: "عني",
  about_title: "نقود التميز في رأس المال البشري",
  about_intro:
    "رئيس التعلم والتطوير، وخبير إدارة المواهب والأداء بخبرة 8+ سنوات في مصر والسعودية و12 دولة أخرى. خبرات في التعليم، التجزئة، السلع الاستهلاكية والخدمات اللوجستية، مع شراكات مع KnowledgeCity وG4S وArmex وImtenan.",
  about_credentials: "المؤهلات التعليمية",

  pillars_eyebrow: "ثلاث ركائز",
  pillars_title: "المواهب · الأداء · المؤشرات",
  pillar_talent: "إدارة المواهب",
  pillar_talent_desc:
    "تخطيط التعاقب الوظيفي، رسم خرائط الجدارات، هندسة استقطاب الكفاءات، تحديد المواهب الواعدة، واستراتيجيات الحفاظ على الموظفين.",
  pillar_perf: "إدارة الأداء",
  pillar_perf_desc:
    "أطر التقييم المستمر، تحديث نظم تقييم الأداء، مواءمة الأهداف المؤسسية، وتحسين السلوك الوظيفي الهيكلي.",
  pillar_kpi: "مؤشرات الأداء الرئيسية (KPIs)",
  pillar_kpi_desc:
    "تصميم بطاقات الأداء المتوازن، هندسة المؤشرات الكمية، بناء لوحات قياس الأداء، ومواءمة التدريب المستند إلى البيانات وقياس العائد المالي.",

  journey_eyebrow: "مسيرتي المهنية",
  journey_title: "من أخصائي إلى رئيس التعلم والتطوير",

  services_eyebrow: "الخدمات",
  services_title: "كيف يمكنني مساعدتك",

  programs_eyebrow: "البرامج",
  programs_title: "مسارات تعلم منتقاة",
  programs_track: "المسار",

  clients_eyebrow: "العملاء",
  clients_title: "الحدود لا توقفنا",
  clients_sub: "تعلّم عالمي يصلك عبر الإنترنت وحضوريًا.",

  snapshots_eyebrow: "لقطات",
  snapshots_title: "لحظات تنفيذية",

  book_badge: "جلسة مجانية 30 دقيقة",
  book_title_1: "احجز جلسة",
  book_title_2: "فردية مجانية",
  book_title_3: "معي.",
  book_desc:
    "أخبرني عن تحدّي التعلم والتطوير أو هدف التدريب لديك. سأرد عبر واتساب ونحدد موعدًا يناسب توقيتك.",
  book_btn_whatsapp: "تواصل عبر واتساب",
  book_step_1_t: "نوضّح الهدف",
  book_step_1_d: "نحدد النتيجة المطلوبة في أول 10 دقائق.",
  book_step_2_t: "خطة مخصصة",
  book_step_2_d: "تخرج بخطوات عملية واضحة.",
  book_step_3_t: "بدون التزامات",
  book_step_3_d: "مجانية تمامًا — قيمة فقط.",

  lead_eyebrow: "ابقَ على اطلاع",
  lead_title: "اشترك في الدورات القادمة",
  lead_desc: "كن أول من يعلم بفتح دفعات جديدة في القيادة، L&D، وتصميم البرامج وإدارة الأداء.",
  lead_placeholder: "بريدك الإلكتروني",
  lead_btn: "اشترك",
  lead_success: "تم تسجيلك. سأتواصل معك قريبًا.",
  lead_error: "حدث خطأ. حاول مرة أخرى.",
  lead_invalid: "أدخل بريدًا صحيحًا.",

  contact_eyebrow: "تواصل",
  contact_title: "هيا نتعاون",
  contact_mobile: "الجوال",
  contact_email: "البريد",
  contact_linkedin: "لينكدإن",
  contact_linkedin_line: "تواصل مع إسلام",

  footer_tag: "بورتفوليو 2026 — رئيس التعلم والتطوير والمواهب والأداء",
  footer_rights: "جميع الحقوق محفوظة.",
};

const dictionaries: Record<Lang, Dict> = { en, ar };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem("lang")) as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("lang", l);
  };

  const t = (key: string) => {
    const v = dictionaries[lang][key];
    if (typeof v === "string") return v;
    return key;
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}
