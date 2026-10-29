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
  nav_ask_selmi: "Ask Selmi",
  nav_book: "Book",
  nav_book_consult: "Book a Free Consultation",
  nav_manage_booking: "Manage your booking",
  nav_contact: "Contact",
  book_cta: "Book free 1:1",
  manage_booking_cta: "Manage booking",
  listen_podcast: "Listen · Podcast",
  demo_title: "Demo preview",
  demo_desc: "This site is a live demo. Content and links may evolve.",

  // hero
  hero_hello: "Hello,",
  hero_meet: "Meet",
  hero_intro:
    "Head of Learning & Development with 9+ years of experience in talent management, performance management, and corporate training.",
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
  about_hook:
    "I align learning plans and talent development with business objectives and performance indicators.",
  about_intro:
    "I work with organizations on training needs analysis, learning plans, leadership development, and performance systems.\n\nWith 9+ years of experience, I design programs around job requirements, business objectives, and KPIs, with training ROI as part of evaluation.",
  about_role: "Head of Learning & Development",
  about_location: "Riyadh, KSA",
  about_kpi_years: "Years of experience",
  about_kpi_countries: "Countries",
  about_kpi_leaders: "Trainees",
  about_kpi_programs: "Programs delivered",
  about_pillar_philosophy: "My Professional Philosophy",
  about_pillar_philosophy_d:
    "I define training objectives, link them to business KPIs, and include training ROI in program evaluation.",
  about_pillar_journey: "My Career Journey",
  about_pillar_journey_d:
    "9+ years in learning and talent management across retail, FMCG, logistics, and education.",
  about_pillar_digital: "Digital Enablement",
  about_pillar_digital_d:
    "Using project management tools and AI to automate learning and performance management workflows (LMS/PMS).",
  about_cta_book: "Book a 1:1 with me",
  about_cta_programs: "Explore programs",
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
  journey_title: "Experience in Learning & Development",

  // services
  services_eyebrow: "Services",
  services_title: "Consulting & Corporate Training",
  services_subtitle: "Tap any service to request it instantly via WhatsApp.",
  svc_request_btn: "Request this service",
  calendly_title: "Book your free 1:1 session",
  calendly_desc: "Pick a time that works for you.",

  // programs
  programs_eyebrow: "Programs",
  programs_title: "Training & Development Programs",
  programs_track: "Track",

  // clients
  clients_eyebrow: "Global Reach",
  clients_title: "Trainees from 12 Countries",
  clients_sub: "Every session delivered online — live and recorded.",

  // brands
  brands_eyebrow: "Trusted by",
  brands_title: "Companies & Training Partners",
  brands_desc:
    "A snapshot of companies and partners I've designed, delivered and led L&D programs with across the region.",
  brands_meta: "Brands & partners",

  // snapshots
  snapshots_eyebrow: "Snapshots",
  snapshots_title: "Training & Workplace Snapshots",

  // podcast
  podcast_eyebrow: "L&D Podcast",
  podcast_title: "Conversations on learning & growth.",
  podcast_now_playing: "Now playing",
  podcast_episodes: "Episodes",
  podcast_play: "Play episode",
  podcast_more_soon: "More episodes coming soon. Stay tuned.",
  podcast_ep1_title: "Episode 01: Inside Learning & Development",
  podcast_ep1_desc: "Real-world experiences and practices from the professional field, on building talent, performance and culture.",
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
  book_step_3_t: "No obligation to purchase",
  book_step_3_d: "A free session with no obligation to purchase a service.",

  // current courses
  current_eyebrow: "Open now",
  current_title: "Available Courses",
  current_desc:
    "Review course content, delivery format, and dates, then submit an enrollment request.",
  current_btn: "Browse & enroll",
  current_meta: "Course content · Dates · Delivery format",
  current_modal_title: "Choose your course",
  current_modal_desc: "Select the program that fits you best and submit your application.",

  // library
  library_eyebrow: "Resources",
  library_title: "Resource Library",
  library_desc:
    "E-books, templates, and practical frameworks for learning, talent management, and performance.",
  library_btn: "Browse resources",
  library_meta: "E-books · Templates · Frameworks",
  library_modal_title: "Resource Library",
  library_modal_desc: "Browse and download the latest resources.",
  library_open_drive: "Open in Google Drive",
  nav_courses: "Courses",
  nav_library: "Resources",
  nav_success_cases: "Success Cases",
  nav_trainings: "Trainings",

  nav_empowerment: "New Grad?",

  // empowerment tools
  emp_eyebrow: "New graduates",
  emp_title: "Empowerment Tools",
  emp_tagline: "Practical Training in Workplace Tools",
  emp_desc:
    "A hands-on program that prepares fresh graduates to master the everyday tools of modern work: practical AI use, professional Outlook workflows, design with Canva, project tracking with Trello, and data work with Google Sheets & Forms.",
  emp_btn: "Enroll now",
  emp_meta: "Tools · Tasks · Practical Application",
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
  contact_title: "Discuss Your Training Needs",
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
  nav_ask_selmi: "اسأل سلمي",
  nav_book: "احجز",
  nav_book_consult: "احجز استشارة مجانية",
  nav_manage_booking: "إدارة حجزك",
  nav_contact: "تواصل",
  book_cta: "احجز جلسة مجانية",
  manage_booking_cta: "إدارة حجزك",
  listen_podcast: "استمع · البودكاست",
  demo_title: "نسخة تجريبية",
  demo_desc: "هذا الموقع نسخة تجريبية حية. قد يتغير المحتوى والروابط.",

  hero_hello: "مرحبًا،",
  hero_meet: "تعرّف إلى",
  hero_intro:
    "رئيس إدارة التعلم والتطوير، بخبرة تتجاوز ٩ سنوات في إدارة المواهب والأداء والتدريب المؤسسي.",
  hero_btn_book: "احجز جلسة فردية مجانية",
  hero_btn_programs: "استكشف البرامج",
  stat_trainees: "متدرب",
  stat_countries: "دولة",
  stat_programs: "برنامج",
  status_current: "حاليًا",
  status_role: "رئيس التعلم والتطوير · السعودية",

  about_eyebrow: "من أنا",
  about_title: "تعرّف إلى إسلام",
  about_hook:
    "أربط خطط التعلم وتطوير الكفاءات بأهداف الأعمال ومؤشرات الأداء.",
  about_intro:
    "أعمل مع المؤسسات على تحليل الاحتياجات التدريبية، وإعداد خطط التعلم، وتطوير القيادات، وبناء أنظمة إدارة الأداء.\n\nبخبرة تتجاوز ٩ سنوات، أصمّم البرامج وفق متطلبات الوظائف وأهداف الأعمال ومؤشرات الأداء، مع إدراج العائد على الاستثمار التدريبي ضمن التقييم.",
  about_credentials: "المؤهلات والشهادات",
  about_role: "رئيس قسم التعلم والتطوير",
  about_location: "الرياض، السعودية",
  about_kpi_years: "سنوات خبرة",
  about_kpi_countries: "دولة",
  about_kpi_leaders: "متدرب",
  about_kpi_programs: "برنامج تم تنفيذه",
  about_pillar_philosophy: "فلسفتي المهنية",
  about_pillar_philosophy_d:
    "أحدّد أهداف التدريب، وأربطها بمؤشرات أداء الأعمال، وأدرج العائد على الاستثمار التدريبي ضمن تقييم البرامج.",
  about_pillar_journey: "رحلتي المهنية",
  about_pillar_journey_d:
    "خبرة تتجاوز ٩ سنوات في إدارة التعلم والمواهب بقطاعات التجزئة والسلع الاستهلاكية واللوجستيات والتعليم.",
  about_pillar_digital: "التمكين الرقمي",
  about_pillar_digital_d:
    "استخدام أدوات إدارة المشاريع والذكاء الاصطناعي لأتمتة إجراءات التعلم وإدارة الأداء على منصات LMS وPMS.",
  about_cta_book: "احجز جلسة فردية معي",
  about_cta_programs: "استكشف البرامج",

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
  journey_title: "الخبرة المهنية في التعلم والتطوير",

  services_eyebrow: "الخدمات",
  services_title: "الاستشارات والتدريب المؤسسي",
  services_subtitle: "اضغط على أي خدمة لطلبها مباشرة عبر واتساب.",
  svc_request_btn: "اطلب هذه الخدمة",
  calendly_title: "احجز جلستك المجانية",
  calendly_desc: "اختر الموعد الذي يناسبك.",

  programs_eyebrow: "البرامج",
  programs_title: "برامج التدريب والتطوير",
  programs_track: "المسار",

  clients_eyebrow: "الانتشار",
  clients_title: "متدربون من 12 دولة",
  clients_sub: "كل التدريب أُقيم عن بُعد — مباشر ومسجل.",

  brands_eyebrow: "موثوق من",
  brands_title: "الشركات وشركاء التدريب",
  brands_desc: "لمحة عن الشركات والشركاء الذين صمّمت وقدت معهم برامج التعلم والتطوير عبر المنطقة.",
  brands_meta: "علامة وشريك",

  snapshots_eyebrow: "لقطات",
  snapshots_title: "لقطات من التدريب والعمل",

  podcast_eyebrow: "بودكاست التعلم والتطوير",
  podcast_title: "حوارات في التعلم والنمو.",
  podcast_now_playing: "يُعرض الآن",
  podcast_episodes: "الحلقات",
  podcast_play: "تشغيل الحلقة",
  podcast_more_soon: "حلقات جديدة قريبًا. تابعنا.",
  podcast_ep1_title: "الحلقة الأولى: داخل عالم التعلم والتطوير",
  podcast_ep1_desc: "تجارب وممارسات من الواقع المهني في بناء المواهب والأداء والثقافة.",
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
  book_step_3_t: "دون التزام بالشراء",
  book_step_3_d: "جلسة مجانية دون التزام بشراء خدمة.",

  current_eyebrow: "متاح الآن",
  current_title: "الكورسات المتاحة",
  current_desc:
    "راجع محتوى الكورس ونوعه ومواعيده، ثم أرسل طلب الاشتراك.",
  current_btn: "تصفّح وسجّل الآن",
  current_meta: "محتوى الكورس · المواعيد · نوع الدراسة",
  current_modal_title: "اختر دورتك",
  current_modal_desc: "حدّد البرنامج الأنسب لك وأرسل طلب الاشتراك.",

  library_eyebrow: "مصادر",
  library_title: "المصادر",
  library_desc:
    "كتب إلكترونية وقوالب وأطر عملية للتعلم وإدارة المواهب والأداء.",
  library_btn: "ادخل المصادر",
  library_meta: "كتب إلكترونية · قوالب · أطر عملية",
  library_modal_title: "المصادر",
  library_modal_desc: "تصفّح وحمّل أحدث المصادر.",
  library_open_drive: "افتح في Google Drive",
  nav_courses: "الكورسات",
  nav_library: "المصادر",
  nav_success_cases: "حالات النجاح",
  nav_trainings: "التدريبات",

  nav_empowerment: "خريج جديد؟",

  emp_eyebrow: "للخريجين الجدد",
  emp_title: "أدوات التمكين",
  emp_tagline: "تدريب عملي على أدوات بيئة العمل",
  emp_desc:
    "برنامج عملي يؤهّل الخريجين الجدد لإتقان الأدوات الأساسية في بيئة العمل الحديثة: توظيف الذكاء الاصطناعي بفاعلية، إتقان Outlook، التصميم باستخدام Canva، إدارة المهام عبر Trello، والعمل مع Google Sheets و Google Forms.",
  emp_btn: "سجّل الآن",
  emp_meta: "أدوات · مهام · تطبيق عملي",
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
  contact_title: "ناقش احتياجاتك التدريبية",
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
  // Match the server's first render; restore the preference after hydration
  // rather than forcing React to discard and rebuild the whole English page.
  const [lang, setLangState] = useState<Lang>("ar");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("lang");
    const htmlLang = document.documentElement.getAttribute("lang");
    setLangState(saved === "ar" || saved === "en" ? saved : htmlLang === "en" ? "en" : "ar");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang, hydrated]);

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
