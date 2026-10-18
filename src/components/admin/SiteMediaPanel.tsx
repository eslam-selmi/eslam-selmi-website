import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { invalidateSiteContent } from "@/lib/site-content";
import { siteMediaKey, useSiteMedia } from "@/lib/site-media";
import { consultationImage, courseImage, programMedia, type SiteMedia } from "@/lib/site-media-data";
import { MediaImageField } from "./MediaImageField";

export function SiteMediaPanel() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const query = useSiteMedia();
  const client = useQueryClient();
  const [draft, setDraft] = useState<SiteMedia>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const courses = useQuery({ queryKey: ["admin", "media-courses"], staleTime: 60_000, queryFn: async () => {
    const { data, error } = await supabase.from("courses").select("id,title").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
  useEffect(() => { if (!dirty && query.data) setDraft(query.data.media); }, [query.data, dirty]);
  function set(key: string, url: string) { setDraft(prev => ({ ...prev, [key]: url })); setDirty(true); }
  async function save() {
    setSaving(true);
    try {
      const payload = { content: draft, is_visible: true };
      const { error } = query.data?.id
        ? await supabase.from("site_content").update(payload).eq("id", query.data.id)
        : await supabase.from("site_content").insert({ ...payload, section_key: "site.media", label: "صور البرامج والكورسات والاستشارة" });
      if (error) throw error;
      await client.invalidateQueries({ queryKey: siteMediaKey });
      invalidateSiteContent();
      setDirty(false);
      toast.success(t("تم حفظ الصور", "Images saved"));
    } catch { toast.error(t("تعذر حفظ الصور", "Could not save images")); }
    finally { setSaving(false); }
  }
  if (query.isPending || courses.isPending) return <Loader2 className="size-5 animate-spin" />;
  if (query.isError || courses.isError) return <div role="alert">{t("تعذر تحميل الصور", "Could not load images")}<Button variant="outline" onClick={() => { void query.refetch(); void courses.refetch(); }}>{t("إعادة المحاولة", "Retry")}</Button></div>;
  return <div className="space-y-8">
    <h2 className="text-xl font-semibold">{t("صور البرامج والكورسات والاستشارة", "Program, course & consultation images")}</h2>
    <div className="max-w-xl"><MediaImageField label={t("بانر الجلسة الاستشارية", "Consultation banner")} value={draft.consultation} fallback={consultationImage} onChange={url => set("consultation", url)} disabled={saving} /></div>
    <section className="space-y-4 border-t border-border pt-6"><h3 className="text-lg font-semibold">{t("البرامج", "Programs")}</h3><div className="grid gap-6 md:grid-cols-3">{programMedia.map(p => <MediaImageField key={p.key} label={lang === "ar" ? p.ar : p.en} value={draft[`program:${p.key}`]} fallback={p.image} onChange={url => set(`program:${p.key}`, url)} disabled={saving} />)}</div></section>
    <section className="space-y-4 border-t border-border pt-6"><h3 className="text-lg font-semibold">{t("الكورسات", "Courses")}</h3><div className="grid gap-6 md:grid-cols-3">{courses.data?.map(c => <MediaImageField key={c.id} label={c.title} value={draft[`course:${c.id}`]} fallback={courseImage({}, c.id, c.title)} onChange={url => set(`course:${c.id}`, url)} disabled={saving} />)}</div></section>
    <Button disabled={!dirty || saving} onClick={() => void save()}><Save className="size-4" />{saving ? t("جارٍ الحفظ…", "Saving…") : t("حفظ الصور", "Save images")}</Button>
  </div>;
}