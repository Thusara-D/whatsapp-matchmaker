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
    { 
      name: "Overview", href: "/dashboard/overview", icon: Home, 
      color: "text-rose-500", glow: "shadow-[0_0_20px_rgba(244,63,94,0.4)]", bg: "bg-rose-500/10",
      activeBg: "bg-rose-500", activeText: "text-rose-400", activeShadow: "shadow-[0_0_20px_rgba(244,63,94,0.5)]", activeCardBg: "bg-rose-500/5", activeCardBorder: "border-rose-500/50", activeCardShadow: "shadow-[0_0_30px_rgba(244,63,94,0.1)]"
    },
    { 
      name: "Users", href: "/dashboard/users", icon: Users, 
      color: "text-emerald-400", glow: "shadow-[0_0_20px_rgba(52,211,153,0.15)]", bg: "bg-emerald-400/10",
      activeBg: "bg-emerald-500", activeText: "text-emerald-400", activeShadow: "shadow-[0_0_20px_rgba(16,185,129,0.5)]", activeCardBg: "bg-emerald-500/5", activeCardBorder: "border-emerald-500/50", activeCardShadow: "shadow-[0_0_30px_rgba(16,185,129,0.1)]"
    },
    { 
      name: "Matches", href: "/dashboard/matches", icon: Heart, 
      color: "text-rose-400", glow: "shadow-[0_0_20px_rgba(251,113,133,0.15)]", bg: "bg-rose-400/10",
      activeBg: "bg-pink-500", activeText: "text-pink-400", activeShadow: "shadow-[0_0_20px_rgba(236,72,153,0.5)]", activeCardBg: "bg-pink-500/5", activeCardBorder: "border-pink-500/50", activeCardShadow: "shadow-[0_0_30px_rgba(236,72,153,0.1)]"
    },
    { 
      name: "Payments", href: "/dashboard/payments", icon: CreditCard, 
      color: "text-purple-500", glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]", bg: "bg-purple-500/10",
      activeBg: "bg-purple-500", activeText: "text-purple-400", activeShadow: "shadow-[0_0_20px_rgba(168,85,247,0.5)]", activeCardBg: "bg-purple-500/5", activeCardBorder: "border-purple-500/50", activeCardShadow: "shadow-[0_0_30px_rgba(168,85,247,0.1)]"
    },
    { 
      name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp, 
      color: "text-amber-500", glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]", bg: "bg-amber-500/10",
      activeBg: "bg-amber-500", activeText: "text-amber-400", activeShadow: "shadow-[0_0_20px_rgba(245,158,11,0.5)]", activeCardBg: "bg-amber-500/5", activeCardBorder: "border-amber-500/50", activeCardShadow: "shadow-[0_0_30px_rgba(245,158,11,0.1)]"
    },
    { 
      name: "Settings", href: "/dashboard/settings", icon: Settings, 
      color: "text-gray-400", glow: "shadow-[0_0_20px_rgba(156,163,175,0.15)]", bg: "bg-gray-400/10",
      activeBg: "bg-gray-500", activeText: "text-gray-300", activeShadow: "shadow-[0_0_20px_rgba(107,114,128,0.5)]", activeCardBg: "bg-gray-500/5", activeCardBorder: "border-gray-500/50", activeCardShadow: "shadow-[0_0_30px_rgba(107,114,128,0.1)]"
    },
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
          className="fixed inset-0 z-[100] bg-slate-950 overflow-y-auto flex flex-col"
        >
          {/* Header area of Curtain */}
          <div 
            className="flex items-center justify-between px-6 pb-6"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 24px) + 1rem)' }}
          >
            <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-[14px] flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.6)]">
                <Heart className="w-7 h-7 text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[20px] font-bold text-white tracking-tight leading-tight">Matchmaker</h2>
                <p className="text-pink-500 text-[10px] font-extrabold uppercase tracking-widest mt-0.5">Admin Portal</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="bg-slate-800/80 rounded-full border border-slate-700/50 p-0.5">
                <ThemeToggle />
              </div>
              <button 
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700/50 text-gray-300 hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Grid Layout inside Curtain */}
          <div className="flex-1 flex flex-col items-center p-4 pt-2">
            <motion.div 
              className="grid grid-cols-2 gap-4 w-full max-w-sm"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05, delayChildren: 0.1 }
                }
              }}
            >
              {links.map((card) => {
                const isActive = pathname === card.href;
                return (
                  <Link href={card.href} key={card.name} onClick={onClose} passHref>
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative rounded-[28px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group aspect-square
                        ${isActive 
                          ? `border ${card.activeCardBorder} ${card.activeCardBg} ${card.activeCardShadow}` 
                          : 'border border-slate-800/60 bg-slate-900/50 hover:bg-slate-800/80'}
                      `}
                    >
                      <div className={`w-[72px] h-[72px] rounded-[22px] flex items-center justify-center mb-4 transition-all duration-300
                        ${isActive 
                          ? `${card.activeBg} text-white ${card.activeShadow}` 
                          : `${card.bg} ${card.color} group-hover:${card.glow}`}
                      `}>
                        <card.icon className="w-8 h-8" />
                      </div>
                      <h3 className={`text-[15px] font-bold tracking-wide transition-colors ${isActive ? card.activeText : 'text-slate-200'}`}>
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
