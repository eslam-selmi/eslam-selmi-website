import { downloadSessionIcs } from "@/components/portal/ics";

export type CalEvent = { id: string; title: string; startsAt: string; durationMinutes: number; url?: string | null; details?: string };

function g(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalUrl(e: CalEvent) {
  const s = new Date(e.startsAt);
  const end = new Date(s.getTime() + e.durationMinutes * 60000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${g(s)}/${g(end)}`,
    details: [e.details, e.url].filter(Boolean).join("\n"),
    location: e.url ?? "",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function outlookCalUrl(e: CalEvent) {
  const s = new Date(e.startsAt);
  const end = new Date(s.getTime() + e.durationMinutes * 60000);
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: s.toISOString(),
    enddt: end.toISOString(),
    body: [e.details, e.url].filter(Boolean).join("\n"),
    location: e.url ?? "",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p}`;
}

export function downloadIcs(e: CalEvent) {
  downloadSessionIcs({ id: e.id, title: e.title, startsAt: e.startsAt, durationMinutes: e.durationMinutes, url: e.url });
}
