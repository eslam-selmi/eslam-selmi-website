import { useCallback, useEffect, useState } from "react";
import { getGuestAccount, createGuestAccount, resetGuestAccountPassword, setGuestAccountEnabled } from "@/lib/guest-access.functions";

const T = {
  ar: { title: "دخول الضيف", note: "إيميل وباسورد واحد يفتح الكورسات المتاحة للتصفح فقط من صفحة /guest. الباسورد بيظهر مرة واحدة. إيقاف الدخول أو باسورد جديد يخرّج أي حد داخل فورًا.", email: "إيميل الضيف", create: "إنشاء دخول الضيف", reset: "باسورد جديد", on: "شغال", off: "متوقف", enable: "تشغيل", disable: "إيقاف", once: "انسخ الباسورد الآن. مش هيظهر تاني.", exists: "فيه دخول ضيف موجود", bad: "الإيميل غير صحيح" },
  en: { title: "Guest login", note: "One email and password that lets someone browse the available courses, read only, at /guest. The password is shown once. Turning it off or setting a new password signs everyone out at once.", email: "Guest email", create: "Create guest login", reset: "New password", on: "On", off: "Off", enable: "Turn on", disable: "Turn off", once: "Copy the password now. It will not be shown again.", exists: "A guest login already exists", bad: "Invalid email" },
};
export function GuestAccessAdmin({ lang }: { lang: "ar" | "en" }) {
  const t = T[lang];
  const [g, setG] = useState<{ exists: boolean; email?: string; enabled?: boolean } | null>(null);
  const [email, setEmail] = useState("");
  const [shown, setShown] = useState<{ email: string; password: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const load = useCallback(async () => { try { setG((await getGuestAccount()) as any); } catch { setG({ exists: false }); } }, []);
  useEffect(() => { void load(); }, [load]);
  const field = "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm";
  const btn = "h-11 px-5 rounded-xl border border-[#2dd4bf]/50 text-[#2dd4bf] text-sm";
  return (
    <section dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-4 text-white">
      <h2 className="text-xl font-bold">{t.title}</h2>
      <p className="text-sm text-white/65">{t.note}</p>
      <div className="rounded-2xl border border-white/10 bg-[#0b1736] p-5 space-y-4">
        {g?.exists ? (
          <>
            <p className="text-sm"><span dir="ltr">{g.email}</span> · {g.enabled ? t.on : t.off}</p>
            <div className="flex flex-wrap gap-2">
              <button className={btn} onClick={async () => { const r: any = await resetGuestAccountPassword(); if (r.ok) setShown({ email: r.email, password: r.password }); }}>{t.reset}</button>
              <button className={btn} onClick={async () => { await setGuestAccountEnabled({ data: { enabled: !g.enabled } }); await load(); }}>{g.enabled ? t.disable : t.enable}</button>
            </div>
          </>
        ) : (
          <>
            <label className="block space-y-1.5"><span className="text-sm text-white/70">{t.email}</span><input dir="ltr" type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <button className="h-11 px-6 rounded-xl bg-[#2dd4bf] text-[#0b1736] font-semibold" onClick={async () => { const r: any = await createGuestAccount({ data: { email } }); if (r.ok) { setShown({ email: r.email, password: r.password }); setMsg(null); await load(); } else setMsg(r.reason === "exists" ? t.exists : t.bad); }}>{t.create}</button>
          </>
        )}
        {msg && <p className="text-sm text-rose-300">{msg}</p>}
        {shown && (<div className="rounded-xl border border-[#2dd4bf]/40 bg-[#2dd4bf]/10 p-3 space-y-1.5"><p className="text-xs text-white/70">{t.once}</p><p dir="ltr" className="text-sm font-mono break-all">{shown.email}</p><p dir="ltr" className="text-sm font-mono break-all">{shown.password}</p></div>)}
      </div>
    </section>
  );
}
