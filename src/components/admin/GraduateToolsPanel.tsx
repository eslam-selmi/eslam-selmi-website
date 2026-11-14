import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2, GraduationCap, Loader2, Languages } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { GRADUATE_TOOLS_KEY, graduateToolsOptions, iconForTool, useGraduateTools, type GraduateTool } from "@/lib/graduate-tools";

export function GraduateToolsPanel() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const qc = useQueryClient();
  const { data } = useGraduateTools();
  const [items, setItems] = useState<GraduateTool[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setItems(data); }, [data]);

  const update = (i: number, patch: Partial<GraduateTool>) => setItems((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => setItems((l) => { const n = [...l]; const k = i + d; if (k < 0 || k >= n.length) return l; [n[i], n[k]] = [n[k], n[i]]; return n; });

  async function save() {
    setSaving(true);
    const tools = items.map((x) => ({ ar: x.ar.trim(), en: x.en.trim() || x.ar.trim() })).filter((x) => x.ar);
    const { error } = await supabase.from("site_content").upsert(
      { section_key: GRADUATE_TOOLS_KEY, label: "Graduates page tools", content: { tools }, is_visible: true },
      { onConflict: "section_key" },
    );
    setSaving(false);
    if (error) return toast.error(t("تعذر الحفظ", "Could not save"));
    qc.setQueryData(graduateToolsOptions.queryKey, tools);
    toast.success(t("تم حفظ أدوات صفحة خريج جديد", "Graduate tools saved"));
  }

  return (
    <div className="dash-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <GraduationCap className="size-5 text-accent mt-1 shrink-0" />
        <div>
          <h3 className="font-bold">{t("أدوات صفحة خريج جديد", "Graduate page tools")}</h3>
          <p className="text-sm text-muted-foreground">{t("اكتب اسم الأداة وتظهر أيقونتها تلقائيًا", "Type a tool name and its icon is picked automatically")}</p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => {
          const Icon = iconForTool(it);
          return (
            <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <span className="size-10 shrink-0 grid place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-5" /></span>
              <Input value={it.ar} onChange={(e) => update(i, { ar: e.target.value })} placeholder="الذكاء الاصطناعي" dir="rtl" />
              <Input value={it.en} onChange={(e) => update(i, { en: e.target.value })} placeholder="AI at work" dir="ltr" />
              <Button size="icon" variant="ghost" onClick={() => move(i, -1)} aria-label="up"><ArrowUp className="size-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => move(i, 1)} aria-label="down"><ArrowDown className="size-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setItems((l) => l.filter((_, j) => j !== i))} aria-label="delete"><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1"><Languages className="size-3.5" />{t("لو تركت الإنجليزي فارغ هيظهر الاسم العربي", "Empty English falls back to Arabic")}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setItems((l) => [...l, { ar: "", en: "" }])}><Plus className="size-4" />{t("إضافة أداة", "Add tool")}</Button>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />}{t("حفظ", "Save")}</Button>
      </div>
    </div>
  );
}
