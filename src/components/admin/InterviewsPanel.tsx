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
  ExternalLink,
} from "lucide-react";

type Interview = {
  id: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  cover_url: string | null;
  resource_url: string;
  sort_order: number;
  is_published: boolean;
};

const empty: Omit<Interview, "id"> = {
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  cover_url: "",
  resource_url: "",
  sort_order: 0,
  is_published: true,
};

export function InterviewsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [rows, setRows] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Interview[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function togglePublish(r: Interview) {
    const { error } = await supabase
      .from("interviews")
      .update({ is_published: !r.is_published })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function move(r: Interview, delta: number) {
    const { error } = await supabase
      .from("interviews")
      .update({ sort_order: r.sort_order + delta })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function remove(r: Interview) {
    if (!confirm(t("حذف هذه المقابلة؟", "Delete this interview?"))) return;
    const { error } = await supabase.from("interviews").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحذف", "Deleted"));
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">
            {t("المقابلات والموارد", "Interviews & resources")}
          </h2>
          <p className="text-xs text-white/55 mt-1">
            {t(
              "أضف مقابلاتك ومواردك (يوتيوب / Google Drive / PDF) — تُعرض في الصفحة الرئيسية وتفتح داخل الموقع.",
              "Add your interviews & resources (YouTube / Google Drive / PDF) — shown on the home page, opens inside the site.",
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({ ...empty, id: "" } as Interview);
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
          {t("لا توجد مقابلات بعد.", "No interviews yet.")}
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
                {!r.is_published && (
                  <span className="absolute top-2 start-2 text-[10px] px-2 py-1 rounded-md bg-black/70 text-white/85">
                    {t("غير منشور", "Unpublished")}
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="text-white font-semibold text-sm line-clamp-2">
                  {lang === "ar" ? r.title_ar : r.title_en || r.title_ar}
                </h3>
                <p className="text-xs text-white/60 line-clamp-2">
                  {lang === "ar" ? r.description_ar : r.description_en || r.description_ar}
                </p>
                <a
                  href={r.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--gold)] hover:underline inline-flex items-center gap-1 truncate"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{r.resource_url}</span>
                </a>
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
                    {r.is_published ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                    {r.is_published ? t("إخفاء", "Hide") : t("نشر", "Publish")}
                  </button>
                  <button
                    onClick={() => move(r, -1)}
                    className="px-2 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => move(r, 1)}
                    className="px-2 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white"
                  >
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
        <InterviewEditor
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

function InterviewEditor({
  initial,
  isNew,
  onClose,
  onSaved,
}: {
  initial: Interview;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [row, setRow] = useState<Interview>(initial);
  const [saving, setSaving] = useState(false);
  const translate = useServerFn(translateArToEnCorporate);
  const [translating, setTranslating] = useState<{ title?: boolean; desc?: boolean }>({});

  function set<K extends keyof Interview>(k: K, v: Interview[K]) {
    setRow((r) => ({ ...r, [k]: v }));
  }

  async function doTranslate(field: "title" | "desc") {
    const src = field === "title" ? row.title_ar : row.description_ar;
    if (!src?.trim()) {
      toast.error(t("اكتب النص العربي أولاً", "Write the Arabic text first"));
      return;
    }
    setTranslating((s) => ({ ...s, [field]: true }));
    try {
      const res = await translate({
        data: { text: src, context: field === "title" ? "title" : "description" },
      });
      if (res.error || !res.text) {
        toast.error(t("فشل الترجمة", "Translation failed"));
      } else {
        if (field === "title") set("title_en", res.text);
        else set("description_en", res.text);
        toast.success(t("تمت الترجمة", "Translated"));
      }
    } finally {
      setTranslating((s) => ({ ...s, [field]: false }));
    }
  }

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error(t("اختر صورة", "Pick an image"));
    if (file.size > 5 * 1024 * 1024)
      return toast.error(t("الحد الأقصى ٥ ميجا", "Max size 5 MB"));
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `interviews/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("public-uploads")
      .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("public-uploads").getPublicUrl(path);
    set("cover_url", data.publicUrl);
    toast.success(t("تم رفع الصورة", "Cover uploaded"));
  }

  async function save() {
    if (!row.title_ar.trim()) return toast.error(t("العنوان مطلوب", "Title is required"));
    if (!row.resource_url.trim())
      return toast.error(t("رابط المورد مطلوب", "Resource URL is required"));
    setSaving(true);
    if (isNew) {
      const { error } = await supabase.from("interviews").insert({
        title_ar: row.title_ar,
        title_en: row.title_en || null,
        description_ar: row.description_ar || null,
        description_en: row.description_en || null,
        cover_url: row.cover_url || null,
        resource_url: row.resource_url,
        sort_order: row.sort_order || 0,
        is_published: row.is_published,
      });
      setSaving(false);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("interviews")
        .update({
          title_ar: row.title_ar,
          title_en: row.title_en || null,
          description_ar: row.description_ar || null,
          description_en: row.description_en || null,
          cover_url: row.cover_url || null,
          resource_url: row.resource_url,
          sort_order: row.sort_order,
          is_published: row.is_published,
        })
        .eq("id", row.id);
      setSaving(false);
      if (error) return toast.error(error.message);
    }
    toast.success(t("تم الحفظ", "Saved"));
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="min-h-full grid place-items-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-2xl dash-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">
              {isNew ? t("مقابلة جديدة", "New interview") : t("تعديل مقابلة", "Edit interview")}
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
                <img
                  src={row.cover_url}
                  className="w-24 h-16 object-cover rounded-lg border border-white/15"
                  alt=""
                />
              ) : (
                <div className="w-24 h-16 rounded-lg bg-white/5 border border-dashed border-white/15 grid place-items-center text-white/40">
                  <Upload className="w-4 h-4" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> {t("رفع صورة", "Upload")}
                <input type="file" accept="image/*" className="hidden" onChange={uploadCover} />
              </label>
              {row.cover_url && (
                <button
                  onClick={() => set("cover_url", "")}
                  className="text-xs text-red-300 hover:text-red-200"
                >
                  {t("إزالة", "Remove")}
                </button>
              )}
            </div>
            <input
              type="url"
              value={row.cover_url || ""}
              onChange={(e) => set("cover_url", e.target.value)}
              placeholder={t("أو ألصق رابط صورة", "Or paste an image URL")}
              className="mt-2 w-full h-9 px-3 rounded-lg bg-white/5 border border-white/15 text-white text-xs"
            />
          </div>

          {/* Title AR + translate + EN */}
          <FieldBilingual
            label={t("العنوان", "Title")}
            ar={row.title_ar}
            en={row.title_en || ""}
            onAr={(v) => set("title_ar", v)}
            onEn={(v) => set("title_en", v)}
            onTranslate={() => doTranslate("title")}
            translating={!!translating.title}
          />

          {/* Description AR + translate + EN */}
          <FieldBilingual
            label={t("الوصف القصير", "Short description")}
            multiline
            ar={row.description_ar || ""}
            en={row.description_en || ""}
            onAr={(v) => set("description_ar", v)}
            onEn={(v) => set("description_en", v)}
            onTranslate={() => doTranslate("desc")}
            translating={!!translating.desc}
          />

          {/* Resource URL */}
          <label className="block text-xs">
            <span className="text-white/70">
              {t("رابط المورد (يوتيوب / Drive / PDF)", "Resource URL (YouTube / Drive / PDF)")}
            </span>
            <input
              type="url"
              value={row.resource_url}
              onChange={(e) => set("resource_url", e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-white text-sm"
            />
          </label>

          <div className="flex items-center gap-4 text-xs text-white/70">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={row.is_published}
                onChange={(e) => set("is_published", e.target.checked)}
              />
              {t("منشور", "Published")}
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
            <button
              onClick={onClose}
              className="px-4 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm"
            >
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
  const sized = multiline ? "py-2 min-h-[80px]" : "h-10";

  return (
    <div className="space-y-2">
      <div className="text-xs text-white/70">{label}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-white/45">
            {t("عربي", "Arabic")}
          </div>
          <Tag
            value={ar}
            onChange={(e: any) => onAr(e.target.value)}
            dir="rtl"
            className={`${base} ${sized}`}
          />
          <button
            type="button"
            onClick={onTranslate}
            disabled={translating || !ar.trim()}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 h-7 rounded-md bg-gradient-to-b from-[var(--gold)]/85 to-[#c89a3a]/85 text-[#0b1736] disabled:opacity-50"
          >
            {translating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {t("ترجم احترافياً للإنجليزية", "Translate to English")}
          </button>
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-white/45">
            {t("إنجليزي", "English")}
          </div>
          <Tag
            value={en}
            onChange={(e: any) => onEn(e.target.value)}
            dir="ltr"
            className={`${base} ${sized}`}
          />
        </div>
      </div>
    </div>
  );
}
