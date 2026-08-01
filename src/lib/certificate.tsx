import { createRoot } from "react-dom/client";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
const brandLogo = brandLogoAsset.url;

export type CertificatePayload = {
  studentName: string;
  courseTitle: string;
  courseDescription?: string | null;
  totalHours?: number | null;
  issueDate: Date;
  lang: "ar" | "en";
  certificateId: string;
  signerName?: string;
  signerTitle?: string;
  courseLogoUrl?: string | null;
  courseBrandName?: string | null;
};

/* ---------- Copy ---------- */
const COPY = {
  ar: {
    eyebrow: "إسلام سلمي",
    title: "شهادة إتمام",
    subtitle: "نشهد بكل فخر أن",
    bridge: "قد أتمّ بامتياز جميع متطلبات كورس",
    hoursLabel: "إجمالي ساعات التدريب",
    hoursUnit: "ساعة",
    dateLabel: "تاريخ الإصدار",
    idLabel: "رقم الشهادة",
    verify: "امسح للتحقّق",
    defaultSigner: "م. إسلام سلمي",
    defaultRole: "المؤسس والمدرّب الرئيسي",
    seal: "الختم الرسمي",
    monogram: "إ س",
    latinTag: "ESLAM SELMI ACADEMY",
    dir: "rtl" as const,
    fontDisplay: "'Amiri','IBM Plex Sans Arabic',serif",
    fontBody: "'IBM Plex Sans Arabic','Tajawal',sans-serif",
  },
  en: {
    eyebrow: "Eslam Selmi Academy",
    title: "Certificate of Achievement",
    subtitle: "This is to proudly certify that",
    bridge: "has successfully completed all requirements of the programme",
    hoursLabel: "Total training hours",
    hoursUnit: "hours",
    dateLabel: "Issued on",
    idLabel: "Certificate No.",
    verify: "Scan to verify",
    defaultSigner: "Eng. Eslam Selmi",
    defaultRole: "Founder & Lead Instructor",
    seal: "Academy Seal",
    monogram: "ES",
    latinTag: "إسلام سلمي",
    dir: "ltr" as const,
    fontDisplay: "'Cinzel','Cormorant Garamond',Georgia,serif",
    fontBody: "'Cormorant Garamond',Georgia,'Times New Roman',serif",
  },
};

/* ---------- Ornaments ---------- */

function GuillocheBorder() {
  // Elegant repeating filigree pattern along the border
  return (
    <svg
      viewBox="0 0 2245 1587"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <pattern id="guilloche" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="22" fill="none" stroke="#b8923f" strokeWidth="0.4" opacity="0.35" />
          <circle cx="30" cy="30" r="14" fill="none" stroke="#b8923f" strokeWidth="0.4" opacity="0.35" />
          <circle cx="0" cy="30" r="14" fill="none" stroke="#b8923f" strokeWidth="0.4" opacity="0.35" />
          <circle cx="60" cy="30" r="14" fill="none" stroke="#b8923f" strokeWidth="0.4" opacity="0.35" />
        </pattern>
        <mask id="borderMask">
          <rect x="0" y="0" width="2245" height="1587" fill="white" />
          <rect x="140" y="140" width="1965" height="1307" fill="black" />
        </mask>
      </defs>
      <rect x="0" y="0" width="2245" height="1587" fill="url(#guilloche)" mask="url(#borderMask)" />
    </svg>
  );
}

