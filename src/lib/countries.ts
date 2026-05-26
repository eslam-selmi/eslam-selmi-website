// Lightweight list of countries with dial codes + flag emojis.
// Used for signup country selector + admin display.

export type Country = {
  code: string;        // ISO-2
  name_ar: string;
  name_en: string;
  dial: string;        // e.g. +20
  flag: string;        // emoji
};

export const COUNTRIES: Country[] = [
  { code: "EG", name_ar: "مصر", name_en: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "SA", name_ar: "السعودية", name_en: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "AE", name_ar: "الإمارات", name_en: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "KW", name_ar: "الكويت", name_en: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "QA", name_ar: "قطر", name_en: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "BH", name_ar: "البحرين", name_en: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "OM", name_ar: "عُمان", name_en: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "JO", name_ar: "الأردن", name_en: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "PS", name_ar: "فلسطين", name_en: "Palestine", dial: "+970", flag: "🇵🇸" },
  { code: "LB", name_ar: "لبنان", name_en: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "SY", name_ar: "سوريا", name_en: "Syria", dial: "+963", flag: "🇸🇾" },
  { code: "IQ", name_ar: "العراق", name_en: "Iraq", dial: "+964", flag: "🇮🇶" },
  { code: "YE", name_ar: "اليمن", name_en: "Yemen", dial: "+967", flag: "🇾🇪" },
  { code: "LY", name_ar: "ليبيا", name_en: "Libya", dial: "+218", flag: "🇱🇾" },
  { code: "TN", name_ar: "تونس", name_en: "Tunisia", dial: "+216", flag: "🇹🇳" },
  { code: "DZ", name_ar: "الجزائر", name_en: "Algeria", dial: "+213", flag: "🇩🇿" },
  { code: "MA", name_ar: "المغرب", name_en: "Morocco", dial: "+212", flag: "🇲🇦" },
  { code: "SD", name_ar: "السودان", name_en: "Sudan", dial: "+249", flag: "🇸🇩" },
  { code: "TR", name_ar: "تركيا", name_en: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "US", name_ar: "الولايات المتحدة", name_en: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name_ar: "المملكة المتحدة", name_en: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "CA", name_ar: "كندا", name_en: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "DE", name_ar: "ألمانيا", name_en: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name_ar: "فرنسا", name_en: "France", dial: "+33", flag: "🇫🇷" },
];

export function findCountry(code?: string | null): Country | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code) ?? null;
}
