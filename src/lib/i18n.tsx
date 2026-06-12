import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

type Dict = Record<string, string | string[]>;

const en: Dict = {
  // nav
  nav_home: "Home",
  nav_about: "Who I Am",
  nav_journey: "Journey",
  nav_services: "Services",
  nav_pillars: "Expertise",
  nav_programs: "Programs",
  nav_clients: "Clients",
  nav_snapshots: "Snapshots",
  nav_podcast: "Podcast",
  nav_contact: "Contact",
  book_cta: "Book free 1:1",
  listen_podcast: "Listen · Podcast",
  demo_title: "Demo preview",
  demo_desc: "This site is a live demo. Content and links may evolve.",

  // hero
  hero_hello: "Hello,",
  hero_meet: "Meet",
  hero_intro:
    "Head of Education & Development, Talent and Performance practitioner with 9+ years driving human capital excellence across 12 countries.",
  hero_btn_book: "Book free 1:1 session",
  hero_btn_programs: "Explore programs",
  stat_trainees: "Trainees",
  stat_countries: "Countries",
  stat_programs: "Programs",
  status_current: "Currently",
  status_role: "Head of L&D · KSA",

  // about
  about_eyebrow: "About Me",
  about_title: "Meet Eslam",
  about_intro:
    "Learning & Development Lead and Talent Management professional with over 9 years of proven expertise in driving organizational growth, building employee capabilities, and executing quality retention strategies across the Retail, FMCG, and Education sectors in the MENA region. Currently serving as L&D Lead at Knowledge City for Education in Saudi Arabia, he spearheads comprehensive training initiatives and corporate talent programs.\n\nEslam successfully bridges the gap between business objectives and human capital development by integrating modern learning methodologies with AI-driven platforms to optimize training experiences and maximize ROI.\n\nHe is passionate about cultivating high-performing teams, fostering a culture of continuous learning, and driving operational excellence through structured project management.",
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
  journey_title: "A decade of shaping L&D excellence",

  // services
  services_eyebrow: "Services",
  services_title: "How I help you grow",
  services_subtitle: "Tap any service to request it instantly via WhatsApp.",
  svc_request_btn: "Invest in this service",
  calendly_title: "Book your free 1:1 session",
  calendly_desc: "Pick a time that works for you.",

  // programs
  programs_eyebrow: "Programs",
  programs_title: "Curated learning tracks",
  programs_track: "Track",

  // clients
  clients_eyebrow: "Clients",
  clients_title: "Borders don't stop us",
  clients_sub: "Worldwide learning, delivered online & on-site.",

  // brands
  brands_eyebrow: "Trusted by",
  brands_title: "Brands that trusted my craft",
  brands_desc:
    "A snapshot of companies and partners I've designed, delivered and led L&D programs with across the region.",
  brands_meta: "Brands & partners",

  // snapshots
  snapshots_eyebrow: "Snapshots",
  snapshots_title: "Moments that shaped the journey",

  // podcast
  podcast_eyebrow: "L&D Podcast",
  podcast_title: "Conversations on learning & growth.",
  podcast_now_playing: "Now playing",
  podcast_episodes: "Episodes",
  podcast_play: "Play episode",
  podcast_more_soon: "More episodes coming soon. Stay tuned.",
  podcast_ep1_title: "Episode 01: Inside Learning & Development",
  podcast_ep1_desc: "Real stories from the field on building talent, performance and culture.",
  podcast_ep2_title: "Episode 02: Building Learning Culture",
  podcast_ep2_desc: "How to embed a learning mindset across teams and leaders.",
  podcast_ep3_title: "Episode 03: Talent in Action",
  podcast_ep3_desc: "Field insights on developing high-potential talent and team performance.",
  podcast_ep4_title: "Episode 04: Coaching for Growth",
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
  book_step_1_d: "We map your priorities and frame a clear focus together.",
  book_step_2_t: "Get a tailored plan",
  book_step_2_d: "Walk away with concrete next steps.",
  book_step_3_t: "No strings attached",
  book_step_3_d: "Free, no obligations. Just value.",

  // current courses
  current_eyebrow: "Open now",
  current_title: "Live courses, enroll today",
  current_desc:
    "Active cohorts running right now. Pick the program that fits you and apply in under a minute.",
  current_btn: "Browse & enroll",
  current_meta: "Limited seats · Live sessions",
  current_modal_title: "Choose your course",
  current_modal_desc: "Select the program that fits you best and submit your application.",

  // library
  library_eyebrow: "Resources",
  library_title: "Knowledge Vault",
  library_desc:
    "A curated vault of e-books, frameworks, templates and resources I share with the community. Always growing, so bookmark it.",
  library_btn: "Open the vault",
  library_meta: "E-books · Templates · Frameworks",
  library_modal_title: "Knowledge Vault",
  library_modal_desc: "Browse and download the latest resources.",
  library_open_drive: "Open in Google Drive",
  nav_courses: "Courses",
  nav_library: "Vault",
  nav_success_cases: "Success Cases",

  nav_empowerment: "New Grad?",

  // empowerment tools
  emp_eyebrow: "New graduates",
  emp_title: "Empowerment Tools",
  emp_tagline: "Workplace-ready in weeks, not years.",
  emp_desc:
    "A hands-on program that prepares fresh graduates to master the everyday tools of modern work: practical AI use, professional Outlook workflows, design with Canva, project tracking with Trello, and data work with Google Sheets & Forms.",
  emp_btn: "Enroll now",
  emp_meta: "Tools · Workflows · Confidence",
  emp_tool_ai: "AI at work",
  emp_tool_outlook: "Outlook mastery",
  emp_tool_canva: "Canva design",
  emp_tool_trello: "Trello & tasks",
  emp_tool_sheets: "Sheets & Forms",
  emp_tool_more: "More essentials",

  // language hint toast
  lang_hint_title_en: "Prefer English?",
  lang_hint_title_ar: "تفضّل العربية؟",
  lang_hint_desc_en: "You can switch the language anytime from here.",
  lang_hint_desc_ar: "يمكنك تغيير لغة الموقع في أي وقت من هنا.",
  lang_hint_switch_en: "Switch to English",
  lang_hint_switch_ar: "التحويل للعربية",

  // lead form
  lead_eyebrow: "Stay in the loop",
  lead_title: "Subscribe to upcoming courses",
  lead_desc:
    "Be the first to know when new cohorts open: leadership, L&D, instructional design and performance management.",
  lead_placeholder: "Your email address",
  lead_btn: "Subscribe",
  lead_success: "You're in. I'll be in touch.",
  lead_error: "Something went wrong. Please try again.",
  lead_invalid: "Please enter a valid email.",

  // contact
  contact_eyebrow: "Get in touch",
  contact_title: "Let's create impact together",
  contact_mobile: "Mobile",
  contact_email: "Email",
  contact_linkedin: "LinkedIn",
  contact_linkedin_line: "Connect with me",

  // footer
  footer_tag: "",
  footer_rights: "All rights reserved.",
};

