import { useState } from "react";

export type AdminShareLink = { id: string; courseTitle: string; createdAt: string; expiresAt: string | null; autoClose: boolean; bindFirst: boolean; status: "open" | "closed" | "revoked" | "expired" };
type Props = {
  lang: "ar" | "en";
  courses: { id: string; title: string }[];
  links: AdminShareLink[];
  justCreated?: { url: string } | null;
  onCreate: (o: { courseId: string; expiresAt: string | null; autoClose: boolean; bindFirst: boolean }) => void;
  onRevoke: (id: string) => void;
};
const T = {
  ar: { title: "روابط مشاركة الكورسات", course: "الكورس", expires: "ينتهي في (اختياري)", close: "يتقفل بعد ما يخلص الكورس", bind: "أول متصفح يبدأ يحتفظ بالرابط", create: "إنشاء رابط", copyNote: "انسخ الرابط الآن. مش هيظهر تاني.", list: "الروابط", none: "لا توجد روابط", revoke: "إلغاء", status: { open: "شغال", closed: "اتقفل", revoked: "ملغي", expired: "منتهي" } },
  en: { title: "Course share links", course: "Course", expires: "Expires (optional)", close: "Close after the course is finished", bind: "First browser to start keeps the link", create: "Create link", copyNote: "Copy the link now. It will not be shown again.", list: "Links", none: "No links yet", revoke: "Revoke", status: { open: "Open", closed: "Closed", revoked: "Revoked", expired: "Expired" } },
};
export function ShareLinksPanel({ lang, courses, links, justCreated, onCreate, onRevoke }: Props) {
  const t = T[lang];
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [expires, setExpires] = useState("");
  const [autoClose, setAutoClose] = useState(true);
  const [bindFirst, setBindFirst] = useState(false);
  const field = "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm";
  return (
    <section dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-5 text-white">
      <h2 className="text-xl font-bold">{t.title}</h2>
      <div className="rounded-2xl border border-white/10 bg-[#0b1736] p-5 space-y-4">
        <label className="block space-y-1.5"><span className="text-sm text-white/70">{t.course}</span>
          <select className={field} value={courseId} onChange={(e) => setCourseId(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label className="block space-y-1.5"><span className="text-sm text-white/70">{t.expires}</span>
          <input type="date" className={field} value={expires} onChange={(e) => setExpires(e.target.value)} /></label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={autoClose} onChange={(e) => setAutoClose(e.target.checked)} className="h-5 w-5 accent-[#2dd4bf]" />{t.close}</label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={bindFirst} onChange={(e) => setBindFirst(e.target.checked)} className="h-5 w-5 accent-[#2dd4bf]" />{t.bind}</label>
        <button onClick={() => onCreate({ courseId, expiresAt: expires ? new Date(expires).toISOString() : null, autoClose, bindFirst })} className="h-11 px-6 rounded-xl bg-[#2dd4bf] text-[#0b1736] font-semibold">{t.create}</button>
        {justCreated && (<div className="rounded-xl border border-[#2dd4bf]/40 bg-[#2dd4bf]/10 p-3 space-y-1.5"><p className="text-xs text-white/70">{t.copyNote}</p><p dir="ltr" className="break-all text-sm font-mono">{justCreated.url}</p></div>)}
      </div>
      <h3 className="font-semibold">{t.list}</h3>
      {links.length === 0 ? <p className="text-sm text-white/60">{t.none}</p> : (
        <ul className="space-y-2">{links.map((l) => (
          <li key={l.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="font-medium truncate">{l.courseTitle}</p>
              <p className="text-xs text-white/60">{t.status[l.status]} · {l.createdAt}{l.expiresAt ? ` · → ${l.expiresAt}` : ""}</p></div>
            {l.status === "open" && <button onClick={() => onRevoke(l.id)} className="h-9 px-3 rounded-lg border border-white/20 text-xs shrink-0">{t.revoke}</button>}
          </li>))}</ul>)}
    </section>
  );
}
