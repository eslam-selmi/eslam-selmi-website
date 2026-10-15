import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Star, MessageSquareHeart, CheckCircle2 } from "lucide-react";
import type { Database, Json } from "@/integrations/supabase/types";

type Q = Database["public"]["Tables"]["feedback_questions"]["Row"];
type Opt = { value: string; ar: string; en: string };
type Val = number | boolean | string | null;
const COLUMN_KEYS = ["content_rating", "trainer_rating", "expectations_rating", "pace", "would_recommend", "comments"] as const;

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n}`} onClick={() => onChange(n)}>
          <Star className={`w-5 h-5 transition ${n <= value ? "fill-[var(--gold)] text-[var(--gold)]" : "text-white/25"}`} />
        </button>
      ))}
    </div>
  );
}

const pill = (on: boolean) => `h-9 px-2 rounded-lg text-xs border ${on ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-white/15 bg-white/5 text-white/70"}`;

export function CourseFeedbackForm({ courseId, userId }: { courseId: string; userId: string }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [vals, setVals] = useState<Record<string, Val>>({});
  const [existing, setExisting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: qs }, { data: fb }] = await Promise.all([
        supabase.from("feedback_questions").select("*").eq("is_visible", true).order("sort_order"),
        supabase.from("course_feedback").select("*").eq("course_id", courseId).eq("user_id", userId).maybeSingle(),
      ]);
      setQuestions(qs ?? []);
      if (fb) {
        setExisting(true);
        const v: Record<string, Val> = { ...((fb.answers as Record<string, Val>) ?? {}) };
        COLUMN_KEYS.forEach((k) => { v[k] = fb[k] as Val; });
        setVals(v);
      }
      setLoading(false);
    })();
  }, [courseId, userId]);

  const keyOf = (q: Q) => q.key ?? q.id;
  const set = (k: string, v: Val) => setVals((p) => ({ ...p, [k]: v }));

  async function submit() {
    const missing = questions.some((q) => q.is_required && (vals[keyOf(q)] == null || vals[keyOf(q)] === "" || vals[keyOf(q)] === 0));
    if (missing) return toast.error(isAr ? "من فضلك أكمل الأسئلة المطلوبة" : "Please answer the required questions");
    const answers: Record<string, Val> = {};
    questions.filter((q) => !q.key || !(COLUMN_KEYS as readonly string[]).includes(q.key)).forEach((q) => {
      const v = vals[keyOf(q)];
      if (v != null) answers[keyOf(q)] = typeof v === "string" ? v.slice(0, 2000) : v;
    });
    const num = (k: string) => (typeof vals[k] === "number" ? (vals[k] as number) : null);
    setSaving(true);
    const { error } = await supabase.from("course_feedback").upsert({
      user_id: userId, course_id: courseId,
      content_rating: num("content_rating"), trainer_rating: num("trainer_rating"), expectations_rating: num("expectations_rating"),
      would_recommend: typeof vals.would_recommend === "boolean" ? vals.would_recommend : null,
      pace: typeof vals.pace === "string" ? vals.pace : null,
      comments: typeof vals.comments === "string" && vals.comments.trim() ? vals.comments.trim().slice(0, 2000) : null,
      answers: answers as Json,
    }, { onConflict: "user_id,course_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isAr ? "شكراً لتقييمك 🙏" : "Thanks for your feedback 🙏");
    setExisting(true); setEditing(false);
  }

  if (loading || questions.length === 0) return null;

  return (
    <div className="dash-card dash-card-hover p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <MessageSquareHeart className="w-4 h-4 text-[var(--gold)]" /> {isAr ? "قيّم الكورس" : "Rate this course"}
      </h3>
      {existing && !editing ? (
        <div className="space-y-2">
          <p className="text-xs text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> {isAr ? "تم استلام تقييمك، شكراً لك" : "Your feedback was received, thank you"}</p>
          <button onClick={() => setEditing(true)} className="text-xs text-[var(--gold)] underline">{isAr ? "تعديل التقييم" : "Edit feedback"}</button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const k = keyOf(q);
            const label = (isAr ? q.label_ar : q.label_en) + (q.is_required ? " *" : "");
            const v = vals[k];
            if (q.kind === "stars") return (
              <div key={q.id} className="flex items-center justify-between gap-2">
                <span className="text-xs text-white/75">{label}</span>
                <Stars value={typeof v === "number" ? v : 0} onChange={(n) => set(k, n)} />
              </div>
            );
            if (q.kind === "yesno") return (
              <div key={q.id}>
                <p className="text-xs text-white/75 mb-1.5">{label}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[true, false].map((b) => <button key={String(b)} type="button" onClick={() => set(k, b)} className={pill(v === b)}>{b ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}</button>)}
                </div>
              </div>
            );
            if (q.kind === "choice") {
              const opts = (Array.isArray(q.options) ? q.options : []) as unknown as Opt[];
              return (
                <div key={q.id}>
                  <p className="text-xs text-white/75 mb-1.5">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {opts.map((o) => <button key={o.value} type="button" onClick={() => set(k, o.value)} className={`${pill(v === o.value)} flex-1 min-w-[5rem]`}>{isAr ? o.ar : o.en}</button>)}
                  </div>
                </div>
              );
            }
            return (
              <div key={q.id}>
                <p className="text-xs text-white/75 mb-1.5">{label}</p>
                <textarea value={typeof v === "string" ? v : ""} onChange={(e) => set(k, e.target.value)} maxLength={2000} rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
              </div>
            );
          })}
          <button onClick={submit} disabled={saving}
            className="w-full h-10 rounded-lg text-xs font-semibold bg-[var(--gold)] text-[#0b1736] disabled:opacity-50">
            {saving ? "..." : (isAr ? "إرسال التقييم" : "Submit feedback")}
          </button>
        </div>
      )}
    </div>
  );
}
