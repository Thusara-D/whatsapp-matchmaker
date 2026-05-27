"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder of the same size
    return <div className="w-10 h-10 rounded-full" />;
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95 group overflow-hidden"
      aria-label="Toggle Dark Mode"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Sun 
          className={`absolute w-5 h-5 text-amber-500 transition-all duration-500 ease-out 
            ${resolvedTheme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} 
        />
        <Moon 
          className={`absolute w-5 h-5 text-indigo-400 transition-all duration-500 ease-out
            ${resolvedTheme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} 
        />
      </div>
      
      {/* Subtle neon glow on hover in dark mode */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 dark:group-hover:opacity-30 bg-pink-500/20 dark:bg-pink-500/50 blur-md transition-opacity duration-300 pointer-events-none" />
    </button>
  );
}
