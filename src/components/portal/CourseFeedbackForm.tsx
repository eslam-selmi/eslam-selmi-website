import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Star, MessageSquareHeart, CheckCircle2 } from "lucide-react";

type Pace = "slow" | "right" | "fast";

function Stars({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-white/75">{label}</span>
      <div className="flex gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n}`} onClick={() => onChange(n)}>
            <Star className={`w-5 h-5 transition ${n <= value ? "fill-[var(--gold)] text-[var(--gold)]" : "text-white/25"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function CourseFeedbackForm({ courseId, userId }: { courseId: string; userId: string }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(0);
  const [trainer, setTrainer] = useState(0);
  const [expect, setExpect] = useState(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [pace, setPace] = useState<Pace | null>(null);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_feedback").select("*")
        .eq("course_id", courseId).eq("user_id", userId).maybeSingle();
      if (data) {
        setExisting(true);
        setContent(data.content_rating); setTrainer(data.trainer_rating); setExpect(data.expectations_rating);
        setRecommend(data.would_recommend); setPace(data.pace as Pace); setComments(data.comments ?? "");
      }
      setLoading(false);
    })();
  }, [courseId, userId]);

  async function submit() {
    if (!content || !trainer || !expect || recommend === null || !pace)
      return toast.error(isAr ? "من فضلك أكمل كل الأسئلة" : "Please answer all questions");
    setSaving(true);
    const { error } = await supabase.from("course_feedback").upsert({
      user_id: userId, course_id: courseId, content_rating: content, trainer_rating: trainer,
      expectations_rating: expect, would_recommend: recommend, pace, comments: comments.trim().slice(0, 2000) || null,
    }, { onConflict: "user_id,course_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isAr ? "شكراً لتقييمك 🙏" : "Thanks for your feedback 🙏");
    setExisting(true); setEditing(false);
  }

  if (loading) return null;

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
        <div className="space-y-3">
          <Stars label={isAr ? "جودة المحتوى" : "Content quality"} value={content} onChange={setContent} />
          <Stars label={isAr ? "أداء المدرب" : "Trainer"} value={trainer} onChange={setTrainer} />
          <Stars label={isAr ? "مدى تحقيق توقعاتك" : "Met your expectations"} value={expect} onChange={setExpect} />
          <div>
            <p className="text-xs text-white/75 mb-1.5">{isAr ? "سرعة الشرح كانت:" : "The pace was:"}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["slow", "right", "fast"] as Pace[]).map((p) => (
                <button key={p} type="button" onClick={() => setPace(p)}
                  className={`h-9 rounded-lg text-xs border ${pace === p ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-white/15 bg-white/5 text-white/70"}`}>
                  {p === "slow" ? (isAr ? "بطيئة" : "Slow") : p === "right" ? (isAr ? "مناسبة" : "Just right") : (isAr ? "سريعة" : "Fast")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-white/75 mb-1.5">{isAr ? "هل ترشّح الكورس لغيرك؟" : "Would you recommend it?"}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[true, false].map((v) => (
                <button key={String(v)} type="button" onClick={() => setRecommend(v)}
                  className={`h-9 rounded-lg text-xs border ${recommend === v ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-white/15 bg-white/5 text-white/70"}`}>
                  {v ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}
                </button>
              ))}
            </div>
          </div>
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} maxLength={2000} rows={3}
            placeholder={isAr ? "ملاحظاتك واقتراحاتك (اختياري)" : "Comments & suggestions (optional)"}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60" />
          <button onClick={submit} disabled={saving}
            className="w-full h-10 rounded-lg text-xs font-semibold bg-[var(--gold)] text-[#0b1736] disabled:opacity-50">
            {saving ? "..." : (isAr ? "إرسال التقييم" : "Submit feedback")}
          </button>
        </div>
      )}
    </div>
  );
}
