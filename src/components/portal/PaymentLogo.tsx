import { Landmark } from "lucide-react";
import instapay from "@/assets/pay-instapay.png";

/** Display-only mark beside a payment method name. Matched by name; no schema involved.
 *  Only assets that came from an official source are bundled (InstaPay). Other methods get no brand mark. */
export function PaymentLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <span className="inline-flex items-center justify-center h-8 w-16 rounded-md bg-white px-1 shrink-0" aria-hidden>
        <img src={logoUrl} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }
  const n = (name || "").toLowerCase();
  if (n.includes("instapay") || n.includes("إنستا") || n.includes("انستا")) {
    return (
      <span className="inline-flex items-center justify-center h-8 w-16 rounded-md bg-white px-1 shrink-0" aria-hidden>
        <img src={instapay} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }
  if (n.includes("bank") || n.includes("بنك") || n.includes("بنكي")) {
    return (
      <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-white/10 border border-white/15 shrink-0" aria-hidden>
        <Landmark className="w-4 h-4" strokeWidth={1.75} />
      </span>
    );
  }
  return null;
}
