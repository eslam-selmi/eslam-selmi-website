import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { toast } from "sonner";
import { GraduationCap, Loader2, ArrowRight } from "lucide-react";
import {
  COUNTRIES,
  findCountry,
  sanitizeNationalNumber,
  validatePhoneForCountry,
} from "@/lib/countries";
import brandLogo from "@/assets/brand-logo.webp";

async function fetchAdminWhatsApp(): Promise<string> {
  const { data } = await supabase.rpc("get_activation_contact");
  const num = ((data as any)?.admin_whatsapp_e164 ?? "").replace(/\D/g, "");
  return num || "201221448888";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: (search.role as string) || "trainee",
  }),
  head: () => ({
    meta: [{ title: "تسجيل الدخول · أكاديمية إسلام سلمي" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [authRole, setAuthRole] = useState<"admin" | "trainee">(
    search.role === "admin" ? "admin" : "trainee",
  );
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("EG");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
          const waNumber = await fetchAdminWhatsApp();
          const message = encodeURIComponent(
            `مرحباً، أود تفعيل حسابي كمتدرب جديد.\nالاسم: ${fullName}\nالبريد: ${email}\nرقم الهاتف: ${v.e164}`,
          );
          const waUrl = `https://wa.me/${waNumber}?text=${message}`;
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
    <div
      dir="rtl"
      className={`min-h-screen relative overflow-hidden px-4 py-8 sm:py-12 font-[var(--font-body-ar)] ${isAdminView ? "bg-[#0f0f12]" : "bg-[#071026]"}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: isAdminView
            ? "radial-gradient(circle at 80% 10%, rgba(245,158,11,0.18), transparent 34%), linear-gradient(135deg, #0f0f12, #18181b)"
            : "radial-gradient(circle at 85% 8%, color-mix(in oklab, var(--gold) 22%, transparent), transparent 34%), radial-gradient(circle at 8% 92%, color-mix(in oklab, var(--lavender-deep) 28%, transparent), transparent 38%), linear-gradient(135deg, #071026, #0b1736 48%, #071326)",
        }}
      />
      <div className="absolute inset-0 grain opacity-35" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div
          className={`grid w-full overflow-hidden rounded-[2rem] border shadow-2xl ${isAdminView ? "border-amber-500/20 bg-zinc-950/80" : "border-[var(--gold)]/25 bg-white/[0.04]"} backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]`}
        >
          <section className="relative hidden lg:flex min-h-[640px] flex-col justify-between overflow-hidden p-10 text-white">
            <div
              className="absolute inset-0"
              style={{
                background: isAdminView
                  ? "linear-gradient(145deg, rgba(245,158,11,0.12), rgba(255,255,255,0.02))"
                  : "linear-gradient(145deg, color-mix(in oklab, var(--gold) 18%, transparent), color-mix(in oklab, var(--accent) 18%, transparent))",
              }}
            />
            <div className="relative">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/80 hover:text-white md:transition"
              >
                ← العودة للموقع
              </Link>
            </div>
            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-white/75">
                <GraduationCap className="h-3.5 w-3.5" />{" "}
                {isAdminView ? "Admin access" : "Trainee portal"}
              </div>
              <h1 className="max-w-md text-5xl font-black leading-tight">
                {isAdminView
                  ? "لوحة إدارة آمنة وهادئة."
                  : "بوابة متدرب مصممة لتجربة تعليمية راقية."}
              </h1>
              <p className="max-w-md text-sm leading-8 text-white/70">
                {isAdminView
                  ? "دخول مخصص لإدارة المنصة ومراجعة الطلبات والمحتوى."
                  : "ادخل إلى كورساتك، تابع تقدمك، واطلب الشهادات من مكان واحد بتجربة واضحة وسريعة."}
              </p>
            </div>
            <div className="relative grid grid-cols-3 gap-3">
              {["كورسات", "شهادات", "تقدم"].map((x) => (
                <div
                  key={x}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur"
                >
                  <div className="text-lg font-black text-[var(--gold)]">✓</div>
                  <div className="mt-1 text-xs font-bold text-white/75">{x}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="relative p-5 sm:p-8 lg:p-10">
            <Link
              to="/"
              className="mb-6 inline-flex lg:hidden items-center gap-2 text-xs tracking-widest text-white/60 hover:text-white md:transition"
            >
              ← العودة للموقع
            </Link>

            <div className="mx-auto w-full max-w-md">
              <div className="mb-7 flex flex-col items-center text-center">
                <div
                  className={`mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border ${isAdminView ? "border-amber-500/35 bg-amber-500/10" : "border-[var(--gold)]/40 bg-[var(--gold)]/10"}`}
                >
                  <img src={brandLogo} alt="Logo" className="h-12 w-auto" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--gold)]">
                  {isAdminView ? "Admin gate" : "Eslam Selmi Academy"}
                </p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">
                  {isAdminView
                    ? "تسجيل دخول الإدارة"
                    : mode === "login"
                      ? "دخول المتدربين"
                      : "إنشاء حساب متدرب"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {isAdminView
                    ? "لوحة تحكم المسؤولين"
                    : mode === "login"
                      ? "ادخل إلى لوحتك للوصول إلى الكورسات والشهادات."
                      : "سجّل بياناتك لتقديم طلب الالتحاق بأحد الكورسات."}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/15 p-4 sm:p-5"
              >
                {!isAdminView && mode === "signup" && (
                  <>
                    <Field
                      label="الاسم الكامل"
                      value={fullName}
                      onChange={setFullName}
                      placeholder="اكتب اسمك الثلاثي"
                      required
                    />
                    <label className="block">
                      <span className="block text-xs text-white/70 mb-1.5 font-medium">الدولة</span>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        required
                        className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--gold)]/60 focus:bg-white/10 md:transition"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code} className="bg-[#0b1736]">
                            {c.flag} {c.name_ar} ({c.dial})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-xs text-white/70 mb-1.5 font-medium">
                        رقم الهاتف
                      </span>
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
                            const cleaned = c
                              ? sanitizeNationalNumber(e.target.value, c)
                              : e.target.value.replace(/\D/g, "");
                            setPhone(cleaned);
                            setPhoneError(null);
                          }}
                          placeholder={
                            findCountry(countryCode)?.nsnLengths[0]
                              ? "5".padEnd(findCountry(countryCode)!.nsnLengths[0], "x")
                              : "1xxxxxxxxx"
                          }
                          required
                          dir="ltr"
                          className={`flex-1 h-11 px-4 rounded-xl bg-white/5 border text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 md:transition ${phoneError ? "border-rose-400/60 focus:border-rose-400" : "border-white/15 focus:border-[var(--gold)]/60"}`}
                        />
                      </div>
                      {phoneError && (
                        <p className="text-[11px] text-rose-300 mt-1.5 leading-relaxed">
                          {phoneError}
                        </p>
                      )}
                    </label>
                  </>
                )}
                <Field
                  type="email"
                  label="البريد الإلكتروني"
                  value={email}
                  onChange={setEmail}
                  placeholder="name@example.com"
                  required
                />
                <Field
                  type="password"
                  label="كلمة المرور"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  required
                />

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full mt-2 h-12 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 md:transition md:hover:-translate-y-0.5"
                  style={
                    isAdminView
                      ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000" }
                      : {
                          background: "linear-gradient(135deg, var(--gold), #b8923f)",
                          color: "#0b1736",
                          boxShadow: "0 16px 35px -20px var(--gold)",
                        }
                  }
                >
                  {busy ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
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

              <div className="mt-6 flex justify-center border-t border-white/10 pt-4 text-center text-xs text-white/50">
                {isAdminView ? (
                  <button
                    type="button"
                    onClick={() => setAuthRole("trainee")}
                    className="hover:text-white underline md:transition"
                  >
                    التبديل إلى بوابة دخول المتدربين
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthRole("admin");
                      setMode("login");
                    }}
                    className="hover:text-white underline md:transition"
                  >
                    بوابة دخول الإدارة
                  </button>
                )}
              </div>

              <p className="text-center text-xs text-white/40 mt-6 leading-relaxed">
                {isAdminView
                  ? "دخول المسؤولين محمي ومشفر بالكامل."
                  : "تجربة دخول آمنة ومهيّأة للمتدربين فقط."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
