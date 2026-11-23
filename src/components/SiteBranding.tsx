import { useEffect } from "react";
import { useSiteProfile } from "@/lib/site-profile";

export function SiteBranding() {
  const { profile } = useSiteProfile();
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const href = media.matches ? profile.logoDark : profile.logo;
      const icons = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
      icons.forEach(icon => { icon.href = href; icon.removeAttribute("type"); });
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [profile.logo, profile.logoDark]);
  return null;
}
