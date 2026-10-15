import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import QRCode from "qrcode";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import { QueryClient } from "@tanstack/react-query";
import { siteProfileOptions } from "@/lib/site-profile";
import { readSiteProfile } from "@/lib/site-profile-data";
import arabicRegular from "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2?url";
import arabicBold from "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-600-normal.woff2?url";
import bodyRegular from "@fontsource/manrope/files/manrope-latin-400-normal.woff2?url";
import bodyBold from "@fontsource/manrope/files/manrope-latin-600-normal.woff2?url";
import bodyHeavy from "@fontsource/manrope/files/manrope-latin-800-normal.woff2?url";
import headingRegular from "@fontsource/sora/files/sora-latin-600-normal.woff2?url";
import headingBold from "@fontsource/sora/files/sora-latin-700-normal.woff2?url";
import { CertificateDocument, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT, verificationUrl } from "@/components/certificates/CertificateDocument";
import type { CertificatePayload } from "@/components/certificates/CertificateDocument";
export type { CertificatePayload } from "@/components/certificates/CertificateDocument";

const fonts = [
  ["IBM Plex Sans Arabic", 400, arabicRegular], ["IBM Plex Sans Arabic", 600, arabicBold],
  ["Manrope", 400, bodyRegular], ["Manrope", 600, bodyBold], ["Manrope", 800, bodyHeavy],
  ["Sora", 600, headingRegular], ["Sora", 700, headingBold],
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
  if (!fontCss) fontCss = Promise.all(fonts.map(async ([family, weight, url]) => `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(${await asDataUrl(url)}) format('woff2');}`)).then(css => css.join("\n")).catch(error => { fontCss = undefined; throw error; });
  return fontCss;
}

export async function generateCertificatePdf(p: CertificatePayload): Promise<Blob> {
  const host = document.createElement("div");
  host.className = "certificate-export-host";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const site = await new QueryClient().fetchQuery(siteProfileOptions);
    const [fontEmbedCSS, logo, qr, courseLogo] = await Promise.all([
      embeddedFonts(), asDataUrl(readSiteProfile(site?.content ?? null).logo),
      QRCode.toDataURL(verificationUrl(p.certificateId), { errorCorrectionLevel: "M", width: 240, margin: 0 }),
      p.courseLogoUrl ? asDataUrl(p.courseLogoUrl).catch(() => undefined) : Promise.resolve(undefined),
    ]);
    flushSync(() => root.render(<CertificateDocument payload={p} qr={qr} logo={logo} courseLogo={courseLogo} />));
    await Promise.all(fonts.map(([family, weight]) => document.fonts.load(`${weight} 24px "${family}"`, family === "IBM Plex Sans Arabic" ? "شهادة إتمام" : "Certificate")));
    await document.fonts.ready;
    await Promise.all(Array.from(host.querySelectorAll("img")).map(img => img.decode()));
    const target = host.firstElementChild;
    if (!(target instanceof HTMLElement)) throw new Error("Certificate layout is unavailable");
    const [{ toPng }, { default: jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
    const image = await toPng(target, { width: CERTIFICATE_WIDTH, height: CERTIFICATE_HEIGHT, pixelRatio: 1.5, fontEmbedCSS, cacheBust: false });
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
    pdf.setProperties({ title: `${p.lang === "ar" ? "شهادة إتمام" : "Certificate of completion"} — ${p.studentName}`, author: "Eslam Selmi", subject: p.courseTitle });
    pdf.addImage(image, "PNG", 0, 0, 297, 210, undefined, "FAST");
    pdf.link(p.lang === "ar" ? 20 : 235, 162, 52, 38, { url: verificationUrl(p.certificateId) });
    return pdf.output("blob");
  } catch (error) {
    throw new Error(`Certificate render failed (${p.lang}): ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    root.unmount();
    host.remove();
  }
}
