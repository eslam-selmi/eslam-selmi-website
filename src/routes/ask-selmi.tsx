import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Paperclip,
  X as XIcon,
  Home,
  History as HistoryIcon,
  Trash2,
  Plus,
  Search,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Languages,
  Sun,
  Moon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
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

function textOf(c: Content): string {
  if (typeof c === "string") return c;
  return c.filter((p): p is TextPart => p.type === "text").map((p) => p.text).join("\n");
}

// Detect if text is predominantly Arabic — used for per-message RTL/LTR
function isArabicText(s: string): boolean {
  if (!s) return false;
  const arabic = (s.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) ?? []).length;
  const latin = (s.match(/[A-Za-z]/g) ?? []).length;
  if (arabic === 0) return false;
  return arabic >= latin;
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

function detectRenameIntent(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
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

function AskSelmiPage() {
  const { lang, setLang } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const isAr = lang === "ar";
  const brandLogo = brandLogoAsset.url;
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const suggestionsEn = [
    "How do I design a high-impact L&D strategy from scratch?",
    "What's the best way to identify high-potential talent (HiPos)?",
    "How do I make performance reviews actually drive performance?",
    "Build a competency framework — where do I start?",
    "How do I measure training ROI beyond happy-sheets?",
  ];
  const suggestionsAr = [
    "إزاي أصمم استراتيجية تعلم وتطوير قوية من الصفر؟",
    "إيه أحسن طريقة أحدد بيها المواهب الواعدة (HiPos)؟",
    "إزاي أخلي تقييمات الأداء فعلاً تفرق؟",
    "عايز أبني إطار كفاءات — أبدأ منين؟",
    "إزاي أقيس عائد التدريب بشكل احترافي؟",
  ];
  const suggestions = isAr ? suggestionsAr : suggestionsEn;

  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOffline, setAiOffline] = useState(false);
  const [courses, setCourses] = useState<CourseCtx[]>([]);
  const [pendingImage, setPendingImage] = useState<{ url: string; name: string } | null>(null);
  const [search, setSearch] = useState("");

  const [userName, setUserName] = useState<string | null>(null);
  const [askName, setAskName] = useState<
    | null
    | { kind: "first"; pendingText: string; pendingImage: { url: string; name: string } | null; suggested: string }
    | { kind: "rename"; suggested: string }
  >(null);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeId) ?? null,
    [chats, activeId],
  );
  const messages: Msg[] = activeChat?.messages ?? [];

  // Hydrate
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

  useEffect(() => {
    if (chats.length > 0) saveChats(chats);
  }, [chats]);

  useEffect(() => {
    if (!activeId) return;
    try { window.localStorage.setItem(ACTIVE_KEY, activeId); } catch {}
  }, [activeId]);

  // After a new message arrives, scroll the page (not an internal container) to the latest message
  useEffect(() => {
    if (!bottomRef.current) return;
    // Only auto-scroll when user already near bottom of the page
    const dist = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
    if (dist < 240) {
      bottomRef.current.scrollIntoView({ block: "end" });
    }
  }, [messages.length, loading]);

  const persistName = (n: string) => {
    const v = n.trim().slice(0, 60);
    if (!v) return;
    setUserName(v);
    try { window.localStorage.setItem(NAME_KEY, v); } catch {}
  };

  const buildUserContent = (text: string, image: { url: string; name: string } | null): Content => {
    if (!image) return text;
    const parts: Array<TextPart | ImagePart> = [];
    if (text) parts.push({ type: "text", text });
    parts.push({ type: "image_url", image_url: { url: image.url } });
    return parts;
  };

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
        if (res.error === "credits") {
          setAiOffline(true);
          setError(null);
        } else {
          const msg =
            res.error === "rate_limit"
              ? isAr ? "في زحمة شوية على الخدمة، جرب تاني بعد دقيقة." : "Rate limit reached. Please try again shortly."
              : isAr ? "حصل خطأ، حاول تاني." : "Something went wrong. Please try again.";
          setError(msg);
        }
      } else {
        setAiOffline(false);
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
    window.scrollTo({ top: 0 });
    inputRef.current?.focus();
  };

  const switchChat = (id: string) => {
    setActiveId(id);
    setError(null);
    setInput("");
    setPendingImage(null);
    setHistoryOpen(false);
    window.scrollTo({ top: 0 });
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

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt - a.updatedAt),
    [chats],
  );
  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedChats;
    return sortedChats.filter((c) => c.title.toLowerCase().includes(q));
  }, [sortedChats, search]);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="relative min-h-screen w-full bg-background text-foreground"
    >
      {/* Soft ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 10% 0%, color-mix(in oklab, var(--gold) 12%, transparent), transparent 60%), radial-gradient(50% 40% at 90% 100%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 70%)",
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 pt-4 pb-40">
        <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
          <aside className="hidden lg:flex sticky top-4 self-start max-h-[calc(100vh-2rem)] flex-col rounded-3xl overflow-hidden shadow-sm"
            style={{
              background: "color-mix(in oklab, var(--card) 92%, transparent)",
              border: "1px solid color-mix(in oklab, var(--foreground) 8%, transparent)",
            }}
          >
            <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
              <div className="size-9 rounded-xl grid place-items-center overflow-hidden shrink-0"
                style={{
                  background: "linear-gradient(135deg, color-mix(in oklab, var(--gold) 28%, var(--background)), var(--background))",
                  border: "1px solid color-mix(in oklab, var(--gold) 50%, transparent)",
                }}>
                <img src={brandLogo} alt="" className="size-full object-contain p-1" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-extrabold text-sm truncate">{isAr ? "اسأل سلمي" : "Ask Selmi"}</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {isAr ? "مستشار رقمي" : "AI Advisor"}
                </div>
              </div>
            </div>

            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={reset}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition"
                style={{
                  background: "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
                  color: "var(--accent-foreground)",
                }}
              >
                <Plus className="size-4" />
                {isAr ? "محادثة جديدة" : "Create New"}
              </button>
            </div>

            <div className="px-4 pb-2 flex items-center justify-between">
              <h3 className="font-display font-extrabold text-sm">{isAr ? "محادثاتي" : "Chats"}</h3>
              <span className="text-[11px] text-muted-foreground">{chats.length}</span>
            </div>

            <div className="px-3 pb-2">
              <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground ${isAr ? "end-3" : "start-3"}`} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isAr ? "ابحث..." : "Search"}
                  className={`w-full rounded-xl text-sm py-2 outline-none focus:ring-2 focus:ring-[var(--gold)]/40 ${isAr ? "pe-9 ps-3" : "ps-9 pe-3"}`}
                  style={{
                    background: "color-mix(in oklab, var(--background) 70%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--foreground) 10%, transparent)",
                  }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {filteredChats.length === 0 && (
                <p className="px-3 py-6 text-xs text-muted-foreground text-center">
                  {isAr ? "لا توجد محادثات" : "No chats"}
                </p>
              )}
              {filteredChats.map((c) => {
                const active = c.id === activeId;
                const titleIsAr = isArabicText(c.title);
                return (
                  <div
                    key={c.id}
                    className="group relative rounded-xl transition"
                    style={{
                      background: active ? "color-mix(in oklab, var(--gold) 12%, transparent)" : "transparent",
                      border: active
                        ? "1px solid color-mix(in oklab, var(--gold) 40%, transparent)"
                        : "1px solid transparent",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => switchChat(c.id)}
                      className="w-full text-start px-3 py-2.5 rounded-xl hover:bg-foreground/5 transition flex items-start gap-2.5"
                    >
                      <MessageSquare className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1" dir={titleIsAr ? "rtl" : "ltr"}>
                        <div className="text-[13px] font-semibold text-foreground truncate text-start">
                          {c.title || (isAr ? "محادثة" : "Chat")}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 text-start" dir={isAr ? "rtl" : "ltr"}>
                          {c.messages.length} {isAr ? "رسالة" : "msgs"}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(isAr ? "حذف هذه المحادثة؟" : "Delete this chat?")) deleteChat(c.id);
                      }}
                      aria-label={isAr ? "حذف" : "Delete"}
                      className={`absolute top-2 ${isAr ? "start-2" : "end-2"} size-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2.5 border-t border-foreground/10 text-[10px] text-muted-foreground text-center">
              {isAr ? "محفوظة محلياً على جهازك" : "Saved locally on this device"}
            </div>
          </aside>

          {/* Main column */}
          <main className="flex flex-col">
            {/* Header — compact, sticky on top */}
            <header
              className="sticky top-2 z-30 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-sm"
              style={{
                background: "color-mix(in oklab, var(--card) 80%, transparent)",
                backdropFilter: "blur(18px) saturate(140%)",
                border: "1px solid color-mix(in oklab, var(--foreground) 8%, transparent)",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0 lg:hidden">
                  <div
                    className="size-9 rounded-xl grid place-items-center overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, color-mix(in oklab, var(--gold) 28%, var(--background)), var(--background))",
                      border: "1px solid color-mix(in oklab, var(--gold) 50%, transparent)",
                    }}
                  >
                    <img src={brandLogo} alt="" className="size-full object-contain p-1" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-sm sm:text-base tracking-tight truncate">
                      {activeChat?.title && messages.length > 0
                        ? activeChat.title
                        : isAr ? "اسأل سلمي" : "Ask Selmi"}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mt-0.5">
                    <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--gold)" }} />
                    {isAr ? "متصل" : "Online"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((v) => !v)}
                  title={sidebarOpen ? (isAr ? "إخفاء الشريط" : "Hide sidebar") : (isAr ? "إظهار الشريط" : "Show sidebar")}
                  aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                  className="hidden lg:grid size-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
                >
                  {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setLang(isAr ? "en" : "ar")}
                  title={isAr ? "English" : "العربية"}
                  aria-label="Toggle language"
                  className="h-9 inline-flex items-center gap-1.5 px-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition text-[11px] font-bold uppercase tracking-wider"
                >
                  <Languages className="size-4" />
                  {isAr ? "EN" : "ع"}
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={theme === "dark" ? (isAr ? "وضع فاتح" : "Light mode") : (isAr ? "وضع داكن" : "Dark mode")}
                  aria-label="Toggle theme"
                  className="size-9 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(true)}
                  title={isAr ? "سجل المحادثات" : "Chat history"}
                  aria-label={isAr ? "سجل المحادثات" : "Chat history"}
                  className="lg:hidden size-9 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
                >
                  <HistoryIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={reset}
                  title={isAr ? "محادثة جديدة" : "New chat"}
                  aria-label={isAr ? "محادثة جديدة" : "New chat"}
                  className="lg:hidden size-9 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
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

            {aiOffline && (
              <div
                className="mt-3 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in oklab, var(--gold) 14%, transparent), color-mix(in oklab, var(--accent) 10%, transparent))",
                  border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)",
                  backdropFilter: "blur(14px) saturate(140%)",
                }}
              >
                <span
                  className="size-9 grid place-items-center rounded-xl shrink-0"
                  style={{
                    background: "color-mix(in oklab, var(--gold) 22%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--gold) 50%, transparent)",
                  }}
                >
                  <Loader2 className="size-4" style={{ color: "var(--gold)" }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-extrabold text-sm tracking-tight">
                    {isAr ? "تحت الصيانة" : "Under maintenance"}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                    {isAr
                      ? "الخدمة متوقفة مؤقتاً للصيانة. تقدر تتصفّح محادثاتك السابقة، وهتقدر تكمل قريباً."
                      : "The service is temporarily paused for maintenance. You can browse your previous chats — it will resume soon."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAiOffline(false)}
                  className="shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg hover:bg-foreground/5 transition"
                  style={{ color: "var(--accent)" }}
                >
                  {isAr ? "إعادة المحاولة" : "Retry"}
                </button>
              </div>
            )}

            {/* Conversation — flows naturally, no internal scroll */}
            <section className="mt-4 space-y-5">
              {!hasChat && !aiOffline && (
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
                <div className={`flex items-center gap-3 text-sm text-muted-foreground ${isAr ? "justify-end pe-1" : "ps-1"}`}>
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
              <div ref={bottomRef} />
            </section>
          </main>
        </div>
      </div>

      {/* Sticky composer pinned to viewport bottom */}
      {!aiOffline && (
      <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, var(--background) 35%, color-mix(in oklab, var(--background) 70%, transparent) 75%, transparent)",
          }}
        />
        <div className="relative mx-auto w-full max-w-7xl px-3 sm:px-6 pb-4 pt-6 pointer-events-none">
          <div className={`lg:grid ${sidebarOpen ? "lg:grid-cols-[300px_minmax(0,1fr)]" : "lg:grid-cols-[0_minmax(0,1fr)]"} lg:gap-6`}>
            <div className={`${sidebarOpen ? "hidden lg:block" : "hidden"}`} />
            <form onSubmit={onSubmit} className="pointer-events-auto">
              {pendingImage && (
                <div
                  className="mb-2 inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium"
                  style={{
                    background: "color-mix(in oklab, var(--card) 90%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--gold) 45%, transparent)",
                  }}
                >
                  <img src={pendingImage.url} alt="" className="size-7 rounded-md object-cover" />
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
                className="rounded-2xl p-1.5 sm:p-2 flex items-end gap-1.5 sm:gap-2 focus-within:ring-2 focus-within:ring-[var(--gold)]/40 transition shadow-xl"
                style={{
                  background: "color-mix(in oklab, var(--card) 96%, transparent)",
                  backdropFilter: "blur(18px) saturate(140%)",
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
                  dir="auto"
                  placeholder={
                    isAr
                      ? "اكتب سؤالك في HR، إدارة المواهب أو L&D..."
                      : "Type a message here..."
                  }
                  className="flex-1 min-w-0 resize-none bg-transparent border-0 outline-none px-2 sm:px-3 py-2.5 sm:py-3 text-[15px] sm:text-base placeholder:text-muted-foreground/70 max-h-40"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !pendingImage)}
                  className="shrink-0 size-10 sm:size-11 rounded-xl grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:scale-105 active:scale-95 transition-transform"
                  style={{
                    background: "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
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
              <p className="mt-1.5 text-[10.5px] text-muted-foreground text-center px-2">
                {isAr
                  ? "Selmi AI متخصص في HR و Talent Management · ممكن يخطئ — راجع المعلومات المهمة"
                  : "Selmi AI only answers HR & Talent Management · It can make mistakes — verify critical info"}
              </p>
            </form>
          </div>
        </div>
      </div>
      )}



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
              const ack = isAr
                ? `تمام يا ${name}، هناديك كده من دلوقتي 🌿`
                : `Got it, ${name} — I'll call you that from now on.`;
              setMessages((m) => [...m, { role: "assistant", content: ack }]);
            }
          }}
        />
      )}

      {historyOpen && (
        <HistoryDrawer
          isAr={isAr}
          chats={chats}
          activeId={activeId}
          onClose={() => setHistoryOpen(false)}
          onSelect={switchChat}
          onDelete={deleteChat}
          onNew={() => {
            reset();
            setHistoryOpen(false);
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
    <div className="flex flex-col items-center justify-center text-center py-12 sm:py-20 px-2">
      <div className="relative mb-6">
        <div
          aria-hidden
          className="absolute -inset-3 rounded-2xl blur-xl opacity-50"
          style={{ background: "radial-gradient(circle, var(--gold), transparent 60%)" }}
        />
        <div
          className="relative size-16 rounded-2xl grid place-items-center overflow-hidden shadow-xl"
          style={{
            background: "linear-gradient(135deg, color-mix(in oklab, var(--gold) 28%, var(--background)), var(--background))",
            border: "1.5px solid color-mix(in oklab, var(--gold) 55%, transparent)",
          }}
        >
          <img src={brandLogo} alt="" className="size-full object-contain p-2" />
        </div>
      </div>
      <h2 className="font-display font-black text-[clamp(1.5rem,4vw,2.25rem)] leading-tight tracking-tight">
        {userName
          ? isAr ? `أهلاً ${userName} 👋` : `Welcome back, ${userName} 👋`
          : isAr ? "اسأل سلمي" : "Ask Selmi"}
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
        {suggestions.map((s) => {
          const ar = isArabicText(s);
          return (
            <button
              key={s}
              type="button"
              dir={ar ? "rtl" : "ltr"}
              onClick={() => onPick(s)}
              className="rounded-full px-3.5 py-2 text-xs sm:text-sm text-foreground/85 hover:text-foreground hover:-translate-y-0.5 transition-all"
              style={{
                background: "color-mix(in oklab, var(--card) 80%, transparent)",
                border: "1px solid color-mix(in oklab, var(--foreground) 10%, transparent)",
              }}
            >
              {s}
            </button>
          );
        })}
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

  // Per-message direction detection
  const msgIsAr = isArabicText(text);
  const msgDir: "rtl" | "ltr" = msgIsAr ? "rtl" : "ltr";

  // User on the right (writer side) — flip if Arabic UI? We anchor user to the end (writing side) of UI direction.
  // But per request, Arabic messages align right, English left — regardless of role.
  // We'll use msgDir for alignment of the bubble.
  const alignEnd = msgDir === "rtl"; // rtl bubbles align right (justify-end in ltr container)
  // For user vs assistant, swap avatar position by role but text alignment follows msg direction.

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Layout: user messages on right (UI side), assistant on left in LTR; mirror in RTL UI.
  // But per the request — alignment driven by message language. We'll honor:
  // role decides avatar side (user: end, assistant: start in the page direction),
  // and msgDir decides text dir + internal alignment of the bubble content.

  const justify = isUser ? (isAr ? "justify-start" : "justify-end") : (isAr ? "justify-end" : "justify-start");
  const itemsAlign = isUser ? (isAr ? "items-start" : "items-end") : (isAr ? "items-end" : "items-start");

  return (
    <div className={`flex gap-2 sm:gap-3 ${justify}`}>
      {!isUser && (
        <div className="relative shrink-0 order-first">
          <div
            className="relative size-9 rounded-xl grid place-items-center overflow-hidden shadow-sm"
            style={{
              background: "linear-gradient(135deg, color-mix(in oklab, var(--gold) 25%, var(--background)), var(--background))",
              border: "1px solid color-mix(in oklab, var(--gold) 50%, transparent)",
            }}
          >
            <img src={logoUrl} alt="" className="size-full object-contain p-1" />
          </div>
        </div>
      )}
      <div className={`max-w-[82%] min-w-0 flex flex-col ${itemsAlign}`}>
        {images.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {images.map((src, idx) => (
              <img key={idx} src={src} alt="" className="max-h-48 rounded-xl border border-foreground/10 shadow" />
            ))}
          </div>
        )}
        {text && (
          <div
            dir={msgDir}
            className={`rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-[14.5px] leading-[1.75] shadow-sm break-words ${
              isUser ? "text-[var(--accent-foreground)]" : "text-foreground/95"
            } ${alignEnd ? "text-right" : "text-left"}`}
            style={
              isUser
                ? {
                    background:
                      "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
                  }
                : {
                    background: "color-mix(in oklab, var(--card) 92%, transparent)",
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
          className="size-9 rounded-xl grid place-items-center shrink-0 text-xs font-bold order-last"
          style={{
            background: "color-mix(in oklab, var(--card) 85%, transparent)",
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
    if (mode === "first") return isAr ? "يسعدني تقديم العون لك" : "Glad to help you";
    return isAr ? "تأكيد تغيير الاسم" : "Confirm new name";
  }, [mode, isAr]);

  const subtitle = useMemo(() => {
    if (mode === "first") return isAr ? "كيف تحب أن أناديك؟" : "How would you like me to call you?";
    return isAr
      ? currentName ? `هناديك ${currentName} حالياً. عاوز أغيره لإيه؟` : "أكد الاسم الجديد"
      : currentName ? `I currently call you ${currentName}. What should I switch to?` : "Confirm the new name";
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
          background: "color-mix(in oklab, var(--card) 95%, transparent)",
          border: "1px solid color-mix(in oklab, var(--gold) 35%, transparent)",
        }}
      >
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
                background: "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
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

function HistoryDrawer({
  isAr,
  chats,
  activeId,
  onClose,
  onSelect,
  onDelete,
  onNew,
}: {
  isAr: boolean;
  chats: StoredChat[];
  activeId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
  const fmt = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "short", day: "numeric" });
  };
  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 flex"
      style={{ background: "color-mix(in oklab, var(--background) 55%, transparent)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className={`${isAr ? "ms-auto" : "me-auto"} h-full w-[88vw] max-w-sm flex flex-col shadow-2xl`}
        style={{
          background: "color-mix(in oklab, var(--card) 96%, transparent)",
          backdropFilter: "blur(18px) saturate(140%)",
          borderInlineStart: isAr ? "none" : "1px solid color-mix(in oklab, var(--gold) 30%, transparent)",
          borderInlineEnd: isAr ? "1px solid color-mix(in oklab, var(--gold) 30%, transparent)" : "none",
        }}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-foreground/10">
          <div className="flex items-center gap-2 min-w-0">
            <HistoryIcon className="size-4" style={{ color: "var(--gold)" }} />
            <h3 className="font-display font-extrabold text-sm tracking-tight">
              {isAr ? "محادثاتي" : "My chats"}
            </h3>
            <span className="text-[11px] text-muted-foreground">({chats.length})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="size-8 grid place-items-center rounded-lg hover:bg-foreground/5 transition"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={onNew}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold shadow-lg hover:scale-[1.01] active:scale-[0.99] transition"
            style={{
              background: "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
              color: "var(--accent-foreground)",
            }}
          >
            <Plus className="size-4" />
            {isAr ? "محادثة جديدة" : "New chat"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {sorted.length === 0 && (
            <p className="px-3 py-6 text-sm text-muted-foreground text-center">
              {isAr ? "لا توجد محادثات بعد" : "No chats yet"}
            </p>
          )}
          {sorted.map((c) => {
            const active = c.id === activeId;
            const titleIsAr = isArabicText(c.title);
            return (
              <div
                key={c.id}
                className="group relative rounded-xl transition"
                style={{
                  background: active ? "color-mix(in oklab, var(--gold) 14%, transparent)" : "transparent",
                  border: active
                    ? "1px solid color-mix(in oklab, var(--gold) 45%, transparent)"
                    : "1px solid transparent",
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="w-full text-start px-3 py-2.5 rounded-xl hover:bg-foreground/5 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1" dir={titleIsAr ? "rtl" : "ltr"}>
                      <div className="text-[13.5px] font-semibold text-foreground truncate">
                        {c.title || (isAr ? "محادثة" : "Chat")}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5" dir={isAr ? "rtl" : "ltr"}>
                        {c.messages.length} {isAr ? "رسالة" : "msgs"} · {fmt(c.updatedAt)}
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(isAr ? "حذف هذه المحادثة؟" : "Delete this chat?")) {
                      onDelete(c.id);
                    }
                  }}
                  aria-label={isAr ? "حذف" : "Delete"}
                  className={`absolute top-2 ${isAr ? "start-2" : "end-2"} size-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2.5 border-t border-foreground/10 text-[10px] text-muted-foreground text-center">
          {isAr ? "المحادثات محفوظة محلياً على جهازك" : "Chats are stored locally on your device"}
        </div>
      </aside>
    </div>
  );
}
