import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Flag, ChevronLeft, ChevronRight, BookOpen, Timer, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// New tables and functions are not in the generated types yet.
const db = supabase as any;

type Q = { id: string; stem: string; domain: string; options: string[] };
type Started = { attempt_id: string; duration_s: number; questions: Q[] };
type Review = { id: string; domain: string; standard: string; correct_shown_index: number | null; explanation: string | null };
type Result = { score: number; total: number; domain_scores: Record<string, number>; standard_scores: Record<string, { ok: number; total: number }>; review: Review[] };
const GUIDE_URL = "https://media.etec.gov.sa/media/n4tgwnff/%D8%AF%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D9%85%D8%AA%D9%82%D8%AF%D9%85-%D9%84%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1-%D8%A7%D9%84%D8%B1%D8%AE%D8%B5%D8%A9-%D8%A7%D9%84%D9%85%D9%87%D9%86%D9%8A%D8%A9-%D9%84%D9%84%D9%85%D8%AF%D8%B1%D8%A8%D9%8A%D9%86.pdf";
type Card = { standard_id: string; title: string; domain: string; weight_pct: number; source_coverage: string; active_questions?: number; key_points: { text: string; source: { title: string; url: string } }[]; common_trap?: string; reading: { title: string; url: string }[] };
type Past = { id: string; submitted_at: string; score: number; count: number };

const L = "أبجد";

