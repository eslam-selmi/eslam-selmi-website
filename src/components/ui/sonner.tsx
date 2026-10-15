import { Toaster as Sonner } from "sonner";
import { CircleCheck, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { lang } = useI18n();
  const { theme } = useTheme();
  return (
    <Sonner
      {...props}
      className="site-toaster"
      theme={theme}
      dir={lang === "ar" ? "rtl" : "ltr"}
      closeButton
      gap={12}
      offset={24}
      mobileOffset={16}
      containerAriaLabel={lang === "ar" ? "الإشعارات" : "Notifications"}
      icons={{
        success: <CircleCheck size={19} strokeWidth={1.8} />,
        error: <CircleAlert size={19} strokeWidth={1.8} />,
        warning: <TriangleAlert size={19} strokeWidth={1.8} />,
        info: <Info size={19} strokeWidth={1.8} />,
        close: <X size={14} />,
      }}
      toastOptions={{
        ...toastOptions,
        unstyled: false,
        closeButtonAriaLabel: lang === "ar" ? "إغلاق الإشعار" : "Dismiss notification",
        classNames: {
          ...toastOptions?.classNames,
          toast: "site-toast",
        },
      }}
    />
  );
};

export { Toaster };
