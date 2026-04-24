"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("vcc-theme");
    const preferred: Theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.setAttribute("data-theme", preferred);
    setTheme(preferred);
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";
  const buttonLabel = theme === "dark" ? "Dark theme active" : "Light theme active";

  return (
    <button
      className="theme-toggle w-full"
      type="button"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        document.documentElement.setAttribute("data-theme", nextTheme);
        window.localStorage.setItem("vcc-theme", nextTheme);
        setTheme(nextTheme);
      }}
    >
      {buttonLabel}
    </button>
  );
}
