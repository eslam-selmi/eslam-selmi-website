import { useState } from "react";
import { completeForcedPasswordReset } from "@/lib/admin-trainers.functions";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";

export function ForcePasswordResetGate({ onDone }: { onDone: () => void }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (p1.length < 8) return toast.error(t("كلمة المرور 8 أحرف على الأقل", "Password must be ≥ 8 chars"));
    if (p1 !== p2) return toast.error(t("كلمتا المرور غير متطابقتين", "Passwords do not match"));
    setBusy(true);
    try {
      await completeForcedPasswordReset({ data: { password: p1 } });
      toast.success(t("تم تحديث كلمة المرور", "Password updated"));
      onDone();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-[#070b1c]/95 backdrop-blur flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-[var(--gold)]/30 bg-[#0b1736] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-400/15 border border-amber-300/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="font-bold text-base">{t("تعيين كلمة مرور جديدة", "Set a new password")}</h2>
            <p className="text-xs text-white/60">{t("يجب تغيير كلمة المرور المؤقتة قبل الوصول للوحة.", "You must replace your temporary password before continuing.")}</p>
          </div>
        </div>
        <div className="space-y-2">
          <input type="password" autoFocus value={p1} onChange={(e) => setP1(e.target.value)}
            placeholder={t("كلمة المرور الجديدة", "New password")}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 h-11 text-sm" />
          <input type="password" value={p2} onChange={(e) => setP2(e.target.value)}
            placeholder={t("تأكيد كلمة المرور", "Confirm password")}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 h-11 text-sm" />
        </div>
        <button type="submit" disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 bg-[var(--gold)] text-[#0b1736] font-bold text-sm h-11 rounded-lg disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {t("حفظ ومتابعة", "Save & continue")}
        </button>
      </form>
    </div>
  );
}
