import { useSiteMedia } from "@/lib/site-media";
import { courseImage } from "@/lib/site-media-data";

export function CourseCover({ id, title, className = "" }: { id: string; title: string; className?: string }) {
  const { data } = useSiteMedia();
  return <img src={courseImage(data?.media ?? {}, id, title)} alt={title} width={1280} height={720} loading="lazy" decoding="async" className={`aspect-video w-full object-cover ${className}`} />;
}