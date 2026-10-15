import { useEffect, useRef, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import { useSiteProfile } from "@/lib/site-profile";
import { certText, defaultCertificateSettings, type CertTextKey, type CertificateSettings } from "@/lib/certificate-settings";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/sora/latin-600.css";
import "@fontsource/sora/latin-700.css";

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
  settings?: CertificateSettings;
};
export const CERTIFICATE_WIDTH = 1600;
export const CERTIFICATE_HEIGHT = 1131;
export const verificationUrl = (id: string) => `https://eslam-selmi.com/verify/${encodeURIComponent(id)}`;

export function CertificateDocument({ payload: p, qr, logo = brandLogoAsset.url, courseLogo }: {
  payload: CertificatePayload; qr?: string; logo?: string; courseLogo?: string;
}) {
  const ar = p.lang === "ar";
  const s = p.settings ?? defaultCertificateSettings;
  const tx = (k: CertTextKey) => certText(s, p.lang, k);
  const on = s.toggles;
  const date = p.issueDate.toLocaleDateString(ar ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  const style = { "--certificate-paper": s.colors.paper, "--certificate-ink": s.colors.ink, "--certificate-accent": s.colors.accent, "--certificate-line": s.colors.line } as CSSProperties;
  return <article className={`certificate-sheet ${ar ? "certificate-ar" : "certificate-en"}`} style={style} dir={ar ? "rtl" : "ltr"} aria-label={tx("title")}>
    {on.showSpine && <div className="certificate-spine" aria-hidden="true"><span>{certText(s, "en", "brandName")}</span><span>{certText(s, "en", "brandTagline")}</span></div>}
    {on.showLines && <svg className="certificate-lines" viewBox="0 0 1600 1131" aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => <path key={i} d={`M${1110+i*19} 0 Q${880+i*21} 180 ${1200+i*16} 360 T${1440+i*12} 1131`} fill="none" stroke="currentColor" strokeWidth="1" />)}
    </svg>}
    {on.showFrame && <div className="certificate-inner-frame" aria-hidden="true" />}
    <header className="certificate-header">
      {on.showBrand && <div className="certificate-brand"><img src={logo} alt="" /><div><strong>{tx("brandName")}</strong><span>{tx("brandTagline")}</span></div></div>}
    </header>
    <main className="certificate-main">
      <p className="certificate-eyebrow">{tx("eyebrow")}</p>
      <h1 style={{ fontSize: `${(ar ? 86 : 76) * s.titleScale / 100}px` }}>{tx("title")}</h1>
      <p className="certificate-subtitle">{tx("subtitle")}</p>
      <div className="certificate-rule" />
      <p className="certificate-intro">{tx("intro")}</p>
      <h2 className="certificate-student" style={{ fontSize: `${49 * s.nameScale / 100}px` }}>{p.studentName.replace(/"/g, "")}</h2>
      <p className="certificate-bridge">{tx("bridge")}</p>
      <h3 className="certificate-course">{s[p.lang].courseTitle?.trim() || p.courseTitle}</h3>
      {on.showHours && Number(p.totalHours) > 0 && <p className="certificate-hours"><strong>{p.totalHours}</strong><span>{tx("hoursLabel")}</span></p>}
      {on.showPartner && p.courseBrandName && <div className="certificate-partner">{courseLogo && <img src={courseLogo} alt="" />}<span>{p.courseBrandName}</span></div>}
    </main>
    <footer className="certificate-footer">
      <div className="certificate-date">{on.showDate && <><span>{tx("dateLabel")}</span><strong>{date}</strong></>}<p>{tx("website")}</p></div>
      <div className="certificate-signature">{on.showSignature && <><div className="certificate-signature-mark">{tx("signatureMark")}</div><strong>{p.signerName || tx("signerName")}</strong><span>{p.signerTitle || tx("signerTitle")}</span></>}</div>
      <div className="certificate-verification">{on.showQr && <>{qr && <img src={qr} alt={tx("verifyTitle")} />}<div><strong>{tx("verifyTitle")}</strong><span>{tx("verifyHint")}</span></div></>}</div>
    </footer>
  </article>;
}

export function CertificatePreview({ payload }: { payload: CertificatePayload }) {
  const { profile } = useSiteProfile();
  const wrapper = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [qr, setQr] = useState<string>();
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setScale(entry.contentRect.width / CERTIFICATE_WIDTH); });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(verificationUrl(payload.certificateId), { width: 240, margin: 0 }).then(url => { if (!cancelled) setQr(url); });
    return () => { cancelled = true; };
  }, [payload.certificateId]);
  return <div ref={wrapper} className="certificate-preview"><div className="certificate-preview-content" style={{ transform: `scale(${scale})` }}><CertificateDocument payload={payload} qr={qr} logo={profile.logo} /></div></div>;
}
