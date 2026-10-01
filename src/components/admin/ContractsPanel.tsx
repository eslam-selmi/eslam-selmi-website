import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Plus, Trash2, X, Eye, EyeOff, Loader2 } from "lucide-react";

export type ContractRow = {
  id: string;
  year: string | null;
  is_current: boolean;
  org_ar: string;
  org_en: string | null;
  industry_ar: string | null;
  industry_en: string | null;
  country_code: string;
  country_ar: string | null;
  country_en: string | null;
  role_ar: string | null;
  role_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  display_order: number;
  is_active: boolean;
};

const empty = {
  year: "",
  is_current: false,
  org_ar: "",
  org_en: "",
  industry_ar: "",
  industry_en: "",
  country_code: "EG",
  country_ar: "",
  country_en: "",
  role_ar: "",
  role_en: "",
  description_ar: "",
  description_en: "",
  display_order: 0,
  is_active: true,
};

export function ContractsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [items, setItems] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContractRow | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts" as any)
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setItems(((data as unknown) as ContractRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({
      ...empty,
      display_order: (items.reduce((m, i) => Math.max(m, i.display_order), 0) || 0) + 1,
    });
    setOpen(true);
  }

  function openEdit(it: ContractRow) {
    setEditing(it);
    setForm({
      year: it.year || "",
      is_current: it.is_current,
      org_ar: it.org_ar,
      org_en: it.org_en || "",
      industry_ar: it.industry_ar || "",
      industry_en: it.industry_en || "",
      country_code: it.country_code || "EG",
      country_ar: it.country_ar || "",
      country_en: it.country_en || "",
      role_ar: it.role_ar || "",
      role_en: it.role_en || "",
      description_ar: it.description_ar || "",
      description_en: it.description_en || "",
      display_order: it.display_order || 0,
      is_active: it.is_active,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.org_ar.trim()) return toast.error(t("اسم الجهة بالعربية مطلوب", "Arabic organization name is required"));
    if (!form.is_current && !form.year.trim()) return toast.error(t("السنة مطلوبة أو اختر (حالياً)", "Year required or mark as current"));
    if (form.year.trim().length > 20) return toast.error(t("السنة طويلة جداً", "Year too long"));
    const cc = form.country_code.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return toast.error(t("كود الدولة حرفان (مثال EG)", "Country code must be 2 letters (e.g. EG)"));
    setBusy(true);
    const n = (v: string) => v.trim() || null;
    const payload = {
      year: n(form.year),
      is_current: form.is_current,
      org_ar: form.org_ar.trim(),
      org_en: n(form.org_en),
      industry_ar: n(form.industry_ar),
      industry_en: n(form.industry_en),
      country_code: cc,
      country_ar: n(form.country_ar),
      country_en: n(form.country_en),
      role_ar: n(form.role_ar),
      role_en: n(form.role_en),
      description_ar: n(form.description_ar),
      description_en: n(form.description_en),
      display_order: Number(form.display_order) || 0,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from("contracts" as any).update(payload).eq("id", editing.id)
      : await supabase.from("contracts" as any).insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? t("تم التحديث", "Updated") : t("تمت الإضافة", "Added"));
    setOpen(false);
    load();
  }

  async function toggleActive(it: ContractRow) {
    const { error } = await supabase.from("contracts" as any).update({ is_active: !it.is_active }).eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function remove(id: string) {
    if (!confirm(t("حذف هذا العقد؟", "Delete this contract?"))) return;
    const { error } = await supabase.from("contracts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحذف", "Deleted"));
    load();
  }

  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-bold text-lg">
          {t("عقود التميز", "Contracts of Excellence")} ({items.length})
        </h3>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] text-[#0b1736] px-4 py-2 text-sm font-bold hover:opacity-90 transition">
          <Plus className="size-4" />
          {t("إضافة عقد", "Add contract")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-white/60"><Loader2 className="size-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-white/50 text-sm rounded-2xl border border-dashed border-white/15">
          {t("لا توجد عقود بعد.", "No contracts yet.")}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-display text-xl font-extrabold text-[var(--gold)]">
                    {it.is_current ? t("حالياً", "Present") : it.year}
                  </div>
                  <div className="font-bold text-sm truncate mt-1">{it.org_ar}</div>
                  <div className="text-[11px] text-white/50 truncate">{it.industry_ar}</div>
                  <div className="text-[11px] text-white/60 truncate">{it.role_ar}</div>
                  <div className="text-[10px] text-white/40 mt-1">
                    {it.country_code} · {t("الترتيب", "Order")}: {it.display_order}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${it.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"}`}>
                  {it.is_active ? t("مفعّل", "Active") : t("موقوف", "Inactive")}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(it)} className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 font-semibold">{t("تعديل", "Edit")}</button>
                <button onClick={() => toggleActive(it)} className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15">
                  {it.is_active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <button onClick={() => remove(it.id)} className="px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-auto rounded-2xl bg-[#0b1736] border border-white/10 p-6 text-white" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-3 end-3 size-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <X className="size-4" />
            </button>
            <h3 className="font-display font-bold text-lg mb-4">
              {editing ? t("تعديل العقد", "Edit contract") : t("عقد جديد", "New contract")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t("السنة", "Year")} v={form.year} on={set("year")} />
              <label className="flex items-center gap-2 text-xs mt-5">
                <input type="checkbox" checked={form.is_current} onChange={(e) => setForm({ ...form, is_current: e.target.checked })} className="size-4 accent-[var(--gold)]" />
                {t("حالي (يظهر «حالياً» بدل السنة)", "Current (shows “Present” instead of year)")}
              </label>
              <Field label={t("اسم الجهة (عربي)*", "Organization (AR)*")} v={form.org_ar} on={set("org_ar")} />
              <Field label={t("اسم الجهة (إنجليزي)", "Organization (EN)")} v={form.org_en} on={set("org_en")} />
              <Field label={t("المجال (عربي)", "Sector (AR)")} v={form.industry_ar} on={set("industry_ar")} />
              <Field label={t("المجال (إنجليزي)", "Sector (EN)")} v={form.industry_en} on={set("industry_en")} />
              <Field label={t("الدور (عربي)", "Role (AR)")} v={form.role_ar} on={set("role_ar")} />
              <Field label={t("الدور (إنجليزي)", "Role (EN)")} v={form.role_en} on={set("role_en")} />
              <Field label={t("كود الدولة (EG, SA…)", "Country code (EG, SA…)")} v={form.country_code} on={set("country_code")} />
              <Field label={t("الدولة (عربي)", "Country (AR)")} v={form.country_ar} on={set("country_ar")} />
              <Field label={t("الدولة (إنجليزي)", "Country (EN)")} v={form.country_en} on={set("country_en")} />
              <Field label={t("الترتيب", "Display order")} v={String(form.display_order)} on={(v) => setForm({ ...form, display_order: Number(v) || 0 })} />
              <TextArea label={t("وصف مختصر (عربي)", "Short description (AR)")} v={form.description_ar} on={set("description_ar")} />
              <TextArea label={t("وصف مختصر (إنجليزي)", "Short description (EN)")} v={form.description_en} on={set("description_en")} />
              <label className="flex items-center gap-2 text-xs sm:col-span-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="size-4 accent-[var(--gold)]" />
                {t("مفعّل (يظهر في الصفحة الرئيسية)", "Active (shown on homepage)")}
              </label>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold">{t("إلغاء", "Cancel")}</button>
              <button onClick={save} disabled={busy} className="px-4 py-2 rounded-xl bg-[var(--gold)] text-[#0b1736] text-sm font-bold disabled:opacity-50">
                {busy ? t("جارٍ الحفظ…", "Saving…") : t("حفظ", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <label className="block text-xs">
      <span className="block mb-1 text-white/60 font-semibold">{label}</span>
      <input value={v} onChange={(e) => on(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white/[0.06] border border-white/10 focus:border-[var(--gold)] outline-none text-sm" />
    </label>
  );
}

function TextArea({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <label className="block text-xs">
      <span className="block mb-1 text-white/60 font-semibold">{label}</span>
      <textarea value={v} onChange={(e) => on(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 focus:border-[var(--gold)] outline-none text-sm resize-y" />
    </label>
  );
}
