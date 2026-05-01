import { useState, useEffect } from "react";

export function useHighContrast() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("gesturetalk-high-contrast") === "true";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add("high-contrast");
      localStorage.setItem("gesturetalk-high-contrast", "true");
    } else {
      root.classList.remove("high-contrast");
      localStorage.setItem("gesturetalk-high-contrast", "false");
    }
  }, [enabled]);

  return { highContrast: enabled, toggleHighContrast: () => setEnabled(v => !v) };
}
