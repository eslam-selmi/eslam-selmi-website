import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { KeyRound, X, Loader2 } from "lucide-react";

// Same change-password flow as the legacy PortalShell modal, restyled for the new shell.
export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { session } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) return toast.error(isAr ? "الرجاء إدخال كلمة المرور الحالية" : "Please enter current password");
    if (newPassword.length < 8) return toast.error(isAr ? "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" : "New password must be at least 8 characters");
    if (newPassword !== confirmNewPassword) return toast.error(isAr ? "كلمتا المرور الجديدتان غير متطابقتين" : "New passwords do not match");
    setBusy(true);
    try {
      const email = session?.user?.email;
      if (!email) return toast.error(isAr ? "لم يتم العثور على البريد الإلكتروني للمستخدم" : "User email not found");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) return toast.error(isAr ? "كلمة المرور الحالية غير صحيحة" : "Current password is incorrect");
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return toast.error(updateError.message);
      toast.success(isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || (isAr ? "حدث خطأ" : "An error occurred"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />
      <form onSubmit={handleSubmit} className="nx nx-card relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto nx-scroll rounded-t-3xl sm:rounded-[20px] p-6 space-y-5 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <span className="nx-hero-line" />
        <button type="button" onClick={onClose} aria-label={isAr ? "إغلاق" : "Close"} className="nx-icon-btn absolute end-4 top-4 !w-9 !h-9">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="nx-stat-icon" style={{ ["--nx-stat-tone" as any]: "var(--nx-gold)" }}>
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="nx-display text-lg">{isAr ? "تغيير كلمة المرور" : "Change Password"}</h2>
            <p className="text-xs text-white/55 mt-0.5">{isAr ? "أدخل كلمة المرور الحالية ثم الجديدة." : "Enter your current and new passwords."}</p>
          </div>
        </div>
        <hr className="nx-divider" />
        <div className="space-y-3.5">
          <label className="block">
            <span className="block text-xs font-semibold text-white/60 mb-1.5">{isAr ? "كلمة المرور الحالية" : "Current password"}</span>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="nx-input" dir="ltr" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-white/60 mb-1.5">{isAr ? "كلمة المرور الجديدة" : "New password"}</span>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="nx-input" dir="ltr" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-white/60 mb-1.5">{isAr ? "تأكيد كلمة المرور" : "Confirm new password"}</span>
            <input type="password" required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="••••••••" className="nx-input" dir="ltr" />
          </label>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="nx-btn nx-btn-ghost flex-1">{isAr ? "إلغاء" : "Cancel"}</button>
          <button type="submit" disabled={busy} className="nx-btn nx-btn-gold flex-1 disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAr ? "تحديث" : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
