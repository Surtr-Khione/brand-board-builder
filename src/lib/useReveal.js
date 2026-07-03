import { useEffect, useRef, useState } from "react";

// Fades a section in as it enters the viewport — the single, quiet motion
// pattern used across the site instead of ambient looping animation.
export function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}
