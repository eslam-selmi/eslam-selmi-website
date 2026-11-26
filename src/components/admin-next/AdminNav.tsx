import { useState } from "react";
import {
  Users, BookOpen, Award, FileText, X, ToggleRight, Calendar, Layers, StickyNote,
  Pencil, Clock, Settings2, Sparkles, Ticket, Percent, Archive, Camera, LifeBuoy, Link2,
  Star, CreditCard, Trophy, Video, ShieldCheck, LayoutDashboard, ChevronDown, Menu,
} from "lucide-react";

export type AdminTabId =
  | "overview" | "enrollments" | "courses" | "coupons" | "banned" | "additions"
  | "activations" | "finance" | "methods" | "feedback" | "tickets" | "site" | "leads"
  | "testimonials" | "success_cases" | "bookings" | "packages" | "interviews"
  | "snapshots" | "trainings" | "partners" | "contracts" | "programs" | "services"
  | "pillars" | "videos" | "graduate_tools" | "media" | "effects" | "visibility"
  | "popups" | "maintenance" | "tools" | "pages" | "subscribers";

export type AdminNavItem = { id: AdminTabId; label: string; icon: any; badge?: number | string };
export type AdminNavGroup = { id: string; label: string; items: AdminNavItem[] };

export function buildAdminNav(
  lang: string,
  badges: { pendingActivations?: number; pendingEnrollments?: number; blockedCount?: number },
): AdminNavGroup[] {
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  return [
    {
      id: "students",
      label: t("العمليات التعليمية والطلاب", "Learning & Students"),
      items: [
        { id: "overview", label: t("نظرة عامة", "Overview"), icon: LayoutDashboard },
        { id: "activations", label: t("تفعيل الحسابات", "Activations"), icon: ShieldCheck, badge: badges.pendingActivations || undefined },
        { id: "subscribers", label: t("المشتركون", "Subscribers"), icon: Users },
        { id: "enrollments", label: t("طلبات وانضمامات", "Enrollments"), icon: Users, badge: badges.pendingEnrollments || undefined },
        { id: "courses", label: t("الكورسات", "Courses"), icon: BookOpen },
        { id: "leads", label: t("اهتمامات الكورسات", "Course leads"), icon: StickyNote },
        { id: "feedback", label: t("تقييمات الكورسات", "Course feedback"), icon: Star },
        { id: "banned", label: t("الموقوفون", "Banned"), icon: Archive, badge: badges.blockedCount || undefined },
      ],
    },
    {
      id: "finance",
      label: t("الحجوزات والمالية", "Bookings & Finance"),
      items: [
        { id: "bookings", label: t("حجوزات الاستشارات", "Bookings"), icon: Calendar },
        { id: "finance", label: t("المعاملات المالية", "Transactions"), icon: CreditCard },
        { id: "methods", label: t("طرق الدفع", "Payment methods"), icon: CreditCard },
        { id: "coupons", label: t("كوبونات الخصم", "Coupons"), icon: Ticket },
        { id: "packages", label: t("باقات الاستشارات", "Packages"), icon: Layers },
      ],
    },
    {
      id: "site",
      label: t("إدارة محتوى الموقع", "Site Content · CMS"),
      items: [
        { id: "services", label: t("الخدمات", "Services"), icon: Layers },
        { id: "pillars", label: t("ثلاث ركائز", "Three pillars"), icon: Layers },
        { id: "videos", label: t("قسم الفيديوهات", "Videos section"), icon: Video },
        { id: "programs", label: t("البرامج والمسارات", "Programs & tracks"), icon: BookOpen },
        { id: "graduate_tools", label: t("أدوات الخريجين", "Graduate tools"), icon: Award },
        { id: "trainings", label: t("التدريبات", "Trainings"), icon: Layers },
        { id: "media", label: t("صور البرامج والكورسات", "Program & course images"), icon: Camera },
        { id: "additions", label: t("أحدث الإضافات", "Latest additions"), icon: Sparkles },
        { id: "snapshots", label: t("لحظات المسيرة", "Career moments"), icon: Camera },
        { id: "testimonials", label: t("شهادات العملاء", "Testimonials"), icon: Star },
        { id: "success_cases", label: t("حالات النجاح", "Success cases"), icon: Trophy },
        { id: "partners", label: t("الشركاء", "Partners"), icon: Star },
        { id: "contracts", label: t("عقود التميز", "Contracts"), icon: Trophy },
        { id: "interviews", label: t("المقابلات", "Interviews"), icon: Video },
      ],
    },
    {
      id: "settings",
      label: t("الإعدادات والدعم", "Settings & Support"),
      items: [
        { id: "site", label: t("هوية الموقع والتواصل", "Site identity & contact"), icon: Settings2 },
        { id: "visibility", label: t("ظهور الأقسام ومحتوى الموقع", "Section visibility & content"), icon: ToggleRight },
        { id: "tools", label: t("الأدوات: الظهور والصلاحيات", "Tools: visibility & access"), icon: ToggleRight },
        { id: "pages", label: t("التابات: الظهور والقفل", "Tabs: visibility & lock"), icon: ToggleRight },
        { id: "popups", label: t("الإعلانات المنبثقة", "Popup announcements"), icon: Sparkles },
        { id: "effects", label: t("مؤثرات الزوار", "Visitor effects"), icon: Sparkles },
        { id: "maintenance", label: t("وضع الصيانة", "Maintenance"), icon: Settings2 },
        { id: "tickets", label: t("تذاكر الدعم", "Support tickets"), icon: LifeBuoy },
      ],
    },
  ];
}