const ar: Dict = {
  nav_home: "الرئيسية",
  nav_about: "من أنا",
  nav_journey: "المسيرة",
  nav_services: "الخدمات",
  nav_pillars: "الركائز",
  nav_programs: "البرامج",
  nav_clients: "العملاء",
  nav_snapshots: "لقطات",
  nav_podcast: "البودكاست",
  nav_contact: "تواصل",
  book_cta: "احجز جلسة مجانية",
  listen_podcast: "استمع · البودكاست",
  demo_title: "نسخة تجريبية",
  demo_desc: "هذا الموقع نسخة تجريبية حية. قد يتغير المحتوى والروابط.",

  hero_hello: "مرحبًا،",
  hero_meet: "تعرّف إلى",
  hero_intro:
    "رئيس قسم التعليم والتطوير. أمتلك خبرة تتجاوز ٩ سنوات في إدارة المواهب والأداء، وتطوير رأس المال البشري عبر العديد من الدول.",
  hero_btn_book: "احجز جلسة فردية مجانية",
  hero_btn_programs: "استكشف البرامج",
  stat_trainees: "متدرب",
  stat_countries: "دولة",
  stat_programs: "برنامج",
  status_current: "حاليًا",
  status_role: "رئيس التعلم والتطوير · السعودية",

  about_eyebrow: "من أنا",
  about_title: "تعرّف إلى إسلام",

  about_intro:
    "قائد متخصص في التعلم والتطوير وإدارة المواهب، بخبرة تتجاوز ٩ سنوات أُثبتت في دفع النمو المؤسسي، وبناء قدرات الموظفين، وتنفيذ استراتيجيات الاحتفاظ بالكفاءات عبر قطاعات التجزئة والسلع الاستهلاكية والتعليم في منطقة الشرق الأوسط وشمال إفريقيا. يشغل حالياً منصب رئيس قسم التعلم والتطوير في Knowledge City للتعليم بالمملكة العربية السعودية، حيث يقود مبادرات تدريبية شاملة وبرامج تطوير المواهب المؤسسية.\n\nيُجيد إسلام سدّ الفجوة بين الأهداف المؤسسية وتطوير رأس المال البشري من خلال دمج منهجيات التعلم الحديثة مع منصات مدعومة بالذكاء الاصطناعي، لتحسين تجربة التدريب وتعظيم العائد على الاستثمار.\n\nشغوف ببناء فرق عالية الأداء، وترسيخ ثقافة التعلم المستمر، وتحقيق التميز التشغيلي من خلال إدارة منهجية للمشاريع.",
  about_credentials: "المؤهلات والشهادات",

  pillars_eyebrow: "ثلاث ركائز",
  pillars_title: "المواهب · الأداء · المؤشرات",
  pillar_talent: "إدارة المواهب",
  pillar_talent_desc:
    "تصميم وتنفيذ برامج التدريب والتطوير، تخطيط التعاقب الوظيفي، رسم خرائط الجدارات، هندسة استقطاب الكفاءات، تحديد المواهب الواعدة، واستراتيجيات استبقاء الموظفين.",
  pillar_perf: "إدارة الأداء",
  pillar_perf_desc:
    "أطر التغذية الراجعة المستمرة، تحديث نظم تقييم الأداء، مواءمة الأهداف المؤسسية، وتطوير السلوكيات الوظيفية.",
  pillar_kpi: "مؤشرات الأداء الرئيسية (KPIs)",
  pillar_kpi_desc:
    "تصميم بطاقات الأداء المتوازن، هندسة المقاييس الكمية، بناء لوحات قياس الأداء، ومواءمة برامج التعلم بقرارات قائمة على البيانات وقياس العائد على الاستثمار.",

  journey_eyebrow: "مسيرتي المهنية",
  journey_title: "عقد من بناء التميّز في التعلم والتطوير",

  services_eyebrow: "الخدمات",
  services_title: "كيف أساعدك تنمو",
  services_subtitle: "اضغط على أي خدمة لطلبها مباشرة عبر واتساب.",
  svc_request_btn: "استثمر في هذه الخدمة",
  calendly_title: "احجز جلستك المجانية",
  calendly_desc: "اختر الموعد الذي يناسبك.",

  programs_eyebrow: "البرامج",
  programs_title: "برامج التدريب والتطوير",
  programs_track: "المسار",

  clients_eyebrow: "العملاء",
  clients_title: "الحدود لا توقفنا",
  clients_sub: "تعلّم عالمي يُقدَّم عبر الإنترنت وحضوريًا.",

  brands_eyebrow: "موثوق من",
  brands_title: "شركاء صنعت معهم الأثر",
  brands_desc: "لمحة عن الشركات والشركاء الذين صمّمت وقدت معهم برامج التعلم والتطوير عبر المنطقة.",
  brands_meta: "علامة وشريك",

  snapshots_eyebrow: "لقطات",
  snapshots_title: "لحظات شكّلت المسيرة",

  podcast_eyebrow: "بودكاست التعلم والتطوير",
  podcast_title: "حوارات في التعلم والنمو.",
  podcast_now_playing: "يُعرض الآن",
  podcast_episodes: "الحلقات",
  podcast_play: "تشغيل الحلقة",
  podcast_more_soon: "حلقات جديدة قريبًا. تابعنا.",
  podcast_ep1_title: "الحلقة الأولى: داخل عالم التعلم والتطوير",
  podcast_ep1_desc: "قصص حقيقية من الميدان عن بناء المواهب والأداء والثقافة.",
  podcast_ep2_title: "الحلقة الثانية: بناء ثقافة التعلم",
  podcast_ep2_desc: "كيف نُرسّخ عقلية التعلم لدى الفرق والقيادات.",
  podcast_ep3_title: "الحلقة الثالثة: المواهب في الميدان",
  podcast_ep3_desc: "رؤى عملية لتطوير المواهب الواعدة وأداء الفرق.",
  podcast_ep4_title: "الحلقة الرابعة: الكوتشينج للنمو",
  podcast_ep4_desc: "كيف يُحدث الكوتشينج والإرشاد أثرًا حقيقيًا في بيئة العمل.",

  book_badge: "جلسة مجانية ٣٠ دقيقة",
  book_title_1: "احجز جلسة",
  book_title_2: "فردية مجانية",
  book_title_3: "معي.",
  book_desc:
    "أخبرني عن تحدّيك في التعلم والتطوير أو هدفك من جلسة الكوتشينج، وسأرد عليك عبر واتساب لتحديد موعد يناسب توقيتك.",
  book_btn_whatsapp: "تواصل عبر واتساب",
  book_step_1_t: "نحدّد الهدف",
  book_step_1_d: "نتعرّف على أولوياتك ونضع تصورًا مشتركًا لمحور الجلسة.",
  book_step_2_t: "خطة مخصّصة",
  book_step_2_d: "تخرج بخطوات عملية واضحة قابلة للتنفيذ.",
  book_step_3_t: "دون أي التزامات",
  book_step_3_d: "جلسة مجانية تمامًا، قيمة حقيقية فقط.",

  current_eyebrow: "متاح الآن",
  current_title: "دورات مباشرة، سجّل اليوم",
  current_desc:
    "انطلق في رحلتك التطويرية اليوم — التحق بإحدى دوراتنا المتاحة حاليًا وابدأ خطوتك الأولى نحو التميّز في أقل من دقيقة.",
  current_btn: "تصفّح وسجّل الآن",
  current_meta: "مقاعد محدودة · جلسات مباشرة",
  current_modal_title: "اختر دورتك",
  current_modal_desc: "حدّد البرنامج الأنسب لك وأرسل طلب الاشتراك.",

  library_eyebrow: "مصادر",
  library_title: "المصادر",
  library_desc:
    "مكتبة مختارة من الكتب الإلكترونية والقوالب والأطر العملية والمصادر التي أشاركها مع المجتمع. تتجدّد باستمرار، فاحفظها للرجوع إليها.",
  library_btn: "ادخل المصادر",
  library_meta: "كتب إلكترونية · قوالب · أطر عملية",
  library_modal_title: "المصادر",
  library_modal_desc: "تصفّح وحمّل أحدث المصادر.",
  library_open_drive: "افتح في Google Drive",
  nav_courses: "الكورسات",
  nav_library: "المصادر",
  nav_success_cases: "حالات النجاح",

  nav_empowerment: "خريج جديد؟",

  emp_eyebrow: "للخريجين الجدد",
  emp_title: "أدوات التمكين",
  emp_tagline: "جاهز لسوق العمل خلال أسابيع، لا سنوات.",
  emp_desc:
    "برنامج عملي يؤهّل الخريجين الجدد لإتقان الأدوات الأساسية في بيئة العمل الحديثة: توظيف الذكاء الاصطناعي بفاعلية، إتقان Outlook، التصميم باستخدام Canva، إدارة المهام عبر Trello، والعمل مع Google Sheets و Google Forms.",
  emp_btn: "سجّل الآن",
  emp_meta: "أدوات · مهارات · ثقة",
  emp_tool_ai: "الذكاء الاصطناعي",
  emp_tool_outlook: "Outlook باحتراف",
  emp_tool_canva: "تصميم Canva",
  emp_tool_trello: "Trello والمهام",
  emp_tool_sheets: "Sheets و Forms",
  emp_tool_more: "أدوات أخرى",

  lang_hint_title_en: "Prefer English?",
  lang_hint_title_ar: "تفضّل العربية؟",
  lang_hint_desc_en: "You can switch the language anytime from here.",
  lang_hint_desc_ar: "يمكنك تغيير لغة الموقع في أي وقت من هنا.",
  lang_hint_switch_en: "Switch to English",
  lang_hint_switch_ar: "التحويل للعربية",

  lead_eyebrow: "ابقَ على اطّلاع",
  lead_title: "اشترك في الدورات القادمة",
  lead_desc:
    "كن أول من يعلم عند فتح دفعات جديدة في القيادة، التعلم والتطوير، التصميم التعليمي، وإدارة الأداء.",
  lead_placeholder: "بريدك الإلكتروني",
  lead_btn: "اشترك الآن",
  lead_success: "تم تسجيلك بنجاح. سأتواصل معك قريبًا.",
  lead_error: "حدث خطأ ما. يُرجى المحاولة مرة أخرى.",
  lead_invalid: "يُرجى إدخال بريد إلكتروني صحيح.",

  contact_eyebrow: "تواصل معي",
  contact_title: "خلّينا نصنع الأثر معًا",
  contact_mobile: "الجوّال",
  contact_email: "البريد الإلكتروني",
  contact_linkedin: "لينكدإن",
  contact_linkedin_line: "تواصل معي",

  footer_tag: "",
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
  // SYNC initial read so client + SSR render the same dir/lang and we avoid a flash.
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    const saved = window.localStorage.getItem("lang");
    if (saved === "ar" || saved === "en") return saved;
    // Fallback to whatever the inline head script already wrote to <html lang>.
    const htmlLang = document.documentElement.getAttribute("lang");
    return htmlLang === "en" ? "en" : "ar";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  // React to changes made in other tabs / windows so the preference truly persists.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "lang" && (e.newValue === "ar" || e.newValue === "en")) {
        setLangState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
