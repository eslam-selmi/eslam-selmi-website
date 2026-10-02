import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotebookPen, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export function ModuleNotes({ moduleId, userId, isAr }: { moduleId: string; userId: string; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef("");

  useEffect(() => {
    let cancel = false;
    supabase.from("trainee_notes").select("content").eq("module_id", moduleId).eq("user_id", userId).maybeSingle()
      .then(({ data }) => {
        if (cancel) return;
        const c = data?.content ?? "";
        setContent(c); lastSaved.current = c; setLoaded(true);
        if (c) setOpen(true);
      });
    return () => { cancel = true; };
  }, [moduleId, userId]);

  async function save(value: string, notify = false) {
    if (value === lastSaved.current) { if (notify) toast.success(isAr ? "الملاحظة محفوظة" : "Note saved"); return; }
    setStatus("saving");
    const { error } = await supabase.from("trainee_notes")
      .upsert({ user_id: userId, module_id: moduleId, content: value.slice(0, 10000) }, { onConflict: "user_id,module_id" });
    if (error) { setStatus("idle"); toast.error(isAr ? "تعذّر حفظ الملاحظة" : "Couldn't save note"); return; }
    lastSaved.current = value;
    setStatus("saved");
    if (notify) toast.success(isAr ? "تم حفظ ملاحظتك" : "Note saved");
  }

  function onChange(v: string) {
    setContent(v);
    setStatus("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(v), 1200);
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="mt-4 ms-12">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold)] hover:underline">
        <NotebookPen className="w-3.5 h-3.5" /> {isAr ? "ملاحظاتي الشخصية" : "My personal notes"}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-[var(--gold)]/20 bg-white/[0.03] p-3">
          <textarea
            value={content}
            disabled={!loaded}
            onChange={(e) => onChange(e.target.value)}
            maxLength={10000}
            rows={4}
            placeholder={isAr ? "اكتب ملاحظاتك عن هذا الجزء… تُحفظ تلقائياً" : "Write your notes for this module… saved automatically"}
            className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/35 outline-none resize-y"
          />
          <div className="flex items-center justify-between mt-2 text-[11px] text-white/45">
            <span className="flex items-center gap-1">
              {status === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> {isAr ? "جارٍ الحفظ…" : "Saving…"}</>}
              {status === "saved" && <><Check className="w-3 h-3 text-emerald-300" /> {isAr ? "تم الحفظ" : "Saved"}</>}
              {status === "idle" && (isAr ? "خاصة بك فقط" : "Visible only to you")}
            </span>
            <button type="button" onClick={() => { if (timer.current) clearTimeout(timer.current); save(content, true); }}
              className="px-3 h-7 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">
              {isAr ? "حفظ" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
