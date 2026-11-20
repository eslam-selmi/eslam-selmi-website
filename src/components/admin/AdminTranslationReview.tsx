import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { Languages, Loader2, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { translateTexts } from "@/lib/translate.functions";
import { useI18n } from "@/lib/i18n";
import { applyReviewedTranslation, editableTextControl, type TextControl } from "@/lib/admin-translation-fields";

type Field = { element: TextControl; label: string; original: string };
export function AdminTranslationReview() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const translate = useServerFn(translateTexts);
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [sourceIndex, setSourceIndex] = useState("manual");
  const [destination, setDestination] = useState("none");
  const [source, setSource] = useState("");
  const [review, setReview] = useState("");
  const [target, setTarget] = useState<"ar" | "en">("en");
  const [busy, setBusy] = useState(false);
  const [dialogHost, setDialogHost] = useState<Element | null>(null);
  const sequence = useRef(0);
  useEffect(() => {
    const sync = () => {
      if (document.querySelector("[data-translation-review]")) return;
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(e => e.getClientRects().length > 0);
      setDialogHost(dialogs.at(-1) ?? null);
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true }); sync();
    return () => observer.disconnect();
  }, []);
  function start() {
    const controls = Array.from(document.querySelectorAll("input,textarea")).filter(editableTextControl).filter(e => e.getClientRects().length > 0 && !e.closest("[data-translation-review]"));
    const next = controls.map((element, i) => ({ element, original: element.value, label: element.getAttribute("aria-label") || element.labels?.[0]?.textContent?.trim() || element.closest("label")?.textContent?.trim() || element.parentElement?.querySelector("label")?.textContent?.trim() || element.placeholder || `${t("حقل", "Field")} ${i + 1}` }));
    setFields(next); setSourceIndex("manual"); setDestination("none"); setSource(""); setReview(""); setOpen(true);
  }
  async function generate() {
    if (!source.trim()) return;
    const current = ++sequence.current;
    setBusy(true);
    try {
      const result = await translate({ data: { texts: [source.trim()], target } });
      if (current !== sequence.current) return;
      if (result.error) throw new Error(result.error);
      const output = result.translations[0];
      if (!output?.trim()) throw new Error("Empty translation");
      setReview(output);
    } catch { toast.error(t("تعذرت الترجمة، النص الأصلي لم يتغير", "Translation failed. Your original text is unchanged.")); }
    finally { if (current === sequence.current) setBusy(false); }
  }
  function apply() {
    const field = fields[Number(destination)];
    if (!field || !applyReviewedTranslation(field.element, review, field.original)) return toast.error(t("الحقل اتغير أو اتقفل؛ افتح المراجعة من جديد", "The field changed or closed. Reopen translation review."));
    toast.success(t("تم تطبيق الترجمة؛ احفظ من القسم بعد المراجعة", "Translation applied. Save from the section when ready."));
    setOpen(false);
  }
  const trigger = <Button type="button" variant="outline" className="fixed bottom-4 end-4 z-[210] shadow-lg" onClick={start} title={t("ترجمة ومراجعة المحتوى", "Translate and review content")}><Languages className="size-4" /><span>{t("ترجمة ومراجعة", "Translate & review")}</span></Button>;
  return <>
    {dialogHost ? createPortal(trigger, dialogHost) : trigger}
    <Dialog open={open} onOpenChange={value => { if (!value) { sequence.current++; setBusy(false); } setOpen(value); }}>
      <DialogContent data-translation-review className="z-[220] max-w-3xl max-h-[88dvh] overflow-y-auto bg-card text-foreground" dir={lang === "ar" ? "rtl" : "ltr"}>
        <DialogTitle>{t("ترجمة ومراجعة المحتوى", "Translate and review content")}</DialogTitle>
        <DialogDescription>{t("راجع الترجمة وعدّلها، ثم طبّقها على الحقل المطلوب؛ الحفظ يظل من القسم نفسه.", "Review and edit the translation, then apply it to your chosen field. Save separately from the section.")}</DialogDescription>
        <label className="space-y-2 text-sm block">{t("النص المطلوب ترجمته", "Source field")}<Select disabled={busy} value={sourceIndex} onValueChange={value => {
          setSourceIndex(value); setReview("");
          const field = fields[Number(value)]; setSource(field?.element.value ?? "");
          const next = fields[Number(value) + 1];
          setDestination(next ? String(Number(value) + 1) : "none");
        }}><SelectTrigger aria-label={t("اختيار النص الأصلي", "Choose source field")}><SelectValue /></SelectTrigger><SelectContent className="z-[230]"><SelectItem value="manual">{t("كتابة أو لصق نص", "Write or paste text")}</SelectItem>{fields.map((f, i) => <SelectItem key={i} value={String(i)}>{f.label.slice(0, 100)}</SelectItem>)}</SelectContent></Select></label>
        <Textarea aria-label={t("النص الأصلي", "Original text")} disabled={busy} rows={4} maxLength={4000} value={source} onChange={e => { setSource(e.target.value); setReview(""); }} />
        <Select disabled={busy} value={target} onValueChange={v => { setTarget(v === "ar" ? "ar" : "en"); setReview(""); }}><SelectTrigger aria-label={t("لغة الترجمة", "Translation language")}><SelectValue /></SelectTrigger><SelectContent className="z-[230]"><SelectItem value="en">English</SelectItem><SelectItem value="ar">العربية</SelectItem></SelectContent></Select>
        <Button onClick={generate} disabled={busy || !source.trim()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Languages className="size-4" />}{t("ترجمة تلقائية", "Translate automatically")}</Button>
        <label className="text-sm space-y-2 block">{t("الترجمة — راجعها وعدّلها", "Translation — review and edit")}<Textarea aria-label={t("الترجمة المقترحة", "Suggested translation")} dir={target === "ar" ? "rtl" : "ltr"} rows={4} value={review} onChange={e => setReview(e.target.value)} /></label>
        <Select value={destination} onValueChange={setDestination}><SelectTrigger aria-label={t("الحقل المستهدف", "Destination field")}><SelectValue /></SelectTrigger><SelectContent className="z-[230]"><SelectItem value="none">{t("نسخ فقط، بدون تطبيق", "Copy only, no field update")}</SelectItem>{fields.map((f, i) => <SelectItem key={i} value={String(i)}>{f.label.slice(0, 100)}</SelectItem>)}</SelectContent></Select>
        <div className="flex flex-wrap gap-2"><Button disabled={busy || !review.trim() || destination === "none"} onClick={apply}><Check className="size-4" />{t("تطبيق الترجمة بعد المراجعة", "Apply reviewed translation")}</Button><Button variant="outline" disabled={!review.trim()} onClick={async () => { try { await navigator.clipboard.writeText(review); toast.success(t("تم نسخ الترجمة", "Translation copied")); } catch { toast.error(t("تعذر النسخ، حدد النص وانسخه", "Could not copy. Select and copy the text.")); } }}><Copy className="size-4" />{t("نسخ الترجمة", "Copy translation")}</Button></div>
      </DialogContent>
    </Dialog>
  </>;
}