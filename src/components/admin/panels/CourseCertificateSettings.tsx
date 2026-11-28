import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Languages, RotateCcw, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CertificatePreview } from "@/components/certificates/CertificateDocument";
import { translateTexts } from "@/lib/translate.functions";
import {
  CERT_TEXT_FIELDS, CERT_TOGGLES, certText, defaultCertificateSettings, readCertificateSettings,
  type CertTextKey, type CertificateSettings,
} from "@/lib/certificate-settings";
import type { Json } from "@/integrations/supabase/types";

const COLOR_LABELS = { paper: "لون الورقة", ink: "لون النص", accent: "لون التمييز", line: "لون الخطوط" } as const;

export function CourseCertificateSettings({ course }: { course: { id: string; title: string; total_hours?: number | null; brand_name?: string | null } }) {
  const [s, setS] = useState<CertificateSettings>(defaultCertificateSettings);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "translate" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<"ar" | "en">("ar");

  useEffect(() => {
    supabase.from("courses").select("certificate_settings").eq("id", course.id).maybeSingle().then(({ data }) => {
      setS(readCertificateSettings(data?.certificate_settings)); setLoading(false);
    });
  }, [course.id]);

  const setText = (lang: "ar" | "en", k: CertTextKey, v: string) => setS((p) => ({ ...p, [lang]: { ...p[lang], [k]: v } }));

  async function translateAll(): Promise<CertificateSettings> {
    const keys: CertTextKey[] = CERT_TEXT_FIELDS.map((f) => f[0]).filter((k) => s.ar[k]?.trim());
    const texts = keys.map((k) => (s.ar[k] ?? "").trim());
    // English certificate shows the course name in English too, unless set manually
    if (!s.ar.courseTitle?.trim() && !s.en.courseTitle?.trim() && /[\u0600-\u06FF]/.test(course.title)) { keys.push("courseTitle"); texts.push(course.title); }
    if (!keys.length) return s;
    const { translations, error } = await translateTexts({ data: { texts, target: "en" } });
    if (error) throw new Error("تعذرت الترجمة التلقائية، راجع النصوص الإنجليزية يدوياً");
    const en = { ...s.en };
    keys.forEach((k, i) => { en[k] = translations[i]; });
    const next = { ...s, en };
    setS(next);
    return next;
  }

  async function save(withTranslate: boolean) {
    setBusy(withTranslate ? "translate" : "save");
    try {
      if (withTranslate) { await translateAll(); setPreview("en"); toast.success("الترجمة جاهزة للمراجعة، احفظ بعد تعديلها"); return; }
      const value = s;
      const { error } = await supabase.from("courses").update({ certificate_settings: value as unknown as Json }).eq("id", course.id);
      if (error) throw error;
      toast.success("تم حفظ إعدادات الشهادة");
    } catch (e) { toast.error(e instanceof Error ? e.message : "تعذر الحفظ"); }
    finally { setBusy(null); }
  }

  async function uploadSignature(file: File) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) return toast.error("ارفع صورة PNG أو JPG أو WEBP بحجم أقل من 2 ميجا");
    setUploading(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `certificate-signatures/${course.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("course-files").upload(path, file, { contentType: file.type });
      if (error) throw error;
      setS((p) => ({ ...p, signaturePath: path }));
      toast.success("تم رفع صورة التوقيع، احفظ الإعدادات لتطبيقها");
    } catch (e) { toast.error(e instanceof Error ? e.message : "تعذر رفع الصورة"); }
    finally { setUploading(false); }
  }

  if (loading) return <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>;

  return <div className="space-y-6" dir="rtl">
    <div className="dash-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-bold">معاينة مباشرة</h4>
        <div className="flex gap-1">
          <Button size="sm" variant={preview === "ar" ? "default" : "outline"} onClick={() => setPreview("ar")}>العربية</Button>
          <Button size="sm" variant={preview === "en" ? "default" : "outline"} onClick={() => setPreview("en")}>English</Button>
        </div>
      </div>
      <CertificatePreview payload={{ certificateId: "preview", studentName: preview === "ar" ? "محمد أحمد علي" : "Mohamed Ahmed Ali", courseTitle: course.title, totalHours: Number(course.total_hours ?? 0) || 24, issueDate: new Date(), lang: preview, courseBrandName: course.brand_name, settings: s }} />
    </div>

    <div className="dash-card p-4 space-y-3">
      <h4 className="font-bold">النصوص</h4>
      <p className="text-xs text-muted-foreground">راجع النصوص الإنجليزية قبل الحفظ. الحقل الفارغ يستخدم النص الافتراضي.</p>
      <div className="grid gap-3">
        {CERT_TEXT_FIELDS.map(([k, label]) => <div key={k} className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs space-y-1"><span className="text-muted-foreground">{label}</span>
            <input dir="rtl" value={s.ar[k] ?? ""} placeholder={certText(defaultCertificateSettings, "ar", k)} onChange={(e) => setText("ar", k, e.target.value)} className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm" /></label>
          <label className="text-xs space-y-1"><span className="text-muted-foreground">English</span>
            <input dir="ltr" value={s.en[k] ?? ""} placeholder={certText(defaultCertificateSettings, "en", k)} onChange={(e) => setText("en", k, e.target.value)} className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm" /></label>
        </div>)}
      </div>
    </div>

    <div className="dash-card p-4 space-y-4">
      <h4 className="font-bold">التصميم</h4>
      <div className="space-y-2" role="radiogroup" aria-label="تنسيق الشهادة">
        <div><span className="block text-sm font-bold">تنسيق الشهادة</span><span className="block text-xs text-muted-foreground">يُطبَّق على كل الشهادات التي تُصدر لهذا الكورس بعد الحفظ.</span></div>
        <div className="flex flex-wrap gap-3">
          {([["portrait", "عمودي", "Portrait", "h-16 w-12"], ["landscape", "أفقي", "Landscape", "h-12 w-16"]] as const).map(([v, ar, en, box]) => <button key={v} type="button" role="radio" aria-checked={s.orientation === v} onClick={() => setS((p) => ({ ...p, orientation: v }))}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${s.orientation === v ? "border-primary bg-primary/15 ring-1 ring-primary" : "border-border bg-transparent opacity-80 hover:opacity-100"}`}>
            <span className={`${box} flex flex-col items-center justify-between rounded-[3px] border border-border bg-[#f4f5f2] py-1`} aria-hidden="true"><i className="block h-1 w-full bg-[#0f2a63]" /><i className="block size-3 rounded-full border-2 border-[#0f2a63]" /><i className="block h-1 w-full bg-[#0f2a63]" /></span>
            <span className="text-start font-bold">{ar}<span className="block text-xs font-normal text-muted-foreground" dir="ltr">{en}</span></span>
          </button>)}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {(Object.keys(COLOR_LABELS) as (keyof typeof COLOR_LABELS)[]).map((k) => <label key={k} className="text-xs space-y-1"><span className="text-muted-foreground">{COLOR_LABELS[k]}</span>
          <input type="color" value={s.colors[k]} onChange={(e) => setS((p) => ({ ...p, colors: { ...p.colors, [k]: e.target.value } }))} className="block h-10 w-full rounded-lg border border-border bg-secondary" /></label>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {([["titleScale", "حجم العنوان"], ["nameScale", "حجم اسم المتدرب"]] as const).map(([k, label]) => <label key={k} className="text-xs space-y-1"><span className="text-muted-foreground">{label}: {s[k]}%</span>
          <input type="range" min={60} max={150} value={s[k]} onChange={(e) => setS((p) => ({ ...p, [k]: Number(e.target.value) }))} className="w-full" /></label>)}
      </div>
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">صورة توقيع المدرب لهذا الكورس (PNG بخلفية شفافة يفضّل). بدونها لا يظهر توقيع، يظهر الاسم فقط.</span>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex"><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void uploadSignature(f); }} />
            <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm"><ImagePlus className="size-4" /> {uploading ? "جارٍ الرفع…" : s.signaturePath ? "تغيير صورة التوقيع" : "رفع صورة التوقيع"}</span></label>
          {s.signaturePath && <Button size="sm" variant="ghost" onClick={() => setS((p) => ({ ...p, signaturePath: "" }))}><Trash2 className="size-4" /> إزالة</Button>}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {CERT_TOGGLES.map(([k, label]) => <label key={k} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.toggles[k]} onChange={(e) => setS((p) => ({ ...p, toggles: { ...p.toggles, [k]: e.target.checked } }))} /> إظهار {label}</label>)}
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <Button onClick={() => void save(true)} disabled={!!busy}><Languages className="size-4" /> {busy === "translate" ? "جارٍ الترجمة…" : "ترجمة ومراجعة"}</Button>
      <Button variant="outline" onClick={() => void save(false)} disabled={!!busy}><Save className="size-4" /> حفظ فقط</Button>
      <Button variant="ghost" onClick={() => setS(structuredClone(defaultCertificateSettings))} disabled={!!busy}><RotateCcw className="size-4" /> استعادة الافتراضي</Button>
    </div>
    <p className="text-xs text-muted-foreground">التغييرات تُطبَّق على الشهادات التي تُصدر بعد الحفظ.</p>
  </div>;
}
