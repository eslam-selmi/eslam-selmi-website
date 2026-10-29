import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { invalidateSiteContent } from "@/lib/site-content";
import { siteMediaKey, useSiteMedia } from "@/lib/site-media";
import { courseImage } from "@/lib/site-media-data";
import { MediaImageField } from "./MediaImageField";

/** Course cover editor inside course settings; saves to the shared site.media record. */
export function CourseImageSetting({ id, title }: { id: string; title: string }) {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const query = useSiteMedia();
  const client = useQueryClient();
  const [saving, setSaving] = useState(false);
  const key = `course:${id}`;
  async function change(url: string) {
    setSaving(true);
    try {
      const fresh = await supabase.from("site_content").select("id,content").eq("section_key", "site.media").maybeSingle();
      if (fresh.error) throw fresh.error;
      const current = (fresh.data?.content && typeof fresh.data.content === "object" && !Array.isArray(fresh.data.content) ? fresh.data.content : {}) as Record<string, string>;
      const content = { ...current, [key]: url };
      const { error } = fresh.data?.id
        ? await supabase.from("site_content").update({ content, is_visible: true }).eq("id", fresh.data.id)
        : await supabase.from("site_content").insert({ content, is_visible: true, section_key: "site.media", label: "صور البرامج والكورسات والاستشارة" });
      if (error) throw error;
      await client.invalidateQueries({ queryKey: siteMediaKey });
      invalidateSiteContent();
      toast.success(t("تم حفظ صورة الكورس", "Course image saved"));
    } catch { toast.error(t("تعذر حفظ الصورة", "Could not save image")); }
    finally { setSaving(false); }
  }
  return <div className="max-w-md">
    <MediaImageField label={t("صورة الكورس", "Course image")} value={query.data?.media[key]} fallback={courseImage({}, id, title)} onChange={url => void change(url)} disabled={saving || query.isPending} />
  </div>;
}