function NavItemButton({ item, active, onSelect }: { item: AdminNavItem; active: boolean; onSelect: (id: AdminTabId) => void }) {
  const Icon = item.icon;
  return (
    <button className="nx-nav-item" data-active={active} aria-current={active ? "page" : undefined} onClick={() => onSelect(item.id)}>
      <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-[var(--nx-teal)]" : "text-white/45"}`} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? <span className="nx-nav-badge" data-tone="alert">{item.badge}</span> : null}
    </button>
  );
}

export function AdminSidebar({ groups, tab, onSelect, attention, lang }: {
  groups: AdminNavGroup[];
  tab: AdminTabId;
  onSelect: (id: AdminTabId) => void;
  attention: { label: string; value: number; tone: "gold" | "teal" }[];
  lang: string;
}) {
  const isAr = lang === "ar";
  // Open the group holding the active tab (plus the first group on load); the rest stay collapsed to keep the nav short.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = { [groups[0]?.id ?? "students"]: true };
    const g = groups.find((gr) => gr.items.some((i) => i.id === tab));
    if (g) init[g.id] = true;
    return init;
  });
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Attention summary: pinned, only the section list below scrolls */}
      <div className="nx-card p-4 nx-rise shrink-0">
        <span className="nx-hero-line" />
        <p className="text-[11px] font-bold text-white/50 mb-3 flex items-center gap-2">
          <span className="nx-live-dot" /> {isAr ? "يحتاج انتباهك الآن" : "Needs attention now"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {attention.map((a) => (
            <div key={a.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2.5 text-center">
              <p className="text-lg font-bold nx-display" style={{ color: a.tone === "gold" ? "var(--nx-gold)" : "var(--nx-teal)" }}>{a.value}</p>
              <p className="text-[9.5px] text-white/50 font-semibold leading-tight mt-0.5">{a.label}</p>
            </div>
          ))}
        </div>
      </div>

      <nav className="nx-card p-2.5 nx-rise nx-rise-1 flex-1 min-h-0 overflow-y-auto nx-scroll" aria-label={isAr ? "أقسام الإدارة" : "Administration sections"}>
        {groups.map((g, gi) => {
          const isOpen = open[g.id] !== false;
          const hasActive = g.items.some((i) => i.id === tab);
          return (
            <div key={g.id} className={gi > 0 ? "mt-2" : ""}>
              <button
                className="nx-group-label w-full hover:text-white/70 transition"
                onClick={() => setOpen((o) => ({ ...o, [g.id]: !isOpen }))}
                aria-expanded={isOpen}
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "" : "-rotate-90 rtl:rotate-90"}`} />
                <span className={hasActive ? "text-[var(--nx-teal)]" : ""}>{g.label}</span>
              </button>
              {isOpen && (
                <ul className="space-y-0.5">
                  {g.items.map((it) => (
                    <li key={it.id}><NavItemButton item={it} active={tab === it.id} onSelect={onSelect} /></li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminMobileNav({ groups, tab, onSelect, lang }: {
  groups: AdminNavGroup[];
  tab: AdminTabId;
  onSelect: (id: AdminTabId) => void;
  lang: string;
}) {
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  const current = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))).find((i) => i.id === tab);
  const CurrentIcon = current?.icon ?? Menu;
  return (
    <>
      <button onClick={() => setOpen(true)} className="nx-card w-full flex items-center gap-3 px-4 h-12 mb-5">
        <span className="w-8 h-8 rounded-lg bg-[var(--nx-teal)]/12 border border-[var(--nx-teal)]/30 flex items-center justify-center shrink-0">
          <CurrentIcon className="w-4 h-4 text-[var(--nx-teal)]" />
        </span>
        <span className="flex-1 min-w-0 text-start">
          <span className="block text-[10px] text-white/45 font-bold">{current?.group}</span>
          <span className="block text-[13.5px] font-bold truncate">{current?.label}</span>
        </span>
        <Menu className="w-4 h-4 text-white/50 shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="nx absolute inset-x-0 bottom-0 top-14 nx-bg rounded-t-3xl border-t border-white/10 flex flex-col animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <p className="font-bold">{isAr ? "أقسام الإدارة" : "Administration"}</p>
              <button className="nx-icon-btn !w-9 !h-9" onClick={() => setOpen(false)} aria-label={isAr ? "إغلاق" : "Close"}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto nx-scroll p-4 space-y-4 pb-10">
              {groups.map((g) => (
                <div key={g.id}>
                  <p className="nx-group-label">{g.label}</p>
                  <ul className="space-y-0.5">
                    {g.items.map((it) => (
                      <li key={it.id}>
                        <NavItemButton item={it} active={tab === it.id} onSelect={(id) => { onSelect(id); setOpen(false); }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
