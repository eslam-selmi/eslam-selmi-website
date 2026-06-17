import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Loader2,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Paperclip,
  X as XIcon,
  Home,
  History as HistoryIcon,
  Trash2,
  Plus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type Content = string | Array<TextPart | ImagePart>;
type Msg = { role: "user" | "assistant"; content: Content };
type CourseCtx = { title: string; description?: string | null; goals?: string | null; audience?: string | null };

const NAME_KEY = "ask-selmi:userName";
const CHATS_KEY = "ask-selmi:chats:v1";
const ACTIVE_KEY = "ask-selmi:activeChatId:v1";

type StoredChat = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Msg[];
};

function newChatId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function deriveTitle(messages: Msg[], fallback: string): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return fallback;
  const txt = textOf(firstUser.content).trim().replace(/\s+/g, " ");
  if (!txt) return fallback;
  return txt.length > 48 ? txt.slice(0, 46) + "…" : txt;
}

function loadChats(): StoredChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c) => c && typeof c.id === "string" && Array.isArray(c.messages));
  } catch {
    return [];
  }
}

function saveChats(chats: StoredChat[]) {
  try {
    window.localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch {}
}

// rough rename-intent detection — bilingual
function detectRenameIntent(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  // Arabic: نادني بـ X | غيّر اسمي إلى X | اسمي X | اسمي هو X
  const arPatterns = [
    /نادني\s+(?:بـ|ب)\s*([^\n.،,!?]{2,40})/i,
    /غي(?:ي|ّ)?ر\s+اسمي\s+(?:إلى|الى|ل)\s*([^\n.،,!?]{2,40})/i,
    /^اسمي\s+(?:هو\s+)?([^\n.،,!?]{2,40})/i,
    /ا?دعني\s+([^\n.،,!?]{2,40})/i,
  ];
  for (const re of arPatterns) {
    const m = t.match(re);
    if (m?.[1]) return m[1].trim();
  }
  // English
  const enPatterns = [
    /\bcall me\s+([A-Za-z][\w' -]{1,38})/i,
    /\bmy name is\s+([A-Za-z][\w' -]{1,38})/i,
    /\bchange my name to\s+([A-Za-z][\w' -]{1,38})/i,
  ];
  for (const re of enPatterns) {
    const m = t.match(re);
    if (m?.[1]) return m[1].trim().replace(/[.!?]+$/, "");
  }
  return null;
}

function textOf(c: Content): string {
  if (typeof c === "string") return c;
  return c.filter((p): p is TextPart => p.type === "text").map((p) => p.text).join("\n");
}

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

  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseCtx[]>([]);
  const [pendingImage, setPendingImage] = useState<{ url: string; name: string } | null>(null);

  const [userName, setUserName] = useState<string | null>(null);
  const [askName, setAskName] = useState<
    | null
    | { kind: "first"; pendingText: string; pendingImage: { url: string; name: string } | null; suggested: string }
    | { kind: "rename"; suggested: string }
  >(null);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const stickToBottomRef = useRef(true);

  // derived: active chat & its messages
  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeId) ?? null,
    [chats, activeId],
  );
  const messages: Msg[] = activeChat?.messages ?? [];

  // hydrate name + chats (idempotent bootstrap, StrictMode safe)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const n = window.localStorage.getItem(NAME_KEY);
      if (n) setUserName(n);
    } catch {}

    const existing = loadChats();
    let storedActive: string | null = null;
    try {
      storedActive = window.localStorage.getItem(ACTIVE_KEY);
    } catch {}

    if (existing.length === 0) {
      const fresh: StoredChat = {
        id: newChatId(),
        title: isAr ? "محادثة جديدة" : "New chat",
        updatedAt: Date.now(),
        messages: [],
      };
      setChats([fresh]);
      setActiveId(fresh.id);
      saveChats([fresh]);
      try { window.localStorage.setItem(ACTIVE_KEY, fresh.id); } catch {}
    } else {
      setChats(existing);
      const valid = storedActive && existing.some((c) => c.id === storedActive)
        ? storedActive
        : existing[0].id;
      setActiveId(valid);
      try { window.localStorage.setItem(ACTIVE_KEY, valid); } catch {}
    }
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Track whether the user is pinned to the bottom — only autoscroll then
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = dist < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeId]);

  // Auto-scroll only if user is at/near bottom — no smooth animation (prevents lag)
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Persist active chat whenever its messages or chats list change
  useEffect(() => {
    if (chats.length > 0) saveChats(chats);
  }, [chats]);

  useEffect(() => {
    if (!activeId) return;
    try { window.localStorage.setItem(ACTIVE_KEY, activeId); } catch {}
    stickToBottomRef.current = true;
    requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [activeId]);

  const persistName = (n: string) => {
    const v = n.trim().slice(0, 60);
    if (!v) return;
    setUserName(v);
    try {
      window.localStorage.setItem(NAME_KEY, v);
    } catch {}
  };

  const buildUserContent = (text: string, image: { url: string; name: string } | null): Content => {
    if (!image) return text;
    const parts: Array<TextPart | ImagePart> = [];
    if (text) parts.push({ type: "text", text });
    parts.push({ type: "image_url", image_url: { url: image.url } });
    return parts;
  };

  // Update active chat's messages immutably, refresh title + updatedAt
  const setMessages = (updater: Msg[] | ((prev: Msg[]) => Msg[])) => {
    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === activeId);
      if (idx === -1) return prev;
      const current = prev[idx];
      const nextMsgs = typeof updater === "function" ? (updater as (p: Msg[]) => Msg[])(current.messages) : updater;
      const updated: StoredChat = {
        ...current,
        messages: nextMsgs,
        updatedAt: Date.now(),
        title: deriveTitle(nextMsgs, isAr ? "محادثة جديدة" : "New chat"),
      };
      const copy = [...prev];
      copy[idx] = updated;
      // bubble active chat to top
      copy.sort((a, b) => b.updatedAt - a.updatedAt);
      return copy;
    });
  };

  const doSend = async (text: string, image: { url: string; name: string } | null, nameForCall: string | null) => {
    const trimmed = text.trim();
    if (!trimmed && !image) return;
    setError(null);
    const userMsg: Msg = { role: "user", content: buildUserContent(trimmed, image) };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPendingImage(null);
    setLoading(true);
    try {
      const res = await askSelmi({
        data: { messages: next, lang, courses, userName: nameForCall ?? null },
      });
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

  const send = async (rawText: string) => {
    if (loading) return;
    const text = rawText.trim();
    if (!text && !pendingImage) return;

    const renameTo = detectRenameIntent(text);
    if (renameTo && userName) {
      setAskName({ kind: "rename", suggested: renameTo });
      return;
    }

    if (!userName) {
      setAskName({
        kind: "first",
        pendingText: text,
        pendingImage,
        suggested: renameTo ?? "",
      });
      return;
    }

    await doSend(text, pendingImage, userName);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  // Start a fresh chat (preserves history)
  const reset = () => {
    const fresh: StoredChat = {
      id: newChatId(),
      title: isAr ? "محادثة جديدة" : "New chat",
      updatedAt: Date.now(),
      messages: [],
    };
    setChats((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setError(null);
    setInput("");
    setPendingImage(null);
    inputRef.current?.focus();
  };

  const switchChat = (id: string) => {
    setActiveId(id);
    setError(null);
    setInput("");
    setPendingImage(null);
    setHistoryOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const deleteChat = (id: string) => {
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh: StoredChat = {
          id: newChatId(),
          title: isAr ? "محادثة جديدة" : "New chat",
          updatedAt: Date.now(),
          messages: [],
        };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(remaining[0].id);
      return remaining;
    });
  };


  const onPickFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(isAr ? "نوع الملف غير مدعوم — صور فقط حاليًا." : "Unsupported file — images only for now.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError(isAr ? "حجم الصورة كبير (الحد 4 ميجا)." : "Image too large (max 4MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      if (url) setPendingImage({ url, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const hasChat = messages.length > 0;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="relative min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground"
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
        className="pointer-events-none absolute -top-40 start-1/4 size-[28rem] rounded-full blur-3xl opacity-25 animate-pulse"
        style={{ background: "var(--gold)", animationDuration: "8s" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 end-1/4 size-[22rem] rounded-full blur-3xl opacity-20"
        style={{ background: "var(--accent)" }}
      />

      <div className="relative mx-auto w-full max-w-4xl px-3 sm:px-6 py-3 sm:py-6 flex flex-col min-h-[100dvh]">
        {/* Premium compact header */}
        <header
          className="rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-lg"
          style={{
            background: "color-mix(in oklab, var(--card) 65%, transparent)",
            backdropFilter: "blur(22px) saturate(160%)",
            border: "1px solid color-mix(in oklab, var(--foreground) 9%, transparent)",
          }}
        >
          {/* Brand identity (compact) */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute -inset-1 rounded-xl blur opacity-60"
                style={{ background: "var(--gold)" }}
              />
              <div
                className="relative size-9 sm:size-10 rounded-xl grid place-items-center overflow-hidden shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in oklab, var(--gold) 30%, var(--background)), var(--background))",
                  border: "1px solid color-mix(in oklab, var(--gold) 55%, transparent)",
                }}
              >
                <img src={brandLogo} alt="Selmi" className="size-full object-contain p-1" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-sm sm:text-base tracking-tight truncate">
                  {isAr ? "اسأل سلمي" : "Ask Selmi"}
                </span>
                <span
                  className="hidden sm:inline-flex items-center gap-1 text-[9px] tracking-[0.28em] uppercase font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    color: "var(--gold)",
                    background: "color-mix(in oklab, var(--gold) 12%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--gold) 45%, transparent)",
                  }}
                >
                  <span className="size-1 rounded-full animate-pulse" style={{ background: "var(--gold)" }} />
                  {isAr ? "متصل" : "Online"}
                </span>
              </div>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold mt-0.5">
                {isAr ? "مستشار HR رقمي" : "AI HR Advisor"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Online chip on mobile */}
            <span
              className="sm:hidden inline-flex items-center gap-1 text-[9px] tracking-[0.22em] uppercase font-bold px-1.5 py-0.5 rounded-full"
              style={{
                color: "var(--gold)",
                background: "color-mix(in oklab, var(--gold) 12%, transparent)",
                border: "1px solid color-mix(in oklab, var(--gold) 45%, transparent)",
              }}
            >
              <span className="size-1 rounded-full animate-pulse" style={{ background: "var(--gold)" }} />
              {isAr ? "متصل" : "On"}
            </span>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              title={isAr ? "سجل المحادثات" : "Chat history"}
              aria-label={isAr ? "سجل المحادثات" : "Chat history"}
              className="relative size-9 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
            >
              <HistoryIcon className="size-4" />
              {chats.length > 1 && (
                <span
                  className="absolute -top-0.5 -end-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold grid place-items-center"
                  style={{ background: "var(--gold)", color: "var(--accent-foreground)" }}
                >
                  {chats.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={reset}
              title={isAr ? "محادثة جديدة" : "New chat"}
              aria-label={isAr ? "محادثة جديدة" : "New chat"}
              className="size-9 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
            >
              <Plus className="size-4" />
            </button>
            <Link
              to="/"
              title={isAr ? "الرئيسية" : "Home"}
              aria-label={isAr ? "الرئيسية" : "Home"}
              className="size-9 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
            >
              <Home className="size-4" />
            </Link>
          </div>
        </header>

        {/* Conversation surface */}
        <div
          ref={scrollerRef}
          className="mt-4 flex-1 min-h-[42vh] rounded-3xl p-3 sm:p-6 overflow-y-auto overflow-x-hidden space-y-5"
          style={{
            scrollbarGutter: "stable",
            background: "color-mix(in oklab, var(--card) 45%, transparent)",
            backdropFilter: "blur(24px) saturate(150%)",
            border: "1px solid color-mix(in oklab, var(--foreground) 7%, transparent)",
          }}
        >
          {!hasChat && (
            <EmptyState
              isAr={isAr}
              suggestions={suggestions}
              onPick={(s) => void send(s)}
              userName={userName}
              brandLogo={brandLogo}
            />
          )}

          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} isAr={isAr} logoUrl={brandLogo} />
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
        <form onSubmit={onSubmit} className="mt-3 sm:mt-4">
          {pendingImage && (
            <div
              className="mb-2 inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium"
              style={{
                background: "color-mix(in oklab, var(--card) 70%, transparent)",
                border: "1px solid color-mix(in oklab, var(--gold) 45%, transparent)",
                backdropFilter: "blur(16px)",
              }}
            >
              <img
                src={pendingImage.url}
                alt=""
                className="size-7 rounded-md object-cover"
              />
              <span className="max-w-[160px] truncate">{pendingImage.name}</span>
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="size-5 grid place-items-center rounded-md hover:bg-foreground/10 transition"
                aria-label={isAr ? "إزالة" : "Remove"}
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          )}
          <div
            className="rounded-2xl p-1.5 sm:p-2 flex items-end gap-1.5 sm:gap-2 focus-within:ring-2 focus-within:ring-[var(--gold)]/50 transition shadow-2xl"
            style={{
              background: "color-mix(in oklab, var(--card) 70%, transparent)",
              backdropFilter: "blur(24px) saturate(160%)",
              border: "1px solid color-mix(in oklab, var(--foreground) 10%, transparent)",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onPickFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="shrink-0 size-10 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition disabled:opacity-40"
              aria-label={isAr ? "إرفاق ملف" : "Attach file"}
              title={isAr ? "إرفاق صورة" : "Attach image"}
            >
              <Paperclip className="size-5" />
            </button>
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
              className="flex-1 min-w-0 resize-none bg-transparent border-0 outline-none px-2 sm:px-3 py-2.5 sm:py-3 text-[15px] sm:text-base placeholder:text-muted-foreground/70 max-h-40"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !pendingImage)}
              className="shrink-0 size-10 sm:size-11 rounded-xl grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:scale-105 active:scale-95 transition-transform"
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
          <p className="mt-2.5 text-[11px] text-muted-foreground text-center px-2">
            {isAr
              ? "Selmi AI متخصص في HR و Talent Management فقط · ممكن يخطئ، راجع المعلومات المهمة"
              : "Selmi AI only answers HR & Talent Management · It can make mistakes — verify critical info"}
          </p>
        </form>
      </div>

      {/* Name dialog */}
      {askName && (
        <NameDialog
          isAr={isAr}
          mode={askName.kind}
          initial={askName.suggested}
          currentName={userName}
          onCancel={() => setAskName(null)}
          onConfirm={(name) => {
            persistName(name);
            if (askName.kind === "first") {
              const { pendingText, pendingImage: img } = askName;
              setAskName(null);
              void doSend(pendingText, img, name);
            } else {
              setAskName(null);
              // Add a friendly assistant ack so the user sees the change took effect
              const ack = isAr
                ? `تمام يا ${name}، هناديك كده من دلوقتي 🌿`
                : `Got it, ${name} — I'll call you that from now on.`;
              setMessages((m) => [...m, { role: "assistant", content: ack }]);
            }
          }}
        />
      )}
    </div>
  );
}

function EmptyState({
  isAr,
  suggestions,
  onPick,
  userName,
  brandLogo,
}: {
  isAr: boolean;
  suggestions: string[];
  onPick: (s: string) => void;
  userName: string | null;
  brandLogo: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-8 sm:py-12 px-2">
      <div className="relative mb-5">
        <div
          aria-hidden
          className="absolute -inset-3 rounded-2xl blur-xl opacity-50"
          style={{ background: "radial-gradient(circle, var(--gold), transparent 60%)" }}
        />
        <div
          className="relative size-16 rounded-2xl grid place-items-center overflow-hidden shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--gold) 28%, var(--background)), var(--background))",
            border: "1.5px solid color-mix(in oklab, var(--gold) 55%, transparent)",
          }}
        >
          <img src={brandLogo} alt="" className="size-full object-contain p-2" />
        </div>
        <span
          aria-hidden
          className="absolute -bottom-1 -end-1 size-5 rounded-full grid place-items-center shadow-md"
          style={{ background: "var(--gold)", color: "var(--accent-foreground)" }}
        >
          <Sparkles className="size-2.5" />
        </span>
      </div>
      <h2 className="font-display font-black text-[clamp(1.5rem,4vw,2.25rem)] leading-tight tracking-tight">
        {userName
          ? isAr
            ? `أهلاً ${userName} 👋`
            : `Welcome back, ${userName} 👋`
          : isAr
            ? "اسأل سلمي"
            : "Ask Selmi"}
      </h2>
      <p className="mt-2 text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-xl">
        {isAr
          ? "مساعد ذكي بيتكلم بصوت إسلام سلمي — متخصص في HR وإدارة المواهب والـ L&D."
          : "An AI that speaks in Eslam Selmi's voice — expert in HR, Talent Management and L&D."}
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase font-bold text-muted-foreground">
        <span className="h-px w-6 bg-foreground/20" />
        {isAr ? "جرب سؤال" : "Try a prompt"}
        <span className="h-px w-6 bg-foreground/20" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-2xl">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-full px-3.5 py-2 text-xs sm:text-sm text-foreground/85 hover:text-foreground hover:-translate-y-0.5 transition-all"
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
  );
}

function MessageBubble({
  message,
  isAr,
  logoUrl,
}: {
  message: Msg;
  isAr: boolean;
  logoUrl: string;
}) {
  const isUser = message.role === "user";
  const text = textOf(message.content);
  const images: string[] = Array.isArray(message.content)
    ? message.content.filter((p): p is ImagePart => p.type === "image_url").map((p) => p.image_url.url)
    : [];

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="relative shrink-0">
          <div
            aria-hidden
            className="absolute -inset-0.5 rounded-xl blur opacity-50"
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
      <div className={`max-w-[82%] min-w-0 flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {images.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {images.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt=""
                className="max-h-48 rounded-xl border border-foreground/10 shadow"
              />
            ))}
          </div>
        )}
        {text && (
          <div
            className={`rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-[14.5px] leading-[1.75] shadow-md break-words ${
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
            {isUser ? (
              <p className="whitespace-pre-wrap">{text}</p>
            ) : (
              <MarkdownBody content={text} />
            )}
          </div>
        )}
        {!isUser && text && (
          <button
            type="button"
            onClick={copy}
            className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-md hover:bg-foreground/5"
            aria-label={isAr ? "نسخ الرد" : "Copy reply"}
          >
            {copied ? (
              <>
                <Check className="size-3.5" style={{ color: "var(--gold)" }} />
                {isAr ? "تم النسخ" : "Copied"}
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                {isAr ? "نسخ" : "Copy"}
              </>
            )}
          </button>
        )}
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

function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-foreground prose-strong:font-bold prose-a:text-[var(--gold)] prose-a:no-underline hover:prose-a:underline prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-foreground/10 prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function NameDialog({
  isAr,
  mode,
  initial,
  currentName,
  onCancel,
  onConfirm,
}: {
  isAr: boolean;
  mode: "first" | "rename";
  initial: string;
  currentName: string | null;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    setTimeout(() => ref.current?.focus(), 30);
  }, []);

  const title = useMemo(() => {
    if (mode === "first") {
      return isAr ? "يسعدني تقديم العون لك" : "Glad to help you";
    }
    return isAr ? "تأكيد تغيير الاسم" : "Confirm new name";
  }, [mode, isAr]);

  const subtitle = useMemo(() => {
    if (mode === "first") {
      return isAr ? "كيف تحب أن أناديك؟" : "How would you like me to call you?";
    }
    return isAr
      ? currentName
        ? `هناديك ${currentName} حالياً. عاوز أغيره لإيه؟`
        : "أكد الاسم الجديد"
      : currentName
        ? `I currently call you ${currentName}. What should I switch to?`
        : "Confirm the new name";
  }, [mode, isAr, currentName]);

  const submit = () => {
    const v = value.trim();
    if (v.length < 1) return;
    onConfirm(v);
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "color-mix(in oklab, var(--background) 65%, transparent)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl"
        style={{
          background: "color-mix(in oklab, var(--card) 88%, transparent)",
          backdropFilter: "blur(24px) saturate(160%)",
          border: "1px solid color-mix(in oklab, var(--gold) 35%, transparent)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }}
        />
        <div className="flex items-center gap-3 mb-1">
          <div
            className="size-10 rounded-xl grid place-items-center shrink-0"
            style={{
              background: "color-mix(in oklab, var(--gold) 18%, transparent)",
              border: "1px solid color-mix(in oklab, var(--gold) 50%, transparent)",
            }}
          >
            <Sparkles className="size-5" style={{ color: "var(--gold)" }} />
          </div>
          <h3 className="font-display font-extrabold text-lg sm:text-xl tracking-tight">{title}</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>

        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={60}
            placeholder={isAr ? "اكتب اسمك" : "Type your name"}
            className="w-full rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[var(--gold)]/50"
            style={{
              background: "color-mix(in oklab, var(--background) 80%, transparent)",
              border: "1px solid color-mix(in oklab, var(--foreground) 14%, transparent)",
            }}
          />
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-foreground/5 transition"
            >
              {isAr ? "لاحقًا" : "Later"}
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-5 py-2.5 text-sm font-bold rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition"
              style={{
                background:
                  "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
                color: "var(--accent-foreground)",
              }}
            >
              {mode === "first" ? (isAr ? "ابدأ المحادثة" : "Start chatting") : isAr ? "تأكيد" : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
