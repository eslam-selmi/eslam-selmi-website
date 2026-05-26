import { createRoot } from "react-dom/client";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import brandLogo from "@/assets/brand-logo.png";

export type CertificatePayload = {
  studentName: string;
  courseTitle: string;
  courseDescription?: string | null;
  totalHours?: number | null;
  issueDate: Date;
  lang: "ar" | "en";
  /** Unique verification id (use enrollment.id) */
  certificateId: string;
  /** Signer name shown under the signature */
  signerName?: string;
  signerTitle?: string;
};

const COPY = {
  ar: {
    title: "شهادة إتمام",
    subtitle: "تشهد أكاديمية إسلام سلمي",
    intro: "بأن المتدرب الفاضل",
    bridge: "قد أتمّ بنجاح كافة متطلبات كورس",
    hoursLabel: "بإجمالي عدد ساعات تدريبية:",
    hoursUnit: "ساعة",
    dateLabel: "تاريخ الإصدار",
    idLabel: "رقم الشهادة",
    signer: "المدرّب المعتمد",
    defaultSigner: "م. إسلام سلمي",
    defaultRole: "المؤسس والمدرّب الرئيسي",
    seal: "ختم الأكاديمية",
    dir: "rtl" as const,
    fontBody: "'IBM Plex Sans Arabic','Tajawal',sans-serif",
    fontDisplay: "'IBM Plex Sans Arabic','Tajawal',sans-serif",
  },
  en: {
    title: "Certificate of Completion",
    subtitle: "Eslam Selmi Academy proudly certifies that",
    intro: "",
    bridge: "has successfully completed the training course",
    hoursLabel: "Total training hours:",
    hoursUnit: "hours",
    dateLabel: "Issued on",
    idLabel: "Certificate ID",
    signer: "Authorised Instructor",
    defaultSigner: "Eng. Eslam Selmi",
    defaultRole: "Founder & Lead Instructor",
    seal: "Academy Seal",
    dir: "ltr" as const,
    fontBody: "'Manrope','IBM Plex Sans Arabic','Tajawal',ui-sans-serif,system-ui,sans-serif",
    fontDisplay: "'Sora','IBM Plex Sans Arabic','Tajawal',ui-sans-serif,system-ui,sans-serif",
  },
};

/** Stylish SVG signature (kept identical across both languages so it reads as a real mark) */
function Signature() {
  return (
    <svg viewBox="0 0 320 110" xmlns="http://www.w3.org/2000/svg" style={{ width: 260, height: 90 }}>
      <path
        d="M10 75 C 30 20, 60 105, 90 55 S 130 15, 160 60 Q 180 90, 205 50 T 260 55 L 300 40"
        fill="none"
        stroke="#0b1736"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M55 80 Q 120 95, 230 82"
        fill="none"
        stroke="#0b1736"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="298" cy="38" r="2.5" fill="#0b1736" />
    </svg>
  );
}

