import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Plus, Trash2, Save, Loader2, Film, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSiteContent } from "@/lib/site-content";
import { DEFAULT_VIDEOS, SITE_VIDEOS_KEY, siteVideosOptions, useSiteVideos, type SiteVideo } from "@/lib/site-videos";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function VideosPanel() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const qc = useQueryClient();
  const { data, isPending, isError, refetch } = useSiteVideos();
  const [config, setConfig] = useState(DEFAULT_VIDEOS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  useEffect(() => { if (data) setConfig(data); }, [data]);
  const update = (key: string, patch: Partial<SiteVideo>) => setConfig(c => ({ ...c, videos: c.videos.map(v => v.key === key ? { ...v, ...patch } : v) }));
  const move = (i: number, d: number) => setConfig(c => { const a = [...c.videos], x = a[i], y = a[i + d]; if (!x || !y) return c; a[i] = y; a[i + d] = x; return { ...c, videos: a }; });
  const add = () => setConfig(c => ({ ...c, videos: [...c.videos, { key: `video-${crypto.randomUUID().slice(0, 8)}`, titleAr: "", titleEn: "", descAr: "", descEn: "", url: "", poster: "", visible: true }] }));

  async function upload(key: string, file: File | undefined, field: "url" | "poster") {
    if (!file) return;
    const allowed = field === "url" ? VIDEO_TYPES : IMAGE_TYPES;
    if (!allowed.includes(file.type)) return toast.error(field === "url" ? t("اختر فيديو MP4 أو WebM أو MOV", "Choose an MP4, WebM or MOV video") : t("اختر صورة JPG أو PNG أو WebP", "Choose a JPG, PNG or WebP image"));
    setUploading(key + field);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      const path = `site-videos/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("public-uploads").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: signed, error: e2 } = await supabase.storage.from("public-uploads").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (e2 || !signed?.signedUrl) throw e2 || new Error("URL unavailable");
      update(key, { [field]: signed.signedUrl });
      toast.success(t("تم الرفع — اضغط حفظ", "Uploaded — press Save"));
    } catch (e) { toast.error(e instanceof Error ? e.message : t("تعذر الرفع", "Upload failed")); }
    finally { setUploading(null); }
  }

  async function save() {
    if (config.videos.some(v => !v.url.trim())) return toast.error(t("كل فيديو محتاج رابط أو ملف مرفوع", "Every video needs a link or uploaded file"));
    setSaving(true);
    try {
      const existing = await supabase.from("site_content").select("id").eq("section_key", SITE_VIDEOS_KEY).maybeSingle();
      if (existing.error) throw existing.error;
      const content = { ...config, videos: config.videos.map(v => ({ ...v })) };
      const r = existing.data ? await supabase.from("site_content").update({ content }).eq("id", existing.data.id) : await supabase.from("site_content").insert({ section_key: SITE_VIDEOS_KEY, label: "قسم الفيديوهات", content, is_visible: true });
      if (r.error) throw r.error;
      await qc.invalidateQueries({ queryKey: siteVideosOptions.queryKey });
      invalidateSiteContent();
      toast.success(t("تم حفظ الفيديوهات", "Videos saved"));
    } catch { toast.error(t("تعذر الحفظ، حاول مرة أخرى", "Could not save. Please retry.")); }
    finally { setSaving(false); }
  }

  return <section className="dash-card p-5 space-y-4" aria-label={t("إدارة قسم الفيديوهات", "Videos section management")}>
    <h3 className="font-bold flex items-center gap-2"><Film className="size-5 text-accent" />{t("قسم الفيديوهات", "Videos section")}</h3>
    <p className="text-sm text-muted-foreground">{t("ارفع فيديو أو الصق رابط يوتيوب / فيميو / جوجل درايف. القسم يظهر في الصفحة الرئيسية لما يكون فيه فيديو ظاهر واحد على الأقل.", "Upload a video or paste a YouTube / Vimeo / Google Drive link. The section shows on the homepage once at least one video is visible.")}</p>
    {isError ? <Button variant="outline" onClick={() => refetch()}>{t("إعادة المحاولة", "Retry")}</Button> : <fieldset disabled={saving || isPending} className="space-y-4 min-w-0">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm space-y-1 block">{t("العبارة أعلى العنوان بالعربية", "Eyebrow — Arabic")}<Input dir="rtl" value={config.eyebrowAr} onChange={e => setConfig(c => ({ ...c, eyebrowAr: e.target.value }))} /></label>
        <label className="text-sm space-y-1 block">{t("العبارة أعلى العنوان بالإنجليزية", "Eyebrow — English")}<Input dir="ltr" value={config.eyebrowEn} onChange={e => setConfig(c => ({ ...c, eyebrowEn: e.target.value }))} /></label>
        <label className="text-sm space-y-1 block">{t("عنوان القسم بالعربية", "Title — Arabic")}<Input dir="rtl" value={config.titleAr} onChange={e => setConfig(c => ({ ...c, titleAr: e.target.value }))} /></label>
        <label className="text-sm space-y-1 block">{t("عنوان القسم بالإنجليزية", "Title — English")}<Input dir="ltr" value={config.titleEn} onChange={e => setConfig(c => ({ ...c, titleEn: e.target.value }))} /></label>
      </div>
      {config.videos.map((v, i) => <div key={v.key} className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm">{t("فيديو", "Video")} {i + 1}</span>
          <div className="flex items-center gap-1">
            <label className="flex items-center gap-2 text-xs me-2"><Switch checked={v.visible} onCheckedChange={visible => update(v.key, { visible })} />{t("ظاهر", "Visible")}</label>
            <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("لأعلى", "Up")}><ArrowUp className="size-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === config.videos.length - 1} aria-label={t("لأسفل", "Down")}><ArrowDown className="size-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => setConfig(c => ({ ...c, videos: c.videos.filter(x => x.key !== v.key) }))} aria-label={t("حذف", "Delete")}><Trash2 className="size-4 text-destructive" /></Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input dir="ltr" placeholder="https://youtube.com/watch?v=…" value={v.url} onChange={e => update(v.key, { url: e.target.value })} aria-label={t("رابط الفيديو", "Video link")} />
          <Button type="button" variant="outline" asChild><label className="cursor-pointer shrink-0">{uploading === v.key + "url" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{t("رفع فيديو", "Upload video")}<input type="file" accept={VIDEO_TYPES.join(",")} className="sr-only" disabled={!!uploading} onChange={e => { void upload(v.key, e.target.files?.[0], "url"); e.target.value = ""; }} /></label></Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {v.poster && <img src={v.poster} alt="" className="h-14 aspect-video rounded object-cover" />}
          <Button type="button" variant="outline" size="sm" asChild><label className="cursor-pointer">{uploading === v.key + "poster" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{t("صورة غلاف (اختياري)", "Cover image (optional)")}<input type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" disabled={!!uploading} onChange={e => { void upload(v.key, e.target.files?.[0], "poster"); e.target.value = ""; }} /></label></Button>
          {v.poster && <Button size="sm" variant="ghost" onClick={() => update(v.key, { poster: "" })}>{t("إزالة الغلاف", "Remove cover")}</Button>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input dir="rtl" placeholder={t("العنوان بالعربية", "Title — Arabic")} value={v.titleAr} onChange={e => update(v.key, { titleAr: e.target.value })} />
          <Input dir="ltr" placeholder={t("العنوان بالإنجليزية", "Title — English")} value={v.titleEn} onChange={e => update(v.key, { titleEn: e.target.value })} />
          <Textarea dir="rtl" rows={2} placeholder={t("وصف قصير بالعربية", "Short description — Arabic")} value={v.descAr} onChange={e => update(v.key, { descAr: e.target.value })} />
          <Textarea dir="ltr" rows={2} placeholder={t("وصف قصير بالإنجليزية", "Short description — English")} value={v.descEn} onChange={e => update(v.key, { descEn: e.target.value })} />
        </div>
      </div>)}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={add}><Plus className="size-4" />{t("إضافة فيديو", "Add video")}</Button>
        <Button type="button" onClick={save}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{t("حفظ", "Save")}</Button>
      </div>
    </fieldset>}
  </section>;
}
