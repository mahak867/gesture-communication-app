import { useState, useEffect } from "react";
export type OneHandedSide = "off" | "left" | "right";

export function useOneHanded() {
  const [mode, setMode] = useState<OneHandedSide>(() => {
    if (typeof window === "undefined") return "off";
    return (localStorage.getItem("gesturetalk-one-handed") as OneHandedSide) ?? "off";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("one-handed-left", "one-handed-right");
    if (mode !== "off") root.classList.add(`one-handed-${mode}`);
    localStorage.setItem("gesturetalk-one-handed", mode);
  }, [mode]);

  return { oneHandedMode: mode, setOneHandedMode: setMode };
}
