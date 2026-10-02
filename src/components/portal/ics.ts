function fmt(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function downloadSessionIcs(s: {
  id: string; title: string; courseTitle?: string; startsAt: string; durationMinutes: number; url?: string | null;
}) {
  const start = new Date(s.startsAt);
  const end = new Date(start.getTime() + (Number(s.durationMinutes) || 60) * 60000);
  const desc = [s.courseTitle, s.url].filter(Boolean).join("\n");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Eslam Selmi//Portal//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${s.id}@eslam-selmi.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(s.courseTitle ? `${s.title} — ${s.courseTitle}` : s.title)}`,
    desc ? `DESCRIPTION:${esc(desc)}` : "",
    s.url ? `URL:${s.url}` : "",
    s.url ? `LOCATION:${esc(s.url)}` : "",
    "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `session-${start.toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
