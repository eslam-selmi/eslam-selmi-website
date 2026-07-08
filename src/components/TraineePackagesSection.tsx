import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Package, Loader2, Upload, X, CheckCircle2, Clock, XCircle } from "lucide-react";

type Pkg = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  sessions_count: number;
  price: number;
  currency: string;
  sort_order: number;
};

type Purchase = {
  id: string;
  package_id: string;
  status: "pending" | "approved" | "rejected" | "exhausted";
  sessions_remaining: number;
  admin_notes: string | null;
  created_at: string;
  consultation_packages?: { name_ar: string; name_en: string; sessions_count: number } | null;
};

export function TraineePackagesSection({ userId }: { userId: string }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const t = (a: string, b: string) => (isAr ? a : b);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<Pkg | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    const [pkgRes, purRes] = await Promise.all([
      supabase.from("consultation_packages").select("*").eq("active", true).order("sort_order").order("price"),
      supabase
        .from("consultation_package_purchases")
        .select("*, consultation_packages(name_ar,name_en,sessions_count)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    setPackages((pkgRes.data as Pkg[]) || []);
    setPurchases((purRes.data as any) || []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, [userId]);

  async function submitPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!buying) return;
    setBusy(true);
    try {
      let proofPath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `packages/${userId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        proofPath = path;
      }
      const { error } = await supabase.from("consultation_package_purchases").insert({
        user_id: userId,
        package_id: buying.id,
        status: "pending",
        sessions_remaining: 0,
        payment_proof_url: proofPath,
      });
      if (error) throw error;
      toast.success(t("تم إرسال الطلب — سيتم مراجعته", "Request sent — pending review"));
      setBuying(null); setFile(null);
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="py-6 grid place-items-center text-white/50"><Loader2 className="size-5 animate-spin" /></div>;
  }
  if (packages.length === 0 && purchases.length === 0) return null;

  const activePurchase = purchases.find((p) => p.status === "approved" && p.sessions_remaining > 0);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Package className="w-5 h-5 text-[var(--gold)]" />
        {t("باقات الاستشارات", "Consultation packages")}
      </h2>

      {activePurchase && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4 flex items-center gap-3">
          <CheckCircle2 className="size-5 text-emerald-300 shrink-0" />
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-bold text-white">
              {isAr ? activePurchase.consultation_packages?.name_ar : activePurchase.consultation_packages?.name_en}
            </div>
            <div className="text-white/70 text-xs mt-0.5">
              {t("جلسات متبقية:", "Sessions remaining:")}{" "}
              <span className="text-[var(--gold)] font-bold">
                {activePurchase.sessions_remaining}/{activePurchase.consultation_packages?.sessions_count ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {purchases.filter((p) => p.status !== "approved" || p.sessions_remaining === 0).length > 0 && (
        <div className="space-y-2">
          {purchases
            .filter((p) => p.status !== "approved" || p.sessions_remaining === 0)
            .map((p) => (
              <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3 text-sm">
                {p.status === "pending" && <Clock className="size-4 text-amber-300" />}
                {p.status === "rejected" && <XCircle className="size-4 text-red-300" />}
                {p.status === "exhausted" && <CheckCircle2 className="size-4 text-white/40" />}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">
                    {isAr ? p.consultation_packages?.name_ar : p.consultation_packages?.name_en}
                  </div>
                  <div className="text-xs text-white/60">
                    {p.status === "pending" && t("قيد المراجعة", "Under review")}
                    {p.status === "rejected" && t("مرفوض", "Rejected")}
                    {p.status === "exhausted" && t("منتهي", "Exhausted")}
                    {p.admin_notes && ` — ${p.admin_notes}`}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {packages.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {packages.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col">
              <div className="font-bold text-white">{isAr ? p.name_ar : p.name_en}</div>
              {(isAr ? p.description_ar : p.description_en) && (
                <p className="text-xs text-white/60 mt-1 line-clamp-2">
                  {isAr ? p.description_ar : p.description_en}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 h-7 grid place-items-center rounded bg-[var(--gold)]/15 text-[var(--gold)] font-bold text-xs">
                  {p.sessions_count} {t("جلسة", "sessions")}
                </span>
                <span className="text-white font-bold text-sm ms-auto">{p.price} {p.currency}</span>
              </div>
              <button
                onClick={() => setBuying(p)}
                className="mt-3 h-9 rounded-xl text-sm font-bold bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736]"
              >
                {t("طلب هذه الباقة", "Request this package")}
              </button>
            </div>
          ))}
        </div>
      )}

      {buying && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setBuying(null)}>
          <form onSubmit={submitPurchase} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0c1224] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base text-white">
                {t("طلب باقة", "Request package")}: {isAr ? buying.name_ar : buying.name_en}
              </h3>
              <button type="button" onClick={() => setBuying(null)} className="size-8 grid place-items-center rounded-md text-white/60 hover:text-white hover:bg-white/5">
                <X className="size-4" />
              </button>
            </div>
            <div className="text-sm text-white/70">
              {t("عدد الجلسات:", "Sessions:")} <span className="font-bold text-[var(--gold)]">{buying.sessions_count}</span>
              {" · "}
              {t("السعر:", "Price:")} <span className="font-bold text-white">{buying.price} {buying.currency}</span>
            </div>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
                {t("إيصال الدفع (اختياري)", "Payment proof (optional)")}
              </span>
              <div className="rounded-xl border-2 border-dashed border-white/15 p-4 text-center hover:border-[var(--gold)]/50 transition">
                <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-white/70" />
                {file && <div className="text-xs text-white/60 mt-2 truncate">{file.name}</div>}
              </div>
              <p className="text-[11px] text-white/40 mt-1.5">
                {t("سيتم مراجعة الطلب ثم تفعيل الجلسات لك.", "Your request will be reviewed then sessions activated.")}
              </p>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setBuying(null)} className="px-4 h-10 rounded-xl text-sm font-semibold text-white/70 hover:text-white">
                {t("إلغاء", "Cancel")}
              </button>
              <button type="submit" disabled={busy}
                className="px-4 h-10 rounded-xl text-sm font-bold bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] disabled:opacity-50 inline-flex items-center gap-2">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {t("إرسال الطلب", "Send request")}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
