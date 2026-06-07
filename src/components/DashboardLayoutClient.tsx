"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, Heart } from "lucide-react";
import Link from "next/link";
import CurtainMenu from "./CurtainMenu";
import { ThemeToggle } from "./ThemeToggle";

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === "/dashboard";
  const [isCurtainOpen, setIsCurtainOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex-1 flex flex-col z-10 relative min-w-0 h-full overflow-hidden">
      
      {/* TopNav - Rendered only on sub-pages */}
      {!isRoot && mounted && (
        <header className="flex-shrink-0 h-20 px-4 md:px-8 flex items-center justify-between border-b border-white/20 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCurtainOpen(true)}
              className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-gray-700 dark:text-gray-200 hover:text-rose-600 dark:hover:text-rose-400 border border-white/50 dark:border-slate-700/50 transition-all shadow-sm"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-3 ml-2 group hidden sm:flex">
              <div className="w-10 h-10 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md shadow-rose-500/30 dark:shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-transform group-hover:scale-105">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight group-hover:text-rose-500 transition-colors">Matchmaker</h2>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:block bg-gradient-to-tr from-rose-100/50 to-pink-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl px-4 py-2 border border-white/60 dark:border-slate-700/50">
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Logged in securely</p>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 overflow-x-hidden overflow-y-auto ${isRoot ? '' : 'p-4 md:p-8'}`}>
        {children}
      </main>

      <CurtainMenu isOpen={isCurtainOpen} onClose={() => setIsCurtainOpen(false)} />
    </div>
  );
}
