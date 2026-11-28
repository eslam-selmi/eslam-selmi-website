// Lists course videos with no trusted duration and lets the ADMIN set it, from the file's own metadata or by typing it.
// Plain admin update of module_items.duration_seconds (no new server function). The server only completes a video against this value.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { mediaSource } from "@/lib/media-url";
import { itemMediaClass, isMeasuredVideo } from "@/lib/media-class";
import { readDurationFromUrl, sanitizeDuration } from "@/lib/duration-meta";

type Row = { id: string; title: string; url: string | null; module_id: string; cls?: string };
export function VideoDurationRepair({ courseId }: { courseId: string }) {
  const { lang } = useI18n(); const isAr = lang === "ar";
  const [rows, setRows] = useState<Row[] | null>(null); const [busy, setBusy] = useState<string | null>(null); const [manual, setManual] = useState<Record<string, string>>({});
  async function load() {
    // Plain admin read of this course's items (same access the content editor already uses); no extra server function needed.
    const { data: items, error } = await supabase.from("module_items")
      .select("id,title,url,kind,module_id,duration_seconds,course_modules!inner(course_id)").eq("course_modules.course_id", courseId);
    if (error) { setRows(null); return; }
    setRows((items ?? []).filter((i: any) => i.duration_seconds == null && (isMeasuredVideo(itemMediaClass(i)) || itemMediaClass(i) === "embed_other"))
      .map((i: any) => ({ id: i.id, title: i.title, url: i.url, module_id: i.module_id, cls: itemMediaClass(i) })));
  }
  useEffect(() => { void load(); }, [courseId]);
  async function save(id: string, secs: number | null) {
    if (!secs) return toast.error(isAr ? "المدة غير صالحة" : "Invalid duration");
    const { error } = await supabase.from("module_items").update({ duration_seconds: Math.round(secs) }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(isAr ? "تم حفظ المدة" : "Duration saved"); void load();
  }
  async function fromMeta(r: Row) {
    if (!r.url) return; setBusy(r.id);
    try {
      let url = r.url;
      if (!/^https?:/i.test(url)) { const { data, error } = await supabase.storage.from("course-files").createSignedUrl(url, 300); if (error || !data) throw error; url = data.signedUrl; }
      else { const ms = mediaSource(url); if (ms.kind === "embed") { toast.error(isAr ? "فيديو مضمّن: اكتب المدة يدوياً" : "Embedded video: type the duration"); return; } url = ms.url; }
      const d = await readDurationFromUrl(url); if (d == null) toast.error(isAr ? "تعذّرت قراءة المدة، اكتبها يدوياً" : "Could not read it, type it instead"); else await save(r.id, d);
    } catch { toast.error(isAr ? "تعذّر فتح الفيديو" : "Could not open the video"); } finally { setBusy(null); }
  }
  if (!rows || rows.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 space-y-2" dir={isAr ? "rtl" : "ltr"}>
      <p className="text-sm font-semibold">{isAr ? "فيديوهات بدون مدة معتمدة (لا يمكن إكمالها حالياً)" : "Videos without a trusted duration (cannot be completed yet)"}</p>
      {rows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex-1 min-w-0 truncate">{r.title}</span>
          {r.cls === "embed_other" ? <span className="text-amber-200">{isAr ? "غير قابل للقياس (Vimeo/Drive): استبدله برابط YouTube أو ملف فيديو، وإلا يبقى غير مكتمل" : "Cannot be measured (Vimeo/Drive): replace with a YouTube link or video file, otherwise it stays incomplete"}</span> : <>
          <button disabled={busy === r.id} onClick={() => fromMeta(r)} className="px-2.5 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">{isAr ? "اقرأ من الملف" : "Read from file"}</button>
          <input value={manual[r.id] ?? ""} onChange={(e) => setManual({ ...manual, [r.id]: e.target.value })} inputMode="numeric" placeholder={isAr ? "ثوانٍ" : "seconds"} className="w-20 h-8 px-2 rounded-lg bg-white/5 border border-white/15" />
          <button onClick={() => save(r.id, sanitizeDuration(Number(manual[r.id])))} className="px-2.5 h-8 rounded-lg bg-white/10 border border-white/15">{isAr ? "حفظ" : "Save"}</button>
          </>}
        </div>
      ))}
    </div>
  );
}
