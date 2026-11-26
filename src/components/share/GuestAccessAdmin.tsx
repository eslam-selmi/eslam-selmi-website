import { useCallback, useEffect, useState } from "react";
import { getGuestAccount, createGuestAccount, resetGuestAccountPassword, setGuestAccountEnabled, setGuestAccountCourses, removeGuestAccount } from "@/lib/guest-access.functions";

const T = {
  ar: { title: "حسابات الضيوف", note: "اعمل حساب مستقل لكل شخص (إيميل وباسورد)، واختار له كورس أو أكتر. كل ضيف يشوف الكورسات المحددة له فقط، للتصفح بس، من صفحة /guest. الباسورد بيظهر مرة واحدة.", name: "الاسم (اختياري)", email: "إيميل الضيف", courses: "الكورسات المتاحة له", none: "اختار كورس واحد على الأقل", create: "إنشاء حساب الضيف", reset: "باسورد جديد", on: "شغال", off: "متوقف", enable: "تشغيل", disable: "إيقاف", once: "انسخ الباسورد الآن. مش هيظهر تاني.", exists: "الإيميل ده مستخدم لضيف تاني", bad: "الإيميل غير صحيح", save: "حفظ الكورسات", saved: "تم الحفظ", del: "حذف", sure: "تأكيد الحذف", list: "الضيوف", empty: "لسه مفيش ضيوف", count: (n: number) => (n === 0 ? "من غير كورسات" : n === 1 ? "كورس واحد" : n === 2 ? "كورسان" : n <= 10 ? `${n} كورسات` : `${n} كورسًا`), edit: "تعديل الكورسات", close: "إغلاق", fail: "حصل خطأ، جرّب تاني" },
  en: { title: "Guest accounts", note: "Create a separate login (email and password) for each person and choose one or more courses for them. Each guest sees only the courses chosen for them, read only, at /guest. The password is shown once.", name: "Name (optional)", email: "Guest email", courses: "Courses this guest can see", none: "Choose at least one course", create: "Create guest account", reset: "New password", on: "On", off: "Off", enable: "Turn on", disable: "Turn off", once: "Copy the password now. It will not be shown again.", exists: "That email already has a guest account", bad: "Invalid email", save: "Save courses", saved: "Saved", del: "Delete", sure: "Confirm delete", list: "Guests", empty: "No guests yet", count: (n: number) => (n === 0 ? "No courses" : n === 1 ? "1 course" : `${n} courses`), edit: "Edit courses", close: "Close", fail: "Something went wrong, try again" },
};
type Course = { id: string; title: string };
type Guest = { id: string; email: string; name: string; enabled: boolean; courseIds: string[] };

