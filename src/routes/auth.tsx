import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { COUNTRIES, findCountry, sanitizeNationalNumber, validatePhoneForCountry } from "@/lib/countries";
import brandLogo from "@/assets/brand-logo.png";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: (search.role as string) || "trainee",
  }),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول · أكاديمية إسلام سلمي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [authRole, setAuthRole] = useState<"admin" | "trainee">(search.role === "admin" ? "admin" : "trainee");
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
  const { user, role, loading, activationStatus } = useAuth();

  useEffect(() => {
    if (search.role === "admin") {
      setAuthRole("admin");
      setMode("login");
    } else {
      setAuthRole("trainee");
    }
  }, [search.role]);

  useEffect(() => {
    if (!loading && user) {
      if (role !== "admin" && (activationStatus === "pending" || activationStatus === "rejected")) {
        nav({ to: "/onboarding" });
        return;
      }
      nav({ to: role === "admin" ? "/admin" : role === "trainer" ? "/trainer" : "/portal" });
    }
  }, [user, role, loading, activationStatus, nav]);

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
          const message = encodeURIComponent(`مرحباً، أود تفعيل حسابي كمتدرب جديد.\nالاسم: ${fullName}\nالبريد: ${email}\nرقم الهاتف: ${v.e164}`);
          const waUrl = `https://wa.me/201221448888?text=${message}`; // Use academy whatsapp
          toast.success("تم تسجيل بياناتك بنجاح. سيتم تحويلك لطلب التفعيل عبر واتساب...");
          setTimeout(() => {
            window.open(waUrl, "_blank");
            setMode("login");
          }, 1500);
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

  const isAdminView = authRole === "admin";

  return (
    <div dir="rtl" className={`min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12 font-[var(--font-body-ar)] transition-colors duration-500 ${isAdminView ? "bg-[#0f0f12]" : "bg-[#0b1736]"}`}>
      {isAdminView ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-zinc-900 to-[#121214] opacity-80" />
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #ffc107, transparent 65%)" }} />
          <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-15" style={{ background: "radial-gradient(circle, #e65100, transparent 65%)" }} />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a1a] via-[#0b1736] to-[#001f3f] opacity-80" />
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, var(--gold), transparent 65%)" }} />
          <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle, var(--lavender-deep), transparent 65%)" }} />
        </>
      )}

      <div className="relative w-full max-w-md">
        <Link to="/" className="block text-center mb-6 text-xs tracking-widest text-white/60 hover:text-white transition">
          ← العودة للموقع
        </Link>

        <div className={`relative rounded-3xl border backdrop-blur-2xl p-8 shadow-2xl transition-all duration-500 ${isAdminView ? "border-amber-500/20 bg-zinc-950/85" : "border-[var(--gold)]/20 bg-[rgba(11,23,54,0.65)]/85"}`} style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
          <div className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent to-transparent ${isAdminView ? "via-amber-500/50" : "via-[var(--gold)]"}`} />

          <div className="flex flex-col items-center text-center mb-7">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border transition-colors ${isAdminView ? "border-amber-500/40" : "border-[var(--gold)]/40"} glass`} style={isAdminView ? { background: "linear-gradient(135deg, rgba(245,158,11,0.25), transparent)" } : { background: "linear-gradient(135deg, rgba(212,178,89,0.25), transparent)" }}>
              <img src={brandLogo} alt="Logo" className="h-7 w-auto" />
            </div>
            <h1 className="text-2xl font-bold">
              {isAdminView ? "تسجيل دخول الإدارة" : (mode === "login" ? "تسجيل الدخول" : "إنشاء حساب متدرب")}
            </h1>
            <p className="text-sm text-white/60 mt-2">
              {isAdminView
                ? "لوحة تحكم المسؤولين والمشرفين"
                : (mode === "login"
                  ? "ادخل إلى لوحتك للوصول إلى الكورسات والشهادات"
                  : "سجّل بياناتك لتقديم طلب الالتحاق بأحد الكورسات")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isAdminView && mode === "signup" && (
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
              style={isAdminView ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" } : { background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isAdminView || mode === "login" ? "دخول" : "إنشاء الحساب"}
                  <ArrowRight className="w-4 h-4 rtl-flip" />
                </>
              )}
            </button>
          </form>

          {!isAdminView && (
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
          )}

          <div className="mt-6 text-center text-xs text-white/50 border-t border-white/10 pt-4 flex justify-center">
            {isAdminView ? (
              <button
                type="button"
                onClick={() => setAuthRole("trainee")}
                className="hover:text-white underline transition"
              >
                التبديل إلى بوابة دخول المتدربين
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setAuthRole("admin"); setMode("login"); }}
                className="hover:text-white underline transition"
              >
                بوابة دخول الإدارة والمدربين
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-6 leading-relaxed">
          {isAdminView ? "دخول المسؤولين محمي ومشفر بالكامل." : ""}
        </p>
      </div>


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