function CornerFiligree({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[position];
  const pos: Record<string, React.CSSProperties> = {
    tl: { top: 70, left: 70 },
    tr: { top: 70, right: 70 },
    bl: { bottom: 70, left: 70 },
    br: { bottom: 70, right: 70 },
  };
  return (
    <svg
      viewBox="0 0 240 240"
      style={{
        position: "absolute",
        ...pos[position],
        width: 220,
        height: 220,
        transform: `rotate(${rot}deg)`,
      }}
    >
      <defs>
        <linearGradient id={`corner-${position}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4d77a" />
          <stop offset="0.5" stopColor="#d4af37" />
          <stop offset="1" stopColor="#8b6914" />
        </linearGradient>
      </defs>
      {/* Sweeping curls */}
      <path
        d="M10 10 L 140 10 Q 120 24, 100 26 Q 80 28, 62 40 Q 46 52, 40 72 Q 34 92, 30 116 Q 26 138, 10 148 Z"
        fill={`url(#corner-${position})`}
        opacity="0.95"
      />
      <path
        d="M14 14 L 100 14 Q 90 28, 74 34 Q 56 42, 46 58 Q 38 74, 34 100 Q 30 122, 14 132 Z"
        fill="#0b1736"
        opacity="0.08"
      />
      {/* Inner floral */}
      <path
        d="M30 30 Q 60 34, 82 30 M30 30 Q 34 60, 30 82"
        stroke="#d4af37"
        strokeWidth="1.4"
        fill="none"
      />
      <circle cx="30" cy="30" r="5" fill="#0b1736" />
      <circle cx="30" cy="30" r="2.5" fill="#f4d77a" />
      {/* Curl tips */}
      <path
        d="M150 20 Q 168 20, 172 36 Q 172 46, 160 46"
        stroke="#d4af37"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M20 150 Q 20 168, 36 172 Q 46 172, 46 160"
        stroke="#d4af37"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

function LaurelWreath({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg
        viewBox="0 0 260 260"
        style={{ position: "absolute", inset: 0, width: 260, height: 260 }}
      >
        <defs>
          <linearGradient id="laurel-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e6c366" />
            <stop offset="1" stopColor="#8b6914" />
          </linearGradient>
        </defs>
        {/* Left branch */}
        <g stroke="url(#laurel-grad)" fill="url(#laurel-grad)">
          <path d="M60 210 Q 30 140, 60 60" stroke="#8b6914" strokeWidth="2.4" fill="none" />
          {Array.from({ length: 9 }).map((_, i) => {
            const t = i / 8;
            const x = 60 + Math.sin(t * Math.PI) * -30;
            const y = 210 - t * 150;
            const angle = -70 + t * 40;
            return (
              <ellipse
                key={`l-${i}`}
                cx={x - 12}
                cy={y}
                rx="14"
                ry="5"
                transform={`rotate(${angle} ${x - 12} ${y})`}
                opacity="0.95"
              />
            );
          })}
        </g>
        {/* Right branch */}
        <g stroke="url(#laurel-grad)" fill="url(#laurel-grad)">
          <path d="M200 210 Q 230 140, 200 60" stroke="#8b6914" strokeWidth="2.4" fill="none" />
          {Array.from({ length: 9 }).map((_, i) => {
            const t = i / 8;
            const x = 200 - Math.sin(t * Math.PI) * -30;
            const y = 210 - t * 150;
            const angle = 70 - t * 40;
            return (
              <ellipse
                key={`r-${i}`}
                cx={x + 12}
                cy={y}
                rx="14"
                ry="5"
                transform={`rotate(${angle} ${x + 12} ${y})`}
                opacity="0.95"
              />
            );
          })}
        </g>
        {/* Ribbon knot at bottom */}
        <path d="M110 210 Q 130 224, 150 210 L 155 232 L 130 220 L 105 232 Z" fill="#d4af37" />
      </svg>
      {children}
    </div>
  );
}

function GoldMedallion({ lang, logoUrl }: { lang: "ar" | "en"; logoUrl?: string | null }) {
  const t = COPY[lang];
  return (
    <div
      style={{
        position: "relative",
        width: 260,
        height: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LaurelWreath>
        <svg viewBox="0 0 200 200" style={{ width: 170, height: 170 }}>
          <defs>
            <radialGradient id="med-grad" cx="50%" cy="45%" r="60%">
              <stop offset="0" stopColor="#faecad" />
              <stop offset="0.55" stopColor="#d4af37" />
              <stop offset="1" stopColor="#7a5a10" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="92" fill="url(#med-grad)" />
          <circle cx="100" cy="100" r="82" fill="none" stroke="#fff8e1" strokeWidth="1.8" opacity="0.7" />
          <circle cx="100" cy="100" r="72" fill="none" stroke="#0b1736" strokeWidth="0.6" opacity="0.35" />
          {/* Fluted rim */}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const x1 = 100 + Math.cos(a) * 84;
            const y1 = 100 + Math.sin(a) * 84;
            const x2 = 100 + Math.cos(a) * 92;
            const y2 = 100 + Math.sin(a) * 92;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7a5a10" strokeWidth="0.8" />;
          })}
        </svg>
        {/* Logo or monogram in center */}
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              crossOrigin="anonymous"
              alt=""
              style={{ width: 96, height: 96, objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                fontFamily: t.fontDisplay,
                fontSize: 60,
                fontWeight: 800,
                color: "#0b1736",
                letterSpacing: 2,
                lineHeight: 1,
              }}
            >
              {t.monogram}
            </div>
          )}
        </div>
      </LaurelWreath>
    </div>
  );
}

/** Signature */
function Signature() {
  return (
    <svg viewBox="0 0 340 110" xmlns="http://www.w3.org/2000/svg" style={{ width: 280, height: 92 }}>
      <path
        d="M10 78 C 34 22, 62 100, 92 58 S 132 18, 162 62 Q 184 90, 210 52 T 264 58 L 306 40"
        fill="none"
        stroke="#0b1736"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M55 84 Q 132 96, 240 84"
        fill="none"
        stroke="#0b1736"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="304" cy="38" r="2.6" fill="#0b1736" />
    </svg>
  );
}

/* ---------- Card ---------- */

function CertificateCard({
  p,
  qrDataUrl,
  verifyUrl,
}: {
  p: CertificatePayload;
  qrDataUrl?: string;
  verifyUrl?: string;
}) {
  const t = COPY[p.lang];
  const dateStr =
    p.lang === "ar"
      ? p.issueDate.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
      : p.issueDate.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  const W = 2245;
  const H = 1587;

  return (
    <div
      dir={t.dir}
      style={{
        width: W,
        height: H,
        position: "relative",
        // Deep navy outer frame with luxurious warm inner card
        background:
          "radial-gradient(ellipse at 50% -10%, #1e2f6c 0%, #101b46 45%, #08102e 100%)",
        fontFamily: t.fontBody,
        color: "#0b1736",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Outer gold hairline */}
      <div
        style={{
          position: "absolute",
          inset: 40,
          border: "2px solid #d4af37",
          borderRadius: 10,
          boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.4)",
        }}
      />
      {/* Guilloche band between outer border and inner card */}
      <GuillocheBorder />
      {/* Inner cream card */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 140,
          right: 140,
          bottom: 140,
          borderRadius: 6,
          background:
            "radial-gradient(ellipse at top, #fdf9ec 0%, #f7ecc9 60%, #ecd9a2 100%)",
          boxShadow:
            "0 0 0 2px #d4af37, 0 0 0 4px rgba(212,175,55,0.4), 0 40px 80px rgba(0,0,0,0.35) inset",
        }}
      />
      {/* Watermark monogram */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 140,
          right: 140,
          bottom: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: COPY.en.fontDisplay,
            fontSize: 620,
            fontWeight: 800,
            color: "#0b1736",
            opacity: 0.035,
            letterSpacing: 20,
          }}
        >
          ES
        </div>
      </div>
      {/* Corner filigrees */}
      <CornerFiligree position="tl" />
      <CornerFiligree position="tr" />
      <CornerFiligree position="bl" />
      <CornerFiligree position="br" />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 180,
          right: 180,
          bottom: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div
            style={{
              fontFamily: t.fontDisplay,
              fontSize: 22,
              letterSpacing: p.lang === "en" ? 10 : 2,
              color: "#8b6914",
              textTransform: p.lang === "en" ? "uppercase" : "none",
              fontWeight: 600,
            }}
          >
            {t.eyebrow}
          </div>
          <div
            style={{
              height: 1,
              width: 260,
              background: "linear-gradient(90deg, transparent, #d4af37, transparent)",
            }}
          />
          <div
            style={{
              fontFamily: COPY.en.fontDisplay,
              fontSize: 11,
              letterSpacing: 6,
              color: "#8b6914",
              opacity: 0.7,
            }}
          >
            EST · 2018
          </div>
        </div>

        {/* Title + medallion cluster */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <GoldMedallion lang={p.lang} logoUrl={p.courseLogoUrl || brandLogo} />

          <h1
            style={{
              fontSize: p.lang === "en" ? 96 : 108,
              fontWeight: p.lang === "en" ? 700 : 800,
              margin: 0,
              fontFamily: t.fontDisplay,
              color: "#0b1736",
              letterSpacing: p.lang === "en" ? 8 : 0,
              lineHeight: 1.05,
              textTransform: p.lang === "en" ? "uppercase" : "none",
            }}
          >
            {t.title}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: "#6b5418",
            }}
          >
            <span style={{ height: 1, width: 60, background: "#c9a84c" }} />
            <span
              style={{
                fontSize: 26,
                fontStyle: p.lang === "en" ? "italic" : "normal",
                fontFamily: t.fontDisplay,
                fontWeight: 500,
              }}
            >
              {t.subtitle}
            </span>
            <span style={{ height: 1, width: 60, background: "#c9a84c" }} />
          </div>

          {/* Student name */}
          <div style={{ position: "relative", padding: "6px 100px", marginTop: 4 }}>
            <h2
              style={{
                fontSize: p.lang === "en" ? 118 : 128,
                fontWeight: p.lang === "en" ? 600 : 800,
                margin: 0,
                fontFamily: t.fontDisplay,
                color: "#0b1736",
                lineHeight: 1.1,
                fontStyle: p.lang === "en" ? "italic" : "normal",
              }}
            >
              {p.studentName.replace(/"/g, "")}
            </h2>
            <div
              style={{
                position: "absolute",
                bottom: -2,
                left: "5%",
                right: "5%",
                height: 2,
                background:
                  "linear-gradient(90deg, transparent, #d4af37 15%, #d4af37 85%, transparent)",
              }}
            />
          </div>

          <div
            style={{
              fontSize: 26,
              color: "#4a5478",
              maxWidth: 1500,
              fontFamily: t.fontDisplay,
              fontStyle: p.lang === "en" ? "italic" : "normal",
            }}
          >
            {t.bridge}
          </div>

          {/* Course title */}
          <h3
            style={{
              fontSize: 56,
              fontWeight: p.lang === "en" ? 600 : 700,
              margin: "4px 0 0",
              fontFamily: t.fontDisplay,
              color: "#1a2a5e",
              maxWidth: 1700,
              lineHeight: 1.2,
            }}
          >
            «{p.courseTitle}»
          </h3>

          {Number(p.totalHours) > 0 && (
            <div
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 32px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.05))",
                border: "1.5px solid #d4af37",
                fontSize: 24,
                fontWeight: 600,
                color: "#6b5418",
                fontFamily: t.fontBody,
              }}
            >
              <span>{t.hoursLabel}</span>
              <span style={{ fontSize: 32, color: "#0b1736", fontWeight: 800 }}>{p.totalHours}</span>
              <span>{t.hoursUnit}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            alignItems: "end",
            gap: 40,
          }}
        >
          {/* Date + ID + QR */}
          <div style={{ textAlign: p.lang === "ar" ? "right" : "left" }}>
            <div
              style={{
                fontFamily: COPY.en.fontDisplay,
                fontSize: 12,
                letterSpacing: 4,
                color: "#8b6914",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {t.dateLabel}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#0b1736",
                fontFamily: t.fontDisplay,
              }}
            >
              {dateStr}
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: COPY.en.fontDisplay,
                fontSize: 11,
                color: "#8b6914",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              {t.idLabel}
            </div>
            <div
              style={{ fontSize: 14, color: "#4a5478", fontFamily: "monospace" }}
              dir="ltr"
            >
              {p.certificateId.slice(0, 8).toUpperCase()}-
              {p.certificateId.slice(-4).toUpperCase()}
            </div>
          </div>

          {/* Center: QR */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            {qrDataUrl && (
              <>
                <img
                  src={qrDataUrl}
                  alt=""
                  style={{
                    width: 130,
                    height: 130,
                    background: "#fff",
                    padding: 6,
                    borderRadius: 8,
                    border: "1.5px solid #d4af37",
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: "#8b6914",
                    letterSpacing: 2,
                    fontFamily: t.fontBody,
                  }}
                >
                  {t.verify}
                </div>
              </>
            )}
          </div>

          {/* Signature */}
          <div style={{ textAlign: p.lang === "ar" ? "left" : "right" }}>
            <div
              style={{
                display: "flex",
                justifyContent: p.lang === "ar" ? "flex-start" : "flex-end",
                marginBottom: -6,
              }}
            >
              <Signature />
            </div>
            <div
              style={{
                height: 1.5,
                background:
                  "linear-gradient(90deg, transparent, #0b1736 40%, #0b1736 60%, transparent)",
                marginBottom: 8,
              }}
            />
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#0b1736",
                fontFamily: t.fontDisplay,
              }}
            >
              {p.signerName || t.defaultSigner}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6b5418",
                letterSpacing: 2,
                marginTop: 4,
                fontFamily: COPY.en.fontDisplay,
                textTransform: "uppercase",
              }}
            >
              {p.signerTitle || t.defaultRole}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Generator ---------- */

