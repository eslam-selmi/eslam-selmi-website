import { lazy, Suspense, useEffect, useState } from "react";

const BookingDialog = lazy(() => import("./BookingDialog").then((m) => ({ default: m.BookingDialog })));

/** Listen immediately, but download the calendar only after a booking request. */
export function DeferredBookingDialog() {
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    const request = () => setRequested(true);
    window.addEventListener("open-calendly", request);
    return () => window.removeEventListener("open-calendly", request);
  }, []);
  return requested ? <Suspense fallback={null}><BookingDialog initiallyOpen /></Suspense> : null;
}