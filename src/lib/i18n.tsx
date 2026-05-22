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
  nav_podcast: "Podcast",
  nav_contact: "Contact",
  book_cta: "Book free 1:1",
  listen_podcast: "Listen — Podcast",
  demo_title: "Demo preview",
  demo_desc: "This site is a live demo. Content and links may evolve.",

  // hero
  hero_hello: "Hello,",
  hero_meet: "Meet",
  hero_intro:
    "Head of L&D, Talent Management & Performance leader with 9+ years driving human capital excellence across 12 countries.",
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
    "L&D Head, Talent & Performance Management Leader with 9+ years across Egypt, Saudi Arabia and 12 other countries. Expertise spans Education, Retail, FMCG and Logistics — partnering with global leaders like KnowledgeCity, G4S, Aramex and Imtenan.",
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

  // podcast
  podcast_eyebrow: "L&D Podcast",
  podcast_title: "Conversations on learning, talent & growth.",
  podcast_now_playing: "Now playing",
  podcast_episodes: "Episodes",
  podcast_play: "Play episode",
  podcast_more_soon: "More episodes coming soon — stay tuned.",
  podcast_ep1_title: "Episode 01 — Inside Learning & Development",
  podcast_ep1_desc: "Real stories from the field on building talent, performance and culture.",
  podcast_ep2_title: "Episode 02 — Building Learning Culture",
  podcast_ep2_desc: "How to embed a learning mindset across teams and leaders.",
  podcast_ep3_title: "Episode 03 — Talent in Action",
  podcast_ep3_desc: "Field insights on developing high-potential talent and team performance.",
  podcast_ep4_title: "Episode 04 — Coaching for Growth",
  podcast_ep4_desc: "How coaching and mentoring drive measurable workplace impact.",


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
  footer_tag: "2026 — Head of L&D, Talent & Performance",
  footer_rights: "All rights reserved.",
};

