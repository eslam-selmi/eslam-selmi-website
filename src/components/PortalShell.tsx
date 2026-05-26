import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Home, ShieldCheck, GraduationCap, Languages, Sparkles } from "lucide-react";
import { signOut } from "@/lib/portal-auth";
import { NotificationsBell } from "@/lib/notifications";
import { useI18n } from "@/lib/i18n";
import { useLatestAdditionsBadge } from "@/components/LatestAdditions";
import brandLogo from "@/assets/brand-logo.png";


type Props = {
  userId: string | undefined;
  role: "admin" | "trainee" | "trainer" | null;
  userLabel?: string | null;
  children: React.ReactNode;
};

export function PortalShell({ userId, role, userLabel, children }: Props) {
  const nav = useNavigate();
  const { lang, setLang, dir } = useI18n();
  const isAr = lang === "ar";

  const L = {
    panelAdmin: isAr ? "لوحة الإدارة" : "Admin Panel",
    panelTrainer: isAr ? "لوحة المدرّب" : "Trainer Panel",
    panelTrainee: isAr ? "بوابة المتدرب" : "Trainee Portal",
    site: isAr ? "الموقع" : "Website",
    admin: isAr ? "الإدارة" : "Admin",
    trainer: isAr ? "كورساتي" : "My Courses",
    courses: isAr ? "كورساتي" : "My Courses",
    logout: isAr ? "خروج" : "Logout",
    switchLang: isAr ? "English" : "العربية",
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#0b1736] text-white">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-aurora opacity-50 pointer-events-none" />

      <header className="relative border-b border-white/10 backdrop-blur-xl bg-[rgba(11,23,54,0.7)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src={brandLogo} alt="Eslam Selmi" className="h-9 w-9 rounded-lg object-contain bg-white/10 p-1 border border-white/10 group-hover:border-[var(--gold)]/50 transition" />
              <div className="hidden sm:block leading-tight">
                <p className="text-[11px] text-white/50 tracking-wider">ESLAM SELMI</p>
                <p className="text-xs font-bold text-[var(--gold)]">
                  {role === "admin" ? L.panelAdmin : role === "trainer" ? L.panelTrainer : L.panelTrainee}
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 mx-3 ps-3 border-s border-white/10">
              <Link to="/" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 h-9 rounded-lg hover:bg-white/5 transition">
                <Home className="w-3.5 h-3.5" /> {L.site}
              </Link>
              {role === "admin" ? (
                <Link to="/admin" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 h-9 rounded-lg hover:bg-white/5 transition">
                  <ShieldCheck className="w-3.5 h-3.5" /> {L.admin}
                </Link>
              ) : role === "trainer" ? (
                <Link to="/trainer" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 h-9 rounded-lg hover:bg-white/5 transition">
                  <GraduationCap className="w-3.5 h-3.5" /> {L.trainer}
                </Link>
              ) : (
                <Link to="/portal" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 h-9 rounded-lg hover:bg-white/5 transition">
                  <GraduationCap className="w-3.5 h-3.5" /> {L.courses}
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(isAr ? "en" : "ar")}
              title={L.switchLang}
              className="flex items-center gap-1.5 text-xs px-3 h-10 rounded-xl border border-white/15 hover:bg-white/5 transition"
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold tracking-wide">{L.switchLang}</span>
            </button>
            <NotificationsBell userId={userId} />
            {userLabel && <span className="hidden lg:inline text-xs text-white/60 max-w-[160px] truncate">{userLabel}</span>}
            <button onClick={() => { signOut(); nav({ to: "/auth" }); }} className="flex items-center gap-1.5 text-xs px-3 h-10 rounded-xl border border-white/15 hover:bg-white/5 transition">
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{L.logout}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8">{children}</div>
    </div>
  );
}
