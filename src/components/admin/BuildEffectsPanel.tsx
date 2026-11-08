import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MousePointer2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { BUILD_EFFECTS_KEY, buildEffectsOptions, useBuildEffects } from "@/lib/build-effects";
import { invalidateSiteContent } from "@/lib/site-content";

export function BuildEffectsPanel() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const queryClient = useQueryClient();
  const { enabled, isPending, isError } = useBuildEffects();
  const [saving, setSaving] = useState(false);
  async function save(value: boolean) {
    setSaving(true);
    const { error } = await supabase.from("site_content").upsert({
      section_key: BUILD_EFFECTS_KEY, label: "Visitor cursor effects",
      content: { build_enabled: value }, is_visible: true,
    }, { onConflict: "section_key" });
    setSaving(false);
    if (error) { toast.error(t("تعذر حفظ الإعداد", "Could not save setting")); return; }
    queryClient.setQueryData(buildEffectsOptions.queryKey, value);
    await queryClient.invalidateQueries({ queryKey: buildEffectsOptions.queryKey });
    invalidateSiteContent();
    toast.success(t(value ? "تم تفعيل حركة البناء للزوار" : "تم إيقاف حركة البناء للزوار", value ? "Visitor build effects enabled" : "Visitor build effects disabled"));
  }
  return (
    <div className="flex items-center justify-between gap-5 border-b border-border pb-6">
      <div className="flex items-start gap-3">
        <MousePointer2 className="size-5 shrink-0 text-accent mt-1" />
        <div>
          <h3 className="font-bold">{t("حركة بناء الموقع للزوار", "Visitor build effects")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("الصفحة الرئيسية وخلفية صفحة الصيانة", "Homepage and maintenance background")}</p>
          {isError && <p className="text-sm text-destructive">{t("تعذر تحميل الإعداد، أعد فتح الصفحة", "Could not load setting; reopen this page")}</p>}
        </div>
      </div>
      <Switch aria-label={t("حركة بناء الموقع للزوار", "Visitor build effects")} checked={enabled} onCheckedChange={save} disabled={saving || isPending || isError} />
    </div>
  );
}