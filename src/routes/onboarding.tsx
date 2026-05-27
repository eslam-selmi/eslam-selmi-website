import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/lib/portal-auth";
import { Loader2, MessageCircle, Clock3, LogOut, CheckCircle2, XCircle } from "lucide-react";
import brandLogo from "@/assets/brand-logo.png";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "تفعيل الحساب · أكاديمية إسلام سلمي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

type Settings = {
  admin_whatsapp_e164: string | null;
  activation_request_template_ar: string;
  activation_request_template_en: string;
};

function OnboardingPage() {
  const { user, loading, activationStatus } = useAuth();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const nav = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && activationStatus === "active") nav({ to: "/portal" });
  }, [user, loading, activationStatus, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, p] = await Promise.all([
        supabase.rpc("get_activation_contact"),
        supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle(),
      ]);
      setSettings((s.data as any) ?? null);
      setProfile((p.data as any) ?? null);
    })();
  }, [user]);

  // Poll for activation every 10s
  useEffect(() => {
    if (!user || activationStatus !== "pending") return;
    const t = setInterval(async () => {
      setPolling(true);
      const { data } = await supabase.from("profiles").select("activation_status").eq("id", user.id).maybeSingle();
      setPolling(false);
      if ((data as any)?.activation_status === "active") {
        window.location.href = "/portal";
      }
    }, 10000);
    return () => clearInterval(t);
  }, [user, activationStatus]);

  if (loading || !user) {
    return <div className="min-h-screen bg-[#0b1736] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div>;
  }

  const rejected = activationStatus === "rejected";
  const name = profile?.full_name || (isAr ? "متدرب" : "Trainee");
  const email = profile?.email || user.email || "";

  const tmpl = isAr ? settings?.activation_request_template_ar : settings?.activation_request_template_en;
  const message = (tmpl ?? "")
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{email\}\}/g, email);
  const waNumber = (settings?.admin_whatsapp_e164 ?? "").replace(/\D/g, "");
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen relative overflow-hidden bg-[#0b1736] text-white flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-aurora opacity-70" />
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, var(--gold), transparent 65%)" }} />
      <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle, var(--lavender-deep), transparent 65%)" }} />

      <div className="relative w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <Link to="/"><img src={brandLogo} alt="Eslam Selmi" className="h-16 w-16 rounded-2xl object-contain bg-white/10 p-2 border border-white/15" /></Link>
          <p className="mt-3 text-[11px] tracking-[0.3em] text-white/60">ESLAM SELMI ACADEMY</p>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-[rgba(11,23,54,0.75)] backdrop-blur-2xl p-8 shadow-2xl text-center">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />

          {rejected ? (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto border border-rose-400/40 bg-rose-500/10">
                <XCircle className="w-8 h-8 text-rose-300" />
              </div>
              <h1 className="text-2xl font-bold">{isAr ? "تعذّر تفعيل حسابك" : "Account activation rejected"}</h1>
              <p className="text-white/70 mt-4 leading-relaxed">
                {isAr
                  ? "لم نتمكن من تفعيل حسابك حالياً. يرجى التواصل مع الإدارة عبر واتساب لمعرفة التفاصيل."
                  : "We couldn't activate your account at this time. Please contact the administration via WhatsApp for details."}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto border border-[var(--gold)]/40" style={{ background: "linear-gradient(135deg, rgba(212,178,89,0.25), transparent)" }}>
                <Clock3 className="w-8 h-8 text-[var(--gold)]" />
              </div>
              <h1 className="text-2xl font-bold">{isAr ? "حسابك قيد المراجعة" : "Your account is under review"}</h1>
              <p className="text-white/70 mt-4 leading-relaxed">
                {isAr ? "مرحباً " : "Hello "}<span className="font-semibold text-[var(--gold)]">{name}</span>{isAr ? "، " : ", "}
                {isAr
                  ? "تم استلام تسجيلك. لتسريع التفعيل، تواصل مع الإدارة على واتساب من الزر بالأسفل."
                  : "we've received your registration. To speed up activation, message the admin on WhatsApp using the button below."}
              </p>
              <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60" dir="ltr">
                {email}
              </div>
            </>
          )}

          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2.5 h-12 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", color: "white" }}
            >
              <MessageCircle className="w-5 h-5" />
              {isAr ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
            </a>
          ) : (
            <p className="mt-7 text-xs text-amber-200/70 p-3 rounded-xl bg-amber-300/10 border border-amber-300/30">
              {isAr ? "لم يتم إعداد رقم الواتساب بعد. يرجى مراسلة الإدارة عبر البريد." : "Admin WhatsApp not configured yet."}
            </p>
          )}

          {!rejected && (
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/50">
              <CheckCircle2 className={`w-3.5 h-3.5 ${polling ? "animate-pulse text-emerald-300" : ""}`} />
              {isAr ? "نتحقق تلقائياً من حالة الحساب كل بضع ثوانٍ" : "We auto-check activation status every few seconds"}
            </div>
          )}

          <button
            onClick={async () => { await signOut(); nav({ to: "/auth" }); }}
            className="mt-6 inline-flex items-center justify-center gap-2 text-xs text-white/60 hover:text-white transition px-4 h-9 rounded-lg border border-white/10 hover:bg-white/5"
          >
            <LogOut className="w-3.5 h-3.5" /> {isAr ? "تسجيل خروج" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
