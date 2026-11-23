import { useSiteProfile } from "@/lib/site-profile";

/**
 * Renders the brand logo matched to the active theme: the navy mark in
 * light mode and the white mark in dark mode. Both variants stay mounted so
 * theme toggles swap instantly without a network refetch.
 */
export function ThemeLogo({
  size,
  className = "",
  alt = "Eslam Selmi",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  const { profile } = useSiteProfile();
  const style = size ? { width: size, height: size } : undefined;
  return (
    <>
      <img
        src={profile.logo}
        alt={alt}
        width={size}
        height={size}
        style={style}
        className={`${className} dark:hidden`}
        suppressHydrationWarning
      />
      <img
        src={profile.logoDark}
        alt=""
        aria-hidden
        width={size}
        height={size}
        style={style}
        className={`${className} hidden dark:block`}
        suppressHydrationWarning
      />
    </>
  );
}
