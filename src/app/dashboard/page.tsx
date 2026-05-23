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
          if (data.state === "PAYMENT_PENDING_APPROVAL") pending++;
          if (data.state === "MATCH_APPROVED") approved++;
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
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-100/50" },
    { title: "Complete Profiles", value: stats.completeProfiles, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-100/50" },
    { title: "Pending Payments", value: stats.pendingPayments, icon: Clock, color: "text-amber-500", bg: "bg-amber-100/50" },
    { title: "Approved Matches", value: stats.approvedMatches, icon: CreditCard, color: "text-rose-500", bg: "bg-rose-100/50" },
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
            <div key={idx} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/60 dark:border-slate-800/50 transform transition-all hover:scale-105 hover:dark:shadow-[0_0_20px_rgba(236,72,153,0.15)] duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3.5 rounded-2xl ${stat.bg} dark:bg-slate-800/80 dark:border dark:border-slate-700/50`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div>
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
