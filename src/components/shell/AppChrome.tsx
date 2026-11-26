import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  LogOut, Home, ShieldCheck, Languages, KeyRound, Sun, Moon,
  UserCog, Bell, ChevronDown,
} from "lucide-react";
import { ForcePasswordResetGate } from "@/components/ForcePasswordResetGate";
import { useAuth, signOut } from "@/lib/portal-auth";
import { NotificationsBell } from "@/lib/notifications";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSiteProfile } from "@/lib/site-profile";
import { ChangePasswordModal } from "./ChangePasswordModal";

type Props = {
  role: "admin" | "trainee" | null;
  userId?: string;
  userLabel?: string | null;
  avatarSrc?: string | null;
  sidebar?: React.ReactNode;
  mobileBar?: React.ReactNode;
  onAccountSettings?: () => void;
  demo?: boolean; // preview harness: no auth side effects, static bell
  children: React.ReactNode;
};

export function AppChrome({ role, userId, userLabel, avatarSrc, sidebar, mobileBar, onAccountSettings, demo, children }: Props) {
  const { profile } = useSiteProfile();
  const nav = useNavigate();
  const { lang, setLang, dir } = useI18n();
  const { theme, toggle } = useTheme();
  const isAr = lang === "ar";
  const { forcePasswordReset } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  // Anti-piracy client hooks (unchanged from the legacy shell)
  useEffect(() => {
    const handleContextMenu = (e: Event) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && (e.key === "u" || e.key === "s"))) e.preventDefault();
      if (e.key === "F12") e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    (window as any).MediaRecorder = undefined;
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const L = {
    panelAdmin: isAr ? "لوحة الإدارة" : "Admin Panel",
    panelTrainee: isAr ? "بوابة المتدرب" : "Trainee Portal",
    site: isAr ? "الموقع" : "Website",
    admin: isAr ? "الإدارة" : "Admin",
    logout: isAr ? "تسجيل الخروج" : "Sign out",
    switchLang: isAr ? "English" : "العربية",
    account: isAr ? "إعدادات الحساب" : "Account settings",
    password: isAr ? "تغيير كلمة المرور" : "Change password",
  };

  const initials = (userLabel || "?").trim().charAt(0).toUpperCase();

  return (
    <div dir={dir} className={`nx nx-bg relative min-h-screen text-white ${role === "admin" ? "nx-is-admin admin-shell" : ""}`}>
      <div className="absolute inset-0 nx-grid-overlay pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[oklch(0.13_0.035_258/0.78)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--nx-teal)]/35 to-transparent" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" reloadDocument aria-label={isAr ? "العودة إلى الموقع" : "Back to website"} className="flex items-center gap-3 group shrink-0">
              <img
                src={profile.logoDark}
                alt="Eslam Selmi"
                className="h-9 w-9 rounded-xl object-contain bg-white/10 p-1 border border-white/15 group-hover:border-[var(--nx-teal)]/60 transition"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.onerror = null;
                  el.style.display = "none";
                  const sib = el.nextElementSibling as HTMLElement | null;
                  if (sib) sib.style.display = "flex";
                }}
              />
              <span style={{ display: "none" }} className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--nx-teal)]/30 to-[var(--nx-gold)]/20 border border-white/15 items-center justify-center text-[13px] font-bold text-white">ES</span>
              <div className="hidden sm:block leading-tight">
                <p className="text-[9px] text-white/40 font-bold" style={{ letterSpacing: dir === "ltr" ? "0.2em" : 0 }}>ESLAM SELMI</p>
                <p className="text-[12.5px] font-bold text-[var(--nx-teal)]">
                  {role === "admin" ? L.panelAdmin : L.panelTrainee}
                </p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1 ms-2 ps-3 border-s border-white/10">
              <Link to="/" reloadDocument className="flex items-center gap-1.5 text-xs text-white/65 hover:text-white px-3 h-9 rounded-lg hover:bg-white/5 transition">
                <Home className="w-3.5 h-3.5" /> {L.site}
              </Link>
              {role === "admin" ? (
                <Link to="/admin" className="flex items-center gap-1.5 text-xs text-white/65 hover:text-white px-3 h-9 rounded-lg hover:bg-white/5 transition">
                  <ShieldCheck className="w-3.5 h-3.5" /> {L.admin}
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggle} title={theme === "dark" ? (isAr ? "الوضع الفاتح" : "Light mode") : (isAr ? "الوضع الداكن" : "Dark mode")} aria-label="toggle theme" className="nx-icon-btn">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setLang(isAr ? "en" : "ar")} title={L.switchLang} className="nx-icon-btn !w-auto px-3 gap-1.5 text-xs font-bold">
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{L.switchLang}</span>
            </button>
            {demo ? (
              <button className="nx-icon-btn relative" aria-label="notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 end-2 nx-live-dot" />
              </button>
            ) : (
              <NotificationsBell userId={userId} />
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 h-10 ps-1.5 pe-2.5 rounded-[13px] border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[var(--nx-teal)]/40 transition"
              >
                <span className="w-7 h-7 rounded-[9px] overflow-hidden bg-gradient-to-br from-[var(--nx-teal)]/30 to-[var(--nx-gold)]/20 border border-white/15 flex items-center justify-center text-[13px] font-bold text-white">
                  {avatarSrc ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" /> : initials}
                </span>
                <span className="hidden lg:block text-xs font-semibold text-white/80 max-w-[130px] truncate">{userLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>
              {menuOpen && (
                <div className="nx-menu absolute end-0 top-12 w-56 p-1.5 z-50 nx-rise">
                  {onAccountSettings && (
                    <button className="nx-menu-item" onClick={() => { setMenuOpen(false); onAccountSettings(); }}>
                      <UserCog className="w-4 h-4 text-[var(--nx-teal)]" /> {L.account}
                    </button>
                  )}
                  <button className="nx-menu-item" onClick={() => { setMenuOpen(false); setShowChangePassword(true); }}>
                    <KeyRound className="w-4 h-4 text-[var(--nx-teal)]" /> {L.password}
                  </button>
                  <hr className="nx-divider my-1.5" />
                  <button className="nx-menu-item" data-danger onClick={() => { if (!demo) { signOut(); nav({ to: "/auth" }); } setMenuOpen(false); }}>
                    <LogOut className="w-4 h-4" /> {L.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {!demo && forcePasswordReset && <ForcePasswordResetGate onDone={() => {}} />}
      {!demo && <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />}
      {demo && showChangePassword ? null : null}

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {sidebar && (
            <aside className="hidden lg:block w-[270px] shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto nx-scroll pe-1">{sidebar}</div>
            </aside>
          )}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>

      {mobileBar && <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 nx-tabbar">{mobileBar}</div>}
    </div>
  );
}
