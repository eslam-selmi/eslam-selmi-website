export type ShareViewState =
  | { kind: "loading" }
  | { kind: "ready"; courseTitle: string; description: string; units: number; needsStart: boolean }
  | { kind: "denied"; reason: "not_found" | "revoked" | "expired" | "closed" | "claimed_elsewhere" };
const T = {
  ar: { start: "ابدأ الكورس", loading: "جاري التحميل", units: "وحدة", note: "الرابط ده مخصص لهذا الكورس فقط.",
    denied: { not_found: "الرابط غير صحيح.", revoked: "تم إلغاء هذا الرابط.", expired: "انتهت صلاحية هذا الرابط.", closed: "تم إغلاق هذا الرابط بعد إتمام الكورس.", claimed_elsewhere: "الرابط ده اتفتح بالفعل من متصفح آخر." } },
  en: { start: "Start the course", loading: "Loading", units: "units", note: "This link opens this course only.",
    denied: { not_found: "This link is not valid.", revoked: "This link was cancelled.", expired: "This link has expired.", closed: "This link closed after the course was completed.", claimed_elsewhere: "This link was already opened in another browser." } },
};
export function ShareVisitorView({ lang, state, onStart }: { lang: "ar" | "en"; state: ShareViewState; onStart?: () => void }) {
  const t = T[lang];
  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#0b1736] text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 text-center space-y-5">
        {state.kind === "loading" && <p className="text-white/70">{t.loading}</p>}
        {state.kind === "ready" && (<>
          <h1 className="text-2xl font-bold leading-snug">{state.courseTitle}</h1>
          <p className="text-sm text-white/70 leading-relaxed">{state.description}</p>
          <p className="text-xs text-[#2dd4bf]">{state.units} {t.units}</p>
          <button onClick={onStart} className="h-12 w-full rounded-xl bg-[#2dd4bf] text-[#0b1736] font-semibold">{t.start}</button>
          <p className="text-xs text-white/50">{t.note}</p></>)}
        {state.kind === "denied" && <p role="alert" className="text-base">{t.denied[state.reason]}</p>}
      </div>
    </main>
  );
}