export async function generateCertificatePdf(p: CertificatePayload): Promise<Blob> {
  if (document.fonts && (document.fonts as any).ready) {
    try {
      await (document.fonts as any).ready;
    } catch {}
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://eslam-selmi.lovable.app";
  const verifyUrl = `${origin}/verify/${p.certificateId}`;
  let qrDataUrl: string | undefined;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "M",
      margin: 0,
      width: 260,
      color: { dark: "#0b1736", light: "#ffffff" },
    });
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
    setTimeout(resolve, 120);
  });

  // Wait for any images (logo) to load
  const imgs = Array.from(host.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete) return res();
          img.onload = () => res();
          img.onerror = () => res();
        }),
    ),
  );
  await new Promise((r) => setTimeout(r, 180));

  try {
    const target = host.firstElementChild as HTMLElement;
    const dataUrl = await toJpeg(target, {
      quality: 0.96,
      backgroundColor: "#0b1736",
      width: 2245,
      height: 1587,
      pixelRatio: 1,
      cacheBust: true,
      skipFonts: false,
    });

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.addImage(dataUrl, "JPEG", 0, 0, 297, 210, undefined, "FAST");
    return pdf.output("blob");
  } catch (err: any) {
    // Surface the true error so callers can display it
    const msg = err?.message || String(err);
    throw new Error(`Certificate render failed (${p.lang}): ${msg}`);
  } finally {
    root.unmount();
    host.remove();
  }
}
