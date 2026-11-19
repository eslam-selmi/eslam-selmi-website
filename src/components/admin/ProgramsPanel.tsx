import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2, Layers, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useSiteMedia } from "@/lib/site-media";
import { programMedia, mediaImage } from "@/lib/site-media-data";
import { SITE_PROGRAMS_KEY, siteProgramsOptions, useSitePrograms, type ProgramModule, type ProgramTrack } from "@/lib/site-programs";
import { MediaImageField } from "./MediaImageField";

function swap<T>(l: T[], i: number, d: number) { const n = [...l]; const k = i + d; if (k < 0 || k >= n.length) return l; [n[i], n[k]] = [n[k], n[i]]; return n; }

export function ProgramsPanel() {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const qc = useQueryClient();
  const { data } = useSitePrograms();
  const { data: media } = useSiteMedia();
  const [tracks, setTracks] = useState<ProgramTrack[]>([]);
  const [open, setOpen] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setTracks(data); }, [data]);

  const upd = (i: number, p: Partial<ProgramTrack>) => setTracks((l) => l.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const updMod = (i: number, m: number, p: Partial<ProgramModule>) => upd(i, { modules: tracks[i].modules.map((x, j) => (j === m ? { ...x, ...p } : x)) });
  const fallbackImage = (tr: ProgramTrack, i: number) => mediaImage(media?.media ?? {}, `program:${tr.key}`, (programMedia.find((p) => p.key === tr.key) ?? programMedia[i % 3]).image);

  async function save() {
    const clean = tracks.filter((x) => x.titleAr.trim() || x.titleEn.trim());
    setSaving(true);
    const { error } = await supabase.from("site_content").upsert(
      { section_key: SITE_PROGRAMS_KEY, label: "برامج التدريب والتطوير", content: { tracks: clean }, is_visible: true },
      { onConflict: "section_key" },
    );
    setSaving(false);
    if (error) return toast.error(t("تعذر الحفظ", "Could not save"));
    await qc.invalidateQueries({ queryKey: siteProgramsOptions.queryKey });
    toast.success(t("تم حفظ البرامج", "Programs saved"));
  }

  return (
    <div className="dash-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Layers className="size-5 text-accent mt-1 shrink-0" />
        <div>
          <h3 className="font-bold">{t("برامج التدريب والتطوير والمسارات", "Training programs & tracks")}</h3>
          <p className="text-sm text-muted-foreground">{t("أضف مسارًا أو عدّله أو رتّبه، ومحاور كل مسار", "Add, edit or reorder tracks and their modules")}</p>
        </div>
      </div>
      <div className="space-y-3">
        {tracks.map((tr, i) => (
          <div key={tr.key} className="rounded-xl border border-border">
            <div className="flex items-center gap-2 p-3">
              <button type="button" className="flex-1 flex items-center gap-2 text-start font-semibold" onClick={() => setOpen(open === i ? null : i)}>
                <ChevronDown className={`size-4 transition ${open === i ? "rotate-180" : ""}`} />
                <span className="text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {(lang === "ar" ? tr.titleAr : tr.titleEn) || t("مسار بدون اسم", "Untitled track")}
              </button>
              <Button size="icon" variant="ghost" onClick={() => setTracks((l) => swap(l, i, -1))} aria-label="up"><ArrowUp className="size-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setTracks((l) => swap(l, i, 1))} aria-label="down"><ArrowDown className="size-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { if (confirm(t("حذف هذا المسار؟", "Delete this track?"))) setTracks((l) => l.filter((_, j) => j !== i)); }} aria-label="delete"><Trash2 className="size-4 text-destructive" /></Button>
            </div>
            {open === i && (
              <div className="border-t border-border p-4 grid gap-4 lg:grid-cols-[260px_1fr]">
                <MediaImageField label={t("صورة المسار", "Track image")} value={tr.image} fallback={fallbackImage(tr, i)} onChange={(url) => upd(i, { image: url })} disabled={saving} />
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input dir="rtl" value={tr.titleAr} onChange={(e) => upd(i, { titleAr: e.target.value })} placeholder="اسم المسار" />
                    <Input dir="ltr" value={tr.titleEn} onChange={(e) => upd(i, { titleEn: e.target.value })} placeholder="Track name" />
                    <Textarea dir="rtl" rows={3} value={tr.introAr} onChange={(e) => upd(i, { introAr: e.target.value })} placeholder="وصف قصير" />
                    <Textarea dir="ltr" rows={3} value={tr.introEn} onChange={(e) => upd(i, { introEn: e.target.value })} placeholder="Short description" />
                  </div>
                  <div className="text-sm font-semibold pt-2">{t("المحاور", "Modules")}</div>
                  {tr.modules.map((m, k) => (
                    <div key={k} className="rounded-lg bg-muted/40 p-3 space-y-2">
                      <div className="flex gap-2">
                        <Input dir="rtl" value={m.nameAr} onChange={(e) => updMod(i, k, { nameAr: e.target.value })} placeholder="اسم المحور" />
                        <Input dir="ltr" value={m.nameEn} onChange={(e) => updMod(i, k, { nameEn: e.target.value })} placeholder="Module name" />
                        <Button size="icon" variant="ghost" onClick={() => upd(i, { modules: swap(tr.modules, k, -1) })} aria-label="up"><ArrowUp className="size-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => upd(i, { modules: tr.modules.filter((_, j) => j !== k) })} aria-label="delete"><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Textarea dir="rtl" rows={2} value={m.descAr} onChange={(e) => updMod(i, k, { descAr: e.target.value })} placeholder="وصف المحور" />
                        <Textarea dir="ltr" rows={2} value={m.descEn} onChange={(e) => updMod(i, k, { descEn: e.target.value })} placeholder="Module description" />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => upd(i, { modules: [...tr.modules, { nameAr: "", nameEn: "", descAr: "", descEn: "" }] })}><Plus className="size-4" />{t("إضافة محور", "Add module")}</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("لو تركت الإنجليزي فارغ هيظهر النص العربي", "Empty English falls back to Arabic")}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { setTracks((l) => [...l, { key: `track-${crypto.randomUUID().slice(0, 8)}`, titleAr: "", titleEn: "", introAr: "", introEn: "", image: "", modules: [] }]); setOpen(tracks.length); }}><Plus className="size-4" />{t("إضافة مسار", "Add track")}</Button>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />}{t("حفظ", "Save")}</Button>
      </div>
    </div>
  );
}
