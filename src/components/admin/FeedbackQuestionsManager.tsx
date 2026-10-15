import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Eye, EyeOff, Plus, Trash2, ArrowUp, ArrowDown, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database, Json } from "@/integrations/supabase/types";

type Q = Database["public"]["Tables"]["feedback_questions"]["Row"];
type Kind = "stars" | "yesno" | "choice" | "text";

const input = "h-9 px-3 rounded-md bg-background border border-border text-sm text-foreground w-full";

export function FeedbackQuestionsManager() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const [qs, setQs] = useState<Q[]>([]);
  const [draft, setDraft] = useState({ label_ar: "", label_en: "", kind: "stars" as Kind, options: "", is_required: false });

  const load = async () => {
    const { data } = await supabase.from("feedback_questions").select("*").order("sort_order");
    setQs(data ?? []);
  };
  useEffect(() => { void load(); }, []);

  const kindLabel = (k: string) => ({ stars: t("نجوم", "Stars"), yesno: t("نعم / لا", "Yes / No"), choice: t("اختيارات", "Choices"), text: t("نص حر", "Free text") }[k] ?? k);
  const parseOpts = (s: string) => s.split(/\n|,/).map((x) => x.trim()).filter(Boolean).map((x, i) => {
    const [ar, en] = x.split("|").map((y) => y.trim());
    return { value: `o${i + 1}`, ar, en: en || ar };
  });

  async function patch(q: Q, p: Partial<Q>) {
    const { error } = await supabase.from("feedback_questions").update(p).eq("id", q.id);
    if (error) return toast.error(error.message);
    void load();
  }
  async function move(i: number, d: -1 | 1) {
    const a = qs[i], b = qs[i + d]; if (!b) return;
    // Sequential swap through a temporary slot so the two rows never share a number.
    const temp = Math.max(...qs.map((q) => q.sort_order)) + 1000;
    const steps = [
      { id: a.id, sort_order: temp },
      { id: b.id, sort_order: a.sort_order },
      { id: a.id, sort_order: b.sort_order },
    ];
    for (const s of steps) {
      const { error } = await supabase.from("feedback_questions").update({ sort_order: s.sort_order }).eq("id", s.id);
      if (error) { toast.error(error.message); break; }
    }
    void load();
  }
  async function remove(q: Q) {
    if (!confirm(t("حذف السؤال؟", "Delete this question?"))) return;
    const { error } = await supabase.from("feedback_questions").delete().eq("id", q.id);
    if (error) return toast.error(error.message);
    void load();
  }
  async function add() {
    if (!draft.label_ar.trim()) return toast.error(t("اكتب نص السؤال", "Enter the question"));
    const options = draft.kind === "choice" ? parseOpts(draft.options) : [];
    if (draft.kind === "choice" && options.length < 2) return toast.error(t("أضف اختيارين على الأقل", "Add at least two choices"));
    const { error } = await supabase.from("feedback_questions").insert({
      label_ar: draft.label_ar.trim(), label_en: draft.label_en.trim() || draft.label_ar.trim(), kind: draft.kind,
      options: options as unknown as Json, is_required: draft.is_required,
      sort_order: (qs.at(-1)?.sort_order ?? 0) + 1,
    });
    if (error) return toast.error(error.message);
    toast.success(t("تمت إضافة السؤال", "Question added"));
    setDraft({ label_ar: "", label_en: "", kind: "stars", options: "", is_required: false });
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {qs.map((q, i) => <Row key={q.id} q={q} t={t} kindLabel={kindLabel} onPatch={(p) => patch(q, p)} onUp={() => move(i, -1)} onDown={() => move(i, 1)} onDelete={() => remove(q)} />)}
      </div>
      <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">{t("إضافة سؤال جديد", "Add a new question")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={input} placeholder={t("السؤال بالعربي", "Question (Arabic)")} value={draft.label_ar} onChange={(e) => setDraft({ ...draft, label_ar: e.target.value })} />
          <input className={input} dir="ltr" placeholder="Question (English)" value={draft.label_en} onChange={(e) => setDraft({ ...draft, label_en: e.target.value })} />
          <select className={input} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Kind })}>
            {(["stars", "yesno", "choice", "text"] as Kind[]).map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={draft.is_required} onChange={(e) => setDraft({ ...draft, is_required: e.target.checked })} /> {t("إجباري", "Required")}</label>
        </div>
        {draft.kind === "choice" && (
          <textarea className={`${input} h-auto py-2`} rows={3} value={draft.options} onChange={(e) => setDraft({ ...draft, options: e.target.value })}
            placeholder={t("اختيار في كل سطر — عربي | English", "One choice per line — Arabic | English")} />
        )}
        <Button size="sm" onClick={add}><Plus className="size-4" /> {t("إضافة", "Add")}</Button>
      </div>
    </div>
  );
}

function Row({ q, t, kindLabel, onPatch, onUp, onDown, onDelete }: {
  q: Q; t: (a: string, b: string) => string; kindLabel: (k: string) => string;
  onPatch: (p: Partial<Q>) => void; onUp: () => void; onDown: () => void; onDelete: () => void;
}) {
  const [ar, setAr] = useState(q.label_ar);
  const [en, setEn] = useState(q.label_en);
  const dirty = ar !== q.label_ar || en !== q.label_en;
  return (
    <div className={`rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-2 ${q.is_visible ? "" : "opacity-55"}`}>
      <div className="flex flex-col">
        <button onClick={onUp} aria-label="up" className="text-muted-foreground hover:text-foreground"><ArrowUp className="size-3.5" /></button>
        <button onClick={onDown} aria-label="down" className="text-muted-foreground hover:text-foreground"><ArrowDown className="size-3.5" /></button>
      </div>
      <input className={`${input} flex-1 min-w-[10rem]`} value={ar} onChange={(e) => setAr(e.target.value)} />
      <input className={`${input} flex-1 min-w-[10rem]`} dir="ltr" value={en} onChange={(e) => setEn(e.target.value)} />
      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-foreground">{kindLabel(q.kind)}</span>
      {q.is_default && <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground flex items-center gap-1"><Lock className="size-3" />{t("افتراضي", "Default")}</span>}
      <label className="flex items-center gap-1 text-xs text-foreground"><input type="checkbox" checked={q.is_required} onChange={(e) => onPatch({ is_required: e.target.checked })} />{t("إجباري", "Required")}</label>
      {dirty && <Button size="sm" variant="secondary" onClick={() => onPatch({ label_ar: ar, label_en: en })}><Save className="size-3.5" /></Button>}
      <Button size="sm" variant="outline" onClick={() => onPatch({ is_visible: !q.is_visible })}>
        {q.is_visible ? <><Eye className="size-3.5" /> {t("ظاهر", "Shown")}</> : <><EyeOff className="size-3.5" /> {t("مخفي", "Hidden")}</>}
      </Button>
      {!q.is_default && <Button size="sm" variant="ghost" onClick={onDelete} aria-label="delete"><Trash2 className="size-3.5" /></Button>}
    </div>
  );
}
