import { Facebook, Instagram, Twitter, Youtube, Music2, Send, Ghost, MessageCircle, AtSign, Pin, Github, Palette, BookOpen, Twitch, Globe, Link as LinkIcon } from "lucide-react";
import type { SocialLink } from "@/lib/site-profile-data";

const ICONS: Record<string, typeof Globe> = {
  facebook: Facebook, instagram: Instagram, x: Twitter, youtube: Youtube, tiktok: Music2, telegram: Send, snapchat: Ghost,
  whatsapp_channel: MessageCircle, threads: AtSign, pinterest: Pin, github: Github, behance: Palette, medium: BookOpen, twitch: Twitch, website: Globe, custom: LinkIcon,
};
export const PLATFORM_NAMES: Record<string, [string, string]> = {
  facebook: ["فيسبوك", "Facebook"], instagram: ["إنستجرام", "Instagram"], x: ["X (تويتر)", "X (Twitter)"], youtube: ["يوتيوب", "YouTube"], tiktok: ["تيك توك", "TikTok"],
  telegram: ["تيليجرام", "Telegram"], snapchat: ["سناب شات", "Snapchat"], whatsapp_channel: ["قناة واتساب", "WhatsApp Channel"], threads: ["ثريدز", "Threads"], pinterest: ["بينترست", "Pinterest"],
  github: ["جيت هاب", "GitHub"], behance: ["بيهانس", "Behance"], medium: ["ميديوم", "Medium"], twitch: ["تويتش", "Twitch"], website: ["موقع", "Website"], custom: ["منصة أخرى", "Other platform"],
};
export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const I = ICONS[platform] ?? LinkIcon;
  return <I className={className ?? "size-4"} />;
}
export function socialLabel(s: SocialLink, lang: string) {
  return s.label?.trim() || (PLATFORM_NAMES[s.platform]?.[lang === "ar" ? 0 : 1] ?? s.platform);
}
