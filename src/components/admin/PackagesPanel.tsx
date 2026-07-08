import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, Package, X, Check, XCircle, Edit3, ExternalLink, User,
} from "lucide-react";

type Pkg = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  sessions_count: number;
  price: number;
  currency: string;
  active: boolean;
  sort_order: number;
};

type Purchase = {
  id: string;
  user_id: string;
  package_id: string;
  status: "pending" | "approved" | "rejected" | "exhausted";
  sessions_remaining: number;
  payment_proof_url: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
  consultation_packages?: { name_ar: string; name_en: string; sessions_count: number } | null;
  profiles?: { full_name: string | null; email: string | null; phone: string | null } | null;
};

const EMPTY: Omit<Pkg, "id"> = {
  name_ar: "", name_en: "",
  description_ar: "", description_en: "",
  sessions_count: 1, price: 0, currency: "USD",
  active: true, sort_order: 0,
};

export function PackagesPanel() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const t = (a: string, b: string) => (isAr ? a : b);

  const [tab, setTab] = useState<"packages" | "purchases">("packages");
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "exhausted">("all");

  async function refresh() {
    setLoading(true);
    const [pkgRes, purRes] = await Promise.all([
      supabase.from("consultation_packages").select("*").order("sort_order").order("created_at"),
      supabase
        .from("consultation_package_purchases")
        .select("*, consultation_packages(name_ar,name_en,sessions_count), profiles(full_name,email,phone)")
        .order("created_at", { ascending: false }),
    ]);
    setPackages((pkgRes.data as Pkg[]) || []);
    setPurchases((purRes.data as any) || []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function savePackage(form: Omit<Pkg, "id"> & { id?: string }) {
    setBusy(true);
    const payload = {
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim(),
      description_ar: form.description_ar?.trim() || null,
      description_en: form.description_en?.trim() || null,
      sessions_count: Math.max(1, Number(form.sessions_count) || 1),
      price: Math.max(0, Number(form.price) || 0),
      currency: form.currency.trim().toUpperCase() || "USD",
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
    };
    const { error } = form.id
      ? await supabase.from("consultation_packages").update(payload).eq("id", form.id)
      : await supabase.from("consultation_packages").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("تم الحفظ", "Saved"));
    setEditing(null); setCreating(false);
    refresh();
  }

  async function deletePackage(id: string) {
    if (!window.confirm(t("حذف هذه الباقة؟", "Delete this package?"))) return;
    const { error } = await supabase.from("consultation_packages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("تم الحذف", "Deleted"));
    refresh();
  }

  async function togglePackage(p: Pkg) {
    const { error } = await supabase.from("consultation_packages").update({ active: !p.active }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  async function approve(pu: Purchase) {
    const sessions = pu.consultation_packages?.sessions_count ?? 0;
    if (!sessions) { toast.error(t("عدد الجلسات غير محدد", "Sessions count missing")); return; }
    const { error } = await supabase.from("consultation_package_purchases").update({
      status: "approved",
      sessions_remaining: sessions,
      approved_at: new Date().toISOString(),
    }).eq("id", pu.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("تمت الموافقة", "Approved"));
    refresh();
  }

  async function reject(pu: Purchase) {
    const note = window.prompt(t("سبب الرفض (اختياري)", "Rejection note (optional)")) || null;
    const { error } = await supabase.from("consultation_package_purchases").update({
      status: "rejected", admin_notes: note,
    }).eq("id", pu.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("تم الرفض", "Rejected"));
    refresh();
  }

  async function deletePurchase(id: string) {
    if (!window.confirm(t("حذف هذا الطلب؟", "Delete this request?"))) return;
    const { error } = await supabase.from("consultation_package_purchases").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  async function proofUrl(path: string) {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  const filteredPurchases = useMemo(() => {
    if (filter === "all") return purchases;
    return purchases.filter((p) => p.status === filter);
  }, [purchases, filter]);

  const stats = useMemo(() => ({
    pending: purchases.filter((p) => p.status === "pending").length,
    approved: purchases.filter((p) => p.status === "approved").length,
  }), [purchases]);

  return (
    <div className="dash-card p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
            <Package className="size-5 text-[var(--gold)]" />
            {t("باقات الاستشارات", "Consultation packages")}
          </h2>
          <p className="text-xs text-white/60 mt-1">
            {t(`${packages.length} باقة · ${stats.pending} طلب معلّق · ${stats.approved} مفعّل`,
               `${packages.length} packages · ${stats.pending} pending · ${stats.approved} active`)}
          </p>
        </div>
        {tab === "packages" && (
          <button onClick={() => setCreating(true)}
            className="px-4 h-10 rounded-xl text-sm font-bold inline-flex items-center gap-2 bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736]">
            <Plus className="size-4" /> {t("باقة جديدة", "New package")}
          </button>
        )}
      </div>

      <div className="flex gap-2 text-xs border-b border-white/10 pb-3">
        {(["packages", "purchases"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 h-8 rounded-lg font-semibold transition ${
              tab === k ? "bg-white/15 text-white" : "bg-white/5 text-white/60 hover:text-white"
            }`}>
            {k === "packages" ? t("الباقات", "Packages") : `${t("طلبات الشراء", "Purchase requests")} (${purchases.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 grid place-items-center text-white/60"><Loader2 className="size-6 animate-spin" /></div>
      ) : tab === "packages" ? (
        packages.length === 0 ? (
          <div className="py-10 text-center text-white/60 text-sm">{t("لا توجد باقات — أضف الأولى", "No packages yet — add one")}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {packages.map((p) => (
              <div key={p.id} className={`rounded-2xl p-4 border ${p.active ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.015] opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate">{isAr ? p.name_ar : p.name_en}</div>
                    <div className="text-xs text-white/60 mt-0.5">{isAr ? p.name_en : p.name_ar}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(p)} className="size-8 grid place-items-center rounded-md text-white/60 hover:text-white hover:bg-white/10">
                      <Edit3 className="size-3.5" />
                    </button>
                    <button onClick={() => deletePackage(p.id)} className="size-8 grid place-items-center rounded-md text-white/60 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span className="px-2 h-6 grid place-items-center rounded bg-[var(--gold)]/15 text-[var(--gold)] font-bold">
                    {p.sessions_count} {t("جلسة", "sessions")}
                  </span>
                  <span className="text-white/80 font-bold">{p.price} {p.currency}</span>
                  <button onClick={() => togglePackage(p)}
                    className={`ms-auto px-2 h-6 rounded text-[11px] font-bold ${p.active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/60"}`}>
                    {p.active ? t("نشط", "Active") : t("متوقف", "Inactive")}
                  </button>
                </div>
                {(p.description_ar || p.description_en) && (
                  <p className="mt-2 text-xs text-white/60 line-clamp-2">{isAr ? p.description_ar : p.description_en}</p>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 text-xs">
            {(["all", "pending", "approved", "exhausted", "rejected"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 h-8 rounded-lg font-semibold transition ${
                  filter === f ? "bg-white/15 text-white" : "bg-white/5 text-white/60 hover:text-white"
                }`}>
                {f === "all" ? t("الكل", "All")
                  : f === "pending" ? t("معلّق", "Pending")
                  : f === "approved" ? t("مفعّل", "Approved")
                  : f === "exhausted" ? t("منتهي", "Exhausted")
                  : t("مرفوض", "Rejected")}
              </button>
            ))}
          </div>
          {filteredPurchases.length === 0 ? (
            <div className="py-10 text-center text-white/60 text-sm">{t("لا توجد طلبات", "No requests")}</div>
          ) : (
            <div className="space-y-2">
              {filteredPurchases.map((pu) => {
                const badge = pu.status === "approved" ? "bg-emerald-500/15 text-emerald-300"
                  : pu.status === "pending" ? "bg-amber-500/15 text-amber-300"
                  : pu.status === "exhausted" ? "bg-white/10 text-white/60"
                  : "bg-red-500/15 text-red-300";
                return (
                  <div key={pu.id} className="rounded-xl p-3.5 border border-white/10 bg-white/[0.03]">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                          <User className="size-3.5 text-white/50" />
                          {pu.profiles?.full_name || pu.profiles?.email || pu.user_id.slice(0, 8)}
                          <span className={`px-2 h-5 grid place-items-center rounded text-[10px] font-bold ${badge}`}>
                            {pu.status}
                          </span>
                        </div>
                        <div className="text-xs text-white/70">
                          {isAr ? pu.consultation_packages?.name_ar : pu.consultation_packages?.name_en}
                          {" · "}
                          <span className="text-[var(--gold)] font-bold">
                            {pu.sessions_remaining}/{pu.consultation_packages?.sessions_count ?? 0} {t("متبقي", "left")}
                          </span>
                        </div>
                        {pu.profiles?.email && <div className="text-[11px] text-white/50" dir="ltr">{pu.profiles.email}</div>}
                        {pu.admin_notes && <div className="text-[11px] text-white/50 italic">📝 {pu.admin_notes}</div>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {pu.payment_proof_url && (
                          <button onClick={() => proofUrl(pu.payment_proof_url!)}
                            className="px-2.5 h-8 rounded-md text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/15 inline-flex items-center gap-1">
                            <ExternalLink className="size-3" /> {t("الإيصال", "Proof")}
                          </button>
                        )}
                        {pu.status === "pending" && (
                          <>
                            <button onClick={() => approve(pu)} title={t("موافقة", "Approve")}
                              className="size-8 grid place-items-center rounded-md text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30">
                              <Check className="size-3.5" />
                            </button>
                            <button onClick={() => reject(pu)} title={t("رفض", "Reject")}
                              className="size-8 grid place-items-center rounded-md text-red-300 hover:bg-red-500/10 border border-red-500/30">
                              <XCircle className="size-3.5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => deletePurchase(pu.id)} title={t("حذف", "Delete")}
                          className="size-8 grid place-items-center rounded-md text-white/50 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(creating || editing) && (
        <PackageForm
          initial={editing ?? { ...EMPTY, id: undefined as any }}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSave={savePackage}
          busy={busy}
          t={t}
        />
      )}
    </div>
  );
}

function PackageForm({
  initial, onCancel, onSave, busy, t,
}: {
  initial: any;
  onCancel: () => void;
  onSave: (v: any) => void;
  busy: boolean;
  t: (a: string, b: string) => string;
}) {
  const [form, setForm] = useState<any>({ ...initial });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-[#0c1224] border border-white/10 p-6 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-extrabold text-base text-white">
            {form.id ? t("تعديل الباقة", "Edit package") : t("باقة جديدة", "New package")}
          </h3>
          <button type="button" onClick={onCancel} className="size-8 grid place-items-center rounded-md text-white/60 hover:text-white hover:bg-white/5">
            <X className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("الاسم (عربي)", "Name (AR)")} required>
            <input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50" required />
          </Field>
          <Field label={t("الاسم (إنجليزي)", "Name (EN)")} required>
            <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50" required />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t("عدد الجلسات", "Sessions")} required>
            <input type="number" min={1} value={form.sessions_count} onChange={(e) => setForm({ ...form, sessions_count: Number(e.target.value) })}
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50" required />
          </Field>
          <Field label={t("السعر", "Price")}>
            <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50" />
          </Field>
          <Field label={t("العملة", "Currency")}>
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50 uppercase" />
          </Field>
        </div>
        <Field label={t("الوصف (عربي)", "Description (AR)")}>
          <textarea value={form.description_ar || ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50 resize-none" />
        </Field>
        <Field label={t("الوصف (إنجليزي)", "Description (EN)")}>
          <textarea value={form.description_en || ""} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50 resize-none" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("الترتيب", "Sort order")}>
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-white/80 self-end pb-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            {t("نشط", "Active")}
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="px-4 h-10 rounded-xl text-sm font-semibold text-white/70 hover:text-white">
            {t("إلغاء", "Cancel")}
          </button>
          <button type="submit" disabled={busy}
            className="px-4 h-10 rounded-xl text-sm font-bold bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] disabled:opacity-50 inline-flex items-center gap-2">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("حفظ", "Save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
        {label}{required && " *"}
      </span>
      {children}
    </label>
  );
}
