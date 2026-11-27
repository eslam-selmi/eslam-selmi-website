import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ShieldCheck, XCircle, Loader2, Award, Clock, Calendar, ArrowLeft } from "lucide-react";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import { useSiteProfile } from "@/lib/site-profile";
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
  | { ok: true; trainee_name_ar: string | null; trainee_name_en: string | null; course_title: string; total_hours: number; issued_at: string | null; issued_at_exact?: boolean; certificate_id: string }
  | { ok: false; error: string };

function VerifyPage() {
  const { profile } = useSiteProfile();
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
  // Only an explicit server flag proves the date is the real issue date. Legacy rows (or an older server) show "date not recorded".
  const issued = d && d.issued_at_exact === true && d.issued_at ? new Date(d.issued_at) : null;

  return (
    <div className="min-h-screen bg-[#070f24] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 45% at 50% 18%, rgba(45,212,200,0.16), transparent 70%), radial-gradient(50% 40% at 50% 100%, rgba(212,175,55,0.10), transparent 70%)" }} />
      <header className="relative z-10 max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={profile.logoDark} alt="" className="h-9 w-auto opacity-90" />
        </Link>
        <Link to="/" className="text-xs text-white/60 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> الرئيسية · Home
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
                <p className="text-sm">جارٍ التحقق · Verifying…</p>
              </div>
            ) : !valid ? (
              <div className="text-center space-y-3 py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-rose-300" />
                </div>
                <h1 className="text-xl font-bold">الشهادة غير موجودة</h1>
                <p className="text-lg font-semibold text-white/80" dir="ltr">Certificate not found</p>
                <p className="text-sm text-white/55">الرقم غير صحيح أو لم تُصدر الشهادة بعد أو تم إلغاؤها.</p>
                <p className="text-sm text-white/55" dir="ltr">The ID is invalid, or the certificate has not been issued or was revoked.</p>
                <p className="text-[11px] text-white/35 font-mono break-all pt-2" dir="ltr">{id}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                {/* glowing shield */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[rgba(45,212,200,0.30)] blur-2xl" />
                  <div className="absolute inset-3 rounded-full bg-[rgba(212,175,55,0.18)] blur-xl" />
                  <svg viewBox="0 0 64 72" className="relative w-20 h-[90px] drop-shadow-[0_0_18px_rgba(45,212,200,0.55)]" aria-hidden>
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

                <h1 className="mt-5 text-[17px] sm:text-2xl font-extrabold text-emerald-200 text-balance">الشهادة موثّقة وصادرة من إسلام سلمي</h1>
                <p className="mt-1 text-[13px] sm:text-base font-semibold text-white/75 text-balance" dir="ltr">This certificate is verified and issued by Eslam Selmi</p>

                <div className="my-8 h-px w-40 bg-gradient-to-r from-transparent via-[var(--gold)]/60 to-transparent" />

                {d!.trainee_name_ar && <p className="text-2xl sm:text-3xl font-extrabold leading-tight" dir="rtl">{d!.trainee_name_ar}</p>}
                {d!.trainee_name_en && <p className="mt-1.5 text-lg sm:text-xl font-semibold text-white/85" dir="ltr">{d!.trainee_name_en}</p>}

                <div className="mt-6 flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-sm text-[var(--gold)]">
                  {issued ? (<>
                  <span className="inline-flex items-center gap-1.5" dir="rtl"><Calendar className="w-3.5 h-3.5" />تاريخ الإصدار: <bdi dir="rtl">{issued.toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" })}</bdi></span>
                  <span className="hidden sm:inline text-white/25">|</span>
                  <span className="inline-flex items-center gap-1.5" dir="ltr">Issued: <bdi dir="ltr">{issued.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</bdi></span>
                  </>) : (<>
                  <span className="inline-flex items-center gap-1.5" dir="rtl"><Calendar className="w-3.5 h-3.5" />تاريخ الإصدار: غير مسجّل</span>
                  <span className="hidden sm:inline text-white/25">|</span>
                  <span className="inline-flex items-center gap-1.5" dir="ltr">Issued: date not recorded</span>
                  </>)}
                </div>

                <div className="mt-8 w-full border-t border-white/10 pt-5 space-y-1.5 text-xs text-white/55">
                  <p className="inline-flex items-center justify-center gap-1.5"><Award className="w-3.5 h-3.5" /><bdi dir="auto">{d!.course_title}</bdi>{Number(d!.total_hours) > 0 && <span> · <bdi dir="ltr">{d!.total_hours} h</bdi></span>}</p>
                  <p className="font-mono text-[11px] text-white/40 break-all" dir="ltr">{d!.certificate_id}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
