export type GuestCourseRef = { id: string; title: string; description: string };
export function GuestCourseList({ lang, courses, onOpen }: { lang: "ar" | "en"; courses: GuestCourseRef[] | null; onOpen: (id: string) => void }) {
  return (
    <main dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#0b1736] text-white px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">{lang === "ar" ? "الكورسات" : "Courses"}</h1>
        <p className="text-sm text-white/60">{lang === "ar" ? "تصفح فقط" : "Browse only"}</p>
        {courses === null ? <p className="text-white/60">…</p> : courses.map((c) => (
          <button key={c.id} onClick={() => onOpen(c.id)} className="block w-full text-start rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <p className="font-semibold">{c.title}</p>{c.description && <p className="text-sm text-white/60 line-clamp-2 mt-1">{c.description}</p>}
          </button>
        ))}
      </div>
    </main>
  );
}
