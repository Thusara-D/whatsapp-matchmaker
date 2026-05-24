"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Heart, CreditCard, Settings, Home, TrendingUp } from "lucide-react";

import { ThemeToggle } from "./ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Matches", href: "/dashboard/matches", icon: Heart },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="w-72 h-screen p-4 z-20">
      <div className="h-full w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col overflow-hidden transition-colors duration-300">
        
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30 dark:shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-shadow">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight transition-colors">Matchmaker</h2>
              <p className="text-rose-500 dark:text-pink-400 text-xs font-semibold uppercase tracking-wider mt-0.5 transition-colors">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden
                  ${isActive 
                    ? "bg-white/80 dark:bg-slate-800/80 shadow-sm border border-white/60 dark:border-slate-700 text-rose-600 dark:text-pink-400 font-semibold" 
                    : "text-gray-500 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-slate-800/40 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-rose-400 to-pink-500 rounded-r-full dark:shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>
                )}
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
          <div className="bg-gradient-to-tr from-rose-100/50 to-pink-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl p-4 border border-white/60 dark:border-slate-700/50 transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium transition-colors">Logged in securely</p>
          </div>
        </div>
      </div>
    </div>
  );
}
