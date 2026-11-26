import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/portal-auth";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck, GraduationCap, Award, Clock3 } from "lucide-react";
import {
  COUNTRIES,
  findCountry,
  sanitizeNationalNumber,
  validatePhoneForCountry,
} from "@/lib/countries";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import { useSiteProfile } from "@/lib/site-profile";
const brandLogo = brandLogoAsset.url;
async function fetchAdminWhatsApp(): Promise<string> {
  const { data } = await supabase.rpc("get_activation_contact");
  const payload = data as { admin_whatsapp_e164?: string } | null;
  const num = (payload?.admin_whatsapp_e164 ?? "").replace(/\D/g, "");
  return num || "201221448888";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { role?: string } => ({
    role: (search.role as string) || "trainee",
  }),

  head: () => ({
    meta: [{ title: "تسجيل الدخول · إسلام سلمي" }, { name: "description", content: "تسجيل الدخول إلى منصة إسلام سلمي للتدريب." }, { property: "og:title", content: "تسجيل الدخول · إسلام سلمي" }, { property: "og:description", content: "تسجيل الدخول إلى منصة إسلام سلمي للتدريب." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { profile: siteProfile } = useSiteProfile();
  const search = Route.useSearch();
  const [authRole, setAuthRole] = useState<"admin" | "trainee">(
    search.role === "admin" ? "admin" : "trainee",
  );
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("EG");
  const [otherCountryName, setOtherCountryName] = useState("");
  const { data: customCountries = [], refetch: refreshCustomCountries } = useQuery({
    queryKey: ["custom-countries", "public-options"],
    staleTime: 60_000,
    queryFn: async (): Promise<Array<Pick<Tables<"custom_countries">, "id" | "name_ar" | "name_en" | "dial" | "flag">>> => {
      const { data, error } = await supabase.rpc("get_public_custom_countries");
      if (error) throw error;
      return data ?? [];
    },
  });
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

  const normalizeCountry = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        let countryCodeFinal = countryCode;
        let countryNameAr = "";
        let countryDial = "";
        let phoneE164 = phone;

        if (countryCode === "OTHER") {
          const nm = otherCountryName.trim();
          if (!nm) throw new Error("اكتب اسم الدولة");
          const norm = normalizeCountry(nm);
          // Anti-dup vs static list
          const dupStatic = COUNTRIES.find(
            (c) => normalizeCountry(c.name_ar) === norm || normalizeCountry(c.name_en) === norm,
          );
          // Anti-dup vs custom list
          const dupCustom = customCountries.find(
            (c) => normalizeCountry(c.name_ar) === norm || normalizeCountry(c.name_en) === norm,
          );
          if (dupStatic) {
            setCountryCode(dupStatic.code);
            throw new Error(`هذه الدولة موجودة بالفعل: ${dupStatic.name_ar} — اختارها من القائمة`);
          }
          let customId = dupCustom?.id;
          if (!customId) {
            try {
              const { proposeCustomCountry } = await import("@/lib/custom-countries.functions");
              const inserted = await proposeCustomCountry({ data: { name_ar: nm, name_en: nm } });
              customId = inserted?.id;
            } catch (err: any) {
              throw new Error("تعذّر إضافة الدولة: " + (err?.message || "خطأ غير معروف"));
            }
            // Refresh local list
            await refreshCustomCountries();
          }
          countryCodeFinal = `CUST:${customId}`;
          countryNameAr = nm;
          if (!phone || phone.replace(/\D/g, "").length < 6) {
            throw new Error("أدخل رقم هاتف صحيح يبدأ بكود الدولة");
          }
          phoneE164 = "+" + phone.replace(/\D/g, "");
        } else {
          const country = findCountry(countryCode);
          if (!country) throw new Error("اختر الدولة");
          const v = validatePhoneForCountry(phone, country);
          if (!v.ok) {
            const msg = `رقم الهاتف لدولة ${country.name_ar} يجب أن يتكون من ${country.nsnLengths.join(" أو ")} أرقام بدون الصفر. مثال: ${v.example}`;
            setPhoneError(msg);
            throw new Error(msg);
          }
          countryCodeFinal = country.code;
          countryNameAr = country.name_ar;
          countryDial = country.dial;
          phoneE164 = v.e164;
        }
        setPhoneError(null);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/portal`,
            data: {
              full_name: fullName,
              phone: phoneE164,
              country: countryCodeFinal,
              country_code: countryDial,
              country_name: countryNameAr,
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          const waNumber = await fetchAdminWhatsApp();
          const message = encodeURIComponent(
            `مرحباً، أود تفعيل حسابي كمتدرب جديد.\nالاسم: ${fullName}\nالبريد: ${email}\nرقم الهاتف: ${phoneE164}`,
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
    } catch (err: unknown) {
      {
        const m = err instanceof Error ? err.message : "";
        const ar: Array<[RegExp, string]> = [
          [/invalid login credentials/i, "البريد الإلكتروني أو كلمة المرور غير صحيحة"],
          [/email not confirmed/i, "لم يتم تأكيد البريد الإلكتروني بعد"],
          [/already registered|already been registered/i, "هذا البريد مسجّل بالفعل، جرّب تسجيل الدخول"],
          [/rate limit|too many/i, "محاولات كثيرة، انتظر قليلًا ثم أعد المحاولة"],
          [/password.*(least|short|weak)/i, "كلمة المرور ضعيفة، استخدم ٨ أحرف على الأقل"],
        ];
        const hit = ar.find(([re]) => re.test(m));
        toast.error(hit ? hit[1] : /[\u0600-\u06FF]/.test(m) ? m : "تعذّر إكمال العملية، حاول مرة أخرى");
      }
    } finally {
      setBusy(false);
    }
  }

  const isAdminView = authRole === "admin";

  return (
    <div dir="rtl" className="nx nx-bg min-h-screen relative overflow-hidden font-[var(--font-body-ar)]" style={{ "--nx-font-display": "var(--font-heading-ar)" } as React.CSSProperties}>
      <div className="absolute inset-0 nx-grid-overlay pointer-events-none" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-10 min-h-screen flex flex-col">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/55 hover:text-white transition">
            <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
            العودة للموقع
          </Link>
          <span className="nx-chip"><ShieldCheck className="w-3 h-3 text-[var(--nx-teal)]" /> اتصال مشفّر</span>
        </div>

        <div className="flex-1 flex items-center py-8">
          <div className="w-full grid lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-10 items-stretch">

            {/* Brand panel */}
            <aside className="nx-card relative overflow-hidden p-7 sm:p-10 hidden lg:flex flex-col justify-between">
              <span className="nx-hero-line" />
              <div className="pointer-events-none absolute -top-28 -start-28 w-80 h-80 rounded-full bg-[var(--nx-teal)]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -end-24 w-80 h-80 rounded-full bg-[var(--nx-gold)]/[0.08] blur-3xl" />
              <div className="relative">
                <div className="inline-flex rounded-[22px] p-4" style={{ background: "linear-gradient(180deg, #0d1a3d 0%, #08122a 100%)", border: "1px solid oklch(0.78 0.14 90 / 0.28)" }}><div className="mt-glass-logo" style={{ "--logo": `url(${siteProfile.logoDark})` } as React.CSSProperties}>
                  <span aria-hidden className="mt-glass-logo__glow" />
                  <div className="mt-glass-logo__tile">
                    <img src={siteProfile.logoDark} alt="Eslam Selmi" width={96} height={96} className="mt-glass-logo__img" />
                    <span aria-hidden className="mt-glass-logo__shine" />
                    <span aria-hidden className="mt-glass-logo__sheen" />
                  </div>
                </div></div>
                <p className="nx-eyebrow mt-8">{isAdminView ? "منطقة الإدارة" : "منصة إسلام سلمي التدريبية"}</p>
                <h1 className="nx-display text-balance text-[34px] xl:text-[42px] leading-[1.2] mt-3">
                  {isAdminView ? "كل إدارة موقعك في مكان واحد." : "رحلتك التدريبية تبدأ من هنا."}
                </h1>
                <p className="text-white/55 text-sm leading-relaxed mt-4 max-w-md">
                  {isAdminView
                    ? "الكورسات، الطلبات، الحجوزات، المحتوى والدعم — لوحة واحدة مصممة لتنجز عملك اليومي بوضوح."
                    : "تابع كورساتك وساعاتك التدريبية، حمّل شهاداتك، واحجز استشاراتك — كل ذلك من بوابة واحدة ذكية."}
                </p>
              </div>
              {!isAdminView && (
                <div className="relative grid grid-cols-3 gap-3 mt-10">
                  {[
                    { icon: GraduationCap, t: "كورسات عملية", d: "محتوى تطبيقي مباشر" },
                    { icon: Award, t: "شهادات موثقة", d: "تحميل فوري وتحقق" },
                    { icon: Clock3, t: "تقدم واضح", d: "ساعاتك أولاً بأول" },
                  ].map((f) => (
                    <div key={f.t} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5">
                      <f.icon className="w-5 h-5 text-[var(--nx-teal)]" />
                      <p className="text-[12.5px] font-bold mt-2.5">{f.t}</p>
                      <p className="text-[10.5px] text-white/45 mt-1 leading-relaxed">{f.d}</p>
                    </div>
                  ))}
                </div>
              )}
              {isAdminView && (
                <div className="relative mt-10 rounded-2xl border border-[var(--nx-gold)]/25 bg-[var(--nx-gold)]/[0.06] p-4 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[var(--nx-gold)] shrink-0" />
                  <p className="text-[12px] text-white/65 leading-relaxed">هذه المنطقة مخصصة لإدارة الموقع فقط. صلاحيات الدخول تُراجع من الخادم في كل زيارة.</p>
                </div>
              )}
            </aside>

            {/* Form card */}
            <div className="nx-card relative p-6 sm:p-9 nx-rise">
              <span className="nx-hero-line" />
              <div className="flex flex-col items-center text-center mb-7">
                <div className="lg:hidden mb-3 rounded-[22px] p-3" style={{ background: "linear-gradient(180deg, #0d1a3d 0%, #08122a 100%)", border: "1px solid oklch(0.78 0.14 90 / 0.28)" }}><div className="mt-glass-logo" style={{ "--logo": `url(${siteProfile.logoDark})` } as React.CSSProperties}>
                  <span aria-hidden className="mt-glass-logo__glow" />
                  <div className="mt-glass-logo__tile">
                    <img src={siteProfile.logoDark} alt="Eslam Selmi" width={96} height={96} className="mt-glass-logo__img" />
                    <span aria-hidden className="mt-glass-logo__shine" />
                    <span aria-hidden className="mt-glass-logo__sheen" />
                  </div>
                </div></div>
                <p className="nx-eyebrow justify-center">{isAdminView ? "لوحة التحكم" : mode === "login" ? "أهلاً بعودتك" : "حساب جديد"}</p>
                <h2 className="nx-display text-2xl sm:text-[27px] mt-2">
                  {isAdminView ? "دخول الإدارة" : mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
                </h2>
                <p className="mt-2 text-[13px] text-white/50">
                  {isAdminView
                    ? "سجّل الدخول للمتابعة إلى لوحة التحكم."
                    : mode === "login"
                      ? "ادخل إلى حسابك للمتابعة."
                      : "أنشئ حساباً جديداً للتقديم على الكورسات."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isAdminView && mode === "signup" && (
                  <>
                    <Field label="الاسم الكامل" value={fullName} onChange={setFullName} placeholder="الاسم الثلاثي" required />
                    <label className="block">
                      <span className="block text-[12px] font-semibold text-white/60 mb-1.5">الدولة</span>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        required
                        className="nx-input"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code} className="bg-[#0a1224]">
                            {c.flag} {c.name_ar} ({c.dial})
                          </option>
                        ))}
                        {customCountries.length > 0 && (
                          <optgroup label="— مضافة —" className="bg-[#0a1224]">
                            {customCountries.map((c) => (
                              <option key={c.id} value={`CUST:${c.id}`} className="bg-[#0a1224]">
                                {c.flag ? c.flag + " " : ""}{c.name_ar}{c.dial ? ` (${c.dial})` : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="OTHER" className="bg-[#0a1224]">
                          🌍 دولة أخرى (اكتب اسمها)…
                        </option>
                      </select>
                    </label>
                    {countryCode === "OTHER" && (
                      <label className="block">
                        <span className="block text-[12px] font-semibold text-white/60 mb-1.5">اسم الدولة</span>
                        <input
                          value={otherCountryName}
                          onChange={(e) => setOtherCountryName(e.target.value)}
                          placeholder="مثال: قبرص"
                          maxLength={80}
                          required
                          className="nx-input"
                        />
                      </label>
                    )}
                    <label className="block">
                      <span className="block text-[12px] font-semibold text-white/60 mb-1.5">رقم الهاتف</span>
                      <div className="flex gap-2" dir="ltr">
                        {countryCode !== "OTHER" && countryCode.startsWith("CUST:") === false && (
                          <span className="h-[46px] px-3 rounded-[13px] bg-white/[0.045] border border-white/10 text-white/70 inline-flex items-center text-sm font-mono">
                            {findCountry(countryCode)?.dial}
                          </span>
                        )}
                        <input
                          type="tel"
                          inputMode="tel"
                          value={phone}
                          onChange={(e) => {
                            const c = findCountry(countryCode);
                            const cleaned = c
                              ? sanitizeNationalNumber(e.target.value, c)
                              : e.target.value.replace(/[^\d+]/g, "");
                            setPhone(cleaned);
                            setPhoneError(null);
                          }}
                          placeholder={
                            countryCode === "OTHER" || countryCode.startsWith("CUST:")
                              ? "+357xxxxxxxx"
                              : findCountry(countryCode)?.nsnLengths[0]
                                ? "5".padEnd(findCountry(countryCode)!.nsnLengths[0], "x")
                                : "1xxxxxxxxx"
                          }
                          required
                          dir="ltr"
                          className={`nx-input flex-1 ${phoneError ? "!border-rose-400/60" : ""}`}
                        />
                      </div>
                      {(countryCode === "OTHER" || countryCode.startsWith("CUST:")) && (
                        <p className="text-[11px] text-white/40 mt-1.5">اكتب الرقم كاملاً مع كود الدولة (مثال: +357…)</p>
                      )}
                      {phoneError && (
                        <p className="text-[11px] text-rose-300/90 mt-1.5 leading-relaxed">{phoneError}</p>
                      )}
                    </label>
                  </>
                )}
                <Field type="email" label="البريد الإلكتروني" value={email} onChange={setEmail} placeholder="name@example.com" required />
                <Field type="password" label="كلمة المرور" value={password} onChange={setPassword} placeholder="••••••••" required />

                <button type="submit" disabled={busy} className="nx-btn nx-btn-primary w-full !h-12 !text-[14px] mt-1 disabled:opacity-60">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isAdminView ? "دخول" : mode === "login" ? "دخول" : "إنشاء الحساب"}</>}
                </button>
              </form>

              {!isAdminView && (
                <div className="mt-5 text-center text-[13px] text-white/55">
                  {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="text-[var(--nx-teal)] hover:underline font-bold"
                  >
                    {mode === "login" ? "إنشاء حساب" : "تسجيل الدخول"}
                  </button>
                </div>
              )}

              <hr className="nx-divider my-6" />
              <div className="flex justify-center">
                {isAdminView ? (
                  <button type="button" onClick={() => setAuthRole("trainee")} className="text-[12px] font-semibold text-white/45 hover:text-white/80 transition">
                    دخول المتدربين
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAuthRole("admin"); setMode("login"); }}
                    className="text-[12px] font-semibold text-white/45 hover:text-white/80 transition"
                  >
                    دخول الإدارة
                  </button>
                )}
              </div>
            </div>
          </div>
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
      <span className="block text-[12px] font-semibold text-white/60 mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        dir={type === "email" || type === "password" ? "ltr" : "rtl"}
        className="nx-input"
      />
    </label>
  );
}
