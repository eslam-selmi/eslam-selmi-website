import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ShieldCheck, XCircle, Loader2, Award, Clock, Calendar, ArrowLeft } from "lucide-react";
import brandLogo from "@/assets/brand-logo.webp";

export const Route = createFileRoute("/verify/$id")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Certificate Verification — Eslam Selmi Academy" },
      { name: "description", content: "Verify the authenticity of a certificate issued by Eslam Selmi Academy." },
    ],
  }),
});

type VerifyResult =
  | { ok: true; trainee_name_ar: string | null; trainee_name_en: string | null; course_title: string; course_description: string | null; total_hours: number; issued_at: string; certificate_id: string }
  | { ok: false; error: string };

function VerifyPage() {
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

  return (
    <div className="min-h-screen bg-[#0b1736] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle at 20% 0%, rgba(212,175,55,0.25), transparent 50%), radial-gradient(circle at 80% 100%, rgba(212,175,55,0.18), transparent 50%)" }} />

      <header className="relative z-10 max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={brandLogo} alt="" className="h-10 w-auto" />
          <span className="text-sm tracking-widest text-white/70 uppercase">Eslam Selmi Academy</span>
        </Link>
        <Link to="/" className="text-xs text-white/60 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 sm:p-10">
          {state.loading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-white/70">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" />
              <p className="text-sm">Verifying certificate…</p>
            </div>
          ) : !valid ? (
            <div className="text-center space-y-3 py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-rose-300" />
              </div>
              <h1 className="text-xl font-bold">Certificate not found</h1>
              <p className="text-sm text-white/60">
                This certificate ID is invalid, has not been issued yet, or has been revoked. Please double-check the QR code or the URL.
              </p>
              <p className="text-[11px] text-white/40 font-mono break-all" dir="ltr">{id}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--gold)] flex items-center justify-center border-2 border-[#0b1736]">
                    <CheckCircle2 className="w-4 h-4 text-[#0b1736]" />
                  </div>
                </div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300 font-semibold">Verified Credential</p>
                <h1 className="text-2xl sm:text-3xl font-bold">This certificate is authentic</h1>
                <p className="text-sm text-white/60 max-w-md">
                  Issued and digitally verified by Eslam Selmi Academy. The data below was retrieved live from our records.
                </p>
              </div>

              <div className="border-t border-white/10 pt-6 space-y-4">
                {(d!.trainee_name_en || d!.trainee_name_ar) && (
                  <Field label="Awarded to">
                    <div className="space-y-0.5">
                      {d!.trainee_name_en && <p className="text-lg font-bold" dir="ltr">{d!.trainee_name_en}</p>}
                      {d!.trainee_name_ar && <p className="text-base font-semibold text-white/85" dir="rtl">{d!.trainee_name_ar}</p>}
                    </div>
                  </Field>
                )}

                <Field label="Course" icon={Award}>
                  <p className="font-semibold">{d!.course_title}</p>
                  {d!.course_description && <p className="text-xs text-white/55 mt-1">{d!.course_description.slice(0, 200)}</p>}
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  {Number(d!.total_hours) > 0 && (
                    <Field label="Training hours" icon={Clock}>
                      <p className="font-semibold">{d!.total_hours} hours</p>
                    </Field>
                  )}
                  <Field label="Date of issue" icon={Calendar}>
                    <p className="font-semibold">
                      {new Date(d!.issued_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </Field>
                </div>

                <Field label="Certificate ID">
                  <p className="text-xs font-mono text-white/70 break-all" dir="ltr">{d!.certificate_id}</p>
                </Field>
              </div>

              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-emerald-200/80 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <p>This verification page is generated on-demand from our database. Any future revocation will be reflected here instantly.</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-white/40 mt-6">
          © {new Date().getFullYear()} Eslam Selmi Academy. All rights reserved.
        </p>
      </main>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-[var(--gold)]/80 mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      {children}
    </div>
  );
}
