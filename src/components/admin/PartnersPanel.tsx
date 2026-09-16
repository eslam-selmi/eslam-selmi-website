import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Plus, Trash2, X, Eye, EyeOff, Loader2, Upload } from "lucide-react";

export type PartnerRow = {
  id: string;
  name_ar: string;
  name_en: string | null;
  industry_ar: string | null;
  industry_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  logo_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

const empty = {
  name_ar: "",
  name_en: "",
  industry_ar: "",
  industry_en: "",
  description_ar: "",
  description_en: "",
  logo_url: "",
  display_order: 0,
  is_active: true,
};

export function PartnersPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [items, setItems] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerRow | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners" as any)
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setItems(((data as unknown) as PartnerRow[]) ?? []);
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

  function openEdit(it: PartnerRow) {
    setEditing(it);
    setForm({
      name_ar: it.name_ar,
      name_en: it.name_en || "",
      industry_ar: it.industry_ar || "",
      industry_en: it.industry_en || "",
      description_ar: it.description_ar || "",
      description_en: it.description_en || "",
      logo_url: it.logo_url || "",
      display_order: it.display_order || 0,
      is_active: it.is_active,
    });
    setOpen(true);
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error(t("اختر صورة", "Pick an image"));
    if (file.size > 5 * 1024 * 1024) return toast.error(t("الحد الأقصى ٥ ميجا", "Max size 5 MB"));
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `partners/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("public-uploads")
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data: signed } = await supabase.storage
        .from("public-uploads")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      setForm((f) => ({ ...f, logo_url: signed?.signedUrl || "" }));
      toast.success(t("تم رفع الشعار", "Logo uploaded"));
    } catch (err: any) {
      toast.error(err?.message || t("فشل الرفع", "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.name_ar.trim())
      return toast.error(t("اسم الشركة بالعربية مطلوب", "Arabic company name is required"));
    if (!form.logo_url.trim())
      return toast.error(t("شعار الشركة مطلوب", "Company logo is required"));
    setBusy(true);
    const payload = {
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim() || null,
      industry_ar: form.industry_ar.trim() || null,
      industry_en: form.industry_en.trim() || null,
      description_ar: form.description_ar.trim() || null,
      description_en: form.description_en.trim() || null,
      logo_url: form.logo_url.trim(),
      display_order: Number(form.display_order) || 0,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from("partners" as any).update(payload).eq("id", editing.id)
      : await supabase.from("partners" as any).insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? t("تم التحديث", "Updated") : t("تمت الإضافة", "Added"));
    setOpen(false);
    load();
  }

  async function toggleActive(it: PartnerRow) {
    const { error } = await supabase
      .from("partners" as any)
      .update({ is_active: !it.is_active })
      .eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function remove(id: string) {
    if (!confirm(t("حذف هذا الشريك؟", "Delete this partner?"))) return;
    const { error } = await supabase.from("partners" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحذف", "Deleted"));
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-bold text-lg">
          {t("الشركاء", "Partners")} ({items.length})
        </h3>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] text-[#0b1736] px-4 py-2 text-sm font-bold hover:opacity-90 transition"
        >
          <Plus className="size-4" />
          {t("إضافة شريك", "Add partner")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-white/60">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-white/50 text-sm rounded-2xl border border-dashed border-white/15">
          {t("لا يوجد شركاء بعد.", "No partners yet.")}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <div className="size-14 shrink-0 rounded-xl bg-white grid place-items-center overflow-hidden">
                  {it.logo_url ? (
                    <img src={it.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm leading-tight truncate">{it.name_ar}</div>
                  <div className="text-[11px] text-white/50 truncate">{it.industry_ar}</div>
                  <div className="text-[10px] text-white/40 mt-1">
                    {t("الترتيب", "Order")}: {it.display_order}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${it.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"}`}
                >
                  {it.is_active ? t("مفعّل", "Active") : t("موقوف", "Inactive")}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => openEdit(it)}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 font-semibold"
                >
                  {t("تعديل", "Edit")}
                </button>
                <button
                  onClick={() => toggleActive(it)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15"
                  title={it.is_active ? t("إيقاف", "Deactivate") : t("تفعيل", "Activate")}
                >
                  {it.is_active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <button
                  onClick={() => remove(it.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[92vh] overflow-auto rounded-2xl bg-[#0b1736] border border-white/10 p-6 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 end-3 size-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X className="size-4" />
            </button>
            <h3 className="font-display font-bold text-lg mb-4">
              {editing ? t("تعديل الشريك", "Edit partner") : t("شريك جديد", "New partner")}
            </h3>

            <div className="mb-4 flex items-center gap-4">
              <div className="size-20 rounded-xl bg-white grid place-items-center overflow-hidden shrink-0">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-[10px] text-black/40">{t("لا شعار", "No logo")}</span>
                )}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadLogo}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {t("رفع شعار الشركة", "Upload logo")}
                </button>
                <p className="text-[10px] text-white/40 mt-1.5">
                  {t("PNG/JPG — حتى ٥ ميجا", "PNG/JPG — up to 5 MB")}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                label={t("اسم الشركة (عربي)*", "Company name (AR)*")}
                v={form.name_ar}
                on={(v) => setForm({ ...form, name_ar: v })}
              />
              <Field
                label={t("اسم الشركة (إنجليزي)", "Company name (EN)")}
                v={form.name_en}
                on={(v) => setForm({ ...form, name_en: v })}
              />
              <Field
                label={t("المجال (عربي)", "Industry (AR)")}
                v={form.industry_ar}
                on={(v) => setForm({ ...form, industry_ar: v })}
              />
              <Field
                label={t("المجال (إنجليزي)", "Industry (EN)")}
                v={form.industry_en}
                on={(v) => setForm({ ...form, industry_en: v })}
              />
              <TextArea
                label={t("وصف مختصر (عربي)", "Short description (AR)")}
                v={form.description_ar}
                on={(v) => setForm({ ...form, description_ar: v })}
              />
              <TextArea
                label={t("وصف مختصر (إنجليزي)", "Short description (EN)")}
                v={form.description_en}
                on={(v) => setForm({ ...form, description_en: v })}
              />
              <Field
                label={t("رابط الشعار", "Logo URL")}
                v={form.logo_url}
                on={(v) => setForm({ ...form, logo_url: v })}
              />
              <Field
                label={t("الترتيب", "Display order")}
                v={String(form.display_order)}
                on={(v) => setForm({ ...form, display_order: Number(v) || 0 })}
              />
              <label className="flex items-center gap-2 text-xs sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="size-4 accent-[var(--gold)]"
                />
                {t("مفعّل (يظهر في الصفحة الرئيسية)", "Active (shown on homepage)")}
              </label>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold"
              >
                {t("إلغاء", "Cancel")}
              </button>
              <button
                onClick={save}
                disabled={busy || uploading}
                className="px-4 py-2 rounded-xl bg-[var(--gold)] text-[#0b1736] text-sm font-bold disabled:opacity-50"
              >
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
      <input
        value={v}
        onChange={(e) => on(e.target.value)}
        className="w-full h-10 px-3 rounded-xl bg-white/[0.06] border border-white/10 focus:border-[var(--gold)] outline-none text-sm"
      />
    </label>
  );
}

function TextArea({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <label className="block text-xs">
      <span className="block mb-1 text-white/60 font-semibold">{label}</span>
      <textarea
        value={v}
        onChange={(e) => on(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 focus:border-[var(--gold)] outline-none text-sm resize-y"
      />
    </label>
  );
}
