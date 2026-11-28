import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Tool files a trainer published for his own learners. The storage policy only returns them to approved learners of that tenant. */
export function LearnerTools({ tenantId, lang }: { tenantId: string; lang: "ar" | "en" }) {
  const prefix = `t/${tenantId}`;
  const q = useQuery({
    queryKey: ["learner-tools", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("tool-assets").list(prefix, { limit: 100 });
      if (error) throw error;
      return (data ?? []).filter((f) => f.name && !f.name.startsWith("."));
    },
  });
  async function open(name: string) {
    const w = window.open("", "_blank");
    const { data, error } = await supabase.storage.from("tool-assets").createSignedUrl(`${prefix}/${name}`, 60);
    if (error || !data) { w?.close(); return; }
    if (w) w.location.href = data.signedUrl; else window.location.href = data.signedUrl;
  }
  const files = q.data ?? [];
  if (files.length === 0) return null;
  return (
    <section dir={lang === "ar" ? "rtl" : "ltr"} style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem", fontFamily: "'Thmanyah Sans', system-ui, sans-serif" }}>
      <h2 style={{ fontFamily: "'Thmanyah Serif Display', serif", fontSize: "1.5rem" }}>{lang === "ar" ? "أدواتي" : "My tools"}</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {files.map((f) => (
          <li key={f.name} style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(128,128,128,.3)" }}>
            <button type="button" onClick={() => open(f.name)} style={{ textDecoration: "underline" }}><bdi dir="ltr">{f.name}</bdi></button>
          </li>
        ))}
      </ul>
    </section>
  );
}
