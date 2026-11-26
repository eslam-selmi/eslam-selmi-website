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
  const { lang } = useI18n();
  const ar = lang !== "en";
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
  const issued = d ? new Date(d.issued_at) : null;

  return (
    <div className="min-h-screen bg-[#070f24] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 45% at 50% 18%, rgba(45,212,200,0.16), transparent 70%), radial-gradient(50% 40% at 50% 100%, rgba(212,175,55,0.10), transparent 70%)" }} />
      <header className="relative z-10 max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={profile.logoDark} alt="" className="h-9 w-auto opacity-90" />
        </Link>
        <Link to="/" className="text-xs text-white/60 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> {ar ? "الرئيسية" : "Home"}
        </Link>
      </header>

      <main className="relative z-10 max-w-xl mx-auto px-5 pb-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
          {/* large, cropped, translucent brand mark */}
          <img src={profile.logoDark} alt="" aria-hidden className="pointer-events-none absolute -bottom-16 -end-24 w-[78%] max-w-[420px] opacity-[0.07] select-none" />
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/70 to-transparent" />

          <div className="relative px-6 sm:px-10 py-10 sm:py-12">
            {state.loading ? (
              <div className="flex flex-col items-center gap-3 py-16 text-white/70">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
                <p className="text-sm">{ar ? "جارٍ التحقق…" : "Verifying…"}</p>
              </div>
            ) : !valid ? (
              <div className="text-center space-y-3 py-8" dir={ar ? "rtl" : "ltr"}>
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-rose-300" />
                </div>
                <h1 className="text-xl font-bold">{ar ? "الشهادة غير موجودة" : "Certificate not found"}</h1>
                <p className="text-sm text-white/55">{ar ? "الرقم غير صحيح أو لم تُصدر الشهادة بعد أو تم إلغاؤها." : "The ID is invalid, or the certificate has not been issued or was revoked."}</p>
                <p className="text-[11px] text-white/35 font-mono break-all pt-2" dir="ltr">{id}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center" dir={ar ? "rtl" : "ltr"}>
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[rgba(45,212,200,0.28)] blur-2xl" />
                  <svg viewBox="0 0 64 72" className="relative w-16 h-[72px] drop-shadow-[0_0_18px_rgba(45,212,200,0.55)]" aria-hidden>
                    <defs>
                      <linearGradient id="vs" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#5eead4" />
                        <stop offset="1" stopColor="#d4af37" />
                      </linearGradient>
                    </defs>
                    <path d="M32 3 58 13v22c0 17-11 28-26 34C17 63 6 52 6 35V13L32 3Z" fill="rgba(7,15,36,0.85)" stroke="url(#vs)" strokeWidth="2.5" />
                    <path d="m20 36 8 8 17-18" fill="none" stroke="url(#vs)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <h1 className="mt-4 text-xl sm:text-2xl font-extrabold text-emerald-200">{ar ? "شهادة موثّقة" : "Verified certificate"}</h1>

                <p className="mt-6 text-2xl sm:text-3xl font-extrabold leading-tight" dir={ar ? "rtl" : "ltr"}>
                  {(ar ? d!.trainee_name_ar || d!.trainee_name_en : d!.trainee_name_en || d!.trainee_name_ar) ?? ""}
                </p>

                <dl className="mt-7 w-full border-t border-white/10 pt-5 space-y-3 text-sm text-start">
                  <div className="flex items-baseline justify-between gap-4"><dt className="text-white/50 shrink-0">{ar ? "الدورة" : "Course"}</dt><dd className="font-semibold text-white/90 text-end"><bdi dir="auto">{d!.course_title}</bdi></dd></div>
                  <div className="flex items-baseline justify-between gap-4"><dt className="text-white/50 shrink-0">{ar ? "تاريخ الإصدار" : "Issued"}</dt><dd className="font-semibold text-[var(--gold)]"><bdi>{issued!.toLocaleDateString(ar ? "ar-EG-u-nu-latn" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}</bdi></dd></div>
                  {Number(d!.total_hours) > 0 && <div className="flex items-baseline justify-between gap-4"><dt className="text-white/50 shrink-0">{ar ? "الساعات" : "Hours"}</dt><dd className="font-semibold text-white/90"><bdi dir="ltr">{d!.total_hours}</bdi></dd></div>}
                  <div className="flex items-baseline justify-between gap-4"><dt className="text-white/50 shrink-0">{ar ? "رقم الشهادة" : "Certificate ID"}</dt><dd className="font-mono text-[11px] text-white/60 break-all" dir="ltr">{d!.certificate_id}</dd></div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