function CoursePick({ courses, value, onChange, label }: { courses: Course[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <fieldset className="space-y-2"><legend className="text-sm text-white/70">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {courses.map((c) => {
          const on = value.includes(c.id);
          return (
            <label key={c.id} className={`flex items-center gap-2 rounded-xl border px-3 min-h-11 py-2 text-sm cursor-pointer ${on ? "border-[#2dd4bf]/60 bg-[#2dd4bf]/10" : "border-white/15 bg-white/5"}`}>
              <input type="checkbox" className="h-4 w-4 accent-[#2dd4bf]" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== c.id) : [...value, c.id])} />
              <span className="min-w-0 break-words">{c.title}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function GuestAccessAdmin({ lang }: { lang: "ar" | "en" }) {
  const t = T[lang];
  const [data, setData] = useState<{ guests: Guest[]; courses: Course[] } | null>(null);
  const [email, setEmail] = useState(""); const [name, setName] = useState(""); const [picked, setPicked] = useState<string[]>([]);
  const [shown, setShown] = useState<{ email: string; password: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ id: string; ids: string[] } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const load = useCallback(async () => { try { setData((await getGuestAccount()) as any); } catch { setData({ guests: [], courses: [] }); } }, []);
  useEffect(() => { void load(); }, [load]);
  const guard = async (fn: () => Promise<void>) => { try { setMsg(null); await fn(); } catch { setMsg(t.fail); } };
  const field = "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm";
  const btn = "h-11 px-4 rounded-xl border border-[#2dd4bf]/50 text-[#2dd4bf] text-sm";
  const title = (id: string) => data?.courses.find((c) => c.id === id)?.title ?? "";
  return (
    <section dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-4 text-white">
      <h2 className="text-xl font-bold">{t.title}</h2>
      <p className="text-sm text-white/65">{t.note}</p>
      <div className="rounded-2xl border border-white/10 bg-[#0b1736] p-5 space-y-4">
        <label className="block space-y-1.5"><span className="text-sm text-white/70">{t.name}</span><input className={field} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block space-y-1.5"><span className="text-sm text-white/70">{t.email}</span><input dir="ltr" type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <CoursePick courses={data?.courses ?? []} value={picked} onChange={setPicked} label={t.courses} />
        <button disabled={picked.length === 0} className="h-11 px-6 rounded-xl bg-[#2dd4bf] text-[#0b1736] font-semibold disabled:opacity-40" onClick={() => guard(async () => {
          const r: any = await createGuestAccount({ data: { email, name, courseIds: picked } });
          if (r.ok) { setShown({ email: r.email, password: r.password }); setEmail(""); setName(""); setPicked([]); await load(); } else setMsg(r.reason === "exists" ? t.exists : t.bad);
        })}>{t.create}</button>
        {picked.length === 0 && <p className="text-xs text-white/50">{t.none}</p>}
        {msg && <p className="text-sm text-rose-300" role="alert">{msg}</p>}
        {shown && (<div className="rounded-xl border border-[#2dd4bf]/40 bg-[#2dd4bf]/10 p-3 space-y-1.5"><p className="text-xs text-white/70">{t.once}</p><p dir="ltr" className="text-sm font-mono break-all">{shown.email}</p><p dir="ltr" className="text-sm font-mono break-all">{shown.password}</p></div>)}
      </div>
      <h3 className="text-base font-semibold pt-2">{t.list}</h3>
      {data && data.guests.length === 0 && <p className="text-sm text-white/55">{t.empty}</p>}
      <div className="space-y-3">
        {data?.guests.map((g) => (
          <div key={g.id} className="rounded-2xl border border-white/10 bg-[#0b1736] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm min-w-0 break-all">{g.name && <span className="font-semibold">{g.name} · </span>}<span dir="ltr">{g.email}</span></p>
              <span className={`text-xs rounded-full px-2.5 py-1 ${g.enabled ? "bg-[#2dd4bf]/15 text-[#2dd4bf]" : "bg-white/10 text-white/60"}`}>{g.enabled ? t.on : t.off}</span>
            </div>
            <p className="text-xs text-white/60">{t.count(g.courseIds.length)}{g.courseIds.length > 0 && ": " + g.courseIds.map(title).filter(Boolean).join(lang === "ar" ? "، " : ", ")}</p>
            {edit?.id === g.id && (
              <div className="space-y-3">
                <CoursePick courses={data.courses} value={edit.ids} onChange={(ids) => setEdit({ id: g.id, ids })} label={t.courses} />
                <div className="flex gap-2"><button className={btn} onClick={() => guard(async () => { await setGuestAccountCourses({ data: { id: g.id, courseIds: edit.ids } }); setEdit(null); await load(); })}>{t.save}</button><button className={btn} onClick={() => setEdit(null)}>{t.close}</button></div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button className={btn} onClick={() => setEdit({ id: g.id, ids: g.courseIds })}>{t.edit}</button>
              <button className={btn} onClick={() => guard(async () => { const r: any = await resetGuestAccountPassword({ data: { id: g.id } }); if (r.ok) setShown({ email: r.email, password: r.password }); })}>{t.reset}</button>
              <button className={btn} onClick={() => guard(async () => { await setGuestAccountEnabled({ data: { id: g.id, enabled: !g.enabled } }); await load(); })}>{g.enabled ? t.disable : t.enable}</button>
              <button className={`${btn} !border-rose-400/50 !text-rose-300`} onClick={() => guard(async () => { if (confirmDel !== g.id) { setConfirmDel(g.id); return; } await removeGuestAccount({ data: { id: g.id } }); setConfirmDel(null); await load(); })}>{confirmDel === g.id ? t.sure : t.del}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
