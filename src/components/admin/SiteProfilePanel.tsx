import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { siteProfileKey, useSiteProfile } from "@/lib/site-profile";
import { siteProfileDefaults, type SiteProfile } from "@/lib/site-profile-data";
import { invalidateSiteContent } from "@/lib/site-content";

export function SiteProfilePanel() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const query = useSiteProfile();
  const client = useQueryClient();
  const [draft, setDraft] = useState<SiteProfile>(siteProfileDefaults);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!dirty && query.isSuccess) setDraft(query.profile); }, [query.data, query.isSuccess, dirty]);
  function set(key: keyof SiteProfile, value: string) { setDirty(true); setDraft(prev => ({ ...prev, [key]: value })); }
  async function upload(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error(t("اختر صورة JPG أو PNG أو WebP", "Choose a JPG, PNG or WebP image"));
    setUploading(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `site-profile/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("public-uploads").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data, error: urlError } = await supabase.storage.from("public-uploads").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (urlError || !data?.signedUrl) throw urlError || new Error("Image URL unavailable");
      set("portrait", data.signedUrl);
    } catch (error) { toast.error(error instanceof Error ? error.message : t("تعذر رفع الصورة", "Image upload failed")); }
    finally { setUploading(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!/^https:\/\/(www\.)?linkedin\.com\//i.test(draft.linkedin)) return toast.error(t("أدخل رابط LinkedIn صحيحًا يبدأ بـ https://", "Enter a valid https LinkedIn profile URL"));
    setSaving(true);
    try {
      const { error } = query.data?.id
        ? await supabase.from("site_content").update({ content: { ...draft }, is_visible: true }).eq("id", query.data.id)
        : await supabase.from("site_content").insert({ section_key: "site.profile", label: "الصورة وبيانات التواصل والحقوق", content: { ...draft }, is_visible: true });
      if (error) throw error;
      await client.invalidateQueries({ queryKey: siteProfileKey });
      invalidateSiteContent();
      setDirty(false);
      toast.success(t("تم حفظ بيانات الموقع", "Site details saved"));
    } catch (error) { toast.error(error instanceof Error ? error.message : t("تعذر الحفظ", "Save failed")); }
    finally { setSaving(false); }
  }
  if (query.isPending) return <Loader2 className="size-5 animate-spin text-accent" />;
  if (query.isError) return <div role="alert" className="text-destructive">{t("تعذر تحميل البيانات", "Could not load details")} <Button variant="outline" onClick={() => void query.refetch()}>{t("إعادة المحاولة", "Retry")}</Button></div>;
  return <form onSubmit={save} className="space-y-6">
    <h2 className="text-xl font-semibold text-foreground">{t("الصورة وبيانات التواصل", "Portrait & contact details")}</h2>
    <div className="flex flex-wrap items-center gap-5 border-b border-border pb-6">
      <img src={draft.portrait} alt={t("معاينة الصورة الرئيسية", "Main portrait preview")} className="h-36 w-28 rounded-md object-cover object-top bg-secondary" />
      <div className="space-y-3">
        <Button type="button" variant="outline" asChild><label className="cursor-pointer"><Camera className="size-4" />{uploading ? t("جارٍ الرفع…", "Uploading…") : t("تغيير الصورة الرئيسية", "Change main portrait")}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || saving} className="sr-only" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label></Button>
        <Button type="button" variant="ghost" onClick={() => set("portrait", siteProfileDefaults.portrait)}>{t("استعادة الصورة الأصلية", "Restore original portrait")}</Button>
      </div>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      {([
        ["phone", t("رقم الهاتف الرئيسي وواتساب", "Primary phone & WhatsApp"), "tel"],
        ["secondary_phone", t("رقم الهاتف الإضافي", "Additional phone"), "tel"],
        ["email", t("البريد الإلكتروني للتواصل", "Contact email"), "email"],
        ["linkedin", t("رابط حساب LinkedIn", "LinkedIn profile URL"), "url"],
      ] as const).map(([key, label, type]) => <label key={key} className="space-y-2 text-sm text-foreground"><span className="block">{label}</span><input type={type} required={key !== "secondary_phone"} dir="ltr" value={draft[key]} onChange={e => set(key, e.target.value)} className="h-11 w-full border border-input rounded-md bg-card px-3" /></label>)}
    </div>
    <div className="grid gap-5 sm:grid-cols-2 border-t border-border pt-6">
      <label className="space-y-2 text-sm"><span className="block">{t("النص أسفل الموقع — عربي", "Footer text — Arabic")}</span><textarea dir="rtl" rows={3} value={draft.footer_ar} placeholder="© 2026 · جميع الحقوق محفوظة." onChange={e => set("footer_ar", e.target.value)} className="w-full rounded-md border border-input bg-card p-3" /></label>
      <label className="space-y-2 text-sm"><span className="block">{t("النص أسفل الموقع — إنجليزي", "Footer text — English")}</span><textarea dir="ltr" rows={3} value={draft.footer_en} placeholder="© 2026 · All rights reserved." onChange={e => set("footer_en", e.target.value)} className="w-full rounded-md border border-input bg-card p-3" /></label>
    </div>
    <Button type="submit" disabled={!dirty || saving || uploading}><Save className="size-4" />{saving ? t("جارٍ الحفظ…", "Saving…") : t("حفظ بيانات الموقع", "Save site details")}</Button>
  </form>;
}