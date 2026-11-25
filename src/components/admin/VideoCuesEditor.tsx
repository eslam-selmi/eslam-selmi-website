import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  formatTime,
  parseTimeInput,
  parseVideoCues,
  serializeVideoCues,
  type VideoCue,
} from "@/lib/video-cues";

type Draft = {
  time: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

const blank = (): Draft => ({
  time: "",
  question: "",
  options: ["", ""],
  correct: 0,
  explanation: "",
});

/** Admin editor: set the times, questions and right answers for one video item. */
export function VideoCuesEditor({
  item,
  isAr,
  onSaved,
  onClose,
}: {
  item: { id: string; content?: string | null };
  isAr: boolean;
  onSaved: () => void;
  onClose: () => void;
}) {
  const t = (a: string, b: string) => (isAr ? a : b);
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    parseVideoCues(item.content).map((c: VideoCue) => ({
      time: formatTime(c.at),
      question: c.question,
      options: [...c.options],
      correct: c.correct,
      explanation: c.explanation ?? "",
    })),
  );
  const [saving, setSaving] = useState(false);

  const patch = (i: number, p: Partial<Draft>) =>
    setDrafts((d) => d.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function save() {
    const cues: VideoCue[] = [];
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      const at = parseTimeInput(d.time);
      const opts = d.options.map((o) => o.trim());
      if (at === null)
        return toast.error(
          t(
            `وقت السؤال ${i + 1} غير صحيح (مثال 1:30)`,
            `Question ${i + 1}: invalid time (e.g. 1:30)`,
          ),
        );
      if (!d.question.trim())
        return toast.error(t(`اكتب نص السؤال ${i + 1}`, `Question ${i + 1}: enter the question`));
      if (opts.length < 2 || opts.some((o) => !o))
        return toast.error(
          t(
            `السؤال ${i + 1} يحتاج اختيارين على الأقل بدون خانات فاضية`,
            `Question ${i + 1}: needs 2+ filled options`,
          ),
        );
      cues.push({
        at,
        question: d.question.trim(),
        options: opts,
        correct: d.correct,
        explanation: d.explanation.trim() || undefined,
      });
    }
    setSaving(true);
    const { error } = await supabase
      .from("module_items")
      .update({ content: serializeVideoCues(cues) })
      .eq("id", item.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("اتحفظت أسئلة الفيديو", "Video questions saved"));
    onSaved();
    onClose();
  }

  const input = "w-full rounded-lg bg-white/5 border border-white/15 px-2.5 h-9 text-sm text-white";

  return (
    <div
      className="mt-2 rounded-xl border border-[var(--gold)]/30 bg-white/[0.03] p-3 space-y-3"
      data-testid="cues-editor"
    >
      <p className="text-xs text-white/60 leading-relaxed">
        {t(
          "الفيديو بيقف عند الوقت اللي تحدده ويظهر السؤال، وبعد ما المتدرب يجاوب بيشوف الصح والغلط ويكمّل.",
          "The video pauses at the time you set and shows the question; after answering the trainee sees right or wrong and continues.",
        )}
      </p>
      {drafts.map((d, i) => (
        <div key={i} className="rounded-lg border border-white/10 p-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <input
              className={input + " max-w-[110px]"}
              dir="ltr"
              placeholder="1:30"
              aria-label={t("وقت السؤال", "Time")}
              value={d.time}
              onChange={(e) => patch(i, { time: e.target.value })}
            />
            <span className="text-[11px] text-white/45 flex-1">
              {t("دقيقة:ثانية", "minutes:seconds")}
            </span>
            <button
              type="button"
              onClick={() => setDrafts((x) => x.filter((_, j) => j !== i))}
              className="text-rose-300/70 hover:text-rose-300"
              aria-label="Delete question"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            className={input}
            placeholder={t("نص السؤال", "Question")}
            value={d.question}
            onChange={(e) => patch(i, { question: e.target.value })}
          />
          {d.options.map((o, k) => (
            <div key={k} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${item.id}-${i}`}
                checked={d.correct === k}
                onChange={() => patch(i, { correct: k })}
                aria-label={t("الإجابة الصحيحة", "Correct answer")}
              />
              <input
                className={input}
                placeholder={t(`اختيار ${k + 1}`, `Option ${k + 1}`)}
                value={o}
                onChange={(e) =>
                  patch(i, { options: d.options.map((x, j) => (j === k ? e.target.value : x)) })
                }
              />
              {d.options.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    patch(i, {
                      options: d.options.filter((_, j) => j !== k),
                      correct: d.correct === k ? 0 : d.correct > k ? d.correct - 1 : d.correct,
                    })
                  }
                  className="text-white/40 hover:text-rose-300"
                  aria-label="Remove option"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {d.options.length < 6 && (
            <button
              type="button"
              onClick={() => patch(i, { options: [...d.options, ""] })}
              className="text-[11px] text-[var(--gold)]"
            >
              + {t("اختيار", "Option")}
            </button>
          )}
          <input
            className={input}
            placeholder={t("شرح الإجابة (اختياري)", "Explanation (optional)")}
            value={d.explanation}
            onChange={(e) => patch(i, { explanation: e.target.value })}
          />
        </div>
      ))}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setDrafts((d) => [...d, blank()])}
          className="h-9 px-3 rounded-lg bg-white/5 border border-white/15 text-xs flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> {t("إضافة سؤال", "Add question")}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="h-9 px-4 rounded-lg bg-[var(--gold)] text-[#0b1736] text-xs font-semibold flex items-center gap-1"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {t("حفظ", "Save")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-3 rounded-lg text-xs text-white/60"
        >
          {t("إغلاق", "Close")}
        </button>
      </div>
    </div>
  );
}
