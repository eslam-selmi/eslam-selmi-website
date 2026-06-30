import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { translateArToEnCorporate } from "@/lib/translate-corporate.functions";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Upload,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  X,
  Star,
} from "lucide-react";

type Training = {
  id: string;
  title_ar: string;
  title_en: string | null;
  role_ar: string | null;
  role_en: string | null;
  period_ar: string | null;
  period_en: string | null;
  cover_url: string | null;
  challenge_ar: string | null;
  challenge_en: string | null;
  solution_ar: string | null;
  solution_en: string | null;
  result_ar: string | null;
  result_en: string | null;
  gallery: string[];
  tags: string[];
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
};

const empty: Omit<Training, "id"> = {
  title_ar: "",
  title_en: "",
  role_ar: "",
  role_en: "",
  period_ar: "",
  period_en: "",
  cover_url: "",
  challenge_ar: "",
  challenge_en: "",
  solution_ar: "",
  solution_en: "",
  result_ar: "",
  result_en: "",
  gallery: [],
  tags: [],
  sort_order: 0,
  is_featured: false,
  is_published: true,
};

export function TrainingsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [rows, setRows] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Training | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("trainings")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data as any) ?? []).map((r: any) => ({ ...r, gallery: r.gallery || [], tags: r.tags || [] })));
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function togglePublish(r: Training) {
    const { error } = await supabase.from("trainings").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function toggleFeatured(r: Training) {
    const { error } = await supabase.from("trainings").update({ is_featured: !r.is_featured }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function move(r: Training, delta: number) {
    const { error } = await supabase.from("trainings").update({ sort_order: r.sort_order + delta }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function remove(r: Training) {
    if (!confirm(t("حذف هذه الحالة الدراسية؟", "Delete this case study?"))) return;
    const { error } = await supabase.from("trainings").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحذف", "Deleted"));
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">
            {t("التدريبات وحالات النجاح", "Trainings & case studies")}
          </h2>
          <p className="text-xs text-white/55 mt-1">
            {t(
              "أضف الحالات الدراسية لبرامجك التدريبية — التحدي، الحل، النتيجة، مع صور المعرض.",
              "Add case studies for your training programs — challenge, solution, result, with gallery images.",
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({ ...empty, id: "" } as Training);
            setCreating(true);
          }}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] text-sm font-bold shadow-[0_8px_24px_-10px_rgba(212,175,55,0.6)]"
        >
          <Plus className="w-4 h-4" /> {t("إضافة جديدة", "Add new")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("جارٍ التحميل…", "Loading…")}
        </div>
      ) : rows.length === 0 ? (
        <div className="dash-card p-10 text-center text-white/60">
          {t("لا توجد حالات دراسية بعد.", "No case studies yet.")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((r) => (
            <div key={r.id} className="dash-card overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-white/5">
                {r.cover_url ? (
                  <img src={r.cover_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-white/30 text-xs">
                    {t("بدون صورة", "No cover")}
                  </div>
                )}
                <div className="absolute top-2 start-2 flex gap-1.5">
                  {!r.is_published && (
                    <span className="text-[10px] px-2 py-1 rounded-md bg-black/70 text-white/85">
                      {t("غير منشور", "Unpublished")}
                    </span>
                  )}
                  {r.is_featured && (
                    <span className="text-[10px] px-2 py-1 rounded-md bg-[var(--gold)]/85 text-[#0b1736] font-semibold inline-flex items-center gap-1">
                      <Star className="w-3 h-3" /> {t("مميز", "Featured")}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="text-white font-semibold text-sm line-clamp-2">
                  {lang === "ar" ? r.title_ar : r.title_en || r.title_ar}
                </h3>
                <div className="text-[11px] text-white/60 flex gap-2 flex-wrap">
                  {(lang === "ar" ? r.role_ar : r.role_en) && (
                    <span>{lang === "ar" ? r.role_ar : r.role_en}</span>
                  )}
                  {(lang === "ar" ? r.period_ar : r.period_en) && (
                    <span>· {lang === "ar" ? r.period_ar : r.period_en}</span>
                  )}
                </div>
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.tags.slice(0, 5).map((tag, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[11px] text-white/45">
                  {r.gallery.length} {t("صورة في المعرض", "gallery images")}
                </div>
                <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setEditing(r);
                      setCreating(false);
                    }}
                    className="px-3 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white inline-flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> {t("تعديل", "Edit")}
                  </button>
                  <button
                    onClick={() => togglePublish(r)}
                    className="px-3 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white inline-flex items-center gap-1"
                  >
                    {r.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {r.is_published ? t("إخفاء", "Hide") : t("نشر", "Publish")}
                  </button>
                  <button
                    onClick={() => toggleFeatured(r)}
                    className={`px-3 h-8 rounded-lg text-xs inline-flex items-center gap-1 ${
                      r.is_featured ? "bg-[var(--gold)]/20 text-[var(--gold)]" : "bg-white/10 hover:bg-white/15 text-white"
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    {r.is_featured ? t("مميز", "Featured") : t("تمييز", "Feature")}
                  </button>
                  <button onClick={() => move(r, -1)} className="px-2 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => move(r, 1)} className="px-2 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="px-3 h-8 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-xs text-red-200 inline-flex items-center gap-1 ms-auto"
                  >
                    <Trash2 className="w-3 h-3" /> {t("حذف", "Delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TrainingEditor
          initial={editing}
          isNew={creating}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function TrainingEditor({
  initial,
  isNew,
  onClose,
  onSaved,
}: {
  initial: Training;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [row, setRow] = useState<Training>(initial);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const translate = useServerFn(translateArToEnCorporate);
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  function set<K extends keyof Training>(k: K, v: Training[K]) {
    setRow((r) => ({ ...r, [k]: v }));
  }

  async function doTranslate(
    field: "title" | "role" | "period" | "challenge" | "solution" | "result",
  ) {
    const map: Record<string, { src: keyof Training; dst: keyof Training; ctx: any }> = {
      title: { src: "title_ar", dst: "title_en", ctx: "title" },
      role: { src: "role_ar", dst: "role_en", ctx: "title" },
      period: { src: "period_ar", dst: "period_en", ctx: "generic" },
      challenge: { src: "challenge_ar", dst: "challenge_en", ctx: "challenge" },
      solution: { src: "solution_ar", dst: "solution_en", ctx: "solution" },
      result: { src: "result_ar", dst: "result_en", ctx: "result" },
    };
    const m = map[field];
    const src = (row[m.src] as string) || "";
    if (!src.trim()) {
      toast.error(t("اكتب النص العربي أولاً", "Write the Arabic text first"));
      return;
    }
    setTranslating((s) => ({ ...s, [field]: true }));
    try {
      const res = await translate({ data: { text: src, context: m.ctx } });
      if (res.error || !res.text) toast.error(t("فشل الترجمة", "Translation failed"));
      else {
        set(m.dst as any, res.text as any);
        toast.success(t("تمت الترجمة", "Translated"));
      }
    } finally {
      setTranslating((s) => ({ ...s, [field]: false }));
    }
  }

  async function uploadImage(file: File, folder: "cover" | "gallery"): Promise<string | null> {
    if (!file.type.startsWith("image/")) {
      toast.error(t("اختر صورة", "Pick an image"));
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("الحد الأقصى ٥ ميجا", "Max size 5 MB"));
      return null;
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `trainings/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("public-uploads")
      .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("public-uploads").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await uploadImage(file, "cover");
    if (url) {
      set("cover_url", url);
      toast.success(t("تم رفع الصورة", "Uploaded"));
    }
  }

  async function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const urls: string[] = [];
    for (const f of files) {
      const u = await uploadImage(f, "gallery");
      if (u) urls.push(u);
    }
    if (urls.length) {
      set("gallery", [...row.gallery, ...urls]);
      toast.success(t(`تم رفع ${urls.length} صورة`, `Uploaded ${urls.length} image(s)`));
    }
  }

  function addTag() {
    const v = tagInput.trim();
    if (!v) return;
    if (row.tags.includes(v)) return;
    set("tags", [...row.tags, v]);
    setTagInput("");
  }

  async function save() {
    if (!row.title_ar.trim()) return toast.error(t("العنوان مطلوب", "Title is required"));
    setSaving(true);
    const payload = {
      title_ar: row.title_ar,
      title_en: row.title_en || null,
      role_ar: row.role_ar || null,
      role_en: row.role_en || null,
      period_ar: row.period_ar || null,
      period_en: row.period_en || null,
      cover_url: row.cover_url || null,
      challenge_ar: row.challenge_ar || null,
      challenge_en: row.challenge_en || null,
      solution_ar: row.solution_ar || null,
      solution_en: row.solution_en || null,
      result_ar: row.result_ar || null,
      result_en: row.result_en || null,
      gallery: row.gallery,
      tags: row.tags,
      sort_order: row.sort_order || 0,
      is_featured: row.is_featured,
      is_published: row.is_published,
    };
    const { error } = isNew
      ? await supabase.from("trainings").insert(payload)
      : await supabase.from("trainings").update(payload).eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحفظ", "Saved"));
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="min-h-full grid place-items-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-3xl dash-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">
              {isNew ? t("حالة دراسية جديدة", "New case study") : t("تعديل حالة دراسية", "Edit case study")}
            </h3>
            <button onClick={onClose} className="text-white/60 hover:text-white text-xs">
              {t("إغلاق", "Close")}
            </button>
          </div>

          {/* Cover */}
          <div className="text-xs">
            <div className="text-white/70 mb-1">{t("صورة الغلاف", "Cover image")}</div>
            <div className="flex items-center gap-3">
              {row.cover_url ? (
                <img src={row.cover_url} className="w-28 h-20 object-cover rounded-lg border border-white/15" alt="" />
              ) : (
                <div className="w-28 h-20 rounded-lg bg-white/5 border border-dashed border-white/15 grid place-items-center text-white/40">
                  <Upload className="w-4 h-4" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> {t("رفع صورة", "Upload")}
                <input type="file" accept="image/*" className="hidden" onChange={onCover} />
              </label>
              {row.cover_url && (
                <button onClick={() => set("cover_url", "")} className="text-xs text-red-300 hover:text-red-200">
                  {t("إزالة", "Remove")}
                </button>
              )}
            </div>
          </div>

          <FieldBilingual
            label={t("اسم البرنامج التدريبي", "Training program title")}
            ar={row.title_ar}
            en={row.title_en || ""}
            onAr={(v) => set("title_ar", v)}
            onEn={(v) => set("title_en", v)}
            onTranslate={() => doTranslate("title")}
            translating={!!translating.title}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldBilingual
              label={t("الدور / الجهة", "Role / Organization")}
              ar={row.role_ar || ""}
              en={row.role_en || ""}
              onAr={(v) => set("role_ar", v)}
              onEn={(v) => set("role_en", v)}
              onTranslate={() => doTranslate("role")}
              translating={!!translating.role}
            />
            <FieldBilingual
              label={t("الفترة الزمنية", "Period")}
              ar={row.period_ar || ""}
              en={row.period_en || ""}
              onAr={(v) => set("period_ar", v)}
              onEn={(v) => set("period_en", v)}
              onTranslate={() => doTranslate("period")}
              translating={!!translating.period}
            />
          </div>

          <FieldBilingual
            label={t("التحدي", "Challenge")}
            multiline
            ar={row.challenge_ar || ""}
            en={row.challenge_en || ""}
            onAr={(v) => set("challenge_ar", v)}
            onEn={(v) => set("challenge_en", v)}
            onTranslate={() => doTranslate("challenge")}
            translating={!!translating.challenge}
          />
          <FieldBilingual
            label={t("الحل / المنهجية", "Solution / Methodology")}
            multiline
            ar={row.solution_ar || ""}
            en={row.solution_en || ""}
            onAr={(v) => set("solution_ar", v)}
            onEn={(v) => set("solution_en", v)}
            onTranslate={() => doTranslate("solution")}
            translating={!!translating.solution}
          />
          <FieldBilingual
            label={t("النتائج", "Results")}
            multiline
            ar={row.result_ar || ""}
            en={row.result_en || ""}
            onAr={(v) => set("result_ar", v)}
            onEn={(v) => set("result_en", v)}
            onTranslate={() => doTranslate("result")}
            translating={!!translating.result}
          />

          {/* Tags */}
          <div className="text-xs space-y-2">
            <div className="text-white/70">{t("الوسوم", "Tags")}</div>
            <div className="flex flex-wrap gap-1.5">
              {row.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/10 text-white/80 text-[11px]">
                  {tag}
                  <button onClick={() => set("tags", row.tags.filter((_, j) => j !== i))} className="text-white/50 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder={t("أضف وسماً واضغط Enter", "Add a tag and press Enter")}
                className="flex-1 h-9 px-3 rounded-lg bg-white/5 border border-white/15 text-white text-xs"
              />
              <button onClick={addTag} className="px-3 h-9 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white">
                {t("إضافة", "Add")}
              </button>
            </div>
          </div>

          {/* Gallery */}
          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-white/70">
                {t("معرض الصور", "Gallery")} ({row.gallery.length})
              </div>
              <label className="inline-flex items-center gap-2 px-3 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> {t("رفع صور", "Upload images")}
                <input type="file" accept="image/*" multiple className="hidden" onChange={onGallery} />
              </label>
            </div>
            {row.gallery.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {row.gallery.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() => set("gallery", row.gallery.filter((_, j) => j !== i))}
                      className="absolute top-1 end-1 w-6 h-6 rounded-md bg-black/70 text-white opacity-0 group-hover:opacity-100 grid place-items-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-white/70 flex-wrap">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={row.is_published}
                onChange={(e) => set("is_published", e.target.checked)}
              />
              {t("منشور", "Published")}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={row.is_featured}
                onChange={(e) => set("is_featured", e.target.checked)}
              />
              {t("مميز (بطاقة كبيرة)", "Featured (big card)")}
            </label>
            <label className="inline-flex items-center gap-2">
              {t("ترتيب", "Sort")}
              <input
                type="number"
                value={row.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
                className="w-20 h-8 px-2 rounded-lg bg-white/5 border border-white/15 text-white"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button onClick={onClose} className="px-4 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm">
              {t("إلغاء", "Cancel")}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-5 h-10 rounded-lg bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("حفظ", "Save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldBilingual({
  label,
  ar,
  en,
  onAr,
  onEn,
  onTranslate,
  translating,
  multiline,
}: {
  label: string;
  ar: string;
  en: string;
  onAr: (v: string) => void;
  onEn: (v: string) => void;
  onTranslate: () => void;
  translating: boolean;
  multiline?: boolean;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const Tag: any = multiline ? "textarea" : "input";
  const base =
    "w-full px-3 rounded-lg bg-white/5 border border-white/15 text-white text-sm focus:border-[var(--gold)]/50 outline-none";
  const sized = multiline ? "py-2 min-h-[90px]" : "h-10";

  return (
    <div className="space-y-2">
      <div className="text-xs text-white/70">{label}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-white/45">{t("عربي", "Arabic")}</div>
          <Tag value={ar} onChange={(e: any) => onAr(e.target.value)} dir="rtl" className={`${base} ${sized}`} />
          <button
            type="button"
            onClick={onTranslate}
            disabled={translating || !ar.trim()}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 h-7 rounded-md bg-gradient-to-b from-[var(--gold)]/85 to-[#c89a3a]/85 text-[#0b1736] disabled:opacity-50"
          >
            {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {t("ترجم احترافياً للإنجليزية", "Translate to English")}
          </button>
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-white/45">{t("إنجليزي", "English")}</div>
          <Tag value={en} onChange={(e: any) => onEn(e.target.value)} dir="ltr" className={`${base} ${sized}`} />
        </div>
      </div>
    </div>
  );
}
