import { supabase } from "@/integrations/supabase/client";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import QRCode from "qrcode";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import { QueryClient } from "@tanstack/react-query";
import { siteProfileOptions } from "@/lib/site-profile";
import { readSiteProfile } from "@/lib/site-profile-data";
import arabicLight from "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-300-normal.woff2?url";
import arabicMedium from "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-500-normal.woff2?url";
import arabicBold from "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2?url";
import latinLight from "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-latin-300-normal.woff2?url";
import latinMedium from "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-latin-500-normal.woff2?url";
import latinBold from "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-latin-600-normal.woff2?url";
import { CertificateDocument, certificateSize, verificationUrl } from "@/components/certificates/CertificateDocument";
import type { CertificatePayload } from "@/components/certificates/CertificateDocument";
export type { CertificatePayload } from "@/components/certificates/CertificateDocument";

const ARABIC_RANGE = "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC";
const LATIN_RANGE = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const fonts = [
  ["IBM Plex Sans Arabic", 300, arabicLight, ARABIC_RANGE, "شهادة إتمام"], ["IBM Plex Sans Arabic", 500, arabicMedium, ARABIC_RANGE, "شهادة إتمام"], ["IBM Plex Sans Arabic", 600, arabicBold, ARABIC_RANGE, "شهادة إتمام"],
  ["IBM Plex Sans Arabic", 300, latinLight, LATIN_RANGE, "Certificate"], ["IBM Plex Sans Arabic", 500, latinMedium, LATIN_RANGE, "Certificate"], ["IBM Plex Sans Arabic", 600, latinBold, LATIN_RANGE, "Certificate"],
] as const;
async function asDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Certificate asset unavailable (${response.status})`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read certificate asset"));
    reader.onerror = () => reject(new Error("Unable to read certificate asset"));
    reader.readAsDataURL(blob);
  });
}
let fontCss: Promise<string> | undefined;
function embeddedFonts() {
  if (!fontCss) fontCss = Promise.all(fonts.map(async ([family, weight, url, range]) => `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(${await asDataUrl(url)}) format('woff2');unicode-range:${range};}`)).then(css => css.join("\n")).catch(error => { fontCss = undefined; throw error; });
  return fontCss;
}

export async function generateCertificatePdf(p: CertificatePayload): Promise<Blob> {
  const host = document.createElement("div");
  host.className = "certificate-export-host";
  const size = certificateSize(p.settings?.orientation);
  const landscape = size.width > size.height;
  host.style.width = `${size.width}px`; host.style.height = `${size.height}px`;
  document.body.appendChild(host);
  const root = createRoot(host);
  const signaturePath = p.settings?.signaturePath;
  try {
    const site = await new QueryClient().fetchQuery(siteProfileOptions);
    const [fontEmbedCSS, logo, signature, qr, courseLogo] = await Promise.all([
      embeddedFonts(), asDataUrl(readSiteProfile(site?.content ?? null).logo), signaturePath ? supabase.storage.from("course-files").createSignedUrl(signaturePath, 300).then(({ data, error }) => { if (error || !data?.signedUrl) throw new Error("Trainer signature image unavailable"); return asDataUrl(data.signedUrl); }) : Promise.resolve(undefined),
      QRCode.toDataURL(verificationUrl(p.certificateId), { errorCorrectionLevel: "M", width: 240, margin: 0 }),
      p.courseLogoUrl ? asDataUrl(p.courseLogoUrl).catch(() => undefined) : Promise.resolve(undefined),
    ]);
    flushSync(() => root.render(<CertificateDocument payload={p} qr={qr} logo={logo} courseLogo={courseLogo} signature={signature} />));
    await Promise.all(fonts.map(([family, weight, , , sample]) => document.fonts.load(`${weight} 24px "${family}"`, sample)));
    await document.fonts.ready;
    await Promise.all(Array.from(host.querySelectorAll("img")).map(img => img.decode()));
    const target = host.firstElementChild;
    if (!(target instanceof HTMLElement)) throw new Error("Certificate layout is unavailable");
    const [{ toPng }, { default: jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
    const image = await toPng(target, { width: size.width, height: size.height, pixelRatio: 1.5, fontEmbedCSS, cacheBust: false });
    const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4", compress: true });
    pdf.setProperties({ title: `${p.lang === "ar" ? "شهادة إتمام" : "Certificate of completion"} — ${p.studentName}`, author: "Eslam Selmi", subject: p.courseTitle });
    const pageW = landscape ? 297 : 210, pageH = landscape ? 210 : 297;
    pdf.addImage(image, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
    if (p.settings?.toggles.showQr !== false) {
      // Link rectangle follows the rendered QR (portrait: 117.2/73.8 mm x, 246 mm y; landscape: bottom corner), 19 mm square.
      const qrBox = host.querySelector(".certificate-qr")?.getBoundingClientRect(), hostBox = target.getBoundingClientRect();
      const mm = pageW / size.width;
      const x = qrBox ? (qrBox.left - hostBox.left) * mm : landscape ? (p.lang === "ar" ? 265 : 15) : p.lang === "ar" ? 117.2 : 73.8;
      const y = qrBox ? (qrBox.top - hostBox.top) * mm : landscape ? 172 : 246;
      pdf.link(x, y, 19, 19, { url: verificationUrl(p.certificateId) });
    }
    return pdf.output("blob");
  } catch (error) {
    throw new Error(`Certificate render failed (${p.lang}): ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    root.unmount();
    host.remove();
  }
}
