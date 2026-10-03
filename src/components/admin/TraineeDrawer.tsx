import { useEffect, useState } from "react";
import { X, Mail, Phone, MessageCircle, Ban, CheckCircle2, ExternalLink, Loader2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Submission = Database["public"]["Tables"]["assignment_submissions"]["Row"] & {
  assignments: { title: string; max_score: number } | null;
};
type Enr = { id: string; status: string; certificate_issued: boolean; created_at: string; courses?: { title?: string | null } | null };

export function TraineeDrawer({
  userId, enrollments, onClose, onOpenEnrollment, refresh,
}: {
  userId: string;
  enrollments: Enr[];
  onClose: () => void;
  onOpenEnrollment: (id: string) => void;
  refresh: () => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const ids = enrollments.map((e) => e.id);
    const [p, pay, s] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      ids.length
        ? supabase.from("payments").select("*").in("enrollment_id", ids).order("paid_at", { ascending: false })
        : Promise.resolve({ data: [] as Payment[] }),
      supabase.from("assignment_submissions").select("*, assignments(title, max_score)").eq("user_id", userId).order("submitted_at", { ascending: false }),
    ]);
    setProfile(p.data ?? null);
    setPayments(pay.data ?? []);
    setSubs((s.data as Submission[] | null) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [userId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function toggleBlock() {
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ account_blocked: !profile.account_blocked }).eq("id", userId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(profile.account_blocked ? t("تم إعادة التفعيل", "Account reactivated") : t("تم إيقاف الحساب", "Account blocked"));
    await load();
    refresh();
  }

  const approvedTotal = payments.filter((p) => p.status === "approved").reduce((a, p) => a + Number(p.amount), 0);
  const cur = payments[0]?.currency ?? "";
  const wa = profile?.phone?.replace(/[^\d]/g, "");

  const statusCls = (s: string) =>
    s === "approved" ? "bg-emerald-400/15 text-emerald-300" : s === "rejected" ? "bg-rose-400/15 text-rose-300" : "bg-amber-300/15 text-amber-200";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-lg h-full bg-[#0b1736] border-s border-white/10 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300 rtl:slide-in-from-left ltr:slide-in-from-right">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 p-5 border-b border-white/10 bg-[#0b1736]/95 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border border-[var(--gold)]/40" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[var(--gold)]/15 text-[var(--gold)] flex items-center justify-center font-bold">
                {(profile?.full_name || "?").slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-white truncate">{profile?.full_name || t("متدرب", "Trainee")}</p>
              <p className="text-xs text-white/50 truncate">{profile?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70" aria-label="close">
            <X className="w-5 h-5" />
          </button>
        </header>

        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--gold)]" /></div>
        ) : (
          <div className="p-5 space-y-6">
            <section className="dash-card p-4 space-y-2 text-sm">
              <h3 className="text-xs uppercase tracking-widest text-white/40 font-bold mb-2">{t("البيانات", "Profile")}</h3>
              <Row icon={Mail} v={profile?.email} />
              <Row icon={Phone} v={profile?.phone} />
              <Row icon={Globe} v={profile?.country} />
              <div className="flex flex-wrap gap-2 pt-2">
                <span className={`text-[11px] px-2 py-1 rounded-md ${profile?.account_blocked ? "bg-rose-400/15 text-rose-300" : "bg-emerald-400/15 text-emerald-300"}`}>
                  {profile?.account_blocked ? t("موقوف", "Blocked") : t("نشط", "Active")}
                </span>
                <span className="text-[11px] px-2 py-1 rounded-md bg-white/10 text-white/70">
                  {t("التفعيل:", "Activation:")} {profile?.activation_status}
                </span>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2">
              {wa && (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="h-10 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-emerald-500/25">
                  <MessageCircle className="w-4 h-4" /> {t("واتساب", "WhatsApp")}
                </a>
              )}
              {profile?.email && (
                <a href={`mailto:${profile.email}`} className="h-10 rounded-xl bg-white/5 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-white/10">
                  <Mail className="w-4 h-4" /> {t("بريد", "Email")}
                </a>
              )}
              <button disabled={busy} onClick={toggleBlock}
                className={`col-span-2 h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 ${profile?.account_blocked ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                {profile?.account_blocked ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                {profile?.account_blocked ? t("إعادة تفعيل الحساب", "Reactivate account") : t("إيقاف الحساب", "Block account")}
              </button>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-widest text-white/40 font-bold">{t("الاشتراكات", "Enrollments")} ({enrollments.length})</h3>
              {enrollments.map((e) => (
                <button key={e.id} onClick={() => onOpenEnrollment(e.id)} className="w-full dash-card p-3 flex items-center gap-3 text-start hover:border-[var(--gold)]/40">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-white truncate">{e.courses?.title}</span>
                    <span className="block text-[11px] text-white/50">{e.created_at.slice(0, 10)}{e.certificate_issued ? ` · ${t("شهادة صادرة", "Certificate issued")}` : ""}</span>
                  </span>
                  <span className={`text-[10px] px-2 py-1 rounded-md ${statusCls(e.status)}`}>{e.status}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                </button>
              ))}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-white/40 font-bold">{t("سجل المدفوعات", "Payment history")}</h3>
                <span className="text-xs text-[var(--gold)] font-bold">{approvedTotal.toLocaleString()} {cur}</span>
              </div>
              {payments.length === 0 && <p className="text-sm text-white/40">{t("لا توجد مدفوعات", "No payments")}</p>}
              {payments.map((p) => (
                <div key={p.id} className="dash-card p-3 flex items-center gap-3 text-sm">
                  <span className="flex-1">
                    <span className="block text-white">{Number(p.amount).toLocaleString()} {p.currency}</span>
                    <span className="block text-[11px] text-white/50">{p.paid_at.slice(0, 10)}{p.payment_method_name ? ` · ${p.payment_method_name}` : ""}</span>
                  </span>
                  <span className={`text-[10px] px-2 py-1 rounded-md ${statusCls(p.status)}`}>{p.status}</span>
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-widest text-white/40 font-bold">{t("الواجبات", "Assignments")} ({subs.length})</h3>
              {subs.length === 0 && <p className="text-sm text-white/40">{t("لا توجد تسليمات", "No submissions")}</p>}
              {subs.map((s) => (
                <div key={s.id} className="dash-card p-3 flex items-center gap-3 text-sm">
                  <span className="flex-1 min-w-0">
                    <span className="block text-white truncate">{s.assignments?.title ?? "—"}</span>
                    <span className="block text-[11px] text-white/50">{s.submitted_at.slice(0, 10)}</span>
                  </span>
                  <span className="text-xs font-bold text-[var(--gold)]">
                    {s.score != null ? `${s.score}/${s.assignments?.max_score ?? ""}` : t("بانتظار التقييم", "Ungraded")}
                  </span>
                </div>
              ))}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ icon: Icon, v }: { icon: typeof Mail; v?: string | null }) {
  return (
    <div className="flex items-center gap-2 text-white/80">
      <Icon className="w-4 h-4 text-white/40" />
      <span className="truncate">{v || "—"}</span>
    </div>
  );
}
