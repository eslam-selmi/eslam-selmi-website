import { useEffect } from "react";
import { useSiteProfile } from "@/lib/site-profile";

export function SiteBranding() {
  const { profile } = useSiteProfile();
  useEffect(() => {
    const icons = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    icons.forEach(icon => { icon.href = profile.logo; icon.removeAttribute("type"); });
  }, [profile.logo]);
  return null;
}