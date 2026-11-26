import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ShieldCheck, XCircle, Loader2, Award, Clock, Calendar, ArrowLeft } from "lucide-react";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import { useSiteProfile } from "@/lib/site-profile";
import { useI18n } from "@/lib/i18n";
const brandLogo = brandLogoAsset.url;
export const Route = createFileRoute("/verify/$id")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "التحقق من الشهادة · Certificate Verification — إسلام سلمي" },
      { name: "description", content: "Verify the authenticity of a certificate issued by Eslam Selmi Academy." },
      { property: "og:title", content: "Certificate Verification — Eslam Selmi" },
      { property: "og:description", content: "Verify the authenticity of a certificate issued by Eslam Selmi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type VerifyResult =
  | { ok: true; trainee_name_ar: string | null; trainee_name_en: string | null; course_title: string; total_hours: number; issued_at: string; certificate_id: string }
  | { ok: false; error: string };

function VerifyPage() {
  const { profile } = useSiteProfile();
  const { lang, setLang } = useI18n();
  const isAr = lang === "ar";
  const tt = (ar: string, en: string) => (isAr ? ar : en);
  const { id } = Route.useParams();
  const [state, setState] = useState<{ loading: boolean; data: VerifyResult | null; err: string | null }>({ loading: true, data: null, err: null });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("verify_certificate", { _enrollment_id: id });
      if (error) setState({ loading: false, data: null, err: error.message });
      else setState({ loading: false, data: data as VerifyResult, err: null });
    })();
  }, [id]);

  const valid = state.data && (state.data as any).ok === true;
  const d = valid ? (state.data as Extract<VerifyResult, { ok: true }>) : null;
  const name = d ? (isAr ? d.trainee_name_ar || d.trainee_name_en : d.trainee_name_en || d.trainee_name_ar) : null;

  return (
    <div className="min-h-screen bg-[#0b1736] text-white relative overflow-hidden" dir={isAr ? "rtl" : "ltr"}>
      <header className="relative z-10 max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={profile.logoDark} alt="" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <button onClick={() => setLang(isAr ? "en" : "ar")} className="text-xs text-white/70 hover:text-white">{isAr ? "English" : "العربية"}</button>
          <Link to="/" className="text-xs text-white/60 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5 rtl-flip" /> {tt("الرئيسية", "Home")}
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-6 pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-8">
          {state.loading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-white/70">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
              <p className="text-sm">{tt("جارٍ التحقق…", "Verifying…")}</p>
            </div>
          ) : !valid ? (
            <div className="text-center space-y-3 py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-rose-300" />
              </div>
              <h1 className="text-xl font-bold">{tt("الشهادة غير موجودة", "Certificate not found")}</h1>
              <p className="text-sm text-white/60">
                {tt("الرقم غير صحيح أو لم تُصدر الشهادة بعد أو تم إلغاؤها.", "The ID is invalid, or the certificate has not been issued or was revoked.")}
              </p>
              <p className="text-[11px] text-white/40 font-mono break-all" dir="ltr">{id}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </div>
                <h1 className="text-lg font-bold text-emerald-200">{tt("شهادة موثّقة", "Verified certificate")}</h1>
              </div>

              <div className="space-y-4 border-t border-white/10 pt-5">
                {name && (
                  <Field label={tt("المتدرب", "Trainee")}>
                    <p className="text-lg font-bold"><bdi>{name}</bdi></p>
                  </Field>
                )}
                <Field label={tt("الدورة", "Course")} icon={Award}>
                  <p className="font-semibold"><bdi dir="auto">{d!.course_title}</bdi></p>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={tt("تاريخ الإصدار", "Issue date")} icon={Calendar}>
                    <p className="font-semibold">
                      <bdi dir={isAr ? "rtl" : "ltr"}>{new Date(d!.issued_at).toLocaleDateString(isAr ? "ar-EG-u-nu-latn" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}</bdi>
                    </p>
                  </Field>
                  {Number(d!.total_hours) > 0 && (
                    <Field label={tt("الساعات", "Hours")} icon={Clock}>
                      <p className="font-semibold"><bdi dir="ltr">{d!.total_hours}</bdi></p>
                    </Field>
                  )}
                </div>
                <Field label={tt("رقم الشهادة", "Certificate ID")}>
                  <p className="text-xs font-mono text-white/70 break-all" dir="ltr">{d!.certificate_id}</p>
                </Field>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-[var(--gold)]/80 mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      {children}
    </div>
  );
}
