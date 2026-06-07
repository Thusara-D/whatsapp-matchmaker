"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Heart, CreditCard, Settings, Home, TrendingUp, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface CurtainMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CurtainMenu({ isOpen, onClose }: CurtainMenuProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const links = [
    { name: "Overview", href: "/dashboard/overview", icon: Home, color: "text-blue-500", glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]", bg: "bg-blue-500/10" },
    { name: "Users", href: "/dashboard/users", icon: Users, color: "text-emerald-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]", bg: "bg-emerald-500/10" },
    { name: "Matches", href: "/dashboard/matches", icon: Heart, color: "text-rose-500", glow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]", bg: "bg-rose-500/10" },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard, color: "text-purple-500", glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]", bg: "bg-purple-500/10" },
    { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp, color: "text-amber-500", glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]", bg: "bg-amber-500/10" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, color: "text-gray-500", glow: "shadow-[0_0_15px_rgba(107,114,128,0.3)]", bg: "bg-gray-500/10" },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl overflow-y-auto flex flex-col"
        >
          {/* Header area of Curtain */}
          <div className="flex items-center justify-between p-6 md:p-8">
            <Link href="/dashboard" onClick={onClose} className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30 dark:shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-transform group-hover:scale-105">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Matchmaker</h2>
                <p className="text-rose-500 dark:text-pink-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Admin Portal</p>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <ThemeToggle />
              <button 
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Grid Layout inside Curtain */}
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl w-full"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05, delayChildren: 0.2 }
                }
              }}
            >
              {links.map((card) => {
                const isActive = pathname === card.href;
                return (
                  <Link href={card.href} key={card.name} onClick={onClose} passHref>
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-colors group h-full
                        ${isActive ? 'border-rose-500/50 dark:border-rose-500/50 bg-rose-50/50 dark:bg-rose-900/20' : 'border-white/50 dark:border-slate-700/50'}
                      `}
                    >
                      {isActive && (
                        <div className="absolute inset-0 rounded-3xl border-2 border-rose-500/30 dark:border-rose-400/30 shadow-[inset_0_0_20px_rgba(244,63,94,0.1)] pointer-events-none"></div>
                      )}
                      
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-4 md:mb-6 z-10 ${isActive ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : `${card.bg} ${card.color} ${card.glow}`} transition-all duration-300 group-hover:shadow-xl`}>
                        <card.icon className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      <h3 className={`text-xl md:text-2xl font-bold z-10 transition-colors ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-gray-800 dark:text-gray-100'}`}>
                        {card.name}
                      </h3>
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
