"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Heart, CreditCard, Settings, Home, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import ParticleBackground from "@/components/ParticleBackground";

export default function WelcomeHub() {
  const cards = [
    { name: "Overview", href: "/dashboard/overview", icon: Home, color: "text-blue-500", glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]", bg: "bg-blue-500/10" },
    { name: "Users", href: "/dashboard/users", icon: Users, color: "text-emerald-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]", bg: "bg-emerald-500/10" },
    { name: "Matches", href: "/dashboard/matches", icon: Heart, color: "text-rose-500", glow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]", bg: "bg-rose-500/10" },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard, color: "text-purple-500", glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]", bg: "bg-purple-500/10" },
    { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp, color: "text-amber-500", glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]", bg: "bg-amber-500/10" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, color: "text-gray-500", glow: "shadow-[0_0_15px_rgba(107,114,128,0.3)]", bg: "bg-gray-500/10" },
  ];

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* Background Particles Layer */}
      <ParticleBackground />

      {/* Top Right Utilities */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] relative w-full h-full max-w-5xl mx-auto px-4 py-8 z-10">

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-16 mt-8 md:mt-0"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-3xl shadow-lg shadow-rose-500/30 dark:shadow-[0_0_30px_rgba(236,72,153,0.5)] mb-8 transform hover:scale-105 transition-transform duration-300">
          <Heart className="w-10 h-10 text-white fill-white" />
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight mb-4">
          Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">Admin!</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">Select a module to manage your matchmaking empire.</p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {cards.map((card) => (
          <Link href={card.href} key={card.name} passHref>
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.05, translateY: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-colors group relative overflow-hidden h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
              
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 z-10 ${card.bg} ${card.color} ${card.glow} transition-all duration-300 group-hover:shadow-xl`}>
                <card.icon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 z-10 transition-colors">{card.name}</h3>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      </div>
    </div>
  );
}