function CornerOrnament({ rotate }: { rotate: number }) {
  return (
    <svg
      viewBox="0 0 140 140"
      style={{
        position: "absolute",
        width: 150,
        height: 150,
        transform: `rotate(${rotate}deg)`,
        opacity: 0.95,
      }}
    >
      <defs>
        <linearGradient id={`g-${rotate}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4af37" />
          <stop offset="1" stopColor="#a07f28" />
        </linearGradient>
      </defs>
      <path
        d="M5 5 L 80 5 Q 75 12, 65 14 L 30 14 Q 18 16, 16 30 L 16 65 Q 14 75, 5 80 Z"
        fill={`url(#g-${rotate})`}
      />
      <path
        d="M20 20 Q 50 22, 70 18 M20 20 Q 22 50, 18 70"
        stroke="#d4af37"
        strokeWidth="1.2"
        fill="none"
        opacity="0.7"
      />
      <circle cx="22" cy="22" r="3" fill="#0b1736" />
    </svg>
  );
}

function Seal({ lang }: { lang: "ar" | "en" }) {
  const t = COPY[lang];
  return (
    <div
      style={{
        position: "relative",
        width: 150,
        height: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 160 160" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="seal-grad" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#f4d77a" />
            <stop offset="0.6" stopColor="#d4af37" />
            <stop offset="1" stopColor="#8b6914" />
          </radialGradient>
        </defs>
        <circle cx="80" cy="80" r="72" fill="url(#seal-grad)" />
        <circle cx="80" cy="80" r="64" fill="none" stroke="#fff8e1" strokeWidth="1.5" opacity="0.55" />
        <circle cx="80" cy="80" r="56" fill="none" stroke="#0b1736" strokeWidth="0.8" opacity="0.4" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const x1 = 80 + Math.cos(a) * 68;
          const y1 = 80 + Math.sin(a) * 68;
          const x2 = 80 + Math.cos(a) * 74;
          const y2 = 80 + Math.sin(a) * 74;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8b6914" strokeWidth="1.2" />;
        })}
        <path d="M80 38 L 86 70 L 118 70 L 92 88 L 102 118 L 80 100 L 58 118 L 68 88 L 42 70 L 74 70 Z" fill="#0b1736" />
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: -22,
          fontSize: 10,
          color: "#8b6914",
          letterSpacing: 2,
          textTransform: "uppercase",
          fontFamily: COPY[lang].fontBody,
        }}
      >
        {t.seal}
      </div>
    </div>
  );
}

