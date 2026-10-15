import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import { useSiteProfile } from "@/lib/site-profile";
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
};
export const CERTIFICATE_WIDTH = 1600;
export const CERTIFICATE_HEIGHT = 1131;
export const verificationUrl = (id: string) => `https://eslam-selmi.com/verify/${encodeURIComponent(id)}`;

export function CertificateDocument({ payload: p, qr, logo = brandLogoAsset.url, courseLogo }: {
  payload: CertificatePayload; qr?: string; logo?: string; courseLogo?: string;
}) {
  const ar = p.lang === "ar";
  const date = p.issueDate.toLocaleDateString(ar ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  return <article className={`certificate-sheet ${ar ? "certificate-ar" : "certificate-en"}`} dir={ar ? "rtl" : "ltr"} aria-label={ar ? "شهادة إتمام التدريب" : "Certificate of completion"}>
    <div className="certificate-spine" aria-hidden="true"><span>ESLAM SELMI</span><span>TRAINING & DEVELOPMENT</span></div>
    <svg className="certificate-lines" viewBox="0 0 1600 1131" aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => <path key={i} d={`M${1110+i*19} 0 Q${880+i*21} 180 ${1200+i*16} 360 T${1440+i*12} 1131`} fill="none" stroke="currentColor" strokeWidth="1" />)}
    </svg>
    <div className="certificate-inner-frame" aria-hidden="true" />
    <header className="certificate-header">
      <div className="certificate-brand"><img src={logo} alt="" /><div><strong>{ar ? "إسلام سلمي" : "ESLAM SELMI"}</strong><span>{ar ? "التدريب والتطوير" : "TRAINING & DEVELOPMENT"}</span></div></div>
      <div className="certificate-number"><span>{ar ? "رقم الشهادة" : "CREDENTIAL ID"}</span><b dir="ltr">{p.certificateId}</b></div>
    </header>
    <main className="certificate-main">
      <p className="certificate-eyebrow">{ar ? "تقديرٌ للإنجاز · استثمارٌ في المستقبل" : "RECOGNISING ACHIEVEMENT"}</p>
      <h1>{ar ? "شهادة إتمام" : "CERTIFICATE"}</h1>
      <p className="certificate-subtitle">{ar ? "برنامج تدريبي" : "OF COMPLETION"}</p>
      <div className="certificate-rule" />
      <p className="certificate-intro">{ar ? "تُمنح هذه الشهادة إلى" : "THIS CERTIFICATE IS AWARDED TO"}</p>
      <h2 className="certificate-student">{p.studentName.replace(/"/g, "")}</h2>
      <p className="certificate-bridge">{ar ? "لإتمام البرنامج التدريبي بنجاح" : "For successfully completing the training programme"}</p>
      <h3 className="certificate-course">{p.courseTitle}</h3>
      {Number(p.totalHours) > 0 && <p className="certificate-hours"><strong>{p.totalHours}</strong><span>{ar ? "ساعة تدريبية" : "TRAINING HOURS"}</span></p>}
      {p.courseBrandName && <div className="certificate-partner">{courseLogo && <img src={courseLogo} alt="" />}<span>{p.courseBrandName}</span></div>}
    </main>
    <footer className="certificate-footer">
      <div className="certificate-date"><span>{ar ? "تاريخ الإصدار" : "DATE OF ISSUE"}</span><strong>{date}</strong><p>eslam-selmi.com</p></div>
      <div className="certificate-signature"><div className="certificate-signature-mark">Eslam Selmi</div><strong>{p.signerName || (ar ? "م. إسلام سلمي" : "Eng. Eslam Selmi")}</strong><span>{p.signerTitle || (ar ? "المؤسس والمدرب" : "Founder & Trainer")}</span></div>
      <div className="certificate-verification">{qr && <img src={qr} alt={ar ? "رمز التحقق من الشهادة" : "Certificate verification QR code"} />}<div><strong>{ar ? "التحقق من الشهادة" : "VERIFY CREDENTIAL"}</strong><span>{ar ? "امسح الرمز للتحقق من الأصالة" : "Scan to verify authenticity"}</span></div></div>
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
