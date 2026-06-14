import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Send, Sparkles, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { askSelmi } from "@/lib/ask-selmi.functions";

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

function AskSelmiPage() {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  const suggestionsEn = [
    "How do I design a high-impact L&D strategy from scratch?",
    "What's the best way to identify high-potential talent (HiPos)?",
    "How do I make performance reviews actually drive performance?",
    "Build a competency framework for a mid-size company — where do I start?",
    "How do I measure training ROI beyond happy-sheets?",
  ];
  const suggestionsAr = [
    "كيف أصمم استراتيجية تعلم وتطوير عالية الأثر من الصفر؟",
    "ما أفضل طريقة لتحديد المواهب الواعدة (HiPos)؟",
    "كيف أجعل تقييمات الأداء تُحدث فارقًا حقيقيًا؟",
    "كيف أبني إطار كفاءات لشركة متوسطة — من أين أبدأ؟",
    "كيف أقيس عائد الاستثمار في التدريب بشكل احترافي؟",
  ];
  const suggestions = isAr ? suggestionsAr : suggestionsEn;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
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
      const res = await askSelmi({ data: { messages: next, lang } });
      if (res.error) {
        const msg =
          res.error === "rate_limit"
            ? isAr
              ? "تم تجاوز الحد المسموح به مؤقتًا. حاول بعد قليل."
              : "Rate limit reached. Please try again shortly."
            : res.error === "credits"
              ? isAr
                ? "نفدت أرصدة الذكاء الاصطناعي. يرجى التواصل مع المدير."
                : "AI credits exhausted. Please contact the administrator."
              : isAr
                ? "حدث خطأ، حاول مجددًا."
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

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
    >
      {/* Ambient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 15% 10%, color-mix(in oklab, var(--gold) 22%, transparent), transparent 70%), radial-gradient(45% 40% at 85% 90%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 70%), radial-gradient(60% 50% at 50% 50%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 start-1/4 size-[28rem] rounded-full blur-3xl opacity-40"
        style={{ background: "var(--gold)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 end-1/4 size-[22rem] rounded-full blur-3xl opacity-30"
        style={{ background: "var(--accent)" }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-6 lg:py-10 flex flex-col min-h-screen">
        {/* Header bar */}
        <header className="glass-panel rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className={`size-4 ${isAr ? "rotate-180" : ""}`} />
            {isAr ? "العودة للرئيسية" : "Back home"}
          </Link>
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

        {/* Title / Hero card */}
        <div className="mt-5 glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-12 -end-12 size-40 rounded-full blur-3xl opacity-50"
            style={{ background: "var(--gold)" }}
          />
          <div className="relative flex items-start gap-4">
            <div
              className="size-12 sm:size-14 rounded-2xl grid place-items-center shrink-0 shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 60%, var(--accent)))",
                color: "var(--accent-foreground)",
              }}
            >
              <Sparkles className="size-6 sm:size-7" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[var(--gold)] font-bold mb-2">
                <span className="h-px w-6 bg-[var(--gold)]/70" />
                {isAr ? "مستشار ذكي" : "AI Advisor"}
              </div>
              <h1 className="font-display font-extrabold text-[clamp(1.75rem,4vw,2.75rem)] leading-tight">
                Ask Selmi
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                {isAr
                  ? "مساعد ذكاء اصطناعي متخصص في الموارد البشرية وإدارة المواهب والتعلم والتطوير. اسأل، واحصل على إجابة تنفيذية عملية."
                  : "An AI advisor focused on HR, Talent Management and L&D. Ask anything in scope and get an executive, actionable answer."}
              </p>
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div
          ref={scrollerRef}
          className="mt-5 flex-1 min-h-[40vh] glass-panel rounded-3xl p-4 sm:p-6 overflow-y-auto space-y-4"
          style={{ scrollbarGutter: "stable" }}
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <MessageSquare className="size-10 text-muted-foreground/60 mb-4" />
              <p className="text-sm text-muted-foreground mb-5">
                {isAr ? "جرّب أحد هذه الأسئلة:" : "Try one of these prompts:"}
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-foreground/10 bg-card/60 backdrop-blur-xl px-3.5 py-2 text-xs sm:text-sm text-foreground/80 hover:border-[var(--gold)]/50 hover:text-foreground hover:-translate-y-0.5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} isAr={isAr} />
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground ps-1">
              <Loader2 className="size-4 animate-spin" style={{ color: "var(--gold)" }} />
              {isAr ? "Selmi AI يفكر..." : "Selmi AI is thinking..."}
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
          <div className="glass-panel rounded-2xl p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-[var(--gold)]/40 transition">
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
                  ? "اسأل عن HR، إدارة المواهب، التعلم والتطوير..."
                  : "Ask about HR, Talent Management, L&D..."
              }
              className="flex-1 resize-none bg-transparent border-0 outline-none px-3 py-2.5 text-sm sm:text-base placeholder:text-muted-foreground/70 max-h-40"
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
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            {isAr
              ? "Selmi AI متخصص في HR و Talent Management فقط. قد يخطئ — راجع المعلومات الحساسة."
              : "Selmi AI only answers HR & Talent Management questions. It can make mistakes — verify critical info."}
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
}: {
  role: "user" | "assistant";
  content: string;
  isAr: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className="size-9 rounded-xl grid place-items-center shrink-0 shadow-md"
          style={{
            background:
              "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
            color: "var(--accent-foreground)",
          }}
        >
          <Sparkles className="size-4" />
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-[14.5px] leading-[1.7] whitespace-pre-wrap ${
          isUser
            ? "text-[var(--accent-foreground)] shadow-lg"
            : "border border-foreground/10 bg-card/70 backdrop-blur-xl text-foreground/95 shadow-md"
        }`}
        style={
          isUser
            ? {
                background:
                  "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
              }
            : undefined
        }
      >
        {content}
      </div>
      {isUser && (
        <div
          className="size-9 rounded-xl grid place-items-center shrink-0 text-xs font-bold border border-foreground/15 bg-card/70 backdrop-blur-xl text-foreground/80"
          aria-hidden
        >
          {isAr ? "أ" : "You"}
        </div>
      )}
    </div>
  );
}
