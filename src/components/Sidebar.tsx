"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Heart, CreditCard, Settings, Home } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "Matches", href: "/dashboard/matches", icon: Heart },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="w-72 h-screen p-4 z-20">
      <div className="h-full w-full bg-white/60 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden">
        
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Matchmaker</h2>
            <p className="text-rose-500 text-xs font-semibold uppercase tracking-wider mt-0.5">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden
                  ${isActive 
                    ? "bg-white/80 shadow-sm border border-white/60 text-rose-600 font-semibold" 
                    : "text-gray-500 hover:bg-white/40 hover:text-gray-800 font-medium"
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-rose-400 to-pink-500 rounded-r-full"></div>
                )}
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-gradient-to-tr from-rose-100/50 to-pink-50/50 rounded-2xl p-4 border border-white/60">
            <p className="text-xs text-gray-500 text-center font-medium">Logged in securely</p>
          </div>
        </div>
      </div>
    </div>
  );
}