const ar: Dict = {
  nav_home: "الرئيسية",
  nav_about: "نبذة",
  nav_journey: "المسيرة",
  nav_services: "الخدمات",
  nav_pillars: "الركائز",
  nav_programs: "البرامج",
  nav_clients: "العملاء",
  nav_snapshots: "لقطات",
  nav_podcast: "البودكاست",
  nav_contact: "تواصل",
  book_cta: "احجز جلسة مجانية",
  listen_podcast: "استمع — البودكاست",
  demo_title: "نسخة تجريبية",
  demo_desc: "هذا الموقع نسخة تجريبية حية. قد يتغير المحتوى والروابط.",

  hero_hello: "مرحبًا،",
  hero_meet: "تعرّف إلى",
  hero_intro:
    "رئيس قطاع التعلم والتطوير، وخبير إدارة المواهب والأداء بخبرة تتجاوز ٩ سنوات في تطوير رأس المال البشري عبر ١٢ دولة.",
  hero_btn_book: "احجز جلسة فردية مجانية",
  hero_btn_programs: "استكشف البرامج",
  stat_trainees: "متدرب",
  stat_countries: "دولة",
  stat_programs: "برنامج",
  status_current: "حاليًا",
  status_role: "رئيس التعلم والتطوير · السعودية",

  about_eyebrow: "نبذة عني",
  about_title: "نقود التميّز في رأس المال البشري",
  about_intro:
    "رئيس قطاع التعلم والتطوير وخبير في إدارة المواهب وإدارة الأداء، بخبرة تتجاوز ٩ سنوات في مصر والمملكة العربية السعودية و١٢ دولة أخرى. خبرات تمتد عبر قطاعات التعليم، التجزئة، السلع الاستهلاكية، والخدمات اللوجستية، بالشراكة مع مؤسسات رائدة مثل KnowledgeCity وG4S وAramex وImtenan.",
  about_credentials: "المؤهلات والشهادات",

  pillars_eyebrow: "ثلاث ركائز",
  pillars_title: "المواهب · الأداء · المؤشرات",
  pillar_talent: "إدارة المواهب",
  pillar_talent_desc:
    "تخطيط التعاقب الوظيفي، رسم خرائط الجدارات، هندسة استقطاب الكفاءات، تحديد المواهب الواعدة، واستراتيجيات استبقاء الموظفين.",
  pillar_perf: "إدارة الأداء",
  pillar_perf_desc:
    "أطر التغذية الراجعة المستمرة، تحديث نظم تقييم الأداء، مواءمة الأهداف المؤسسية، وتطوير السلوكيات الوظيفية.",
  pillar_kpi: "مؤشرات الأداء الرئيسية (KPIs)",
  pillar_kpi_desc:
    "تصميم بطاقات الأداء المتوازن، هندسة المقاييس الكمية، بناء لوحات قياس الأداء، ومواءمة برامج التعلم بقرارات قائمة على البيانات وقياس العائد على الاستثمار.",

  journey_eyebrow: "مسيرتي المهنية",
  journey_title: "من أخصائي إلى رئيس قطاع التعلم والتطوير",

  services_eyebrow: "الخدمات",
  services_title: "كيف يمكنني مساعدتك",

  programs_eyebrow: "البرامج",
  programs_title: "مسارات تعلم منتقاة بعناية",
  programs_track: "المسار",

  clients_eyebrow: "العملاء",
  clients_title: "الحدود لا توقفنا",
  clients_sub: "تعلّم عالمي يُقدَّم عبر الإنترنت وحضوريًا.",

  snapshots_eyebrow: "لقطات",
  snapshots_title: "لحظات من الميدان",

  podcast_eyebrow: "بودكاست التعلم والتطوير",
  podcast_title: "حوارات في التعلم، إدارة المواهب والنمو.",
  podcast_now_playing: "يُعرض الآن",
  podcast_episodes: "الحلقات",
  podcast_play: "تشغيل الحلقة",
  podcast_more_soon: "حلقات جديدة قريبًا — تابعنا.",
  podcast_ep1_title: "الحلقة الأولى — داخل عالم التعلم والتطوير",
  podcast_ep1_desc: "قصص حقيقية من الميدان عن بناء المواهب والأداء والثقافة.",
  podcast_ep2_title: "الحلقة الثانية — بناء ثقافة التعلم",
  podcast_ep2_desc: "كيف نُرسّخ عقلية التعلم لدى الفرق والقيادات.",
  podcast_ep3_title: "الحلقة الثالثة — المواهب في الميدان",
  podcast_ep3_desc: "رؤى عملية لتطوير المواهب الواعدة وأداء الفرق.",
  podcast_ep4_title: "الحلقة الرابعة — الكوتشينج للنمو",
  podcast_ep4_desc: "كيف يُحدث الكوتشينج والإرشاد أثرًا حقيقيًا في بيئة العمل.",


  book_badge: "جلسة مجانية ٣٠ دقيقة",
  book_title_1: "احجز جلسة",
  book_title_2: "فردية مجانية",
  book_title_3: "معي.",
  book_desc:
    "أخبرني عن تحدّيك في التعلم والتطوير أو هدفك من جلسة الكوتشينج، وسأرد عليك عبر واتساب لتحديد موعد يناسب توقيتك.",
  book_btn_whatsapp: "تواصل عبر واتساب",
  book_step_1_t: "نحدّد الهدف",
  book_step_1_d: "نتفق على النتيجة المطلوبة خلال أول ١٠ دقائق.",
  book_step_2_t: "خطة مخصّصة",
  book_step_2_d: "تخرج بخطوات عملية واضحة قابلة للتنفيذ.",
  book_step_3_t: "دون أي التزامات",
  book_step_3_d: "جلسة مجانية تمامًا — قيمة حقيقية فقط.",

  lead_eyebrow: "ابقَ على اطّلاع",
  lead_title: "اشترك في الدورات القادمة",
  lead_desc: "كن أول من يعلم عند فتح دفعات جديدة في القيادة، التعلم والتطوير، التصميم التعليمي، وإدارة الأداء.",
  lead_placeholder: "بريدك الإلكتروني",
  lead_btn: "اشترك الآن",
  lead_success: "تم تسجيلك بنجاح. سأتواصل معك قريبًا.",
  lead_error: "حدث خطأ ما. يُرجى المحاولة مرة أخرى.",
  lead_invalid: "يُرجى إدخال بريد إلكتروني صحيح.",

  contact_eyebrow: "تواصل معي",
  contact_title: "هيا نتعاون",
  contact_mobile: "الجوّال",
  contact_email: "البريد الإلكتروني",
  contact_linkedin: "لينكدإن",
  contact_linkedin_line: "تواصل مع إسلام",

  footer_tag: "٢٠٢٦ — رئيس قطاع التعلم والتطوير والمواهب والأداء",
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