function CertificateCard({ p, qrDataUrl, verifyUrl }: { p: CertificatePayload; qrDataUrl?: string; verifyUrl?: string }) {
  const t = COPY[p.lang];
  const dateStr =
    p.lang === "ar"
      ? p.issueDate.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
      : p.issueDate.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  // A4 landscape proportions, rendered at high DPI
  const W = 2245;
  const H = 1587;

  return (
    <div
      dir={t.dir}
      style={{
        width: W,
        height: H,
        position: "relative",
        background:
          "radial-gradient(ellipse at top, #fbf6e8 0%, #f5ecd3 55%, #ead9a8 100%)",
        fontFamily: t.fontBody,
        color: "#0b1736",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* outer gold frame */}
      <div
        style={{
          position: "absolute",
          inset: 40,
          border: "3px solid #d4af37",
          borderRadius: 12,
        }}
      />
      {/* inner thin frame */}
      <div
        style={{
          position: "absolute",
          inset: 64,
          border: "1.5px solid #b8923f",
          borderRadius: 8,
        }}
      />
      {/* watermark texture */}
      <div
        style={{
          position: "absolute",
          inset: 64,
          background:
            "repeating-linear-gradient(45deg, rgba(212,175,55,0.03) 0 2px, transparent 2px 18px)",
          borderRadius: 8,
        }}
      />
      {/* corner ornaments */}
      <div style={{ position: "absolute", top: 50, left: 50 }}>
        <CornerOrnament rotate={0} />
      </div>
      <div style={{ position: "absolute", top: 50, right: 50 }}>
        <CornerOrnament rotate={90} />
      </div>
      <div style={{ position: "absolute", bottom: 50, right: 50 }}>
        <CornerOrnament rotate={180} />
      </div>
      <div style={{ position: "absolute", bottom: 50, left: 50 }}>
        <CornerOrnament rotate={270} />
      </div>

      {/* content */}
      <div
        style={{
          position: "absolute",
          inset: 120,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "center",
        }}
      >
        {/* header: logo + brand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <img
            src={brandLogo}
            crossOrigin="anonymous"
            alt=""
            style={{ height: 110, width: "auto", objectFit: "contain" }}
          />
          <div
            style={{
              fontSize: 16,
              letterSpacing: 8,
              color: "#8b6914",
              textTransform: "uppercase",
              fontFamily: t.fontDisplay,
              fontWeight: 600,
            }}
          >
            Eslam Selmi Academy · أكاديمية إسلام سلمي
          </div>
          <div
            style={{
              height: 1,
              width: 320,
              background: "linear-gradient(90deg, transparent, #d4af37, transparent)",
            }}
          />
        </div>

        {/* title block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          <h1
            style={{
              fontSize: 96,
              fontWeight: 800,
              margin: 0,
              fontFamily: t.fontDisplay,
              background: "linear-gradient(180deg, #1a2a5e 0%, #0b1736 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: p.lang === "ar" ? 0 : -1,
              lineHeight: 1.05,
            }}
          >
            {t.title}
          </h1>
          <div
            style={{
              fontSize: 28,
              color: "#6b5418",
              letterSpacing: p.lang === "ar" ? 0 : 3,
              fontWeight: 500,
            }}
          >
            {t.subtitle}
          </div>
          {t.intro && (
            <div style={{ fontSize: 26, color: "#4a5478", fontWeight: 400 }}>{t.intro}</div>
          )}

          {/* student name — the hero */}
          <div
            style={{
              position: "relative",
              padding: "18px 90px",
              marginTop: 8,
            }}
          >
            <h2
              style={{
                fontSize: 110,
                fontWeight: 800,
                margin: 0,
                fontFamily: t.fontDisplay,
                color: "#0b1736",
                lineHeight: 1.1,
              }}
            >
              {p.studentName}
            </h2>
            <div
              style={{
                position: "absolute",
                bottom: 4,
                left: "10%",
                right: "10%",
                height: 2,
                background: "linear-gradient(90deg, transparent, #d4af37 20%, #d4af37 80%, transparent)",
              }}
            />
          </div>

          <div style={{ fontSize: 26, color: "#4a5478", maxWidth: 1400 }}>{t.bridge}</div>

          {/* course title */}
          <h3
            style={{
              fontSize: 56,
              fontWeight: 700,
              margin: 0,
              fontFamily: t.fontDisplay,
              color: "#1a2a5e",
              maxWidth: 1600,
              lineHeight: 1.2,
            }}
          >
            «{p.courseTitle}»
          </h3>

          {p.courseDescription && (
            <p
              style={{
                fontSize: 22,
                color: "#4a5478",
                maxWidth: 1500,
                lineHeight: 1.6,
                margin: "4px 0 0",
                fontStyle: p.lang === "en" ? "italic" : "normal",
              }}
            >
              {p.courseDescription.length > 280
                ? p.courseDescription.slice(0, 277) + "…"
                : p.courseDescription}
            </p>
          )}

          {Number(p.totalHours) > 0 && (
            <div
              style={{
                marginTop: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 28px",
                borderRadius: 999,
                background: "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06))",
                border: "1.5px solid #d4af37",
                fontSize: 24,
                fontWeight: 600,
                color: "#6b5418",
              }}
            >
              <span>{t.hoursLabel}</span>
              <span style={{ fontSize: 30, color: "#0b1736", fontWeight: 800 }}>{p.totalHours}</span>
              <span>{t.hoursUnit}</span>
            </div>
          )}
        </div>

        {/* footer: signature + seal + date */}
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "end",
            gap: 40,
            marginTop: 20,
          }}
        >
          {/* date (start side) */}
          <div style={{ textAlign: p.lang === "ar" ? "right" : "left" }}>
            <div
              style={{
                fontSize: 14,
                letterSpacing: 3,
                color: "#8b6914",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {t.dateLabel}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0b1736" }}>{dateStr}</div>
            <div style={{ marginTop: 14, fontSize: 12, color: "#8b6914", letterSpacing: 2 }}>
              {t.idLabel}
            </div>
            <div
              style={{ fontSize: 14, color: "#4a5478", fontFamily: "monospace" }}
              dir="ltr"
            >
              {p.certificateId.slice(0, 8).toUpperCase()}-{p.certificateId.slice(-4).toUpperCase()}
            </div>
            {qrDataUrl && (
              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: p.lang === "ar" ? "flex-end" : "flex-start", gap: 4 }}>
                <img src={qrDataUrl} alt="" style={{ width: 120, height: 120, background: "#fff", padding: 6, borderRadius: 8, border: "1px solid #d4af37" }} />
                <div style={{ fontSize: 10, color: "#8b6914", letterSpacing: 1 }}>
                  {p.lang === "ar" ? "امسح للتحقّق" : "Scan to verify"}
                </div>
                {verifyUrl && (
                  <div style={{ fontSize: 9, color: "#6b5418", fontFamily: "monospace", maxWidth: 220, wordBreak: "break-all" }} dir="ltr">
                    {verifyUrl}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* seal */}
          <Seal lang={p.lang} />

          {/* signature (end side) */}
          <div style={{ textAlign: p.lang === "ar" ? "left" : "right" }}>
            <div
              style={{
                display: "flex",
                justifyContent: p.lang === "ar" ? "flex-start" : "flex-end",
                marginBottom: -8,
              }}
            >
              <Signature />
            </div>
            <div
              style={{
                height: 1.5,
                background: "linear-gradient(90deg, transparent, #0b1736 40%, #0b1736 60%, transparent)",
                marginBottom: 8,
              }}
            />
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0b1736" }}>
              {p.signerName || t.defaultSigner}
            </div>
            <div style={{ fontSize: 14, color: "#6b5418", letterSpacing: 2, marginTop: 4 }}>
              {p.signerTitle || t.defaultRole}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Render off-screen, rasterise, return a single-page A4 landscape PDF blob */
export async function generateCertificatePdf(p: CertificatePayload): Promise<Blob> {
  // Ensure fonts are ready (Sora / IBM Plex Arabic / Manrope are already loaded via the site).
  if (document.fonts && (document.fonts as any).ready) {
    try {
      await (document.fonts as any).ready;
    } catch {}
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://eslam-selmi.lovable.app";
  const verifyUrl = `${origin}/verify/${p.certificateId}`;
  let qrDataUrl: string | undefined;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: "M", margin: 0, width: 240, color: { dark: "#0b1736", light: "#ffffff" } });
  } catch {}

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.zIndex = "-1";
  host.style.pointerEvents = "none";
  document.body.appendChild(host);

  const root = createRoot(host);
  await new Promise<void>((resolve) => {
    root.render(<CertificateCard p={p} qrDataUrl={qrDataUrl} verifyUrl={verifyUrl} />);
    // give react & images a tick
    setTimeout(resolve, 80);
  });

  // wait for the logo image to fully load
  const img = host.querySelector("img");
  if (img && !(img as HTMLImageElement).complete) {
    await new Promise((res) => {
      (img as HTMLImageElement).onload = () => res(null);
      (img as HTMLImageElement).onerror = () => res(null);
    });
  }
  // small extra delay to let layout settle
  await new Promise((r) => setTimeout(r, 120));

  try {
    const target = host.firstElementChild as HTMLElement;
    // html-to-image renders via SVG foreignObject and does NOT parse the page's
    // stylesheets, so it works fine even when the site uses oklch() tokens.
    const dataUrl = await toJpeg(target, {
      quality: 0.96,
      backgroundColor: "#fbf6e8",
      width: 2245,
      height: 1587,
      pixelRatio: 1,
      cacheBust: true,
      // Skip walking external stylesheets — we only need inline styles from our
      // own component tree, which uses plain hex colors.
      skipFonts: false,
    });

    // A4 landscape (297 × 210 mm)
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.addImage(dataUrl, "JPEG", 0, 0, 297, 210, undefined, "FAST");
    const blob = pdf.output("blob");
    return blob;
  } finally {
    root.unmount();
    host.remove();
  }
}
