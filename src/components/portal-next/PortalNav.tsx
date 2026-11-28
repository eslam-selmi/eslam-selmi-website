import { Sparkles, BookOpen, Award, PhoneOutgoing, GraduationCap, UserCog, FolderKanban } from "lucide-react";

export type PortalTabId = "overview" | "my-courses" | "certificates" | "packages" | "available" | "my-access";

export type PortalNavItem = {
  id: PortalTabId | "account";
  label: string;
  icon: any;
  badge?: number;
  alert?: boolean;
};

export function buildPortalNav(lang: string, badges: { paymentCount?: number; certCount?: number; availableCount?: number }): PortalNavItem[] {
  const isAr = lang === "ar";
  return [
    { id: "overview", label: isAr ? "نظرة عامة" : "Overview", icon: Sparkles },
    { id: "my-access", label: isAr ? "أدواتي" : "My tools", icon: FolderKanban },
    { id: "my-courses", label: isAr ? "كورساتي" : "My courses", icon: BookOpen, badge: badges.paymentCount || undefined, alert: true },
    { id: "certificates", label: isAr ? "شهاداتي" : "My certificates", icon: Award, badge: badges.certCount || undefined, alert: true },
    { id: "packages", label: isAr ? "باقات الاستشارات" : "Consulting packages", icon: PhoneOutgoing },
    { id: "available", label: isAr ? "كورسات متاحة" : "Available courses", icon: GraduationCap, badge: badges.availableCount || undefined },
    { id: "account", label: isAr ? "إعدادات الحساب" : "Account settings", icon: UserCog },
  ];
}

// Progress ring lives in the overview hero only — the sidebar carries compact stats.
export function PortalSidebar({
  items, tab, onSelect, onAccount,
  summary, profile, supportNode, lang,
}: {
  items: PortalNavItem[];
  tab: string;
  onSelect: (id: PortalTabId) => void;
  onAccount: () => void;
  summary: { active: number; hoursEarned: number; hoursTotal: number; certs: number };
  profile: { name: string; avatarSrc?: string | null; countryFlag?: string | null; countryName?: string | null };
  supportNode?: React.ReactNode;
  lang: string;
}) {
  const isAr = lang === "ar";
  return (
    <div className="space-y-4">
      {/* Learner identity + quick stats */}
      <div className="nx-card p-5 nx-rise">
        <span className="nx-hero-line" />
        <div className="flex items-center gap-3.5">
          <div className="nx-avatar-ring shrink-0">
            <div className="w-14 h-14 flex items-center justify-center text-xl font-bold text-[var(--nx-teal)]">
              {profile.avatarSrc
                ? <img src={profile.avatarSrc} alt={profile.name} className="w-full h-full object-cover" />
                : (profile.name || "?").trim().charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[15px] truncate">{profile.name}</p>
            {profile.countryName && (
              <span className="nx-chip mt-1.5">{profile.countryFlag} {profile.countryName}</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nx-card p-2.5 nx-rise nx-rise-1" aria-label={isAr ? "أقسام البوابة" : "Portal sections"}>
        <ul className="space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = tab === it.id;
            return (
              <li key={it.id}>
                <button
                  className="nx-nav-item"
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  onClick={() => { if (it.id === "account") { onAccount(); return; } onSelect(it.id as PortalTabId); }}
                >
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-[var(--nx-teal)]" : "text-white/45"} ${it.id === "certificates" && it.alert && it.badge ? "cert-glow" : ""}`} />
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.badge ? <span className="nx-nav-badge" data-tone={it.alert ? "alert" : undefined}>{it.badge}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
        {supportNode && (
          <>
            <hr className="nx-divider my-2.5" />
            <div className="px-1 pb-1">{supportNode}</div>
          </>
        )}
      </nav>
    </div>
  );
}

export function PortalTabBar({ items, tab, onSelect, lang }: {
  items: PortalNavItem[];
  tab: string;
  onSelect: (id: PortalTabId) => void;
  lang: string;
}) {
  const barItems = items.filter((i) => i.id !== "account") as (PortalNavItem & { id: PortalTabId })[];
  return (
    <div className="flex items-stretch" role="tablist" aria-label={lang === "ar" ? "أقسام البوابة" : "Portal sections"}>
      {barItems.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button key={it.id} role="tab" aria-selected={active} data-active={active} className="nx-tabbar-item" onClick={() => onSelect(it.id)}>
            <span className="relative">
              <Icon className="w-5 h-5" />
              {it.badge ? (
                <span className={`absolute -top-1.5 -end-2.5 min-w-[16px] h-4 px-1 rounded-md text-[9px] font-extrabold flex items-center justify-center ${it.alert ? "bg-[var(--nx-gold)] text-black" : "bg-white/15 text-white"}`}>{it.badge}</span>
              ) : null}
            </span>
            <span className="truncate max-w-[64px] sm:max-w-[68px] sm:whitespace-normal sm:text-center sm:leading-[1.15] sm:line-clamp-2 sm:break-words">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Pill navigation for the trainee header. Account settings is not a tab; it stays reachable from the avatar menu and the page footer. */
export function PortalTopNav({ items, tab, onSelect, lang }: {
  items: PortalNavItem[];
  tab: string;
  onSelect: (id: PortalTabId) => void;
  lang: string;
}) {
  const tabs = items.filter((i) => i.id !== "account") as (PortalNavItem & { id: PortalTabId })[];
  return (
    <nav className="nx-pills" aria-label={lang === "ar" ? "أقسام البوابة" : "Portal sections"}>
      {tabs.map((it) => {
        const active = tab === it.id;
        return (
          <button key={it.id} className="nx-pill" data-active={active} aria-current={active ? "page" : undefined} onClick={() => onSelect(it.id)}>
            {it.label}
            {it.badge ? <span className="nx-pill-badge">{it.badge}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
