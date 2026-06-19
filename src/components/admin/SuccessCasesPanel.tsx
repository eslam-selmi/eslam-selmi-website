import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Trash2, Eye, EyeOff, Plus, X, Languages, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { translateTexts } from "@/lib/translate.functions";

type SuccessCaseRow = {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  challenges_ar: string | null;
  challenges_en: string | null;
  solutions_ar: string | null;
  solutions_en: string | null;
  results_ar: string | null;
  results_en: string | null;
  tools: string[] | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  external_url: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
};

const empty = {
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  challenges_ar: "",
  challenges_en: "",
  solutions_ar: "",
  solutions_en: "",
  results_ar: "",
  results_en: "",
  tools: "",
  cover_image_url: "",
  gallery_urls: "",
  external_url: "",
  display_order: 0,
};

export function SuccessCasesPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [items, setItems] = useState<SuccessCaseRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SuccessCaseRow | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [busy, setBusy] = useState(false);
  const [translating, setTranslating] = useState(false);
  const translate = useServerFn(translateTexts);

  async function autoTranslateEmptyEn(f: typeof empty): Promise<typeof empty> {
    const fields: Array<keyof typeof empty> = [
      "name_ar", "description_ar", "challenges_ar", "solutions_ar", "results_ar",
    ];
    const enKeys: Array<keyof typeof empty> = [
      "name_en", "description_en", "challenges_en", "solutions_en", "results_en",
    ];
    const pending: { idx: number; arText: string }[] = [];
    fields.forEach((arKey, i) => {
      const ar = String(f[arKey] || "").trim();
      const en = String(f[enKeys[i]] || "").trim();
      if (ar && !en) pending.push({ idx: i, arText: ar });
    });
    if (pending.length === 0) return f;
    const res = await translate({
      data: { texts: pending.map((p) => p.arText), target: "en" },
    });
    const next = { ...f };
    pending.forEach((p, i) => {
      const t = res.translations?.[i];
      if (t && typeof t === "string") (next as any)[enKeys[p.idx]] = t;
    });
    return next;
  }

  async function manualTranslate() {
    setTranslating(true);
    try {
      const next = await autoTranslateEmptyEn(form);
      setForm(next);
      toast.success(t("تمت الترجمة", "Translated"));
    } catch (e: any) {
      toast.error(e?.message || "Translation failed");
    } finally {
      setTranslating(false);
    }
  }

  async function load() {
    const { data } = await supabase
      .from("success_cases" as any)
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems(((data as unknown) as SuccessCaseRow[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(it: SuccessCaseRow) {
    setEditing(it);
    setForm({
      name_ar: it.name_ar,
      name_en: it.name_en || "",
      description_ar: it.description_ar || "",
      description_en: it.description_en || "",
      challenges_ar: it.challenges_ar || "",
      challenges_en: it.challenges_en || "",
      solutions_ar: it.solutions_ar || "",
      solutions_en: it.solutions_en || "",
      results_ar: it.results_ar || "",
      results_en: it.results_en || "",
      tools: (it.tools || []).join(", "),
      cover_image_url: it.cover_image_url || "",
      gallery_urls: (it.gallery_urls || []).join("\n"),
      external_url: it.external_url || "",
      display_order: it.display_order || 0,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name_ar.trim()) {
      toast.error(t("الاسم بالعربية مطلوب", "Arabic name is required"));
      return;
    }
    setBusy(true);
    const payload = {
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim() || null,
      description_ar: form.description_ar.trim() || null,
      description_en: form.description_en.trim() || null,
      challenges_ar: form.challenges_ar.trim() || null,
      challenges_en: form.challenges_en.trim() || null,
      solutions_ar: form.solutions_ar.trim() || null,
      solutions_en: form.solutions_en.trim() || null,
      results_ar: form.results_ar.trim() || null,
      results_en: form.results_en.trim() || null,
      tools: form.tools.split(",").map((s) => s.trim()).filter(Boolean),
      cover_image_url: form.cover_image_url.trim() || null,
      gallery_urls: form.gallery_urls.split("\n").map((s) => s.trim()).filter(Boolean),
      external_url: form.external_url.trim() || null,
      display_order: Number(form.display_order) || 0,
    };
    const { error } = editing
      ? await supabase.from("success_cases" as any).update(payload).eq("id", editing.id)
      : await supabase.from("success_cases" as any).insert(payload);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? t("تم التحديث", "Updated") : t("تمت الإضافة", "Added"));
    setOpen(false);
    load();
  }

  async function toggleVisible(it: SuccessCaseRow) {
    const { error } = await supabase
      .from("success_cases" as any)
      .update({ is_visible: !it.is_visible })
      .eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function remove(id: string) {
    if (!confirm(t("حذف هذه الحالة؟", "Delete this case?"))) return;
    const { error } = await supabase.from("success_cases" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحذف", "Deleted"));
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-bold text-lg">
          {t("حالات النجاح", "Success Cases")} ({items.length})
        </h3>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] text-[#0b1736] px-4 py-2 text-sm font-bold hover:opacity-90 transition"
        >
          <Plus className="size-4" />
          {t("إضافة حالة", "Add case")}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-white/50 text-sm rounded-2xl border border-dashed border-white/15">
          {t("لا توجد حالات بعد.", "No cases yet.")}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-sm leading-tight">{it.name_ar}</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${it.is_visible ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"}`}
                >
                  {it.is_visible ? t("ظاهر", "Visible") : t("مخفي", "Hidden")}
                </span>
              </div>
              {it.description_ar && (
                <p className="text-xs text-white/60 mt-2 line-clamp-3">{it.description_ar}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => openEdit(it)}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 font-semibold"
                >
                  {t("تعديل", "Edit")}
                </button>
                <button
                  onClick={() => toggleVisible(it)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15"
                  title={it.is_visible ? t("إخفاء", "Hide") : t("إظهار", "Show")}
                >
                  {it.is_visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-auto rounded-2xl bg-[#0b1736] border border-white/10 p-6 text-white" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-3 end-3 size-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <X className="size-4" />
            </button>
            <h3 className="font-display font-bold text-lg mb-4">
              {editing ? t("تعديل الحالة", "Edit case") : t("حالة جديدة", "New case")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t("الاسم (عربي)*", "Name (Arabic)*")} v={form.name_ar} on={(v) => setForm({ ...form, name_ar: v })} />
              <Field label={t("الاسم (إنجليزي)", "Name (English)")} v={form.name_en} on={(v) => setForm({ ...form, name_en: v })} />
              <TextArea label={t("الوصف (عربي)", "Description (AR)")} v={form.description_ar} on={(v) => setForm({ ...form, description_ar: v })} />
              <TextArea label={t("الوصف (إنجليزي)", "Description (EN)")} v={form.description_en} on={(v) => setForm({ ...form, description_en: v })} />
              <TextArea label={t("التحديات (عربي)", "Challenges (AR)")} v={form.challenges_ar} on={(v) => setForm({ ...form, challenges_ar: v })} />
              <TextArea label={t("التحديات (إنجليزي)", "Challenges (EN)")} v={form.challenges_en} on={(v) => setForm({ ...form, challenges_en: v })} />
              <TextArea label={t("الحلول والتنفيذ (عربي)", "Solutions (AR)")} v={form.solutions_ar} on={(v) => setForm({ ...form, solutions_ar: v })} />
              <TextArea label={t("الحلول والتنفيذ (إنجليزي)", "Solutions (EN)")} v={form.solutions_en} on={(v) => setForm({ ...form, solutions_en: v })} />
              <TextArea label={t("النتائج (عربي)", "Results (AR)")} v={form.results_ar} on={(v) => setForm({ ...form, results_ar: v })} />
              <TextArea label={t("النتائج (إنجليزي)", "Results (EN)")} v={form.results_en} on={(v) => setForm({ ...form, results_en: v })} />
              <Field label={t("الأدوات (بفاصلة)", "Tools (comma-separated)")} v={form.tools} on={(v) => setForm({ ...form, tools: v })} />
              <Field label={t("الترتيب", "Order")} v={String(form.display_order)} on={(v) => setForm({ ...form, display_order: Number(v) || 0 })} />
              <Field label={t("رابط صورة الغلاف", "Cover image URL")} v={form.cover_image_url} on={(v) => setForm({ ...form, cover_image_url: v })} />
              <Field label={t("رابط خارجي", "External URL")} v={form.external_url} on={(v) => setForm({ ...form, external_url: v })} />
              <div className="sm:col-span-2">
                <TextArea label={t("روابط صور إضافية (سطر لكل رابط)", "Gallery URLs (one per line)")} v={form.gallery_urls} on={(v) => setForm({ ...form, gallery_urls: v })} />
              </div>
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold">
                {t("إلغاء", "Cancel")}
              </button>
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
      <span className="text-white/70">{label}</span>
      <input
        value={v}
        onChange={(e) => on(e.target.value)}
        className="mt-1 w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40"
      />
    </label>
  );
}

function TextArea({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <label className="block text-xs">
      <span className="text-white/70">{label}</span>
      <textarea
        value={v}
        onChange={(e) => on(e.target.value)}
        rows={3}
        className="mt-1 w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 resize-y"
      />
    </label>
  );
}
