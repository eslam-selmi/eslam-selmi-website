import { useState } from "react";
const T = {
  ar: { title: "دخول الضيف", email: "الإيميل", password: "الباسورد", go: "دخول", bad: "بيانات الدخول غير صحيحة", locked: "محاولات كتير. جرّب بعد دقيقة." },
  en: { title: "Guest sign in", email: "Email", password: "Password", go: "Sign in", bad: "Incorrect sign in details", locked: "Too many tries. Try again in a minute." },
};
export function GuestLoginForm({ lang, onSubmit }: { lang: "ar" | "en"; onSubmit: (email: string, password: string) => Promise<string | null> }) {
  const t = T[lang]; const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const field = "h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm";
  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#0b1736] text-white px-4 flex items-center justify-center">
      <form className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await onSubmit(email, pw); setBusy(false); setErr(r ? (r === "locked" ? t.locked : t.bad) : null); }}>
        <h1 className="text-xl font-bold">{t.title}</h1>
        <label className="block space-y-1.5"><span className="text-sm text-white/70">{t.email}</span><input dir="ltr" type="email" autoComplete="username" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block space-y-1.5"><span className="text-sm text-white/70">{t.password}</span><input dir="ltr" type="password" autoComplete="current-password" className={field} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {err && <p className="text-sm text-rose-300">{err}</p>}
        <button disabled={busy} className="h-11 w-full rounded-xl bg-[#2dd4bf] text-[#0b1736] font-semibold">{t.go}</button>
      </form>
    </main>
  );
}
