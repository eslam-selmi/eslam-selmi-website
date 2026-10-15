export const CERT_TEXT_FIELDS = [
  ["brandName", "اسم الجهة", "إسلام سلمي", "ESLAM SELMI"],
  ["brandTagline", "وصف الجهة", "التدريب والتطوير", "TRAINING & DEVELOPMENT"],
  ["eyebrow", "السطر العلوي", "تقديرٌ للإنجاز · استثمارٌ في المستقبل", "RECOGNISING ACHIEVEMENT"],
  ["title", "العنوان الرئيسي", "شهادة إتمام", "CERTIFICATE"],
  ["subtitle", "العنوان الفرعي", "برنامج تدريبي", "OF COMPLETION"],
  ["intro", "جملة التقديم", "تُمنح هذه الشهادة إلى", "THIS CERTIFICATE IS AWARDED TO"],
  ["bridge", "جملة الإتمام", "لإتمام البرنامج التدريبي بنجاح", "For successfully completing the training programme"],
  ["courseTitle", "اسم البرنامج على الشهادة (فارغ = اسم الكورس)", "", ""],
  ["hoursLabel", "وصف الساعات", "ساعة تدريبية", "TRAINING HOURS"],
  ["dateLabel", "عنوان التاريخ", "تاريخ الإصدار", "DATE OF ISSUE"],
  ["website", "الموقع الإلكتروني", "eslam-selmi.com", "eslam-selmi.com"],
  ["signatureMark", "التوقيع", "Eslam Selmi", "Eslam Selmi"],
  ["signerName", "اسم الموقّع", "م. إسلام سلمي", "Eng. Eslam Selmi"],
  ["signerTitle", "صفة الموقّع", "المؤسس والمدرب", "Founder & Trainer"],
  ["verifyTitle", "عنوان التحقق", "التحقق من الشهادة", "VERIFY CREDENTIAL"],
  ["verifyHint", "وصف التحقق", "امسح الرمز للتحقق من الأصالة", "Scan to verify authenticity"],
] as const;

export type CertTextKey = (typeof CERT_TEXT_FIELDS)[number][0];
export type CertTexts = Record<CertTextKey, string>;
export const CERT_TOGGLES = [
  ["showBrand", "الشعار واسم الجهة"], ["showSpine", "الشريط الجانبي"], ["showLines", "الخطوط الزخرفية"],
  ["showFrame", "الإطار"], ["showHours", "عدد الساعات"], ["showPartner", "شعار الكورس"],
  ["showDate", "التاريخ"], ["showSignature", "التوقيع"], ["showQr", "رمز التحقق"],
] as const;
export type CertToggleKey = (typeof CERT_TOGGLES)[number][0];

export type CertificateSettings = {
  ar: Partial<CertTexts>; en: Partial<CertTexts>;
  colors: { paper: string; ink: string; accent: string; line: string };
  toggles: Record<CertToggleKey, boolean>;
  titleScale: number; nameScale: number;
};

export const defaultCertificateSettings: CertificateSettings = {
  ar: {}, en: {},
  colors: { paper: "#fcfdfe", ink: "#16244a", accent: "#1f7f9a", line: "#c6d3dc" },
  toggles: { showBrand: true, showSpine: true, showLines: true, showFrame: true, showHours: true, showPartner: true, showDate: true, showSignature: true, showQr: true },
  titleScale: 100, nameScale: 100,
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
  };
}

/** Resolved text for a language: custom value if non-empty, else default. */
export function certText(s: CertificateSettings | undefined, lang: "ar" | "en", key: CertTextKey): string {
  const v = s?.[lang]?.[key]?.trim();
  if (v) return v;
  const f = CERT_TEXT_FIELDS.find((x) => x[0] === key)!;
  return lang === "ar" ? f[2] : f[3];
}