export function ExamTool({ ar }: { ar: boolean }) {
  const t = (a: string, b: string) => (ar ? a : b);
  const [tab, setTab] = useState<"practice" | "study" | "history">("practice");
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="dash-card p-4 text-sm">
        <b>{t("أسئلة تدريبية أصلية، وليست أسئلة الامتحان الفعلي.", "Original practice questions, not the actual exam.")}</b>{" "}
        {t("المجموعة الحالية مسودة قيد المراجعة ولا تغطي كل المعايير. النتيجة للتدريب فقط ولا تتنبأ بالنجاح. العدد والوقت إعدادات تدريب وليست رسمية.",
          "The current set is a draft under review and does not cover every standard. Scores are for practice only and do not predict passing. Count and time are practice settings, not official.")}
      </div>
      <div className="flex gap-2 flex-wrap">
        {([["practice", t("التدريب", "Practice"), Timer], ["study", t("المذاكرة", "Study"), BookOpen], ["history", t("محاولاتي", "My attempts"), History]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 border ${tab === id ? "bg-[var(--gold)] text-black border-transparent" : "border-white/15"}`}><Icon className="w-4 h-4" />{label}</button>
        ))}
      </div>
      {tab === "practice" ? <Practice ar={ar} /> : tab === "study" ? <Study ar={ar} /> : <HistoryList ar={ar} />}
    </div>
  );
}

function Practice({ ar }: { ar: boolean }) {
  const t = (a: string, b: string) => (ar ? a : b);
  const [count, setCount] = useState(20);
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [run, setRun] = useState<Started | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  async function start() {
    setBusy(true); setErr(null);
    const { data, error } = await db.rpc("start_exam", { p_count: count, p_duration_s: Math.round(minutes * 60) });
    setBusy(false);
    if (error) return setErr(error.message.includes("no approved") ? t("لا توجد أسئلة معتمدة متاحة بعد.", "No approved questions are available yet.") : t("تعذّر بدء التدريب.", "Could not start practice."));
    setResult(null); setTimedOut(false); setRun(data as Started);
  }
  if (result) return <ResultView ar={ar} r={result} timedOut={timedOut} onAgain={() => { setResult(null); setRun(null); }} />;
  if (run) return <Run ar={ar} run={run} onDone={(r, to) => { setTimedOut(to); setResult(r); setRun(null); }} />;
  return (
    <div className="dash-card p-5 space-y-3">
      <h2 className="font-bold text-lg">{t("إعداد التدريب", "Practice setup")}</h2>
      <div className="flex gap-3 flex-wrap">
        <label className="text-sm space-y-1 block">{t("عدد الأسئلة", "Questions")}
          <input type="number" min={5} max={200} value={count} onChange={(e) => setCount(Math.max(5, Math.min(200, +e.target.value || 5)))} className="block h-11 w-32 rounded-xl bg-white/5 border border-white/10 px-3" /></label>
        <label className="text-sm space-y-1 block">{t("الوقت بالدقائق", "Minutes")}
          <input type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(240, +e.target.value || 5)))} className="block h-11 w-32 rounded-xl bg-white/5 border border-white/10 px-3" /></label>
      </div>
      <p className="text-xs opacity-70">{t("لو طلبت أكثر من الأسئلة المتاحة يُقلَّل العدد تلقائيًا. الأسئلة غير المعتمدة لا تظهر.", "If you ask for more than is available, the count is reduced. Unapproved questions are never shown.")}</p>
      {err && <p className="text-sm text-red-300">{err}</p>}
      <button type="button" disabled={busy} onClick={start} className="h-11 px-5 rounded-xl bg-[var(--gold)] text-black font-bold text-sm inline-flex items-center gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />}{t("ابدأ التدريب", "Start practice")}</button>
    </div>
  );
}

function Run({ ar, run, onDone }: { ar: boolean; run: Started; onDone: (r: Result, timedOut: boolean) => void }) {
  const t = (a: string, b: string) => (ar ? a : b);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<Record<string, number>>({});
  const [flag, setFlag] = useState<Set<string>>(new Set());
  const endAt = useRef(Date.now() + run.duration_s * 1000);
  const [left, setLeft] = useState(run.duration_s);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const done = useRef(false);
  const ansRef = useRef<Record<string, number>>({});
  ansRef.current = ans; // timer callback must read the latest answers, not the first render's empty object
  const q = run.questions[i];

  async function submit(timeout: boolean) {
    if (done.current) return;
    if (!timeout) { const un = run.questions.filter((x) => ansRef.current[x.id] === undefined).length; if (un && !window.confirm(t(`باقي ${un} سؤال بدون إجابة. تسليم؟`, `${un} unanswered. Submit?`))) return; }
    done.current = true; setBusy(true); setErr(false);
    const { data, error } = await db.rpc("submit_exam", { p_attempt: run.attempt_id, p_answers: ansRef.current });
    if (error) { done.current = false; setBusy(false); setErr(true); return; }
    onDone(data as Result, timeout);
  }
  useEffect(() => {
    const h = setInterval(() => {
      const s = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) { clearInterval(h); void submit(true); }
    }, 500);
    return () => clearInterval(h);
    // eslint-disable-next-line
  }, []);
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, "0");
  return (
    <div className="space-y-3">
      <div className="dash-card p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">{t(`سؤال ${i + 1} من ${run.questions.length}`, `Question ${i + 1} of ${run.questions.length}`)}</span>
          <span className={`font-bold tabular-nums text-lg ${left < 60 ? "text-red-300" : ""}`} dir="ltr">{mm}:{ss}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {run.questions.map((x, k) => (
            <button key={x.id} type="button" onClick={() => setI(k)} className={`w-9 h-9 rounded-lg text-xs border ${k === i ? "ring-2 ring-[var(--gold)]" : ""} ${ans[x.id] !== undefined ? "bg-emerald-500/20 border-emerald-400/40" : "border-white/15"} ${flag.has(x.id) ? "border-amber-400" : ""}`}>{k + 1}</button>
          ))}
        </div>
      </div>
      <div className="dash-card p-5 space-y-3">
        <p className="text-lg leading-8">{q.stem}</p>
        {q.options.map((o, k) => (
          <button key={k} type="button" onClick={() => setAns((a) => ({ ...a, [q.id]: k }))} className={`w-full text-start flex gap-3 items-start rounded-xl border p-3 ${ans[q.id] === k ? "border-emerald-400 bg-emerald-500/15" : "border-white/15"}`}>
            <span className="w-7 h-7 shrink-0 rounded-full border border-white/30 grid place-items-center text-xs">{ar ? L[k] : String.fromCharCode(65 + k)}</span><span>{o}</span>
          </button>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => setFlag((f) => { const n = new Set(f); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })} className="h-10 px-3 rounded-xl border border-white/15 text-sm inline-flex items-center gap-1.5"><Flag className="w-4 h-4" />{flag.has(q.id) ? t("إلغاء العلامة", "Unflag") : t("علّم للمراجعة", "Flag for review")}</button>
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="h-10 px-3 rounded-xl border border-white/15 text-sm inline-flex items-center gap-1 disabled:opacity-40"><ChevronRight className="w-4 h-4 ltr:hidden" /><ChevronLeft className="w-4 h-4 rtl:hidden" />{t("السابق", "Previous")}</button>
          <button type="button" disabled={i === run.questions.length - 1} onClick={() => setI(i + 1)} className="h-10 px-3 rounded-xl border border-white/15 text-sm inline-flex items-center gap-1 disabled:opacity-40">{t("التالي", "Next")}<ChevronLeft className="w-4 h-4 ltr:hidden" /><ChevronRight className="w-4 h-4 rtl:hidden" /></button>
          <button type="button" disabled={busy} onClick={() => submit(false)} className="h-10 px-4 rounded-xl bg-[var(--gold)] text-black font-bold text-sm inline-flex items-center gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />}{t("إنهاء وتسليم", "Finish and submit")}</button>
        </div>
        {err && <p className="text-sm text-red-300">{t("تعذّر التسليم. إجاباتك ما زالت هنا، حاول مرة ثانية.", "Could not submit. Your answers are still here; try again.")}</p>}
      </div>
    </div>
  );
}

function ResultView({ ar, r, timedOut, onAgain }: { ar: boolean; r: Result; timedOut: boolean; onAgain: () => void }) {
  const t = (a: string, b: string) => (ar ? a : b);
  const rows = useMemo(() => Object.entries(r.standard_scores || {}).sort((a, b) => (+(a[1].total < 2) - +(b[1].total < 2)) || (a[1].ok / a[1].total - b[1].ok / b[1].total)), [r]);
  const wrong = r.review.filter((x) => x.correct_shown_index !== null);
  return (
    <div className="space-y-4">
      <div className="dash-card p-5 space-y-2">
        <h2 className="font-bold text-lg">{t("نتيجة التدريب", "Practice result")}</h2>
        <div className="text-4xl font-extrabold" dir="ltr">{r.score} / {r.total}</div>
        <p className="text-sm opacity-70">{timedOut ? t("انتهى الوقت وتم التسليم تلقائيًا. ", "Time ran out and your answers were submitted. ") : ""}{t("نتيجة تدريب على عيّنة أسئلة، وليست توقعًا لنتيجة الامتحان.", "A practice result on a sample of questions, not a prediction of the exam.")}</p>
      </div>
      <div className="dash-card p-5 space-y-2">
        <h3 className="font-bold">{t("نقاط الضعف حسب المعيار", "Weak points by standard")}</h3>
        {rows.map(([k, v]) => {
          const small = v.total < 2; const p = v.ok / v.total;
          return (<div key={k} className="flex justify-between gap-3 text-sm border-t border-white/10 pt-2"><span>{k}</span><span dir="ltr">{v.ok}/{v.total}</span>
            <span className="text-xs">{small ? t("العيّنة صغيرة", "Sample too small") : p < 0.5 ? t("راجعه أولًا", "Review first") : p < 0.8 ? t("يحتاج تثبيتًا", "Needs reinforcing") : t("جيد", "Good")}</span></div>);
        })}
        <p className="text-xs opacity-60">{t("لا يُصنَّف المعيار الذي ظهر له سؤال واحد فقط.", "A standard with only one question is not rated.")}</p>
      </div>
      <div className="dash-card p-5 space-y-2">
        <h3 className="font-bold">{t("حسب المحور", "By domain")}</h3>
        {Object.entries(r.domain_scores || {}).map(([k, v]) => <div key={k} className="text-sm flex justify-between"><span>{k}</span><span dir="ltr">{v}</span></div>)}
      </div>
      <div className="dash-card p-5 space-y-2">
        <h3 className="font-bold">{t("مراجعة", "Review")}</h3>
        {wrong.length === 0 ? <p className="text-sm">{t("لا توجد بيانات مراجعة.", "No review data.")}</p> : wrong.map((x) => x.explanation ? <p key={x.id} className="text-sm border-t border-white/10 pt-2"><b>{x.standard}</b> {x.explanation}</p> : null)}
      </div>
      <button type="button" onClick={onAgain} className="h-11 px-5 rounded-xl bg-[var(--gold)] text-black font-bold text-sm">{t("تدريب جديد", "New practice")}</button>
    </div>
  );
}

function Study({ ar }: { ar: boolean }) {
  const t = (a: string, b: string) => (ar ? a : b);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let dead = false;
    supabase.storage.from("tool-assets").download("exam/study_cards.json").then(async ({ data, error }) => {
      if (dead) return;
      if (error || !data) return setErr(true);
      try { setCards(JSON.parse(await data.text()).cards as Card[]); } catch { setErr(true); }
    });
    return () => { dead = true; };
  }, []);
  if (err) return <div className="dash-card p-4 text-sm">{t("تعذّر تحميل مادة المذاكرة.", "Could not load the study material.")}</div>;
  if (!cards) return <div className="dash-card p-6"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  const cov: Record<string, string> = { covered: t("مصادر موثقة", "Sourced"), partial: t("مصادر جزئية", "Partial sources"), uncovered: t("لا مصدر موثق", "No verified source") };
  return (
    <div className="space-y-3">
      <p className="text-xs opacity-70">{t("الأوزان المعروضة هي أوزان المعايير في دليل المتقدم الرسمي. أسئلة التدريب هنا غير موزعة بهذه الأوزان، وعددها في كل معيار محدود.", "Weights shown are the standard weights in the official applicant guide. The practice questions here are not distributed by these weights, and each standard has only a few.")}</p>
      {cards.map((c) => (
        <div key={c.standard_id} className="dash-card p-5 space-y-2">
          <div className="flex justify-between gap-2 flex-wrap"><h3 className="font-bold">{c.standard_id} {c.title}</h3><span className="text-xs border border-white/15 rounded-md px-2 py-0.5">{cov[c.source_coverage] || c.source_coverage}</span></div>
          <div className="text-xs opacity-60">{c.domain} | {t("الوزن في الدليل الرسمي", "Official guide weight")} {c.weight_pct}% <a className="underline" href={`${GUIDE_URL}#page=${Number(c.standard_id.split(".")[0]) <= 5 ? 5 : 6}`} target="_blank" rel="noopener noreferrer">({t("دليل المتقدم 1447-2026، ص", "Applicant guide 1447-2026, p.")}{Number(c.standard_id.split(".")[0]) <= 5 ? 5 : 6})</a></div>
          {c.source_coverage !== "covered" && <p className="text-xs opacity-70">{t("المادة الموثقة لهذا المعيار محدودة.", "Limited verified material for this standard.")}</p>}
          <ul className="list-disc ps-5 space-y-1 text-sm">{c.key_points.map((k, n) => <li key={n}>{k.text} <a className="underline text-xs" href={k.source.url} target="_blank" rel="noopener noreferrer">({k.source.title})</a></li>)}</ul>
          {c.common_trap && <p className="text-sm"><b>{t("فخ شائع:", "Common trap:")}</b> {c.common_trap}</p>}
        </div>
      ))}
    </div>
  );
}

function HistoryList({ ar }: { ar: boolean }) {
  const t = (a: string, b: string) => (ar ? a : b);
  const [rows, setRows] = useState<Past[] | null>(null);
  useEffect(() => {
    db.from("exam_attempts").select("id,submitted_at,score,count").not("submitted_at", "is", null).order("submitted_at", { ascending: false }).limit(30)
      .then(({ data }: { data: Past[] | null }) => setRows(data || []));
  }, []);
  if (!rows) return <div className="dash-card p-6"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  return (
    <div className="dash-card p-5 space-y-2">
      <p className="text-xs opacity-60">{t("محاولاتك السابقة، ولا يراها غيرك.", "Your past attempts. Only you can see them.")}</p>
      {rows.length === 0 ? <p className="text-sm">{t("لا توجد محاولات بعد.", "No attempts yet.")}</p> : rows.map((r) => (
        <div key={r.id} className="flex justify-between text-sm border-t border-white/10 pt-2"><span>{new Date(r.submitted_at).toLocaleString(ar ? "ar" : "en")}</span><span dir="ltr">{r.score}/{r.count}</span></div>
      ))}
    </div>
  );
}
