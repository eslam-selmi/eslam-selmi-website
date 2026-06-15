import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Send, MessageSquare, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { askSelmi } from "@/lib/ask-selmi.functions";
import { supabase } from "@/integrations/supabase/client";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";

export const Route = createFileRoute("/ask-selmi")({
  head: () => ({
    meta: [
      { title: "Ask Selmi — AI Advisor on HR & Talent Management" },
      {
        name: "description",
        content:
          "Chat with Selmi AI — an expert advisor on Human Resources, Talent Management, Learning & Development, and Performance.",
      },
      { property: "og:title", content: "Ask Selmi — HR & Talent Management AI" },
      {
        property: "og:description",
        content: "Get executive-grade answers on HR, L&D and Talent Management.",
      },
    ],
  }),
  component: AskSelmiPage,
});

type Msg = { role: "user" | "assistant"; content: string };
type CourseCtx = { title: string; description?: string | null; goals?: string | null; audience?: string | null };

function AskSelmiPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const brandLogo = brandLogoAsset.url;

  const suggestionsEn = [
    "How do I design a high-impact L&D strategy from scratch?",
    "What's the best way to identify high-potential talent (HiPos)?",
    "How do I make performance reviews actually drive performance?",
    "Build a competency framework for a mid-size company — where do I start?",
    "How do I measure training ROI beyond happy-sheets?",
  ];
  const suggestionsAr = [
    "إزاي أصمم استراتيجية تعلم وتطوير قوية من الصفر؟",
    "إيه أحسن طريقة أحدد بيها المواهب الواعدة (HiPos)؟",
    "إزاي أخلي تقييمات الأداء فعلاً تفرق؟",
    "عايز أبني إطار كفاءات لشركة متوسطة — أبدأ منين؟",
    "إزاي أقيس عائد التدريب بشكل احترافي؟",
  ];
  const suggestions = isAr ? suggestionsAr : suggestionsEn;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseCtx[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("title, description, course_goals, target_audience")
        .eq("active", true)
        .eq("is_archived", false);
      if (!data) return;
      const mapped: CourseCtx[] = data.map((c: any) => ({
        title: String(c.title ?? "").slice(0, 300),
        description: c.description ? String(c.description).slice(0, 1200) : null,
        goals: c.course_goals ? String(c.course_goals).slice(0, 1200) : null,
        audience: c.target_audience ? String(c.target_audience).slice(0, 800) : null,
      }));
      setCourses(mapped);
    })();
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await askSelmi({ data: { messages: next, lang, courses } });
      if (res.error) {
        const msg =
          res.error === "rate_limit"
            ? isAr
              ? "في زحمة شوية على الخدمة، جرب تاني بعد دقيقة."
              : "Rate limit reached. Please try again shortly."
            : res.error === "credits"
              ? isAr
                ? "نفدت أرصدة الذكاء الاصطناعي. يرجى التواصل مع المدير."
                : "AI credits exhausted. Please contact the administrator."
              : isAr
                ? "حصل خطأ، حاول تاني."
                : "Something went wrong. Please try again.";
        setError(msg);
      } else {
        setMessages([...next, { role: "assistant", content: res.reply || "…" }]);
      }
    } catch {
      setError(isAr ? "تعذّر الاتصال." : "Connection failed.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const reset = () => {
    setMessages([]);
    setError(null);
    setInput("");
    inputRef.current?.focus();
  };

  const hasChat = messages.length > 0;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
    >
      {/* Premium ambient atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 12% 8%, color-mix(in oklab, var(--gold) 22%, transparent), transparent 65%), radial-gradient(45% 45% at 88% 92%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 70%), radial-gradient(60% 50% at 50% 50%, color-mix(in oklab, var(--primary) 8%, transparent), transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--gold) 60%, transparent), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 start-1/4 size-[32rem] rounded-full blur-3xl opacity-30 animate-pulse"
        style={{ background: "var(--gold)", animationDuration: "8s" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 end-1/4 size-[24rem] rounded-full blur-3xl opacity-25"
        style={{ background: "var(--accent)" }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-5 lg:py-8 flex flex-col min-h-screen">
        {/* Header */}
        <header
          className="rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-3"
          style={{
            background: "color-mix(in oklab, var(--card) 55%, transparent)",
            backdropFilter: "blur(20px) saturate(160%)",
            border: "1px solid color-mix(in oklab, var(--foreground) 8%, transparent)",
          }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className={`size-4 ${isAr ? "rotate-180" : ""}`} />
            {isAr ? "الرئيسية" : "Back home"}
          </Link>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--gold)" }}>
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--gold)" }} />
            {isAr ? "متصل" : "Online"}
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={messages.length === 0 && !loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw className="size-3.5" />
            {isAr ? "محادثة جديدة" : "New chat"}
          </button>
        </header>

        {/* Hero identity */}
        <div
          className="mt-5 rounded-3xl p-6 sm:p-9 relative overflow-hidden"
          style={{
            background: "color-mix(in oklab, var(--card) 60%, transparent)",
            backdropFilter: "blur(24px) saturate(160%)",
            border: "1px solid color-mix(in oklab, var(--foreground) 8%, transparent)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }}
          />
          <div
            aria-hidden
            className="absolute -top-16 -end-16 size-56 rounded-full blur-3xl opacity-50"
            style={{ background: "var(--gold)" }}
          />
          <div className="relative flex items-start gap-5">
            {/* Logo avatar with halo */}
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute -inset-2 rounded-full blur-xl opacity-60"
                style={{ background: "radial-gradient(circle, var(--gold), transparent 60%)" }}
              />
              <div
                className="relative size-16 sm:size-20 rounded-2xl grid place-items-center overflow-hidden shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, color-mix(in oklab, var(--gold) 30%, var(--background)), var(--background))",
                  border: "1.5px solid color-mix(in oklab, var(--gold) 60%, transparent)",
                }}
              >
                <img
                  src={brandLogo}
                  alt="Eslam Selmi"
                  className="size-full object-contain p-2"
                  loading="eager"
                />
              </div>
              <span
                aria-hidden
                className="absolute -bottom-1 -end-1 size-5 rounded-full grid place-items-center shadow-lg"
                style={{ background: "var(--gold)", color: "var(--accent-foreground)" }}
              >
                <Sparkles className="size-2.5" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.34em] uppercase font-bold mb-2" style={{ color: "var(--gold)" }}>
                <span className="h-px w-6" style={{ background: "color-mix(in oklab, var(--gold) 70%, transparent)" }} />
                {isAr ? "مستشار رقمي" : "AI Advisor"}
              </div>
              <h1 className="font-display font-black text-[clamp(1.85rem,4.5vw,3rem)] leading-[1.02] tracking-tight">
                {isAr ? "اسأل سلمي" : "Ask Selmi"}
              </h1>
              <p className="mt-2.5 text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
                {isAr
                  ? "مساعد ذكي بيتكلم بصوت إسلام سلمي — متخصص في HR وإدارة المواهب والـ L&D. اكتبله بالفصحى أو بالعامية، هيرد عليك بنفس أسلوبك."
                  : "An AI that speaks in Eslam Selmi's voice — expert in HR, Talent Management and L&D. Write in any tone, it will mirror you."}
              </p>
            </div>
          </div>
        </div>

        {/* Conversation surface */}
        <div
          ref={scrollerRef}
          className="mt-5 flex-1 min-h-[42vh] rounded-3xl p-4 sm:p-6 overflow-y-auto space-y-5"
          style={{
            scrollbarGutter: "stable",
            background: "color-mix(in oklab, var(--card) 45%, transparent)",
            backdropFilter: "blur(24px) saturate(150%)",
            border: "1px solid color-mix(in oklab, var(--foreground) 7%, transparent)",
          }}
        >
          {!hasChat && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div
                className="size-14 rounded-2xl grid place-items-center mb-5 shadow-lg"
                style={{
                  background: "color-mix(in oklab, var(--gold) 14%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)",
                }}
              >
                <MessageSquare className="size-6" style={{ color: "var(--gold)" }} />
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                {isAr ? "ابدأ بسؤال من دول:" : "Try one of these prompts:"}
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full px-4 py-2.5 text-xs sm:text-sm text-foreground/85 hover:text-foreground hover:-translate-y-0.5 transition-all"
                    style={{
                      background: "color-mix(in oklab, var(--card) 70%, transparent)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid color-mix(in oklab, var(--foreground) 10%, transparent)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "color-mix(in oklab, var(--gold) 60%, transparent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "color-mix(in oklab, var(--foreground) 10%, transparent)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} isAr={isAr} logoUrl={brandLogo} />
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground ps-1">
              <div className="flex gap-1">
                <span className="size-2 rounded-full animate-bounce" style={{ background: "var(--gold)", animationDelay: "0ms" }} />
                <span className="size-2 rounded-full animate-bounce" style={{ background: "var(--gold)", animationDelay: "150ms" }} />
                <span className="size-2 rounded-full animate-bounce" style={{ background: "var(--gold)", animationDelay: "300ms" }} />
              </div>
              <span className="font-medium">{isAr ? "سلمي بيفكر..." : "Selmi is thinking..."}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm px-4 py-3">
              {error}
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={onSubmit} className="mt-4">
          <div
            className="rounded-2xl p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-[var(--gold)]/50 transition shadow-2xl"
            style={{
              background: "color-mix(in oklab, var(--card) 70%, transparent)",
              backdropFilter: "blur(24px) saturate(160%)",
              border: "1px solid color-mix(in oklab, var(--foreground) 10%, transparent)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder={
                isAr
                  ? "اكتب سؤالك في HR، إدارة المواهب أو L&D..."
                  : "Ask about HR, Talent Management, L&D..."
              }
              className="flex-1 resize-none bg-transparent border-0 outline-none px-3 py-3 text-sm sm:text-base placeholder:text-muted-foreground/70 max-h-40"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 size-11 rounded-xl grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:scale-105 active:scale-95 transition-transform"
              style={{
                background:
                  "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
                color: "var(--accent-foreground)",
              }}
              aria-label={isAr ? "إرسال" : "Send"}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className={`size-5 ${isAr ? "rotate-180" : ""}`} />
              )}
            </button>
          </div>
          <p className="mt-2.5 text-[11px] text-muted-foreground text-center">
            {isAr
              ? "Selmi AI متخصص في HR و Talent Management فقط · ممكن يخطئ، راجع المعلومات المهمة"
              : "Selmi AI only answers HR & Talent Management · It can make mistakes — verify critical info"}
          </p>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  isAr,
  logoUrl,
}: {
  role: "user" | "assistant";
  content: string;
  isAr: boolean;
  logoUrl: string;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="relative shrink-0">
          <div
            aria-hidden
            className="absolute -inset-0.5 rounded-xl blur opacity-60"
            style={{ background: "var(--gold)" }}
          />
          <div
            className="relative size-9 rounded-xl grid place-items-center overflow-hidden shadow-md"
            style={{
              background: "linear-gradient(135deg, color-mix(in oklab, var(--gold) 25%, var(--background)), var(--background))",
              border: "1px solid color-mix(in oklab, var(--gold) 50%, transparent)",
            }}
          >
            <img src={logoUrl} alt="" className="size-full object-contain p-1" />
          </div>
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-[14.5px] leading-[1.75] whitespace-pre-wrap shadow-md ${
          isUser ? "text-[var(--accent-foreground)]" : "text-foreground/95"
        }`}
        style={
          isUser
            ? {
                background:
                  "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
              }
            : {
                background: "color-mix(in oklab, var(--card) 75%, transparent)",
                backdropFilter: "blur(16px)",
                border: "1px solid color-mix(in oklab, var(--foreground) 8%, transparent)",
              }
        }
      >
        {content}
      </div>
      {isUser && (
        <div
          className="size-9 rounded-xl grid place-items-center shrink-0 text-xs font-bold"
          style={{
            background: "color-mix(in oklab, var(--card) 75%, transparent)",
            backdropFilter: "blur(16px)",
            border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
            color: "color-mix(in oklab, var(--foreground) 85%, transparent)",
          }}
          aria-hidden
        >
          {isAr ? "أنت" : "You"}
        </div>
      )}
    </div>
  );
}
