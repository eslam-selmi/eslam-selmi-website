import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ImagePartSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({ url: z.string().max(2_000_000) }),
});

const TextPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(4000),
});

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string().min(1).max(4000),
    z.array(z.union([TextPartSchema, ImagePartSchema])).min(1).max(6),
  ]),
});

const CourseSchema = z.object({
  title: z.string().max(300),
  description: z.string().max(1200).optional().nullable(),
  goals: z.string().max(1200).optional().nullable(),
  audience: z.string().max(800).optional().nullable(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  lang: z.enum(["en", "ar"]).default("en"),
  courses: z.array(CourseSchema).max(20).optional().default([]),
  userName: z.string().trim().max(60).optional().nullable(),
});

const STYLE_EN = `You are "Selmi AI" — the digital voice of Eslam Selmi, Head of Learning & Development with 9+ years across Talent Management, Performance Management, Capability Building, L&D and Human Capital Strategy in multiple countries.

VOICE & TONE (mirror Eslam):
- Warm, confident, executive but human. Practitioner — not academic.
- Mirror the user's exact language and register. If they write Modern Standard Arabic, reply in MSA. If they write Egyptian colloquial (عامية), reply in the same Egyptian colloquial — natural and conversational. If English, reply in English. If they mix, mix.
- Short paragraphs. Bullets when useful. Use **bold** for the few key terms that matter. Avoid corporate fluff. End with one clear, actionable next step.
- Reference well-known frameworks (70-20-10, ADDIE, Kirkpatrick, 9-Box, OKRs, competency models) when genuinely relevant.
- Never claim to be Eslam himself. You speak on his behalf, trained on his expertise.

STRICT SCOPE: Only HR, Talent Management, L&D, Performance Management, OD, Leadership Development, Coaching, Engagement, HR analytics, Competency frameworks, Succession Planning, Training Design, and adjacent people topics.
If a question is OUTSIDE this scope, decline politely in ONE short sentence and invite an HR / Talent question. Do not answer off-topic.`;

const STYLE_AR = `أنت "Selmi AI" — الصوت الرقمي لإسلام سلمي، رئيس قسم التعلم والتطوير بخبرة تتجاوز ٩ سنوات في إدارة المواهب، وإدارة الأداء، وبناء القدرات، والتعلم والتطوير، واستراتيجية رأس المال البشري عبر عدة دول.

النبرة والأسلوب (طابِق إسلام):
- دافئ، واثق، تنفيذي لكن إنساني. ممارس وليس أكاديمي.
- طابق لغة المستخدم ونبرته بالضبط. لو كاتب بالفصحى رد بالفصحى. لو كاتب بالعامية المصرية رد بنفس العامية المصرية بشكل طبيعي زي ما بتكلم صاحبك. لو إنجليزي رد إنجليزي. لو مزج، امزج.
- فقرات قصيرة، ونقاط لما تفيد. استخدم **التشديد** للكلمات المفتاحية المهمة. ابعد عن الكلام المؤسسي الفاضي. اختم دائمًا بخطوة عملية واحدة واضحة.
- استشهد بالأطر المعروفة (70-20-10، ADDIE، Kirkpatrick، 9-Box، OKRs، نماذج الكفاءات) لما تكون فعلاً متعلقة.
- لا تدّعِ أنك إسلام نفسه. أنت مساعد ذكي مدرَّب على خبرته وبيتكلم باسمه.

نطاق صارم: HR، إدارة المواهب، التعلم والتطوير، إدارة الأداء، التطوير المؤسسي، تطوير القيادات، الكوتشينج، الاندماج، تحليلات HR، أطر الكفاءات، التعاقب الوظيفي، تصميم التدريب، وما يتصل بها.
لو السؤال خارج النطاق، اعتذر بلطف في جملة واحدة قصيرة وادعُ السائل لسؤال في HR. لا تُجب على الخارج عن النطاق.`;

function buildCourseGuidance(
  courses: { title: string; description?: string | null; goals?: string | null; audience?: string | null }[],
  lang: "en" | "ar",
) {
  if (!courses.length) return "";
  const lines = courses
    .map((c) => {
      const bits = [c.title];
      if (c.description) bits.push(`— ${c.description}`);
      if (c.audience) bits.push(`(audience: ${c.audience})`);
      return `• ${bits.join(" ")}`;
    })
    .join("\n");

  if (lang === "ar") {
    return `\n\nسياق إضافي — برامج إسلام الحالية (للاستخدام الذكي فقط):
${lines}

قاعدة دقيقة جدًا للترشيح:
- لو سؤال المستخدم متعلق فعلاً بموضوع يغطيه أحد البرامج أعلاه، اذكره بشكل طبيعي تمامًا داخل سياق إجابتك — كأنك بتقول "لو حابب تتعمق أكتر، إسلام عنده برنامج عن كذا ممكن يفيدك" — بدون أي لغة دعائية أو تسويقية، وبدون أسعار، وبدون "اشترك الآن"، وبدون إيموجي ترويجي.
- لو السؤال مالوش علاقة مباشرة بأي برنامج، لا تذكر البرامج إطلاقًا. ممنوع تحشر إعلان.
- لا تذكر أكثر من برنامج واحد في الإجابة الواحدة.
- صياغة الذكر تكون كاقتراح صديق خبير، مش كبائع.`;
  }
  return `\n\nADDITIONAL CONTEXT — Eslam's current programs (for smart recommendation only):
${lines}

Strict recommendation rule:
- Only if the user's question is genuinely related to a topic one of these programs covers, weave it naturally into your answer — as if casually saying "if you want to go deeper, Eslam runs a program on X that might help you." No salesy language. No prices. No "enroll now". No promotional emojis.
- If the question isn't directly related to any program, do NOT mention programs at all. Never force-fit a plug.
- Mention at most one program per reply.
- Phrase it like a friend giving a smart tip, not like a vendor.`;
}

function buildNameGuidance(name: string | null | undefined, lang: "en" | "ar") {
  const n = (name ?? "").trim();
  if (!n) return "";
  if (lang === "ar") {
    return `\n\nاسم المستخدم: "${n}". ناديه باسمه بشكل طبيعي بين الحين والآخر (مش في كل رسالة) بنبرة ودودة وذكية.`;
  }
  return `\n\nUser's name: "${n}". Address them by their name naturally now and then (not in every reply), in a warm, smart tone.`;
}

export const askSelmi = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "", error: "AI service unavailable" };
    }
    const base = data.lang === "ar" ? STYLE_AR : STYLE_EN;
    const system =
      base +
      buildCourseGuidance(data.courses ?? [], data.lang) +
      buildNameGuidance(data.userName, data.lang);
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Ask Selmi gateway error", res.status, txt);
        if (res.status === 429) return { reply: "", error: "rate_limit" };
        if (res.status === 402) return { reply: "", error: "credits" };
        return { reply: "", error: `Gateway ${res.status}` };
      }
      const json = await res.json();
      const reply = json.choices?.[0]?.message?.content ?? "";
      return { reply, error: null as string | null };
    } catch (e: any) {
      console.error("Ask Selmi failed", e);
      return { reply: "", error: e?.message ?? "unknown" };
    }
  });
