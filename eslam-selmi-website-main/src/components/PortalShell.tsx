import { Link, useNavigate } from "@tanstack/react-router";
import { ForcePasswordResetGate } from "@/components/ForcePasswordResetGate";
import { useAuth, signOut } from "@/lib/portal-auth";
import { LogOut, Home, ShieldCheck, GraduationCap, Languages, Sparkles, KeyRound } from "lucide-react";
import { NotificationsBell } from "@/lib/notifications";
import { useI18n } from "@/lib/i18n";
import { useLatestAdditionsBadge } from "@/components/LatestAdditions";
import brandLogo from "@/assets/brand-logo.webp";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  userId: string | undefined;
  role: "admin" | "trainee" | "trainer" | null;
  userLabel?: string | null;
  children: React.ReactNode;
};

export function PortalShell({ userId, role, userLabel, children }: Props) {
  const nav = useNavigate();
  const { lang, setLang, dir } = useI18n();
  const { hasNew, markSeen } = useLatestAdditionsBadge();
  const isAr = lang === "ar";
  const { forcePasswordReset, session } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      toast.error(isAr ? "الرجاء إدخال كلمة المرور الحالية" : "Please enter current password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error(isAr ? "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" : "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(isAr ? "كلمتا المرور الجديدتان غير متطابقتين" : "New passwords do not match");
      return;
    }
    
    setChangingPassword(true);
    try {
      const email = session?.user?.email;
      if (!email) {
        toast.error(isAr ? "لم يتم العثور على البريد الإلكتروني للمستخدم" : "User email not found");
        return;
      }
      
      // 1. Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      
      if (signInError) {
        toast.error(isAr ? "كلمة المرور الحالية غير صحيحة" : "Current password is incorrect");
        return;
      }
      
      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        toast.error(updateError.message);
        return;
      }
      
      toast.success(isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast.error(err?.message || "An error occurred");
    } finally {
      setChangingPassword(false);
    }
  }

  // Anti-piracy client hooks
  useEffect(() => {
    const handleContextMenu = (e: Event) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && (e.key === "u" || e.key === "s"))) {
        e.preventDefault();
      }
      if (e.key === "F12") {
        e.preventDefault();
      }
    };
    const handleBlur = () => console.log("Window lost focus - potential screen capture");
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    (window as any).MediaRecorder = undefined;
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const L = {
    panelAdmin: isAr ? "لوحة الإدارة" : "Admin Panel",
    panelTrainer: isAr ? "لوحة المدرب" : "Trainer Panel",
    panelTrainee: isAr ? "بوابة المتدرب" : "Trainee Portal",
    site: isAr ? "الموقع" : "Website",
    admin: isAr ? "الإدارة" : "Admin",
    trainer: isAr ? "كورساتي" : "My Courses",
    courses: isAr ? "كورساتي" : "My Courses",
    logout: isAr ? "خروج" : "Logout",
    switchLang: isAr ? "English" : "العربية",
  };

  return (
    <div dir={dir} className="relative min-h-screen dash-bg text-white">
      <div className="absolute inset-0 dash-grid pointer-events-none opacity-70" />
      <div className="absolute inset-x-0 top-0 h-[520px] bg-aurora opacity-40 pointer-events-none" />
      <header className="relative border-b border-white/10 backdrop-blur-xl bg-[rgba(8,16,40,0.72)] sticky top-0 z-40">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--gold)]/30 to-transparent blur-md opacity-0 group-hover:opacity-100 transition" />
                <img src={brandLogo} alt="Eslam Selmi" className="relative h-9 w-9 rounded-xl object-contain bg-white/10 p-1 border border-white/15 group-hover:border-[var(--gold)]/60 transition" />
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-[10px] text-white/45 tracking-[0.18em] font-semibold">ESLAM SELMI</p>
                <p className="text-xs font-bold text-[var(--gold)] tracking-wide">
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
                <>
                  <Link to="/portal" className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 h-9 rounded-lg hover:bg-white/5 transition">
                    <GraduationCap className="w-3.5 h-3.5" /> {L.courses}
                  </Link>
                  <a href="/portal#latest-additions" onClick={() => markSeen()} className="relative flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 h-9 rounded-lg hover:bg-white/5 transition">
                    <Sparkles className="w-3.5 h-3.5" /> {isAr ? "أحدث الإضافات" : "Latest"}
                    {hasNew && (
                      <span className="absolute -top-0.5 -end-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                      </span>
                    )}
                  </a>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(isAr ? "en" : "ar")} title={L.switchLang} className="flex items-center gap-1.5 text-xs px-3 h-10 rounded-xl border border-white/15 bg-white/[0.03] hover:bg-white/10 hover:border-[var(--gold)]/40 transition">
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold tracking-wide">{L.switchLang}</span>
            </button>
            <button onClick={() => setShowChangePassword(true)} title={isAr ? "تغيير كلمة المرور" : "Change Password"} className="flex items-center gap-1.5 text-xs px-3 h-10 rounded-xl border border-white/15 bg-white/[0.03] hover:bg-white/10 hover:border-[var(--gold)]/40 transition">
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isAr ? "كلمة المرور" : "Password"}</span>
            </button>
            <NotificationsBell userId={userId} />
            {userLabel && (
              <span className="hidden lg:inline text-xs text-white/60 max-w-[160px] truncate px-2">{userLabel}</span>
            )}
            <button onClick={() => { signOut(); nav({ to: "/auth" }); }} className="flex items-center gap-1.5 text-xs px-3 h-10 rounded-xl border border-white/15 bg-white/[0.03] hover:bg-rose-500/15 hover:border-rose-400/40 hover:text-rose-200 transition">
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{L.logout}</span>
            </button>
          </div>
        </div>
      </header>
      {forcePasswordReset && <ForcePasswordResetGate onDone={() => {}} />}
      {showChangePassword && (
        <div className="fixed inset-0 z-[80] bg-[#040818]/85 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setShowChangePassword(false)} />
          <form
            onSubmit={handleChangePassword}
            className="premium-dialog relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/60 to-transparent" />
            <button
              type="button"
              onClick={() => setShowChangePassword(false)}
              aria-label="Close"
              className="absolute end-4 top-4 w-9 h-9 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-[var(--gold)]/40 flex items-center justify-center transition text-white/80"
            >
              ✕
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.25)]">
                <KeyRound className="w-5 h-5 text-[var(--gold)]" />
              </div>
              <div>
                <h2 className="font-bold text-base">{isAr ? "تغيير كلمة المرور" : "Change Password"}</h2>
                <p className="text-xs text-white/55">{isAr ? "أدخل كلمة المرور الحالية والجديدة." : "Enter current and new passwords."}</p>
              </div>
            </div>

            <div className="gold-divider" />

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/55 mb-1.5 font-semibold">{isAr ? "كلمة المرور الحالية" : "Current Password"}</label>
                <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="premium-input" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/55 mb-1.5 font-semibold">{isAr ? "كلمة المرور الجديدة" : "New Password"}</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="premium-input" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/55 mb-1.5 font-semibold">{isAr ? "تأكيد كلمة المرور" : "Confirm New Password"}</label>
                <input type="password" required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="••••••••" className="premium-input" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowChangePassword(false)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm h-11 rounded-xl transition">
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" disabled={changingPassword} className="flex-1 bg-gradient-to-r from-[var(--gold)] to-[#e8c870] text-[#0b1736] font-bold text-sm h-11 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_8px_24px_-8px_rgba(212,175,55,0.6)] transition">
                {changingPassword && <span className="animate-spin border-2 border-[#0b1736] border-t-transparent rounded-full w-4 h-4" />}
                {isAr ? "تحديث" : "Update"}
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8">{children}</div>
    </div>
  );
}
