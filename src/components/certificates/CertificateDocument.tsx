import { useEffect, useRef, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { CertificateBands, CertificateSeal, certificateSize } from "@/components/certificates/CertificateArt";
import { useSiteProfile } from "@/lib/site-profile";
import { certText, defaultCertificateSettings, type CertTextKey, type CertificateSettings } from "@/lib/certificate-settings";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-300.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/latin-300.css";
import "@fontsource/ibm-plex-sans-arabic/latin-500.css";
import "@fontsource/ibm-plex-sans-arabic/latin-600.css";
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
export const CERTIFICATE_WIDTH = 794;
export const CERTIFICATE_HEIGHT = 1123;
export { certificateSize };
export const verificationUrl = (id: string) => `https://eslam-selmi.com/verify/${encodeURIComponent(id)}`;

export function CertificateDocument({ payload: p, qr, logo = brandLogoAsset.url, courseLogo, signature }: {
  payload: CertificatePayload; qr?: string; logo?: string; courseLogo?: string; signature?: string;
}) {
  const ar = p.lang === "ar";
  const s = p.settings ?? defaultCertificateSettings;
  const tx = (k: CertTextKey) => certText(s, p.lang, k);
  const on = s.toggles;
  const date = p.issueDate.toLocaleDateString(ar ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  const style = { "--certificate-paper": s.colors.paper, "--certificate-ink": s.colors.ink, "--certificate-accent": s.colors.accent, "--certificate-line": s.colors.line } as CSSProperties;
  const student = p.studentName.replace(/"/g, "");
  const land = s.orientation === "landscape";
  const nameBase = land ? (ar ? 62 : 56) : ar ? 80 : 70;
  const nameSize = nameBase * (student.length < 24 ? 1 : student.length < 40 ? 0.64 : 0.5) * s.nameScale / 100;
  const course = (s[p.lang].courseTitle?.trim() || p.courseTitle).replace(/[\p{Extended_Pictographic}\uFE0F\u200D]+/gu, "").replace(/\s{2,}/g, " ").trim();
  const courseSize = (land ? (ar ? 30 : 25) : ar ? 34 : 27) * (course.length > 50 ? 0.65 : course.length > 30 ? 0.8 : 1);
  const hours = ar ? Number(p.totalHours).toLocaleString("ar-EG") : String(p.totalHours);
  const microN = land ? 1.42 : 1;
  const micro = ar ? "CERTIFICATE OF COMPLETION · شهادة إتمام · ".repeat(Math.round(18 * microN)) : "CERTIFICATE OF COMPLETION · ".repeat(Math.round(26 * microN));
  return <article className={`certificate-sheet ${ar ? "certificate-ar" : "certificate-en"}${land ? " certificate-landscape" : ""}${!tx("intro") && !tx("bridge") ? " certificate-compact" : ""}`} style={style} dir={ar ? "rtl" : "ltr"} aria-label={tx("title")}>
    {on.showLines && <img className="certificate-watermark" src="/certificate-watermark.webp" alt="" aria-hidden="true" />}
    {on.showSpine && <><CertificateBands landscape={land} /><div className="certificate-micro certificate-micro-top" aria-hidden="true">{micro}</div><div className="certificate-micro certificate-micro-bottom" aria-hidden="true">{micro}</div></>}
    {on.showBrand && <img className="certificate-logo" src={logo} alt="" />}
    {on.showPartner && p.courseBrandName && <div className="certificate-partner">{courseLogo && <img src={courseLogo} alt="" />}<span>{p.courseBrandName}</span></div>}
    <h1 className="certificate-title" style={{ fontSize: `${(land ? (ar ? 50 : 36) : ar ? 58 : 41) * s.titleScale / 100}px` }}>{tx("title")}</h1>
    <p className="certificate-subtitle">{tx("subtitle")}</p>
    <div className="certificate-divider" aria-hidden="true"><i /><b /><i /></div>
    {tx("intro") && <p className="certificate-intro">{tx("intro")}</p>}
    <h2 className="certificate-student" style={{ fontSize: `${nameSize}px` }}>{student}</h2>
    <div className="certificate-student-line" aria-hidden="true" />
    {tx("bridge") && <p className="certificate-bridge">{tx("bridge")}</p>}
    <h3 className="certificate-course" style={{ fontSize: `${courseSize}px` }}>{course}</h3>
    {on.showHours && Number(p.totalHours) > 0 && <p className="certificate-hours">{tx("hoursPrefix")} <strong>{hours}</strong> {tx("hoursLabel")}</p>}
    <div className="certificate-date">{on.showDate && <><div className="certificate-line-value">{date}</div><span>{tx("dateLabel")}</span></>}</div>
    <div className="certificate-signature">{on.showSignature && <><div className="certificate-line-value"><span>{p.signerName || tx("signerName")}</span>{signature && <img src={signature} alt="" />}</div><span>{p.signerTitle || tx("signerTitle")}</span></>}</div>
    {on.showFrame && <div className="certificate-seal-wrap"><CertificateSeal logo={logo} /></div>}
    {on.showQr && <div className="certificate-verification">{qr && <div className="certificate-qr"><img src={qr} alt={tx("verifyTitle")} /></div>}<div className="certificate-verify-text">{tx("verifyTitle")}<br />{tx("verifyHint")}<bdi>{p.certificateId.length > 20 ? p.certificateId.slice(0, 8).toUpperCase() : p.certificateId}</bdi></div></div>}
  </article>;
}

/** Signed URL for a course's trainer signature image (private bucket); undefined when none is set or it cannot be read. */
export function useSignatureUrl(path?: string) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    setUrl(undefined);
    if (!path) return;
    supabase.storage.from("course-files").createSignedUrl(path, 3600).then(({ data }) => { if (!cancelled && data?.signedUrl) setUrl(data.signedUrl); });
    return () => { cancelled = true; };
  }, [path]);
  return url;
}

export function CertificatePreview({ payload }: { payload: CertificatePayload }) {
  const signature = useSignatureUrl(payload.settings?.signaturePath);
  const { profile } = useSiteProfile();
  const wrapper = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const size = certificateSize(payload.settings?.orientation);
  const [qr, setQr] = useState<string>();
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setScale(entry.contentRect.width / size.width); });
    observer.observe(el);
    return () => observer.disconnect();
  }, [size.width]);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(verificationUrl(payload.certificateId), { width: 240, margin: 0 }).then(url => { if (!cancelled) setQr(url); });
    return () => { cancelled = true; };
  }, [payload.certificateId]);
  return <div ref={wrapper} className="certificate-preview" style={{ aspectRatio: `${size.width}/${size.height}`, maxWidth: size.width }}><div className="certificate-preview-content" style={{ "--certificate-scale": scale } as CSSProperties}><CertificateDocument payload={payload} qr={qr} logo={profile.logo} signature={signature} /></div></div>;
}
