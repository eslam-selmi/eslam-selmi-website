import { supabase } from "@/integrations/supabase/client";

/** Extra questions a visitor answers while booking a consultation. Stored as one site_content row (no schema change);
 *  answers are written into the existing consultation_slots.details text under a marker line. */
export const BOOKING_QUESTIONS_KEY = "site.booking_questions";
export const QA_MARKER = "[[أسئلة الحجز]]";
export const MAX_QUESTIONS = 12;

export type BookingQuestion = {
  id: string;
  label_ar: string;
  label_en: string;
  required: boolean;
  options: string[]; // empty = free text, otherwise single choice
};

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function parseBookingQuestions(content: unknown): BookingQuestion[] {
  const list = content && typeof content === "object" ? (content as { questions?: unknown }).questions : null;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: BookingQuestion[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const id = clean(r.id, 40);
    const label_ar = clean(r.label_ar, 200);
    const label_en = clean(r.label_en, 200);
    if (!id || seen.has(id) || (!label_ar && !label_en)) continue;
    seen.add(id);
    const options = Array.isArray(r.options) ? [...new Set(r.options.map((o) => clean(o, 80)).filter(Boolean))].slice(0, 10) : [];
    out.push({ id, label_ar: label_ar || label_en, label_en: label_en || label_ar, required: r.required === true, options });
    if (out.length >= MAX_QUESTIONS) break;
  }
  return out;
}

export async function fetchBookingQuestions(): Promise<BookingQuestion[]> {
  const { data } = await supabase.from("site_content").select("content").eq("section_key", BOOKING_QUESTIONS_KEY).maybeSingle();
  return parseBookingQuestions((data as { content?: unknown } | null)?.content);
}

export async function saveBookingQuestions(questions: BookingQuestion[]): Promise<void> {
  const content = { questions: parseBookingQuestions({ questions }) };
  const { data, error: readError } = await supabase.from("site_content").select("id").eq("section_key", BOOKING_QUESTIONS_KEY).maybeSingle();
  if (readError) throw readError;
  const res = data?.id
    ? await supabase.from("site_content").update({ content, is_visible: true }).eq("id", data.id)
    : await supabase.from("site_content").insert({ section_key: BOOKING_QUESTIONS_KEY, label: "أسئلة حجز الاستشارات", content, is_visible: true });
  if (res.error) throw res.error;
}

/** Returns the first problem as a question to flag, or null when the answers are acceptable. */
export function firstMissingAnswer(questions: BookingQuestion[], answers: Record<string, string>): BookingQuestion | null {
  for (const q of questions) {
    const a = (answers[q.id] ?? "").trim();
    if (q.required && !a) return q;
    if (a && q.options.length > 0 && !q.options.includes(a)) return q;
  }
  return null;
}

/** Text block appended to the booking details. Empty when there is nothing to record. */
export function encodeAnswers(questions: BookingQuestion[], answers: Record<string, string>, lang: "ar" | "en"): string {
  const lines = questions
    .map((q) => ({ q: lang === "ar" ? q.label_ar : q.label_en, a: (answers[q.id] ?? "").replace(/\s+/g, " ").trim().slice(0, 300) }))
    .filter((x) => x.a)
    .map((x) => `• ${x.q}: ${x.a}`);
  return lines.length ? `\n\n${QA_MARKER}\n${lines.join("\n")}` : "";
}

/** Splits stored details into the visitor's own text and the recorded Q and A lines. */
export function splitDetails(details: string | null | undefined): { text: string; qa: { q: string; a: string }[]; tail: string } {
  const raw = details ?? "";
  const i = raw.indexOf(QA_MARKER);
  if (i < 0) return { text: raw, qa: [], tail: "" };
  const text = raw.slice(0, i).trimEnd();
  const rest = raw.slice(i + QA_MARKER.length).replace(/^\n/, "");
  const lines = rest.split("\n");
  const qa: { q: string; a: string }[] = [];
  const tailLines: string[] = [];
  for (const l of lines) {
    const m = /^• (.+?): (.*)$/.exec(l);
    if (m) qa.push({ q: m[1], a: m[2] }); else if (l.trim()) tailLines.push(l);
  }
  return { text, qa, tail: tailLines.join("\n") };
}
