import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Plus, Trash2, Save, Loader2, Briefcase, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSiteContent } from "@/lib/site-content";
import { DEFAULT_SERVICES, SITE_SERVICES_KEY, serviceIcons, siteServicesOptions, useSiteServices, type Service, type ServiceIcon, type ServicesConfig } from "@/lib/site-services";

export function ServicesPanel() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const qc = useQueryClient();
  const { data, isPending, isError, refetch } = useSiteServices();
  const [config, setConfig] = useState<ServicesConfig>(DEFAULT_SERVICES);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setConfig(data); }, [data]);
  const update = (key: string, patch: Partial<Service>) => setConfig(c => ({ ...c, services: c.services.map(s => s.key === key ? { ...s, ...patch } : s) }));
  const move = (i: number, delta: number) => setConfig(c => {
    const services = [...c.services], first = services[i], second = services[i + delta];
    if (!first || !second) return c;
    services[i] = second; services[i + delta] = first;
    return { ...c, services };
  });
  async function save() {
    if (config.services.some(s => !s.titleAr.trim() && !s.titleEn.trim())) return toast.error(t("اكتب اسم كل خدمة قبل الحفظ", "Enter a name for every service"));
    if (config.services.some(s => s.price !== null && (!Number.isFinite(s.price) || s.price < 0))) return toast.error(t("السعر يجب أن يكون صفرًا أو أكبر", "Prices must be zero or greater"));
    setSaving(true);
    try {
      const existing = await supabase.from("site_content").select("id").eq("section_key", SITE_SERVICES_KEY).maybeSingle();
      if (existing.error) throw existing.error;
      const content = { ...config, services: config.services.map(s => ({ ...s })) };
      const result = existing.data
        ? await supabase.from("site_content").update({ content }).eq("id", existing.data.id)
        : await supabase.from("site_content").insert({ section_key: SITE_SERVICES_KEY, label: "الخدمات", content, is_visible: true });
      if (result.error) throw result.error;
      await qc.invalidateQueries({ queryKey: siteServicesOptions.queryKey });
      invalidateSiteContent();
      toast.success(t("تم حفظ الخدمات", "Services saved"));
    } catch { toast.error(t("تعذر حفظ الخدمات، حاول مرة أخرى", "Could not save services. Please retry.")); }
    finally { setSaving(false); }
  }
  const iconLabels: Record<ServiceIcon, string> = { strategy: t("استراتيجية", "Strategy"), training: t("تدريب", "Training"), design: t("تصميم تعليمي", "Learning design"), coaching: t("تدريب فردي", "Coaching"), business: t("أعمال", "Business"), people: t("فرق ومواهب", "People"), ai: t("ذكاء اصطناعي", "AI"), education: t("تعليم", "Education") };
  return <section className="dash-card p-5 space-y-4" aria-label={t("إدارة الخدمات", "Service management")}>
    <h3 className="font-bold flex items-center gap-2"><Briefcase className="size-5 text-accent" />{t("إدارة الخدمات", "Service management")}</h3>
    {isError ? <Button variant="outline" onClick={() => refetch()}>{t("إعادة تحميل الخدمات", "Retry loading services")}</Button> : <fieldset disabled={saving || isPending} className="space-y-4 min-w-0">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm space-y-1 block">{t("عنوان القسم بالعربية", "Section title — Arabic")}<Input dir="rtl" value={config.titleAr} onChange={e => setConfig(c => ({ ...c, titleAr: e.target.value }))} /></label>
        <label className="text-sm space-y-1 block">{t("عنوان القسم بالإنجليزية", "Section title — English")}<Input dir="ltr" value={config.titleEn} onChange={e => setConfig(c => ({ ...c, titleEn: e.target.value }))} /></label>
        <label className="text-sm space-y-1 block">{t("وصف القسم بالعربية", "Section description — Arabic")}<Textarea dir="rtl" value={config.subtitleAr} onChange={e => setConfig(c => ({ ...c, subtitleAr: e.target.value }))} /></label>
        <label className="text-sm space-y-1 block">{t("وصف القسم بالإنجليزية", "Section description — English")}<Textarea dir="ltr" value={config.subtitleEn} onChange={e => setConfig(c => ({ ...c, subtitleEn: e.target.value }))} /></label>
      </div>
      <label className="flex items-center justify-between gap-3 text-sm font-semibold">{t("تفعيل خيارات الأسعار للخدمات", "Enable service pricing options")}<Switch checked={config.pricingEnabled} onCheckedChange={pricingEnabled => setConfig(c => ({ ...c, pricingEnabled }))} /></label>
      <div className="divide-y divide-border">
        {config.services.map((s, i) => {
          const Icon = serviceIcons[s.icon];
          return <div key={s.key} className="py-3 space-y-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" className="flex-1 min-w-0 justify-start h-auto text-start whitespace-normal" aria-expanded={open === s.key} onClick={() => setOpen(open === s.key ? null : s.key)}><Icon className="size-4 shrink-0" /><span className="break-words">{(lang === "ar" ? s.titleAr : s.titleEn || s.titleAr) || t("خدمة جديدة", "New service")}</span><ChevronDown className="size-4 shrink-0" /></Button>
              <Button size="icon" variant="ghost" disabled={i === 0} aria-label={t("تحريك الخدمة لأعلى", "Move service up")} title={t("تحريك لأعلى", "Move up")} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
              <Button size="icon" variant="ghost" disabled={i === config.services.length - 1} aria-label={t("تحريك الخدمة لأسفل", "Move service down")} title={t("تحريك لأسفل", "Move down")} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={t("حذف الخدمة", "Delete service")} title={t("حذف الخدمة", "Delete service")} onClick={() => { if (confirm(t("حذف هذه الخدمة؟", "Delete this service?"))) setConfig(c => ({ ...c, services: c.services.filter(x => x.key !== s.key) })); }}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
            {open === s.key && <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-sm space-y-1 block">{t("اسم الخدمة بالعربية", "Service name — Arabic")}<Input dir="rtl" value={s.titleAr} onChange={e => update(s.key, { titleAr: e.target.value })} /></label>
                <label className="text-sm space-y-1 block">{t("اسم الخدمة بالإنجليزية", "Service name — English")}<Input dir="ltr" value={s.titleEn} onChange={e => update(s.key, { titleEn: e.target.value })} /></label>
                <label className="text-sm space-y-1 block">{t("وصف الخدمة بالعربية", "Service description — Arabic")}<Textarea dir="rtl" value={s.descAr} onChange={e => update(s.key, { descAr: e.target.value })} /></label>
                <label className="text-sm space-y-1 block">{t("وصف الخدمة بالإنجليزية", "Service description — English")}<Textarea dir="ltr" value={s.descEn} onChange={e => update(s.key, { descEn: e.target.value })} /></label>
              </div>
              <Select value={s.icon} onValueChange={icon => update(s.key, { icon: icon as ServiceIcon })}><SelectTrigger aria-label={t("أيقونة الخدمة", "Service icon")}><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(serviceIcons) as ServiceIcon[]).map(key => { const Preview = serviceIcons[key]; return <SelectItem key={key} value={key}><span className="flex items-center gap-2"><Preview className="size-4" />{iconLabels[key]}</span></SelectItem>; })}</SelectContent></Select>
              <label className="flex items-center justify-between gap-3 text-sm">{t("إظهار الخدمة على الموقع", "Show service on website")}<Switch checked={s.visible} onCheckedChange={visible => update(s.key, { visible })} /></label>
              {config.pricingEnabled && <>
                <label className="flex items-center justify-between gap-3 text-sm">{t("إظهار سعر هذه الخدمة", "Show this service’s price")}<Switch checked={s.showPrice} onCheckedChange={showPrice => update(s.key, { showPrice })} /></label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-sm space-y-1 block">{t("السعر (اتركه فارغًا بدون سعر)", "Price (leave blank for no price)")}<Input type="number" min="0" step="any" value={s.price ?? ""} onChange={e => update(s.key, { price: e.target.value === "" ? null : Number(e.target.value) })} /></label>
                  <label className="text-sm space-y-1 block">{t("العملة", "Currency")}<Input value={s.currency} dir="ltr" onChange={e => update(s.key, { currency: e.target.value })} /></label>
                </div>
              </>}
            </div>}
          </div>;
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { const key = crypto.randomUUID(); setConfig(c => ({ ...c, services: [...c.services, { key, titleAr: "", titleEn: "", descAr: "", descEn: "", icon: "business", visible: true, price: null, currency: "EGP", showPrice: false }] })); setOpen(key); }}><Plus className="size-4" />{t("إضافة خدمة", "Add service")}</Button>
        <Button onClick={save}>{saving || isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{t("حفظ الخدمات", "Save services")}</Button>
      </div>
    </fieldset>}
  </section>;
}