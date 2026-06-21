import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import {
  COUNTRIES,
  findCountry,
  sanitizeNationalNumber,
  validatePhoneForCountry,
} from "@/lib/countries";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
const brandLogo = brandLogoAsset.url;
async function fetchAdminWhatsApp(): Promise<string> {
  const { data } = await supabase.rpc("get_activation_contact");
  const payload = data as { admin_whatsapp_e164?: string } | null;
  const num = (payload?.admin_whatsapp_e164 ?? "").replace(/\D/g, "");
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
  const [otherCountryName, setOtherCountryName] = useState("");
  const [customCountries, setCustomCountries] = useState<Array<{ id: string; name_ar: string; name_en: string; dial: string | null; flag: string | null }>>([]);
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

  // Load admin-added countries
  useEffect(() => {
    supabase.from("custom_countries").select("id,name_ar,name_en,dial,flag").order("name_ar")
      .then(({ data }) => setCustomCountries(((data as any) || [])));
  }, []);

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
            const { data: inserted, error: insErr } = await supabase
              .from("custom_countries")
              .insert({ name_ar: nm, name_en: nm, normalized: norm })
              .select("id")
              .single();
            if (insErr) throw new Error("تعذّر إضافة الدولة: " + insErr.message);
            customId = inserted?.id;
            // Refresh local list
            setCustomCountries((prev) => [...prev, { id: customId!, name_ar: nm, name_en: nm, dial: null, flag: null }]);
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  const isAdminView = authRole === "admin";

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden px-4 py-10 sm:py-16 font-[var(--font-body-ar)] bg-[#0a1224] text-white"
    >
      {/* Calm background: deep navy with one soft ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 500px at 50% -10%, rgba(212,175,108,0.10), transparent 60%), linear-gradient(180deg, #0a1224 0%, #0a1224 100%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.05] grain" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col">
        {/* Back to site */}
        <Link
          to="/"
          className="self-start inline-flex items-center gap-1.5 text-[12px] text-white/55 hover:text-white/90 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
          العودة للموقع
        </Link>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full">
            {/* Brand */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="h-14 w-14 rounded-2xl border border-white/12 bg-white/[0.03] flex items-center justify-center mb-5">
                <img src={brandLogo} alt="" className="h-9 w-auto opacity-90" />
              </div>
              <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-white">
                {isAdminView
                  ? "تسجيل دخول الإدارة"
                  : mode === "login"
                    ? "تسجيل الدخول"
                    : "إنشاء حساب"}
              </h1>
              <p className="mt-1.5 text-[13px] text-white/50">
                {isAdminView
                  ? "الوصول لإدارة المنصة."
                  : mode === "login"
                    ? "ادخل إلى حسابك للمتابعة."
                    : "أنشئ حساباً جديداً للتقديم على الكورسات."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!isAdminView && mode === "signup" && (
                <>
                  <Field
                    label="الاسم الكامل"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="الاسم الثلاثي"
                    required
                  />
                  <label className="block">
                    <span className="block text-[12px] text-white/60 mb-1.5">الدولة</span>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      required
                      className="w-full h-11 px-3.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#0a1224]">
                          {c.flag} {c.name_ar} ({c.dial})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[12px] text-white/60 mb-1.5">رقم الهاتف</span>
                    <div className="flex gap-2" dir="ltr">
                      <span className="h-11 px-3 rounded-lg bg-white/[0.04] border border-white/10 text-white/70 inline-flex items-center text-sm font-mono">
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
                        className={`flex-1 h-11 px-3.5 rounded-lg bg-white/[0.04] border text-white text-sm placeholder:text-white/25 focus:outline-none focus:bg-white/[0.06] transition ${phoneError ? "border-rose-400/60 focus:border-rose-400" : "border-white/10 focus:border-white/30"}`}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-[11px] text-rose-300/90 mt-1.5 leading-relaxed">
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
                className="w-full mt-2 h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition bg-white text-[#0a1224] hover:bg-white/90"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>{isAdminView || mode === "login" ? "دخول" : "إنشاء الحساب"}</>
                )}
              </button>
            </form>

            {!isAdminView && (
              <div className="mt-5 text-center text-[13px] text-white/55">
                {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-white hover:underline font-medium"
                >
                  {mode === "login" ? "إنشاء حساب" : "تسجيل الدخول"}
                </button>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              {isAdminView ? (
                <button
                  type="button"
                  onClick={() => setAuthRole("trainee")}
                  className="text-[12px] text-white/45 hover:text-white/80 transition"
                >
                  دخول المتدربين
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthRole("admin");
                    setMode("login");
                  }}
                  className="text-[12px] text-white/45 hover:text-white/80 transition"
                >
                  دخول الإدارة
                </button>
              )}
            </div>

            <div className="mt-10 flex items-center justify-center gap-1.5 text-[11px] text-white/35">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>اتصال مشفّر</span>
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
