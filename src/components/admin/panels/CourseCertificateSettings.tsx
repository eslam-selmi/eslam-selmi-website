import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Languages, RotateCcw, Save } from "lucide-react";
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
  const [preview, setPreview] = useState<"ar" | "en">("ar");

  useEffect(() => {
    supabase.from("courses").select("certificate_settings").eq("id", course.id).maybeSingle().then(({ data }) => {
      setS(readCertificateSettings(data?.certificate_settings)); setLoading(false);
    });
  }, [course.id]);

  const setText = (lang: "ar" | "en", k: CertTextKey, v: string) => setS((p) => ({ ...p, [lang]: { ...p[lang], [k]: v } }));

  async function translateAll(): Promise<CertificateSettings> {
    const keys: CertTextKey[] = CERT_TEXT_FIELDS.map((f) => f[0]).filter((k) => s.ar[k]?.trim());
    const texts = keys.map((k) => s.ar[k]!.trim());
    // English certificate shows the course name in English too, unless set manually
    if (!s.ar.courseTitle?.trim() && !s.en.courseTitle?.trim() && /[\u0600-\u06FF]/.test(course.title)) { keys.push("courseTitle"); texts.push(course.title); }
    if (!keys.length) return s;
    const { translations, error } = await translateTexts({ data: { texts, target: "en" } });
    if (error) toast.error("تعذرت الترجمة التلقائية، راجع النصوص الإنجليزية يدوياً");
    const en = { ...s.en };
    keys.forEach((k, i) => { en[k] = translations[i]; });
    const next = { ...s, en };
    setS(next);
    return next;
  }

  async function save(withTranslate: boolean) {
    setBusy(withTranslate ? "translate" : "save");
    try {
      const value = withTranslate ? await translateAll() : s;
      const { error } = await supabase.from("courses").update({ certificate_settings: value as unknown as Json }).eq("id", course.id);
      if (error) throw error;
      toast.success(withTranslate ? "تمت الترجمة والحفظ" : "تم حفظ إعدادات الشهادة");
    } catch (e) { toast.error(e instanceof Error ? e.message : "تعذر الحفظ"); }
    finally { setBusy(null); }
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
      <p className="text-xs text-muted-foreground">اكتب بالعربي، واضغط «ترجمة وحفظ» لتتحول النصوص للإنجليزية تلقائياً. الحقل الفارغ يستخدم النص الافتراضي.</p>
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
      <div className="grid gap-3 sm:grid-cols-4">
        {(Object.keys(COLOR_LABELS) as (keyof typeof COLOR_LABELS)[]).map((k) => <label key={k} className="text-xs space-y-1"><span className="text-muted-foreground">{COLOR_LABELS[k]}</span>
          <input type="color" value={s.colors[k]} onChange={(e) => setS((p) => ({ ...p, colors: { ...p.colors, [k]: e.target.value } }))} className="block h-10 w-full rounded-lg border border-border bg-secondary" /></label>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {([["titleScale", "حجم العنوان"], ["nameScale", "حجم اسم المتدرب"]] as const).map(([k, label]) => <label key={k} className="text-xs space-y-1"><span className="text-muted-foreground">{label}: {s[k]}%</span>
          <input type="range" min={60} max={150} value={s[k]} onChange={(e) => setS((p) => ({ ...p, [k]: Number(e.target.value) }))} className="w-full" /></label>)}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {CERT_TOGGLES.map(([k, label]) => <label key={k} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.toggles[k]} onChange={(e) => setS((p) => ({ ...p, toggles: { ...p.toggles, [k]: e.target.checked } }))} /> إظهار {label}</label>)}
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <Button onClick={() => void save(true)} disabled={!!busy}><Languages className="size-4" /> {busy === "translate" ? "جارٍ الترجمة…" : "ترجمة للإنجليزية وحفظ"}</Button>
      <Button variant="outline" onClick={() => void save(false)} disabled={!!busy}><Save className="size-4" /> حفظ فقط</Button>
      <Button variant="ghost" onClick={() => setS(structuredClone(defaultCertificateSettings))} disabled={!!busy}><RotateCcw className="size-4" /> استعادة الافتراضي</Button>
    </div>
    <p className="text-xs text-muted-foreground">التغييرات تُطبَّق على الشهادات التي تُصدر بعد الحفظ.</p>
  </div>;
}
