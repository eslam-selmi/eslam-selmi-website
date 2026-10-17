import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

/** Keep below-the-fold code, queries and media idle until the section approaches. */
export function DeferredSection({ id, children }: { id: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || ready) return;
    const revealHash = () => {
      if (window.location.hash === `#${id}`) setReady(true);
    };
    revealHash();
    window.addEventListener("hashchange", revealHash);
    if (!("IntersectionObserver" in window)) {
      setReady(true);
      return () => window.removeEventListener("hashchange", revealHash);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin: "400px 0px" });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", revealHash);
    };
  }, [id, ready]);

  const placeholder = <div id={id} className="home-section-placeholder" aria-busy="true" />;
  return (
    <div ref={ref} data-deferred-section={id}>
      {ready ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
    </div>
  );
}