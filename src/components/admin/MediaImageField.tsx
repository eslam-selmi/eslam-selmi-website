import { useState } from "react";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function MediaImageField({ label, value, fallback, onChange, disabled }: { label: string; value?: string; fallback: string; onChange: (url: string) => void; disabled?: boolean }) {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error(t("اختر صورة JPG أو PNG أو WebP", "Choose a JPG, PNG or WebP image"));
    if (file.size > 10 * 1024 * 1024) return toast.error(t("الحد الأقصى للصورة ١٠ ميجابايت", "Maximum image size is 10 MB"));
    setBusy(true);
    try {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `site-media/${crypto.randomUUID()}.${extension}`;
      const uploaded = await supabase.storage.from("public-uploads").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (uploaded.error) throw uploaded.error;
      const signed = await supabase.storage.from("public-uploads").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed.error || !signed.data?.signedUrl) throw signed.error || new Error("Image URL unavailable");
      onChange(signed.data.signedUrl);
    } catch { toast.error(t("تعذر رفع الصورة", "Image upload failed")); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3">
    <h3 className="font-semibold text-sm">{label}</h3>
    <img src={value || fallback} alt={label} loading="lazy" width={1280} height={720} className="aspect-video w-full object-cover rounded-md border border-border" />
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" asChild><label className="cursor-pointer">{busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}{t("تغيير الصورة", "Change image")}<input aria-label={`${t("رفع صورة", "Upload image")}: ${label}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || busy} className="sr-only" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label></Button>
      <Button type="button" variant="ghost" disabled={!value || disabled || busy} onClick={() => onChange("")}><RotateCcw className="size-4" />{t("استعادة الأصل", "Restore default")}</Button>
    </div>
  </div>;
}