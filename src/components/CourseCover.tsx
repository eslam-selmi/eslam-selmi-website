import { useSiteMedia } from "@/lib/site-media";
import { courseImage } from "@/lib/site-media-data";

export function CourseCover({ id, title, className = "" }: { id: string; title: string; className?: string }) {
  const { data } = useSiteMedia();
  return (
    <div className={`group/cover relative overflow-hidden ${className}`}>
      <img
        src={courseImage(data?.media ?? {}, id, title)}
        alt={title}
        width={1280}
        height={720}
        loading="lazy"
        decoding="async"
        className="aspect-video w-full object-cover"
      />
      {/* Frosted-glass veil — dissolves on hover to reveal the sharp image */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 opacity-100 transition-opacity duration-500 group-hover/cover:opacity-0 border border-white/25 bg-gradient-to-br from-white/30 via-white/10 to-white/[0.05] backdrop-blur-[6px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1/3 start-[-20%] z-10 h-[180%] w-1/3 rotate-12 bg-gradient-to-b from-white/45 via-white/10 to-transparent opacity-100 transition-opacity duration-500 group-hover/cover:opacity-0"
      />
    </div>
  );
}
