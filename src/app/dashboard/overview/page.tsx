"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, CheckCircle, Clock, CreditCard } from "lucide-react";

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    completeProfiles: 0,
    pendingPayments: 0,
    approvedMatches: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersRef = collection(db, "users");
        const snap = await getDocs(usersRef);
        
        let total = 0;
        let complete = 0;
        let pending = 0;
        let approved = 0;

        snap.forEach((doc) => {
          total++;
          const data = doc.data();
          if (data.profileData?.isComplete) complete++;
          if (data.status === "PAYMENT_PENDING_APPROVAL") pending++;
          if (data.status === "MATCH_APPROVED") approved++;
        });

        setStats({
          totalUsers: total,
          completeProfiles: complete,
          pendingPayments: pending,
          approvedMatches: approved
        });
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    }
    
    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-100/50 dark:bg-blue-900/20", border: "border-blue-500/30", glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]" },
    { title: "Complete Profiles", value: stats.completeProfiles, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-100/50 dark:bg-emerald-900/20", border: "border-emerald-500/30", glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]" },
    { title: "Pending Payments", value: stats.pendingPayments, icon: Clock, color: "text-amber-500", bg: "bg-amber-100/50 dark:bg-amber-900/20", border: "border-amber-500/30", glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] dark:hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]" },
    { title: "Approved Matches", value: stats.approvedMatches, icon: CreditCard, color: "text-rose-500", bg: "bg-rose-100/50 dark:bg-rose-900/20", border: "border-rose-500/30", glow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] dark:hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]" },
  ];

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="mb-10 px-2">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight transition-colors">Overview</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium transition-colors">Your business performance at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border ${stat.border} transform transition-all hover:scale-105 ${stat.glow} duration-300 relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3.5 rounded-2xl ${stat.bg} border border-white/20 dark:border-white/10`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-4xl font-black text-gray-800 dark:text-gray-100 transition-colors">{stat.value}</h3>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider transition-colors">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
