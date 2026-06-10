"use client";

import React, { useState, useEffect } from "react";

interface Theme {
  name: string;
  label: string;
  bg: string;
  text: string;
  border: string;
}

const THEMES: Theme[] = [
  { name: "white",  label: "White",  bg: "bg-white",      text: "text-black",  border: "border border-gray-300" },
  { name: "indigo", label: "Indigo", bg: "bg-indigo-700",  text: "text-white",  border: "" },
  { name: "green",  label: "Green",  bg: "bg-green-700",   text: "text-white",  border: "" },
  { name: "dark",   label: "Dark",   bg: "bg-gray-900",    text: "text-white",  border: "" },
];

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<string>("white");

  useEffect(() => {
    const saved = localStorage.getItem("spms-theme") || "white";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("spms-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="text-xs text-gray-500 mr-1">Theme:</span>
      {THEMES.map((t: Theme) => (
        <button
          key={t.name}
          onClick={() => handleThemeChange(t.name)}
          className={`px-3 py-1 rounded text-xs font-medium transition-all ${t.bg} ${t.text} ${t.border} ${
            theme === t.name ? "ring-2 ring-offset-1 ring-indigo-400" : "opacity-70 hover:opacity-100"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
