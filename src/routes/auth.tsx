import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { COUNTRIES, findCountry, sanitizeNationalNumber, validatePhoneForCountry } from "@/lib/countries";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول · أكاديمية إسلام سلمي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("EG");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const nav = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      nav({ to: role === "admin" ? "/admin" : role === "trainer" ? "/trainer" : "/portal" });
    }
  }, [user, role, loading, nav]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const country = findCountry(countryCode);
        if (!country) throw new Error("اختر الدولة");
        const v = validatePhoneForCountry(phone, country);
        if (!v.ok) {
          const msg = `رقم الهاتف لدولة ${country.name_ar} يجب أن يتكون من ${country.nsnLengths.join(" أو ")} أرقام بدون الصفر. مثال: ${v.example}`;
          setPhoneError(msg);
          throw new Error(msg);
        }
        setPhoneError(null);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/portal`,
            data: {
              full_name: fullName,
              phone: v.e164,
              country: country.code,
              country_code: country.dial,
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmEmail(email);
        } else {
          toast.success("تم إنشاء الحساب بنجاح. جاري التحويل...");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحباً بك");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen relative overflow-hidden bg-[#0b1736] text-white flex items-center justify-center px-4 py-12 font-[var(--font-body-ar)]">
      <div className="absolute inset-0 bg-aurora opacity-70" />
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, var(--gold), transparent 65%)" }} />
      <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle, var(--lavender-deep), transparent 65%)" }} />

      <div className="relative w-full max-w-md">
        <Link to="/" className="block text-center mb-6 text-xs tracking-widest text-white/60 hover:text-white transition">
          ← العودة للموقع
        </Link>

        <div className="relative rounded-3xl border border-white/10 bg-[rgba(11,23,54,0.7)] backdrop-blur-2xl p-8 shadow-2xl">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />

          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border border-[var(--gold)]/40" style={{ background: "linear-gradient(135deg, rgba(212,178,89,0.25), transparent)" }}>
              {mode === "login" ? <ShieldCheck className="w-7 h-7 text-[var(--gold)]" /> : <GraduationCap className="w-7 h-7 text-[var(--gold)]" />}
            </div>
            <h1 className="text-2xl font-bold">
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب متدرب"}
            </h1>
            <p className="text-sm text-white/60 mt-2">
              {mode === "login"
                ? "ادخل إلى لوحتك للوصول إلى الكورسات والشهادات"
                : "سجّل بياناتك لتقديم طلب الالتحاق بأحد الكورسات"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field label="الاسم الكامل" value={fullName} onChange={setFullName} placeholder="اكتب اسمك الثلاثي" required />
                <label className="block">
                  <span className="block text-xs text-white/70 mb-1.5 font-medium">الدولة</span>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    required
                    className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--gold)]/60 focus:bg-white/10 transition"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#0b1736]">
                        {c.flag} {c.name_ar} ({c.dial})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70 mb-1.5 font-medium">رقم الهاتف</span>
                  <div className="flex gap-2" dir="ltr">
                    <span className="h-11 px-3 rounded-xl bg-white/10 border border-white/15 text-white/80 inline-flex items-center text-sm font-mono">
                      {findCountry(countryCode)?.dial}
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        const c = findCountry(countryCode);
                        const cleaned = c ? sanitizeNationalNumber(e.target.value, c) : e.target.value.replace(/\D/g, "");
                        setPhone(cleaned);
                        setPhoneError(null);
                      }}
                      placeholder={findCountry(countryCode)?.nsnLengths[0] ? "5".padEnd(findCountry(countryCode)!.nsnLengths[0], "x") : "1xxxxxxxxx"}
                      required
                      dir="ltr"
                      className={`flex-1 h-11 px-4 rounded-xl bg-white/5 border text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 transition ${phoneError ? "border-rose-400/60 focus:border-rose-400" : "border-white/15 focus:border-[var(--gold)]/60"}`}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-[11px] text-rose-300 mt-1.5 leading-relaxed">{phoneError}</p>
                  )}
                </label>
              </>
            )}
            <Field type="email" label="البريد الإلكتروني" value={email} onChange={setEmail} placeholder="name@example.com" required />
            <Field type="password" label="كلمة المرور" value={password} onChange={setPassword} placeholder="••••••••" required />

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {mode === "login" ? "دخول" : "إنشاء الحساب"}
                  <ArrowRight className="w-4 h-4 rtl-flip" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/70">
            {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-[var(--gold)] hover:underline font-semibold"
            >
              {mode === "login" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-6 leading-relaxed">
          الحسابات تخضع للموافقة اليدوية من قِبل الإدارة قبل تفعيل الكورس.
        </p>
      </div>

      {confirmEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setConfirmEmail(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} dir="rtl"
            className="relative w-full max-w-md rounded-3xl border border-[var(--gold)]/30 bg-[rgba(11,23,54,0.98)] p-8 text-white shadow-2xl">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border border-[var(--gold)]/40 mx-auto"
              style={{ background: "linear-gradient(135deg, rgba(212,178,89,0.25), transparent)" }}>
              <span className="text-3xl">📧</span>
            </div>
            <h3 className="text-2xl font-bold text-center">تفقّد بريدك الإلكتروني</h3>
            <p className="text-white/75 text-center mt-4 leading-relaxed">
              تم إرسال رابط التفعيل إلى:
              <br/>
              <span className="font-semibold text-[var(--gold)]" dir="ltr">{confirmEmail}</span>
              <br/><br/>
              يرجى تفقد البريد الوارد (وربما مجلد الـ Spam) والضغط على الرابط لتفعيل حسابك ثم العودة لتسجيل الدخول.
            </p>
            <button onClick={() => { setConfirmEmail(null); setMode("login"); }}
              className="mt-6 w-full h-12 rounded-xl font-semibold"
              style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
              فهمت — الانتقال لتسجيل الدخول
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-white/70 mb-1.5 font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        dir={type === "email" || type === "password" ? "ltr" : "rtl"}
        className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/60 focus:bg-white/10 transition"
      />
    </label>
  );
}
