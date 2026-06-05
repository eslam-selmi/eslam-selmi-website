// Lightweight list of countries with dial codes + flag emojis + national-number length.
// Used for signup country selector, admin display, and phone validation.

export type Country = {
  code: string;        // ISO-2
  name_ar: string;
  name_en: string;
  dial: string;        // e.g. +20
  flag: string;        // emoji
  /** Expected national subscriber number length (without leading 0, without dial code). */
  nsnLengths: number[];
};

export const COUNTRIES: Country[] = [
  { code: "EG", name_ar: "مصر", name_en: "Egypt", dial: "+20", flag: "🇪🇬", nsnLengths: [10] },
  { code: "SA", name_ar: "السعودية", name_en: "Saudi Arabia", dial: "+966", flag: "🇸🇦", nsnLengths: [9] },
  { code: "AE", name_ar: "الإمارات", name_en: "United Arab Emirates", dial: "+971", flag: "🇦🇪", nsnLengths: [9] },
  { code: "KW", name_ar: "الكويت", name_en: "Kuwait", dial: "+965", flag: "🇰🇼", nsnLengths: [8] },
  { code: "QA", name_ar: "قطر", name_en: "Qatar", dial: "+974", flag: "🇶🇦", nsnLengths: [8] },
  { code: "BH", name_ar: "البحرين", name_en: "Bahrain", dial: "+973", flag: "🇧🇭", nsnLengths: [8] },
  { code: "OM", name_ar: "عُمان", name_en: "Oman", dial: "+968", flag: "🇴🇲", nsnLengths: [8] },
  { code: "JO", name_ar: "الأردن", name_en: "Jordan", dial: "+962", flag: "🇯🇴", nsnLengths: [9] },
  { code: "PS", name_ar: "فلسطين", name_en: "Palestine", dial: "+970", flag: "🇵🇸", nsnLengths: [9] },
  { code: "LB", name_ar: "لبنان", name_en: "Lebanon", dial: "+961", flag: "🇱🇧", nsnLengths: [7, 8] },
  { code: "SY", name_ar: "سوريا", name_en: "Syria", dial: "+963", flag: "🇸🇾", nsnLengths: [9] },
  { code: "IQ", name_ar: "العراق", name_en: "Iraq", dial: "+964", flag: "🇮🇶", nsnLengths: [10] },
  { code: "YE", name_ar: "اليمن", name_en: "Yemen", dial: "+967", flag: "🇾🇪", nsnLengths: [9] },
  { code: "LY", name_ar: "ليبيا", name_en: "Libya", dial: "+218", flag: "🇱🇾", nsnLengths: [9] },
  { code: "TN", name_ar: "تونس", name_en: "Tunisia", dial: "+216", flag: "🇹🇳", nsnLengths: [8] },
  { code: "DZ", name_ar: "الجزائر", name_en: "Algeria", dial: "+213", flag: "🇩🇿", nsnLengths: [9] },
  { code: "MA", name_ar: "المغرب", name_en: "Morocco", dial: "+212", flag: "🇲🇦", nsnLengths: [9] },
  { code: "SD", name_ar: "السودان", name_en: "Sudan", dial: "+249", flag: "🇸🇩", nsnLengths: [9] },
  { code: "TR", name_ar: "تركيا", name_en: "Turkey", dial: "+90", flag: "🇹🇷", nsnLengths: [10] },
  { code: "US", name_ar: "الولايات المتحدة", name_en: "United States", dial: "+1", flag: "🇺🇸", nsnLengths: [10] },
  { code: "GB", name_ar: "المملكة المتحدة", name_en: "United Kingdom", dial: "+44", flag: "🇬🇧", nsnLengths: [10] },
  { code: "CA", name_ar: "كندا", name_en: "Canada", dial: "+1", flag: "🇨🇦", nsnLengths: [10] },
  { code: "DE", name_ar: "ألمانيا", name_en: "Germany", dial: "+49", flag: "🇩🇪", nsnLengths: [10, 11] },
  { code: "FR", name_ar: "فرنسا", name_en: "France", dial: "+33", flag: "🇫🇷", nsnLengths: [9] },
];

export function findCountry(code?: string | null): Country | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

/**
 * Sanitize a raw user-typed phone number for a given country:
 *  - strip non-digits (except a single leading "+")
 *  - strip the country dial-code prefix if present (with or without +)
 *  - strip a single leading 0 (national trunk prefix)
 * Returns the bare national subscriber number (digits only).
 */
export function sanitizeNationalNumber(raw: string, country: Country): string {
  let s = (raw || "").replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  const dialDigits = country.dial.replace(/\D/g, "");
  if (dialDigits && s.startsWith(dialDigits)) s = s.slice(dialDigits.length);
  // Now strip a single leading zero (national trunk).
  s = s.replace(/^0+/, "");
  return s;
}

export function validatePhoneForCountry(
  raw: string,
  country: Country,
): { ok: boolean; nsn: string; e164: string; error?: string; example: string } {
  const nsn = sanitizeNationalNumber(raw, country);
  const exampleLen = country.nsnLengths[0];
  const example = "5" + "1".repeat(Math.max(0, exampleLen - 1));
  if (!nsn) {
    return { ok: false, nsn, e164: "", example, error: "phone_required" };
  }
  if (!country.nsnLengths.includes(nsn.length)) {
    return { ok: false, nsn, e164: "", example, error: "phone_length" };
  }
  return { ok: true, nsn, e164: `${country.dial}${nsn}`, example };
}
