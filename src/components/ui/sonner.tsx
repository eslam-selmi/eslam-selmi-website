import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Premium glassmorphism toast system.
 * Backdrop-blurred, semi-transparent surfaces with per-status brand glows.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-2xl backdrop-saturate-150 " +
            "bg-[color-mix(in_oklab,var(--card)_78%,transparent)] " +
            "text-foreground border-[color-mix(in_oklab,var(--foreground)_14%,transparent)] " +
            "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45),inset_0_1px_0_color-mix(in_oklab,white_10%,transparent)]",
          title: "font-semibold tracking-tight",
          description: "text-muted-foreground text-sm leading-relaxed",
          actionButton:
            "!bg-primary !text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm hover:opacity-90 transition",
          cancelButton:
            "!bg-muted !text-muted-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:opacity-90 transition",
          success:
            "!border-[color-mix(in_oklab,#10b981_45%,transparent)] " +
            "!shadow-[0_20px_60px_-20px_rgba(16,185,129,0.35),inset_0_1px_0_color-mix(in_oklab,white_10%,transparent)]",
          error:
            "!border-[color-mix(in_oklab,#ef4444_50%,transparent)] " +
            "!shadow-[0_20px_60px_-20px_rgba(239,68,68,0.40),inset_0_1px_0_color-mix(in_oklab,white_10%,transparent)]",
          warning:
            "!border-[color-mix(in_oklab,#f59e0b_50%,transparent)] " +
            "!shadow-[0_20px_60px_-20px_rgba(245,158,11,0.40),inset_0_1px_0_color-mix(in_oklab,white_10%,transparent)]",
          info:
            "!border-[color-mix(in_oklab,var(--accent)_50%,transparent)] " +
            "!shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--accent)_45%,transparent),inset_0_1px_0_color-mix(in_oklab,white_10%,transparent)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
