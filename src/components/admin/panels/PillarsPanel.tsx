import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Plus, Trash2, Save, Loader2, Columns3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSiteContent } from "@/lib/site-content";
import { DEFAULT_PILLARS, SITE_PILLARS_KEY, pillarIcons, sitePillarsOptions, useSitePillars, type Pillar, type PillarIcon } from "@/lib/site-pillars";

export function PillarsPanel() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const qc = useQueryClient();
  const { data, isPending, isError, refetch } = useSitePillars();
  const [config, setConfig] = useState(DEFAULT_PILLARS);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setConfig(data); }, [data]);
  const update = (key: string, patch: Partial<Pillar>) => setConfig(c => ({ ...c, pillars: c.pillars.map(p => p.key === key ? { ...p, ...patch } : p) }));
  const move = (i: number, delta: number) => setConfig(c => {
    const pillars = [...c.pillars], first = pillars[i], second = pillars[i + delta];
    if (!first || !second) return c;
    pillars[i] = second; pillars[i + delta] = first;
    return { ...c, pillars };
  });
  async function save() {
    if (config.pillars.some(p => !p.titleAr.trim() && !p.titleEn.trim())) return toast.error(t("اكتب اسم كل ركيزة قبل الحفظ", "Enter a title for every pillar"));
    setSaving(true);
    try {
      const existing = await supabase.from("site_content").select("id").eq("section_key", SITE_PILLARS_KEY).maybeSingle();
      if (existing.error) throw existing.error;
      const content = { ...config, pillars: config.pillars.map(p => ({ ...p })) };
      const result = existing.data ? await supabase.from("site_content").update({ content }).eq("id", existing.data.id) : await supabase.from("site_content").insert({ section_key: SITE_PILLARS_KEY, label: "ثلاث ركائز", content, is_visible: true });
      if (result.error) throw result.error;
      await qc.invalidateQueries({ queryKey: sitePillarsOptions.queryKey });
      invalidateSiteContent();
      toast.success(t("تم حفظ الركائز", "Pillars saved"));
    } catch { toast.error(t("تعذر حفظ الركائز، حاول مرة أخرى", "Could not save pillars. Please retry.")); }
    finally { setSaving(false); }
  }
  const iconLabels: Record<PillarIcon, string> = { talent: t("المواهب", "Talent"), performance: t("الأداء", "Performance"), metrics: t("المؤشرات", "Metrics"), strategy: t("استراتيجية", "Strategy"), training: t("تدريب", "Training"), design: t("تصميم", "Design") };
  return <section className="dash-card p-5 space-y-4" aria-label={t("إدارة ثلاث ركائز", "Three pillars management")}>
    <h3 className="font-bold flex items-center gap-2"><Columns3 className="size-5 text-accent" />{t("ثلاث ركائز", "Three pillars")}</h3>
    {isError ? <Button variant="outline" onClick={() => refetch()}>{t("إعادة المحاولة", "Retry")}</Button> : <fieldset disabled={saving || isPending} className="space-y-4 min-w-0">
      <div className="grid sm:grid-cols-2 gap-3">
        {(["eyebrow", "title"] as const).map(field => <div key={field} className="contents">
          <label className="text-sm space-y-1 block">{field === "eyebrow" ? t("العبارة أعلى العنوان بالعربية", "Eyebrow — Arabic") : t("عنوان القسم بالعربية", "Section title — Arabic")}<Input dir="rtl" value={config[`${field}Ar`]} onChange={e => setConfig(c => ({ ...c, [`${field}Ar`]: e.target.value }))} /></label>
          <label className="text-sm space-y-1 block">{field === "eyebrow" ? t("العبارة أعلى العنوان بالإنجليزية", "Eyebrow — English") : t("عنوان القسم بالإنجليزية", "Section title — English")}<Input dir="ltr" value={config[`${field}En`]} onChange={e => setConfig(c => ({ ...c, [`${field}En`]: e.target.value }))} /></label>
        </div>)}
      </div>
      <div className="divide-y divide-border">
        {config.pillars.map((p, i) => <div key={p.key} className="py-4 space-y-3">
          <div className="flex items-center gap-1"><span className="flex-1 font-semibold text-sm">{String(i + 1).padStart(2, "0")} · {(lang === "ar" ? p.titleAr : p.titleEn || p.titleAr) || t("ركيزة جديدة", "New pillar")}</span>
            <Button size="icon" variant="ghost" disabled={i === 0} title={t("تحريك لأعلى", "Move up")} aria-label={t("تحريك الركيزة لأعلى", "Move pillar up")} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
            <Button size="icon" variant="ghost" disabled={i === config.pillars.length - 1} title={t("تحريك لأسفل", "Move down")} aria-label={t("تحريك الركيزة لأسفل", "Move pillar down")} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
            <Button size="icon" variant="ghost" title={t("حذف الركيزة", "Delete pillar")} aria-label={t("حذف الركيزة", "Delete pillar")} onClick={() => { if (confirm(t("حذف هذه الركيزة؟", "Delete this pillar?"))) setConfig(c => ({ ...c, pillars: c.pillars.filter(x => x.key !== p.key) })); }}><Trash2 className="size-4 text-destructive" /></Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm space-y-1 block">{t("اسم الركيزة بالعربية", "Pillar name — Arabic")}<Input dir="rtl" value={p.titleAr} onChange={e => update(p.key, { titleAr: e.target.value })} /></label>
            <label className="text-sm space-y-1 block">{t("اسم الركيزة بالإنجليزية", "Pillar name — English")}<Input dir="ltr" value={p.titleEn} onChange={e => update(p.key, { titleEn: e.target.value })} /></label>
            <label className="text-sm space-y-1 block">{t("وصف الركيزة بالعربية", "Pillar description — Arabic")}<Textarea dir="rtl" value={p.descAr} onChange={e => update(p.key, { descAr: e.target.value })} /></label>
            <label className="text-sm space-y-1 block">{t("وصف الركيزة بالإنجليزية", "Pillar description — English")}<Textarea dir="ltr" value={p.descEn} onChange={e => update(p.key, { descEn: e.target.value })} /></label>
          </div>
          <Select value={p.icon} onValueChange={icon => update(p.key, { icon: icon as PillarIcon })}><SelectTrigger aria-label={t("أيقونة الركيزة", "Pillar icon")}><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(pillarIcons) as PillarIcon[]).map(key => { const Icon = pillarIcons[key]; return <SelectItem key={key} value={key}><span className="flex items-center gap-2"><Icon className="size-4" />{iconLabels[key]}</span></SelectItem>; })}</SelectContent></Select>
          <label className="flex items-center justify-between gap-3 text-sm">{t("إظهار الركيزة على الموقع", "Show pillar on website")}<Switch checked={p.visible} onCheckedChange={visible => update(p.key, { visible })} /></label>
        </div>)}
      </div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setConfig(c => ({ ...c, pillars: [...c.pillars, { key: crypto.randomUUID(), titleAr: "", titleEn: "", descAr: "", descEn: "", icon: "talent", visible: true }] }))}><Plus className="size-4" />{t("إضافة ركيزة", "Add pillar")}</Button><Button onClick={save}>{saving || isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{t("حفظ الركائز", "Save pillars")}</Button></div>
    </fieldset>}
  </section>;
}