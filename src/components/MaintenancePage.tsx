import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
const brandLogo = brandLogoAsset.url;
type Props = {
  message: string;
  until: string | null;
};

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    done: ms === 0,
  };
}

export function MaintenancePage({ message, until }: Props) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const target = useMemo(() => (until ? new Date(until).getTime() : null), [until]);
  const [tick, setTick] = useState(() => (target ? diff(target) : null));

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setTick(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const labels = [
    { v: tick?.d ?? 0, l: t("يوم", "Days") },
    { v: tick?.h ?? 0, l: t("ساعة", "Hours") },
    { v: tick?.m ?? 0, l: t("دقيقة", "Min") },
    { v: tick?.s ?? 0, l: t("ثانية", "Sec") },
  ];

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-5 py-12"
      style={{
        background:
          "radial-gradient(ellipse 85% 55% at 12% -5%, oklch(0.55 0.18 258 / 0.45), transparent 60%), radial-gradient(ellipse 70% 50% at 88% -8%, oklch(0.72 0.13 180 / 0.22), transparent 60%), radial-gradient(ellipse 60% 45% at 50% 110%, oklch(0.34 0.13 290 / 0.30), transparent 60%), linear-gradient(180deg, #07112a 0%, #0a1635 40%, #08122a 100%)",
      }}
    >
      {/* Decorative grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 80%)",
        }}
      />
      {/* Soft glow orbs */}
      <div aria-hidden className="absolute -top-32 -start-32 w-[420px] h-[420px] rounded-full blur-3xl"
           style={{ background: "radial-gradient(circle, oklch(0.72 0.13 180 / 0.35), transparent 70%)" }} />
      <div aria-hidden className="absolute -bottom-40 -end-32 w-[480px] h-[480px] rounded-full blur-3xl"
           style={{ background: "radial-gradient(circle, oklch(0.66 0.14 290 / 0.30), transparent 70%)" }} />

      <div className="relative w-full max-w-2xl">
        <div
          className="rounded-[28px] p-8 md:p-12 text-center"
          style={{
            background:
              "linear-gradient(160deg, oklch(1 0 0 / 0.06), transparent 45%), linear-gradient(180deg, #0d1a3d 0%, #0b1736 55%, #08122a 100%)",
            border: "1px solid oklch(0.78 0.14 90 / 0.28)",
            boxShadow:
              "0 50px 120px -30px oklch(0 0 0 / 0.8), 0 0 0 1px oklch(1 0 0 / 0.04), inset 0 1px 0 oklch(1 0 0 / 0.08)",
            color: "#fff",
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg, #122353 0%, #0b1736 100%)",
                border: "1px solid oklch(0.78 0.14 90 / 0.4)",
                boxShadow:
                  "0 0 0 1px oklch(0.78 0.14 90 / 0.35), 0 0 40px -6px oklch(0.78 0.14 90 / 0.55)",
              }}
            >
              <img src={brandLogo} alt="Eslam Selmi" width={96} height={96} className="w-full h-full object-contain p-3" />
            </div>
          </div>

          {/* Status pill */}
          <div className="flex justify-center mb-4">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
              style={{
                background: "oklch(0.78 0.14 90 / 0.12)",
                color: "oklch(0.85 0.14 90)",
                border: "1px solid oklch(0.78 0.14 90 / 0.35)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              {t("الموقع تحت الصيانة", "Site under maintenance")}
            </div>
          </div>

          {/* Brand name */}
          <h1
            className="text-2xl md:text-4xl font-extrabold mb-3"
            style={{
              fontFamily: lang === "ar" ? "var(--font-heading-ar)" : "var(--font-heading-en)",
              background: "linear-gradient(110deg, #fff 0%, oklch(0.85 0.14 90) 55%, #fff 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {t("إسلام سلمي", "Eslam Selmi")}
          </h1>

          {/* Headline */}
          <p className="text-lg md:text-xl font-semibold text-white/90 mb-2">
            {t("سنعود إليكم قريباً", "We'll be back soon")}
          </p>

          {/* Message */}
          <p className="text-sm md:text-base text-white/65 max-w-xl mx-auto leading-relaxed mb-7 whitespace-pre-line">
            {message}
          </p>

          {/* Countdown */}
          {target ? (
            <>
              <div className="text-[11px] uppercase tracking-widest text-white/45 mb-3">
                {t("الوقت المتبقي للعودة", "Time until we're back")}
              </div>
              <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-md mx-auto">
                {labels.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-xl py-3 md:py-4"
                    style={{
                      background: "linear-gradient(180deg, oklch(1 0 0 / 0.06), oklch(1 0 0 / 0.02))",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.08)",
                    }}
                  >
                    <div
                      className="text-2xl md:text-4xl font-extrabold tabular-nums"
                      style={{ fontFamily: "var(--font-heading-en)" }}
                    >
                      {String(b.v).padStart(2, "0")}
                    </div>
                    <div className="text-[10px] md:text-xs text-white/50 mt-1 uppercase tracking-wider">
                      {b.l}
                    </div>
                  </div>
                ))}
              </div>
              {tick?.done ? (
                <p className="mt-5 text-sm text-emerald-300">
                  {t("نوشك على العودة... جرّب تحديث الصفحة.", "We're almost back — try refreshing.")}
                </p>
              ) : null}
            </>
          ) : null}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-white/40">
            © {new Date().getFullYear()} Eslam Selmi · {t("شكراً لصبركم", "Thank you for your patience")}
          </div>
        </div>
      </div>
    </div>
  );
}
