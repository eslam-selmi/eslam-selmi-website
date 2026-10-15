import { useEffect } from "react";
import { toast } from "sonner";
import { Award, Flame, Hourglass, Rocket, Send, Sparkles } from "lucide-react";
import type { Enrollment } from "./types";

type Continue = { en: Enrollment; progress: number; done: number; total: number } | null;
type Tab = "my-courses" | "certificates" | "available";

export function timeGreeting(lang: string, hour = new Date().getHours()) {
  const ar = lang === "ar";
  if (hour >= 5 && hour < 12) return ar ? "صباح الخير" : "Good morning";
  if (hour >= 12 && hour < 17) return ar ? "نهارك سعيد" : "Good afternoon";
  return ar ? "مساء الخير" : "Good evening";
}

/** Says hello once per browser session for each trainee. */
export function useWelcomeGreeting(userId: string | undefined, firstName: string | undefined, lang: string) {
  useEffect(() => {
    if (!userId || !firstName) return;
    const k = `portal-greeted-${userId}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
    const t = setTimeout(() => toast(`${timeGreeting(lang)} يا ${firstName} 👋`.replace(" يا ", lang === "ar" ? " يا " : ", "), {
      description: lang === "ar" ? "سعيدين برجوعك، يلا نكمل رحلة التعلّم." : "Great to see you again — let's keep learning.",
    }), 600);
    return () => clearTimeout(t);
  }, [userId, firstName, lang]);
}

export function PersonalMessage({ lang, firstName, enrollments, continueTarget, newCerts, onGo, onOpenCourse }: {
  lang: string; firstName: string; enrollments: Enrollment[]; continueTarget: Continue; newCerts: number;
  onGo: (t: Tab) => void; onOpenCourse: (e: Enrollment) => void;
}) {
  const ar = lang === "ar";
  const approved = enrollments.filter((e) => e.status === "approved");
  const pending = enrollments.filter((e) => e.status === "pending");
  const readyForCert = approved.find((e) => !e.certificate_issued && !e.certificate_requested_at && continueTarget?.en.id !== e.id);

  let icon = Sparkles, title = "", body = "", cta = "", action: () => void = () => onGo("available");
  if (newCerts > 0) {
    icon = Award; title = ar ? `مبروك يا ${firstName}! 🎉` : `Congratulations, ${firstName}! 🎉`;
    body = ar ? "شهادتك اتصدرت وجاهزة للتحميل. تعبك أثمر — افتحها وشاركها بكل فخر." : "Your certificate is issued and ready. Your effort paid off — open it and share it proudly.";
    cta = ar ? "افتح شهاداتي" : "Open my certificates"; action = () => onGo("certificates");
  } else if (continueTarget) {
    const p = continueTarget.progress, left = continueTarget.total - continueTarget.done, course = continueTarget.en.courses?.title ?? "";
    icon = p >= 70 ? Flame : Rocket;
    title = ar ? (p === 0 ? `جاهز تبدأ يا ${firstName}؟` : p >= 70 ? `قربت جداً يا ${firstName}! 🔥` : `مكمّل بقوة يا ${firstName} 💪`) : (p === 0 ? `Ready to start, ${firstName}?` : p >= 70 ? `Almost there, ${firstName}! 🔥` : `Keep going, ${firstName} 💪`);
    body = ar ? `أنجزت ${p}% من «${course}». فاضلك ${left} محاضرة بس وتوصل لشهادتك — كل خطوة النهارده بتقرّبك.` : `You've completed ${p}% of “${course}”. Only ${left} lecture(s) left until your certificate — every step today counts.`;
    cta = ar ? "كمّل الكورس" : "Continue the course"; action = () => onOpenCourse(continueTarget.en);
  } else if (readyForCert) {
    icon = Send; title = ar ? `خلّصت يا ${firstName}! 👏` : `You finished, ${firstName}! 👏`;
    body = ar ? `أنهيت «${readyForCert.courses?.title ?? ""}». اطلب شهادتك دلوقتي عشان نصدرهالك.` : `You completed “${readyForCert.courses?.title ?? ""}”. Request your certificate now.`;
    cta = ar ? "اطلب الشهادة" : "Request certificate"; action = () => onOpenCourse(readyForCert);
  } else if (pending.length) {
    icon = Hourglass; title = ar ? `طلبك قيد المراجعة يا ${firstName}` : `Your request is under review, ${firstName}`;
    body = ar ? "هنراجع طلب انضمامك قريباً، وهيوصلك إشعار أول ما يتفعّل." : "We'll review your enrollment soon and notify you once it's active.";
    cta = ar ? "تابع كورساتي" : "View my courses"; action = () => onGo("my-courses");
  } else {
    title = ar ? `يلا نبدأ رحلة جديدة يا ${firstName} ✨` : `Let's start something new, ${firstName} ✨`;
    body = ar ? "اختار كورسك الجاي واستثمر في مهاراتك — أنت أقرب لهدفك مما تتخيل." : "Pick your next course and invest in your skills — you're closer than you think.";
    cta = ar ? "تصفح الكورسات" : "Browse courses";
  }
  const Icon = icon;
  return <section className={`dash-card relative overflow-hidden p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 ${newCerts > 0 ? "border-[var(--gold)]/50" : ""}`}>
    <div className="absolute -top-16 -end-16 size-48 rounded-full bg-[var(--gold)]/15 blur-3xl pointer-events-none" />
    <span className={`relative size-14 shrink-0 rounded-2xl grid place-items-center bg-[var(--gold)]/15 border border-[var(--gold)]/40 text-[var(--gold)] ${newCerts > 0 ? "cert-glow" : ""}`}><Icon className="size-7" /></span>
    <div className="relative flex-1 min-w-0">
      <h2 className="font-bold text-lg">{title}</h2>
      <p className="text-sm text-white/70 mt-1 leading-relaxed">{body}</p>
    </div>
    <button onClick={action} className="relative h-11 px-5 rounded-xl font-semibold bg-[var(--gold)] text-[#0b1736] shrink-0 hover:brightness-110 transition">{cta}</button>
  </section>;
}
