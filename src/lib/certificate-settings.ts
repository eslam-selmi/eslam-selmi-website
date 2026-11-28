export const CERT_TEXT_FIELDS = [
  ["brandName", "اسم الجهة", "إسلام سلمي", "ESLAM SELMI"],
  ["brandTagline", "وصف الجهة", "التدريب والتطوير", "TRAINING & DEVELOPMENT"],
    ["title", "العنوان الرئيسي", "شهادة إتمام", "Certificate of Completion"],
  ["subtitle", "العنوان الفرعي", "CERTIFICATE OF COMPLETION", "TRAINING PROGRAMME"],
  ["intro", "جملة التقديم (فارغ = بدون جملة)", "تُوثّق هذه الشهادة إتمام", "This is to certify that"],
  ["bridge", "جملة الإتمام (فارغ = بدون جملة)", "للبرنامج التدريبي بنجاح", "has successfully completed the training programme"],
  ["courseTitle", "اسم البرنامج على الشهادة (فارغ = اسم الكورس)", "", ""],
  ["hoursPrefix", "كلمة قبل الساعات", "بواقع", "A total of"],
  ["hoursLabel", "وصف الساعات", "ساعة تدريبية", "training hours"],
  ["dateLabel", "عنوان التاريخ", "تاريخ الإصدار", "Date of issue"],
  ["website", "الموقع الإلكتروني", "eslam-selmi.com", "eslam-selmi.com"],
  ["signatureMark", "التوقيع", "Eslam Selmi", "Eslam Selmi"],
  ["signerName", "اسم الموقّع", "إسلام سلمي", "Eslam Selmi"],
  ["signerTitle", "صفة الموقّع", "المدرب", "Trainer"],
  ["verifyTitle", "عنوان التحقق", "للتحقق من صحة الشهادة", "Scan to verify"],
  ["verifyHint", "وصف التحقق", "امسح الرمز", "this certificate"],
] as const;

export type CertTextKey = (typeof CERT_TEXT_FIELDS)[number][0];
export type CertTexts = Record<CertTextKey, string>;
export const CERT_TOGGLES = [
  ["showBrand", "الشعار"], ["showSpine", "الشريطان العلوي والسفلي"], ["showLines", "العلامة المائية"],
  ["showFrame", "الختم"], ["showHours", "عدد الساعات"], ["showPartner", "شعار الكورس"],
  ["showDate", "التاريخ"], ["showSignature", "التوقيع"], ["showQr", "رمز التحقق"],
] as const;
export type CertToggleKey = (typeof CERT_TOGGLES)[number][0];

export type CertificateSettings = {
  ar: Partial<CertTexts>; en: Partial<CertTexts>;
  colors: { paper: string; ink: string; accent: string; line: string };
  toggles: Record<CertToggleKey, boolean>;
  titleScale: number; nameScale: number;
  /** Storage path (course-files bucket) of this course's trainer signature image; empty = no signature drawn. */
  signaturePath: string;
  /** Page format used for every certificate issued for the course. */
  orientation: "portrait" | "landscape";
};

export const defaultCertificateSettings: CertificateSettings = {
  ar: {}, en: {},
  colors: { paper: "#f4f5f2", ink: "#0a1f4d", accent: "#19b9b5", line: "#c6d3dc" },
  toggles: { showBrand: true, showSpine: true, showLines: true, showFrame: true, showHours: true, showPartner: true, showDate: true, showSignature: true, showQr: true },
  titleScale: 100, nameScale: 100, signaturePath: "", orientation: "portrait",
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

export function readCertificateSettings(raw: unknown): CertificateSettings {
  const d = defaultCertificateSettings;
  if (!isObj(raw)) return structuredClone(d);
  const texts = (v: unknown) => Object.fromEntries(Object.entries(isObj(v) ? v : {}).filter(([, x]) => typeof x === "string")) as Partial<CertTexts>;
  const colors = isObj(raw.colors) ? raw.colors : {};
  const toggles = isObj(raw.toggles) ? raw.toggles : {};
  const num = (v: unknown, f: number) => (typeof v === "number" && v >= 60 && v <= 150 ? v : f);
  return {
    ar: texts(raw.ar), en: texts(raw.en),
    colors: Object.fromEntries(Object.entries(d.colors).map(([k, f]) => [k, typeof colors[k] === "string" && /^#[0-9a-f]{6}$/i.test(colors[k] as string) ? colors[k] : f])) as CertificateSettings["colors"],
    toggles: Object.fromEntries(Object.entries(d.toggles).map(([k, f]) => [k, typeof toggles[k] === "boolean" ? toggles[k] : f])) as CertificateSettings["toggles"],
    titleScale: num(raw.titleScale, 100), nameScale: num(raw.nameScale, 100),
    orientation: raw.orientation === "landscape" ? "landscape" : "portrait",
    signaturePath: typeof raw.signaturePath === "string" && raw.signaturePath.length <= 300 && !raw.signaturePath.includes("..") ? raw.signaturePath : "",
  };
}

/** Resolved text for a language: custom value if non-empty, else default. */
export function certText(s: CertificateSettings | undefined, lang: "ar" | "en", key: CertTextKey): string {
  const v = s?.[lang]?.[key]?.trim();
  if (v) return v;
  const f = CERT_TEXT_FIELDS.find((x) => x[0] === key)!;
  return lang === "ar" ? f[2] : f[3];
}
