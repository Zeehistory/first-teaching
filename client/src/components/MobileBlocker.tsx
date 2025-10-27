import { useEffect, useState } from "react";

// Blocks usage on small phone-sized screens with a full-screen overlay.
// Criteria: viewport width < 768px OR coarse pointer without hover (typical phones).
export default function MobileBlocker() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const mqPhoneWidth = window.matchMedia("(max-width: 767px)");
    const mqCoarse = window.matchMedia("(hover: none) and (pointer: coarse)");

    const evaluate = () => {
      const isPhoneWidth = mqPhoneWidth.matches;
      const isLikelyPhone = mqCoarse.matches && isPhoneWidth;
      setBlocked(isPhoneWidth || isLikelyPhone);
      document.documentElement.classList.toggle("overflow-hidden", isPhoneWidth || isLikelyPhone);
    };

    evaluate();
    mqPhoneWidth.addEventListener("change", evaluate);
    mqCoarse.addEventListener("change", evaluate);
    window.addEventListener("orientationchange", evaluate);
    window.addEventListener("resize", evaluate);
    return () => {
      mqPhoneWidth.removeEventListener("change", evaluate);
      mqCoarse.removeEventListener("change", evaluate);
      window.removeEventListener("orientationchange", evaluate);
      window.removeEventListener("resize", evaluate);
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, []);

  if (!blocked) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-sm px-6 text-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="max-w-md rounded-lg border border-[color:var(--popover-border)] bg-[hsl(var(--popover))] p-6 shadow-lg">
        <div className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
          Best viewed on a computer
        </div>
        <p className="text-[hsl(var(--muted-foreground))]">
          This site is optimized for desktop screens. Please visit on a laptop or desktop computer for the ideal reading experience.
        </p>
      </div>
    </div>
  );
}

