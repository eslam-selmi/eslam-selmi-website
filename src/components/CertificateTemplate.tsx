import { useEffect, useState } from "react";
import QRCode from "qrcode";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";

const brandLogo = brandLogoAsset.url;

export type CertificateData = {
  certificateId: string;
  traineeName: string;
  courseName: string;
  trainingHours: string;
  issueDate: string;
  verificationUrl: string;
};

const NAVY = "#0b1f4b";
const BLUE = "#1c56c9";

/** Decorative wavy vector pattern (right side, mirrored on the left). */
function Waves({ side }: { side: "left" | "right" }) {
  const lines = Array.from({ length: 26 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 400 600"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 ${
        side === "right" ? "right-0" : "left-0 -scale-x-100"
      } h-full ${side === "right" ? "w-[34%]" : "w-[20%]"}`}
    >
      {side === "right" && (
        <>
          <path
            d="M400,0 C250,120 330,300 225,430 C150,515 175,575 400,600 Z"
            fill={NAVY}
            opacity="0.95"
          />
          <path
            d="M400,40 C290,150 350,320 265,455 C205,535 235,582 400,600 Z"
            fill={BLUE}
            opacity="0.55"
          />
        </>
      )}
      {lines.map((i) => (
        <path
          key={i}
          d={`M${360 - i * 13},0 C${250 - i * 9},140 ${330 - i * 11},310 ${
            230 - i * 8
          },440 C${180 - i * 7},520 ${240 - i * 8},570 ${360 - i * 12},600`}
          fill="none"
          stroke={BLUE}
          strokeWidth="0.6"
          opacity={side === "right" ? 0.16 : 0.05}
        />
      ))}
    </svg>
  );
}

function SealBadge() {
  return (
    <div className="relative flex h-[92px] w-[92px] items-center justify-center rounded-full border border-[#0b1f4b]/25">
      <div className="absolute inset-[5px] rounded-full border border-[#0b1f4b]/50" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <path id="seal-top" d="M50,50 m-38,0 a38,38 0 1,1 76,0" fill="none" />
          <path id="seal-bottom" d="M50,50 m38,0 a38,38 0 1,1 -76,0" fill="none" />
        </defs>
        <text fill={NAVY} fontSize="8.5" letterSpacing="2.4" fontWeight="600">
          <textPath href="#seal-top" startOffset="50%" textAnchor="middle">
            ESLAM SELMI
          </textPath>
        </text>
        <text fill={NAVY} fontSize="6.6" letterSpacing="2" fontWeight="600">
          <textPath href="#seal-bottom" startOffset="50%" textAnchor="middle">
            TRAINING &amp; DEVELOPMENT
          </textPath>
        </text>
        <circle cx="12" cy="50" r="1.6" fill={NAVY} />
        <circle cx="88" cy="50" r="1.6" fill={NAVY} />
      </svg>
      <img src={brandLogo} alt="" className="h-9 w-9 object-contain" />
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={BLUE} strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2" strokeLinecap="round" />
    </svg>
  );
}

export function CertificateTemplate({ data }: { data: CertificateData }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(data.verificationUrl, {
      width: 320,
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#0b1f4b", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [data.verificationUrl]);

  return (
    <div
      dir="ltr"
      className="relative mx-auto @container aspect-[297/210] w-full max-w-[1123px] overflow-hidden bg-[#fbfcfe] font-[Manrope,sans-serif] text-[#0b1f4b]"
    >
      <Waves side="left" />
      <Waves side="right" />

      {/* Double border frame */}
      <div className="pointer-events-none absolute inset-[1.1%] border border-[#1c56c9]/45" />
      <div className="pointer-events-none absolute inset-[2.4%] border-[1.5px] border-[#1c56c9]/75" />

      <div className="relative flex h-full flex-col px-[6%] py-[4.5%]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <p className="text-[0.62cqw] font-semibold uppercase tracking-[0.28em] text-[#0b1f4b]/55">
            Certificate ID: <span className="text-[#0b1f4b]">{data.certificateId}</span>
          </p>
          <div className="flex items-center gap-3">
            <img src={brandLogo} alt="Eslam Selmi" className="h-[3.4cqw] max-h-14 w-auto" />
            <div className="leading-tight">
              <p className="text-[1.25cqw] font-extrabold tracking-[0.12em]">ESLAM SELMI</p>
              <p className="text-[0.62cqw] font-semibold tracking-[0.22em] text-[#1c56c9]">
                TRAINING &amp; DEVELOPMENT
              </p>
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-[4.4cqw] font-extrabold leading-none tracking-[0.16em] text-[#0b1f4b]">
            CERTIFICATE
          </h1>
          <p className="mt-[1%] text-[1.55cqw] font-semibold tracking-[0.42em] text-[#1c56c9]">
            OF COMPLETION
          </p>

          <div className="mt-[1.4%] flex items-center gap-3">
            <span className="h-px w-[7cqw] bg-gradient-to-l from-[#1c56c9]/70 to-transparent" />
            <span className="h-[5px] w-[5px] rounded-full bg-[#1c56c9]" />
            <span className="h-px w-[7cqw] bg-gradient-to-r from-[#1c56c9]/70 to-transparent" />
          </div>

          <p className="mt-[2%] text-[0.95cqw] font-medium tracking-[0.22em] text-[#0b1f4b]/80">
            THIS CERTIFICATE IS PROUDLY PRESENTED TO
          </p>

          <div className="mt-[1.6%] w-[62%] border-b border-[#1c56c9]/40 pb-[0.8%]">
            <p className="font-[Cormorant_Garamond,serif] text-[3.2cqw] font-semibold leading-tight text-[#0b1f4b]">
              {data.traineeName}
            </p>
          </div>

          <p className="mt-[1.8%] text-[0.9cqw] font-medium tracking-[0.2em] text-[#0b1f4b]/80">
            FOR SUCCESSFULLY COMPLETING THE
          </p>

          <p className="mt-[1%] max-w-[78%] text-[1.7cqw] font-bold leading-tight text-[#1c56c9]">
            {data.courseName}
          </p>

          <div className="mt-[1.4%] flex w-[52%] items-center gap-4">
            <span className="h-px flex-1 bg-[#0b1f4b]/25" />
            <span className="whitespace-nowrap text-[0.95cqw] font-semibold tracking-[0.2em] text-[#0b1f4b]">
              {data.trainingHours}
            </span>
            <span className="h-px flex-1 bg-[#0b1f4b]/25" />
          </div>

          <p className="mt-[1.6%] max-w-[64%] text-[0.72cqw] leading-relaxed text-[#0b1f4b]/65">
            This certificate is awarded in recognition of the successful completion of the training
            program, demonstrating full attendance, active participation, and the achievement of all
            required learning outcomes and assessment criteria.
          </p>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-[3%]">
          {/* Issued on */}
          <div className="flex items-center gap-3">
            <CalendarIcon />
            <div className="min-w-[9cqw]">
              <p className="text-[0.66cqw] font-semibold tracking-[0.24em] text-[#0b1f4b]/70">
                ISSUED ON
              </p>
              <p className="mt-1 border-t border-[#0b1f4b]/30 pt-1 text-[0.82cqw] font-semibold">
                {data.issueDate}
              </p>
            </div>
          </div>

          {/* Seal */}
          <SealBadge />

          {/* Signature */}
          <div className="flex flex-col items-center">
            <p className="font-[Cormorant_Garamond,serif] text-[1.9cqw] italic leading-none text-[#0b1f4b]">
              Eslam Selmi
            </p>
            <span className="mt-[0.6cqw] h-px w-[13cqw] bg-[#0b1f4b]/35" />
            <p className="mt-2 text-[0.85cqw] font-bold tracking-[0.12em] text-[#1c56c9]">
              ESLAM SELMI
            </p>
            <p className="text-[0.68cqw] font-medium tracking-[0.16em] text-[#0b1f4b]/75">
              FOUNDER &amp; TRAINER
            </p>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center text-center">
            <div className="rounded-md bg-white p-[0.5cqw] shadow-sm">
              {qr ? (
                <img src={qr} alt="Verification QR code" className="h-[6cqw] w-[6cqw]" />
              ) : (
                <div className="h-[6cqw] w-[6cqw] animate-pulse bg-[#0b1f4b]/10" />
              )}
            </div>
            <p className="mt-2 text-[0.66cqw] font-bold tracking-[0.14em] text-white">
              VERIFY CERTIFICATE
            </p>
            <p className="text-[0.6cqw] leading-snug text-white/85">
              Scan the QR code
              <br />
              to verify authenticity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CertificateTemplate;
