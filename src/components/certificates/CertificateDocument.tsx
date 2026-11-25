import { useEffect, useRef, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import { supabase } from "@/integrations/supabase/client";
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
export const CERTIFICATE_WIDTH = 794;
export const CERTIFICATE_HEIGHT = 1123;
export const verificationUrl = (id: string) => `https://eslam-selmi.com/verify/${encodeURIComponent(id)}`;

// Fine contour lines behind the content (same curve family as the approved design).
const CONTOUR_PATHS = Array.from({ length: 70 }, (_, i) => {
  const y0 = i * 17 - 40;
  let d = `M-10 ${y0}`;
  for (let x = -10; x < 810; x += 20) d += `L${x} ${(y0 + 38 * Math.sin(x / 130 + i * 0.09) + 14 * Math.sin(x / 47 + i * 0.2) + x * 0.12).toFixed(1)}`;
  return d;
});

export function CertificateDocument({ payload: p, qr, logo = brandLogoAsset.url, courseLogo, signature }: {
  payload: CertificatePayload; qr?: string; logo?: string; courseLogo?: string; signature?: string;
}) {
  const ar = p.lang === "ar";
  const s = p.settings ?? defaultCertificateSettings;
  const tx = (k: CertTextKey) => certText(s, p.lang, k);
  const on = s.toggles;
  const date = p.issueDate.toLocaleDateString(ar ? "ar-EG-u-nu-latn" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  const style = { "--certificate-paper": s.colors.paper, "--certificate-ink": s.colors.ink, "--certificate-accent": s.colors.accent, "--certificate-line": s.colors.line } as CSSProperties;
  const student = p.studentName.replace(/"/g, "");
  const nameSize = (student.length < 24 ? 66 : student.length < 40 ? 42 : 34) * s.nameScale / 100;
  return <article className={`certificate-sheet ${ar ? "certificate-ar" : "certificate-en"}`} style={style} dir={ar ? "rtl" : "ltr"} aria-label={tx("title")}>
    {on.showLines && <svg className="certificate-lines" viewBox="0 0 794 1123" aria-hidden="true">{CONTOUR_PATHS.map((d, i) => <path key={i} d={d} />)}</svg>}
    <div className="certificate-top-band" aria-hidden="true" />
    {on.showFrame && <div className="certificate-inner-frame" aria-hidden="true" />}
    {on.showBrand && <img className="certificate-watermark" src={logo} alt="" aria-hidden="true" />}
    {on.showBrand && <img className="certificate-logo" src={logo} alt="" />}
    <main className="certificate-main">
      <h1 style={{ fontSize: `${(ar ? 48 : 36) * s.titleScale / 100}px` }}>{tx("title")}</h1>
      <p className="certificate-subtitle">{tx("subtitle")}</p>
      <p className="certificate-intro">{tx("intro")}</p>
      <h2 className="certificate-student" style={{ fontSize: `${nameSize}px` }}>{student}</h2>
      <p className="certificate-bridge">{tx("bridge")}</p>
      <h3 className="certificate-course">{s[p.lang].courseTitle?.trim() || p.courseTitle}</h3>
      {on.showHours && Number(p.totalHours) > 0 && <p className="certificate-hours"><strong>{p.totalHours}</strong><span>{tx("hoursLabel")}</span></p>}
      {on.showPartner && p.courseBrandName && <div className="certificate-partner">{courseLogo && <img src={courseLogo} alt="" />}<span>{p.courseBrandName}</span></div>}
    </main>
    <footer className="certificate-footer">
      <div className="certificate-date">{on.showDate && <><div className="certificate-line-value">{date}</div><span>{tx("dateLabel")}</span></>}</div>
      <div className="certificate-signature">{on.showSignature && <><div className="certificate-line-value"><span>{p.signerName || tx("signerName")}</span>{signature && <img src={signature} alt="" />}</div><span>{p.signerTitle || tx("signerTitle")}</span></>}</div>
      <div className="certificate-verification">{on.showQr && <>{qr && <img src={qr} alt={tx("verifyTitle")} />}<strong>{tx("verifyTitle")}</strong><span>{tx("verifyHint")}</span></>}</div>
    </footer>
    <div className="certificate-issuer">{tx("brandName")} &nbsp;·&nbsp; {tx("brandTagline")}{tx("website") ? <> &nbsp;·&nbsp; <bdi>{tx("website")}</bdi></> : null}</div>
    {on.showSpine && <><div className="certificate-bottom-accent" aria-hidden="true" /><div className="certificate-bottom-band" aria-hidden="true" /></>}
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
  return <div ref={wrapper} className="certificate-preview"><div className="certificate-preview-content" style={{ transform: `scale(${scale})` }}><CertificateDocument payload={payload} qr={qr} logo={profile.logo} signature={signature} /></div></div>;
}
